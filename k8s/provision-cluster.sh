#!/usr/bin/env bash
set -euo pipefail

# Create or recover EKS cluster for GitHub Actions Provision workflow.
# Env: EKS_CLUSTER_NAME, AWS_REGION

CLUSTER_NAME="${EKS_CLUSTER_NAME:?EKS_CLUSTER_NAME required}"
AWS_REGION="${AWS_REGION:?AWS_REGION required}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cluster_exists() {
  eksctl get cluster --name "${CLUSTER_NAME}" --region "${AWS_REGION}" >/dev/null 2>&1
}

ready_node_count() {
  aws eks update-kubeconfig --name "${CLUSTER_NAME}" --region "${AWS_REGION}" >/dev/null 2>&1 || true
  kubectl get nodes --no-headers 2>/dev/null | grep -c " Ready" || echo 0
}

if cluster_exists; then
  NODES="$(ready_node_count)"
  if [ "${NODES}" -gt 0 ]; then
    echo "Cluster ${CLUSTER_NAME} already exists with ${NODES} ready node(s) — skipping create."
    exit 0
  fi

  echo "Cluster ${CLUSTER_NAME} exists but has no ready nodes (likely a failed prior run)."
  echo "Deleting broken cluster before recreate..."
  eksctl delete cluster --name "${CLUSTER_NAME}" --region "${AWS_REGION}" --wait --timeout 45m
fi

echo "Creating cluster ${CLUSTER_NAME} in ${AWS_REGION}..."
export EKS_CLUSTER_NAME="${CLUSTER_NAME}" AWS_REGION
envsubst < "${SCRIPT_DIR}/eksctl.yaml" | eksctl create cluster -f - --timeout 75m

echo "Cluster created successfully."
kubectl get nodes
