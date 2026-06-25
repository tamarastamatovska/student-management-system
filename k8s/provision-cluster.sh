#!/usr/bin/env bash
set -euo pipefail

# Create or recover EKS cluster for GitHub Actions Provision workflow.
# Env: EKS_CLUSTER_NAME, AWS_REGION

CLUSTER_NAME="${EKS_CLUSTER_NAME:?EKS_CLUSTER_NAME required}"
AWS_REGION="${AWS_REGION:?AWS_REGION required}"
AWS_AZ="${AWS_AZ:-${AWS_REGION}a}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODEGROUP_NAME="sms-nodes"

cluster_exists() {
  aws eks describe-cluster --name "${CLUSTER_NAME}" --region "${AWS_REGION}" >/dev/null 2>&1
}

cluster_status() {
  aws eks describe-cluster --name "${CLUSTER_NAME}" --region "${AWS_REGION}" \
    --query 'cluster.status' --output text 2>/dev/null || echo "NOTFOUND"
}

nodegroup_status() {
  aws eks describe-nodegroup \
    --cluster-name "${CLUSTER_NAME}" \
    --nodegroup-name "${NODEGROUP_NAME}" \
    --region "${AWS_REGION}" \
    --query 'nodegroup.status' --output text 2>/dev/null || echo "NOTFOUND"
}

cluster_is_healthy() {
  [ "$(cluster_status)" = "ACTIVE" ] && [ "$(nodegroup_status)" = "ACTIVE" ]
}

dump_cf_errors() {
  local stack
  for stack in \
    "eksctl-${CLUSTER_NAME}-nodegroup-${NODEGROUP_NAME}" \
    "eksctl-${CLUSTER_NAME}-cluster"; do
    echo ""
    echo "=== CloudFormation failures: ${stack} ==="
    aws cloudformation describe-stack-events \
      --stack-name "${stack}" \
      --region "${AWS_REGION}" \
      --query 'StackEvents[?contains(ResourceStatus, `FAILED`)].{Time:Timestamp,Resource:LogicalResourceId,Reason:ResourceStatusReason}' \
      --output table 2>/dev/null || echo "(stack not found or no events)"
  done
  echo ""
  echo "=== Tip: new accounts often need EC2 vCPU quota increase (Service Quotas → EC2) ==="
}

if cluster_exists; then
  if cluster_is_healthy; then
    echo "Cluster ${CLUSTER_NAME} is ACTIVE with nodegroup ${NODEGROUP_NAME} — skipping create."
    exit 0
  fi

  echo "Cluster ${CLUSTER_NAME} exists but is not healthy (cluster=$(cluster_status), nodegroup=$(nodegroup_status))."
  dump_cf_errors
  echo "Deleting broken cluster before recreate..."
  eksctl delete cluster --name "${CLUSTER_NAME}" --region "${AWS_REGION}" --wait --timeout 45m
fi

echo "Creating cluster ${CLUSTER_NAME} in ${AWS_REGION} (AZ ${AWS_AZ})..."
export EKS_CLUSTER_NAME="${CLUSTER_NAME}" AWS_REGION AWS_AZ

if ! envsubst < "${SCRIPT_DIR}/eksctl.yaml" | eksctl create cluster -f - --timeout 90m; then
  echo "Cluster creation failed."
  dump_cf_errors
  exit 1
fi

echo "Cluster created successfully."
aws eks update-kubeconfig --name "${CLUSTER_NAME}" --region "${AWS_REGION}"
kubectl get nodes
