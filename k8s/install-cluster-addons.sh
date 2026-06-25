#!/usr/bin/env bash
set -euo pipefail

# Install EKS add-ons required by this project (idempotent).
# Env: EKS_CLUSTER_NAME (default sms-cluster), AWS_REGION (default us-east-1)

CLUSTER_NAME="${EKS_CLUSTER_NAME:-sms-cluster}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "==> Cluster: ${CLUSTER_NAME} (${AWS_REGION})"

aws eks update-kubeconfig --name "${CLUSTER_NAME}" --region "${AWS_REGION}"

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
eksctl create iamserviceaccount \
  --cluster="${CLUSTER_NAME}" \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --role-name AmazonEKSLoadBalancerControllerRole \
  --attach-policy-arn="${POLICY_ARN}" \
  --region="${AWS_REGION}" \
  --override-existing-serviceaccounts \
  --approve

echo "==> Helm: AWS Load Balancer Controller (1 replica for t3.micro)..."
helm repo add eks https://aws.github.io/eks-charts 2>/dev/null || true
helm repo update

# Default chart uses 2 replicas — too heavy for a single t3.micro node.
helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName="${CLUSTER_NAME}" \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set replicaCount=1 \
  --set resources.requests.cpu=100m \
  --set resources.requests.memory=128Mi \
  --set resources.limits.cpu=200m \
  --set resources.limits.memory=256Mi \
  --wait --timeout 15m

echo "==> Waiting for ALB controller pod..."
kubectl rollout status deployment/aws-load-balancer-controller -n kube-system --timeout=600s

echo "==> Add-ons installed."
