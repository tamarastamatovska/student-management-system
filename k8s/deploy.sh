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

echo "==> Applying namespace..."
kubectl apply -f "${SCRIPT_DIR}/namespace.yaml"

echo "==> Applying postgres (Secret, ConfigMap, Service, StatefulSet)..."
kubectl apply -f "${SCRIPT_DIR}/postgres/secret.yaml"
kubectl apply -f "${SCRIPT_DIR}/postgres/configmap.yaml"
kubectl apply -f "${SCRIPT_DIR}/postgres/service.yaml"
kubectl apply -f "${SCRIPT_DIR}/postgres/statefulset.yaml"

echo "==> Waiting for postgres PVC..."
for i in $(seq 1 60); do
  PHASE=$(kubectl get pvc postgres-data-postgres-0 -n sms -o jsonpath='{.status.phase}' 2>/dev/null || echo "")
  if [ "$PHASE" = "Bound" ]; then
    echo "PVC bound."
    break
  fi
  if [ "$i" -eq 60 ]; then
    echo "PVC not bound after 5 minutes:"
    kubectl describe pvc postgres-data-postgres-0 -n sms || true
    kubectl get storageclass || true
    exit 1
  fi
  sleep 5
done

echo "==> Waiting for postgres pod..."
kubectl rollout status statefulset/postgres -n sms --timeout=600s

echo "==> Applying backend..."
kubectl apply -f "${SCRIPT_DIR}/backend/configmap.yaml"
kubectl apply -f "${SCRIPT_DIR}/backend/service.yaml"
envsubst < "${SCRIPT_DIR}/backend/deployment.yaml" | kubectl apply -f -

echo "==> Applying frontend..."
kubectl apply -f "${SCRIPT_DIR}/frontend/configmap.yaml"
kubectl apply -f "${SCRIPT_DIR}/frontend/service.yaml"
envsubst < "${SCRIPT_DIR}/frontend/deployment.yaml" | kubectl apply -f -

echo "==> Waiting for deployments..."
kubectl rollout status deployment/backend -n sms --timeout=300s
kubectl rollout status deployment/frontend -n sms --timeout=300s

echo ""
echo "==> Deploy complete. Resources in namespace sms:"
kubectl get all,pvc -n sms

echo ""
echo "Public URL (may take 2-3 minutes to appear):"
kubectl get svc frontend -n sms -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "(pending)"
echo ""
