#!/usr/bin/env bash
set -euo pipefail

# Install EKS add-ons required by this project (idempotent).
# Env: EKS_CLUSTER_NAME (default sms-cluster), AWS_REGION (default us-east-1)

CLUSTER_NAME="${EKS_CLUSTER_NAME:-sms-cluster}"
AWS_REGION="${AWS_REGION:-us-east-1}"
ALB_RELEASE="aws-load-balancer-controller"

echo "==> Cluster: ${CLUSTER_NAME} (${AWS_REGION})"

aws eks update-kubeconfig --name "${CLUSTER_NAME}" --region "${AWS_REGION}"

dump_alb_debug() {
  echo ""
  echo "=== ALB controller debug ==="
  kubectl get nodes -o wide 2>/dev/null || true
  kubectl top nodes 2>/dev/null || true
  kubectl get deployment,pods -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller 2>/dev/null || true
  kubectl describe deployment "${ALB_RELEASE}" -n kube-system 2>/dev/null | tail -40 || true
  kubectl describe pods -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller 2>/dev/null | tail -80 || true
  kubectl get events -n kube-system --sort-by='.lastTimestamp' 2>/dev/null | tail -20 || true
}

reset_alb_controller() {
  echo "==> Removing previous ALB controller install (if any)..."
  helm uninstall "${ALB_RELEASE}" -n kube-system 2>/dev/null || true
  kubectl delete deployment,rs,pods -n kube-system \
    -l app.kubernetes.io/name=aws-load-balancer-controller \
    --ignore-not-found --force --grace-period=0 2>/dev/null || true
  kubectl delete deployment "${ALB_RELEASE}" -n kube-system --ignore-not-found --wait=true --timeout=120s 2>/dev/null || true
  sleep 5
}

echo "==> Waiting for node(s) to be Ready..."
kubectl wait --for=condition=Ready nodes --all --timeout=600s

echo "==> EBS CSI driver add-on..."
eksctl create addon \
  --name aws-ebs-csi-driver \
  --cluster "${CLUSTER_NAME}" \
  --region "${AWS_REGION}" \
  --force

echo "==> OIDC provider for IRSA..."
eksctl utils associate-iam-oidc-provider \
  --cluster="${CLUSTER_NAME}" \
  --region="${AWS_REGION}" \
  --approve 2>/dev/null || echo "OIDC provider already associated."

echo "==> ALB controller IAM policy..."
curl -sS -o /tmp/alb-iam-policy.json \
  https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.7.2/docs/install/iam_policy.json

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/AWSLoadBalancerControllerIAMPolicy"

aws iam create-policy \
  --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file:///tmp/alb-iam-policy.json \
  2>/dev/null || true

echo "==> ALB controller service account (IRSA)..."
# Recreate SA so IRSA role is always attached (eksctl skips existing accounts).
eksctl delete iamserviceaccount \
  --cluster="${CLUSTER_NAME}" \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --region="${AWS_REGION}" \
  --wait 2>/dev/null || true

eksctl create iamserviceaccount \
  --cluster="${CLUSTER_NAME}" \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --role-name AmazonEKSLoadBalancerControllerRole \
  --attach-policy-arn="${POLICY_ARN}" \
  --region="${AWS_REGION}" \
  --override-existing-serviceaccounts \
  --approve

reset_alb_controller

echo "==> Helm: AWS Load Balancer Controller (1 replica for t3.micro)..."
helm repo add eks https://aws.github.io/eks-charts 2>/dev/null || true
helm repo update

# Single replica + low memory — required on t3.micro Free Tier nodes.
if ! helm upgrade --install "${ALB_RELEASE}" eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName="${CLUSTER_NAME}" \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set replicaCount=1 \
  --set resources.requests.cpu=50m \
  --set resources.requests.memory=64Mi \
  --set resources.limits.cpu=200m \
  --set resources.limits.memory=128Mi \
  --wait --timeout 15m; then
  dump_alb_debug
  exit 1
fi

echo "==> Waiting for ALB controller pod..."
if ! kubectl rollout status deployment/"${ALB_RELEASE}" -n kube-system --timeout=600s; then
  dump_alb_debug
  exit 1
fi

echo "==> Add-ons installed."
