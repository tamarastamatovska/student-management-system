#!/usr/bin/env bash
set -euo pipefail

# Install EKS add-ons required by this project (idempotent).
# Uses LoadBalancer Service (not ALB Ingress) so t3.micro nodes have enough pod slots.
# Env: EKS_CLUSTER_NAME, AWS_REGION

CLUSTER_NAME="${EKS_CLUSTER_NAME:-sms-cluster}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "==> Cluster: ${CLUSTER_NAME} (${AWS_REGION})"

aws eks update-kubeconfig --name "${CLUSTER_NAME}" --region "${AWS_REGION}"

echo "==> Waiting for node(s) to be Ready..."
kubectl wait --for=condition=Ready nodes --all --timeout=600s

echo "==> Tuning system pods for small nodes..."
kubectl delete deployment metrics-server -n kube-system --ignore-not-found --wait=true --timeout=60s 2>/dev/null || true
kubectl scale deployment coredns -n kube-system --replicas=1 2>/dev/null || true

echo "==> EBS CSI driver add-on (required for Postgres PVC)..."
eksctl create addon \
  --name aws-ebs-csi-driver \
  --cluster "${CLUSTER_NAME}" \
  --region "${AWS_REGION}" \
  --force

echo "==> Waiting for default StorageClass..."
for i in $(seq 1 30); do
  if kubectl get storageclass 2>/dev/null | grep -q '(default)'; then
    kubectl get storageclass
    break
  fi
  sleep 10
done

echo "==> Add-ons installed."
echo "Public URL will come from frontend LoadBalancer Service (no in-cluster ALB controller needed)."
