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
  NODE="$(kubectl get nodes -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")"
  kubectl get nodes -o wide 2>/dev/null || true
  if [ -n "${NODE}" ]; then
    echo "Pods on node ${NODE}:"
    kubectl get pods -A -o wide --field-selector "spec.nodeName=${NODE}" 2>/dev/null || true
  fi
  kubectl get deployment,pods -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller 2>/dev/null || true
  kubectl describe pods -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller 2>/dev/null | tail -40 || true
  kubectl get events -n kube-system --sort-by='.lastTimestamp' 2>/dev/null | tail -15 || true
  echo ""
  echo "If you see 'Too many pods': upgrade to t3.medium (Billing → leave Free account plan)."
}

free_node_pod_slots() {
  echo "==> Freeing pod slots (t3.micro fits ~4 pods without tuning)..."

  # metrics-server is optional; remove to save a pod slot.
  kubectl delete deployment metrics-server -n kube-system --ignore-not-found --wait=true --timeout=60s 2>/dev/null || true

  # Default CoreDNS uses 2 replicas; one is enough for a demo cluster.
  kubectl scale deployment coredns -n kube-system --replicas=1 2>/dev/null || true

  # Prefix delegation raises max pods per node (required for ALB controller on small instances).
  echo "==> Enabling VPC CNI prefix delegation..."
  kubectl set env daemonset/aws-node -n kube-system \
    ENABLE_PREFIX_DELEGATION=true \
    WARM_PREFIX_TARGET=1 \
    --overwrite 2>/dev/null || true

  sleep 15
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

free_node_pod_slots

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
free_node_pod_slots

echo "==> Helm: AWS Load Balancer Controller (1 replica)..."
helm repo add eks https://aws.github.io/eks-charts 2>/dev/null || true
helm repo update

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
