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

echo "==> Verifying EBS CSI driver is ready..."
if ! kubectl rollout status deployment/ebs-csi-controller -n kube-system --timeout=120s 2>/dev/null; then
  echo "ERROR: EBS CSI controller not running. Re-run Provision EKS (install cluster add-ons step)."
  kubectl get pods -n kube-system -l 'app.kubernetes.io/name=aws-ebs-csi-driver' 2>/dev/null || true
  exit 1
fi

DESIRED_SC="ebs-csi-gp3"
DESIRED_SIZE=$(grep 'storage:' "${SCRIPT_DIR}/postgres/statefulset.yaml" | tail -1 | awk '{print $2}')

recreate_postgres() {
  echo "$1"
  kubectl delete statefulset postgres -n sms --ignore-not-found --wait=true --timeout=180s
  kubectl delete pvc postgres-data-postgres-0 -n sms --ignore-not-found --wait=true --timeout=180s
  kubectl delete pod postgres-0 -n sms --ignore-not-found --wait=true --timeout=60s 2>/dev/null || true
}

# Clean up failed deploy so postgres PVC/StatefulSet can be recreated.
if kubectl get namespace sms >/dev/null 2>&1; then
  PVC_PHASE=$(kubectl get pvc postgres-data-postgres-0 -n sms \
    -o jsonpath='{.status.phase}' 2>/dev/null || echo "")
  if [ "${PVC_PHASE}" = "Pending" ]; then
    echo "Removing stuck sms namespace (PVC still Pending)..."
    kubectl delete namespace sms --wait=true --timeout=180s
  fi
fi

# StatefulSet volumeClaimTemplates are immutable — recreate postgres if claim spec changed.
if kubectl get statefulset postgres -n sms >/dev/null 2>&1; then
  STS_SC=$(kubectl get statefulset postgres -n sms \
    -o jsonpath='{.spec.volumeClaimTemplates[0].spec.storageClassName}' 2>/dev/null || echo "")
  STS_SIZE=$(kubectl get statefulset postgres -n sms \
    -o jsonpath='{.spec.volumeClaimTemplates[0].spec.resources.requests.storage}' 2>/dev/null || echo "")
  if [ "${STS_SC}" != "${DESIRED_SC}" ] || [ "${STS_SIZE}" != "${DESIRED_SIZE}" ]; then
    recreate_postgres "Recreating postgres (volumeClaim: ${STS_SC:-empty}/${STS_SIZE:-empty} -> ${DESIRED_SC}/${DESIRED_SIZE})..."
  fi
fi

echo "==> Applying namespace..."
kubectl apply -f "${SCRIPT_DIR}/namespace.yaml"

echo "==> Applying postgres (Secret, ConfigMap, Service, StatefulSet)..."
kubectl apply -f "${SCRIPT_DIR}/postgres/secret.yaml"
kubectl apply -f "${SCRIPT_DIR}/postgres/configmap.yaml"
kubectl apply -f "${SCRIPT_DIR}/postgres/service.yaml"
if ! kubectl apply -f "${SCRIPT_DIR}/postgres/statefulset.yaml" 2>&1 | tee /tmp/postgres-sts-apply.log; then
  if grep -q Forbidden /tmp/postgres-sts-apply.log; then
    recreate_postgres "Recreating postgres (StatefulSet has immutable spec changes)..."
    kubectl apply -f "${SCRIPT_DIR}/postgres/statefulset.yaml"
  else
    exit 1
  fi
fi

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
