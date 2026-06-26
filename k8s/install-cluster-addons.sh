#!/usr/bin/env bash
set -euo pipefail

# Install EKS add-ons required by this project (idempotent).
# Env: EKS_CLUSTER_NAME, AWS_REGION

CLUSTER_NAME="${EKS_CLUSTER_NAME:-sms-cluster}"
AWS_REGION="${AWS_REGION:-us-east-1}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Cluster: ${CLUSTER_NAME} (${AWS_REGION})"

aws eks update-kubeconfig --name "${CLUSTER_NAME}" --region "${AWS_REGION}"

echo "==> Waiting for node(s) to be Ready..."
kubectl wait --for=condition=Ready nodes --all --timeout=600s

echo "==> Tuning system pods for small nodes..."
kubectl delete deployment metrics-server -n kube-system --ignore-not-found --wait=true --timeout=60s 2>/dev/null || true
kubectl scale deployment coredns -n kube-system --replicas=1 2>/dev/null || true

echo "==> EBS CSI driver add-on (required for Postgres PVC)..."
install_ebs_csi() {
  eksctl create addon \
    --name aws-ebs-csi-driver \
    --cluster "${CLUSTER_NAME}" \
    --region "${AWS_REGION}" \
    --force \
    --well-known-policies ebsCSIController
}

if aws eks describe-addon \
  --cluster-name "${CLUSTER_NAME}" \
  --addon-name aws-ebs-csi-driver \
  --region "${AWS_REGION}" >/dev/null 2>&1; then
  echo "EBS CSI addon already installed — ensuring ACTIVE..."
  aws eks wait addon-active \
    --cluster-name "${CLUSTER_NAME}" \
    --addon-name aws-ebs-csi-driver \
    --region "${AWS_REGION}" 2>/dev/null || true
else
  install_ebs_csi
fi

kubectl scale deployment ebs-csi-controller -n kube-system --replicas=1 2>/dev/null || true

echo "==> Waiting for EBS CSI controller..."
for i in $(seq 1 60); do
  if kubectl rollout status deployment/ebs-csi-controller -n kube-system --timeout=30s 2>/dev/null; then
    break
  fi
  if [ "$i" -eq 60 ]; then
    echo "EBS CSI controller not ready — reinstalling addon with IAM policy..."
    eksctl delete addon \
      --name aws-ebs-csi-driver \
      --cluster "${CLUSTER_NAME}" \
      --region "${AWS_REGION}" \
      --wait 2>/dev/null || true
    install_ebs_csi
    kubectl rollout status deployment/ebs-csi-controller -n kube-system --timeout=300s || {
      echo "EBS CSI controller still not ready:"
      kubectl get pods -n kube-system -l 'app.kubernetes.io/name=aws-ebs-csi-driver' -o wide 2>/dev/null || true
      kubectl describe deployment ebs-csi-controller -n kube-system 2>/dev/null | tail -40 || true
      exit 1
    }
    break
  fi
  sleep 10
done

echo "==> Waiting for EBS CSI node plugin..."
kubectl rollout status daemonset/ebs-csi-node -n kube-system --timeout=300s

echo "==> Applying EBS CSI StorageClass..."
kubectl apply -f "${SCRIPT_DIR}/storageclass.yaml"
kubectl get storageclass

echo "==> Add-ons installed."
