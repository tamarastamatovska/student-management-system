#!/usr/bin/env bash
set -euo pipefail

# Deploy Student Management System to Kubernetes (namespace: sms)
# Required env vars for app images:
#   IMAGE_BACKEND  e.g. dockerhub-user/sms-backend:latest
#   IMAGE_FRONTEND e.g. dockerhub-user/sms-frontend:latest

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ -z "${IMAGE_BACKEND:-}" || -z "${IMAGE_FRONTEND:-}" ]]; then
  echo "ERROR: Set IMAGE_BACKEND and IMAGE_FRONTEND before running deploy.sh"
  exit 1
fi

export IMAGE_BACKEND IMAGE_FRONTEND

echo "==> Ensuring EBS CSI StorageClass..."
kubectl apply -f "${SCRIPT_DIR}/storageclass.yaml"

DESIRED_SC="ebs-csi-gp3"

# StatefulSet volumeClaimTemplates are immutable — recreate postgres if StorageClass changed.
if kubectl get statefulset postgres -n sms >/dev/null 2>&1; then
  STS_SC=$(kubectl get statefulset postgres -n sms \
    -o jsonpath='{.spec.volumeClaimTemplates[0].spec.storageClassName}' 2>/dev/null || echo "")
  if [ "${STS_SC}" != "${DESIRED_SC}" ]; then
    echo "Recreating postgres (StatefulSet StorageClass: ${STS_SC:-empty} -> ${DESIRED_SC})..."
    kubectl delete statefulset postgres -n sms --ignore-not-found --wait=true --timeout=180s
    kubectl delete pvc postgres-data-postgres-0 -n sms --ignore-not-found --wait=true --timeout=180s
    kubectl delete pod postgres-0 -n sms --ignore-not-found --wait=true --timeout=60s 2>/dev/null || true
  fi
fi

echo "==> Applying namespace..."
kubectl apply -f "${SCRIPT_DIR}/namespace.yaml"

echo "==> Applying postgres (Secret, ConfigMap, Service, StatefulSet)..."
kubectl apply -f "${SCRIPT_DIR}/postgres/secret.yaml"
kubectl apply -f "${SCRIPT_DIR}/postgres/configmap.yaml"
kubectl apply -f "${SCRIPT_DIR}/postgres/service.yaml"
kubectl apply -f "${SCRIPT_DIR}/postgres/statefulset.yaml"

echo "==> Waiting for postgres pod (PVC binds on schedule with WaitForFirstConsumer)..."
kubectl rollout status statefulset/postgres -n sms --timeout=900s

echo "==> Applying backend..."
kubectl apply -f "${SCRIPT_DIR}/backend/configmap.yaml"
kubectl apply -f "${SCRIPT_DIR}/backend/service.yaml"
envsubst < "${SCRIPT_DIR}/backend/deployment.yaml" | kubectl apply -f -
kubectl rollout status deployment/backend -n sms --timeout=600s

echo "==> Applying frontend..."
kubectl apply -f "${SCRIPT_DIR}/frontend/configmap.yaml"
kubectl apply -f "${SCRIPT_DIR}/frontend/service.yaml"
envsubst < "${SCRIPT_DIR}/frontend/deployment.yaml" | kubectl apply -f -

echo "==> Waiting for frontend..."
kubectl rollout status deployment/frontend -n sms --timeout=300s

echo ""
echo "==> Deploy complete. Resources in namespace sms:"
kubectl get all,pvc -n sms

echo ""
echo "Public URL (may take 2-3 minutes to appear):"
kubectl get svc frontend -n sms -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "(pending)"
echo ""
