# Kubernetes Deployment (Amazon EKS)

Deploy the Student Management System to namespace `sms` on Amazon EKS.

## Architecture

```
Internet → ALB (Ingress) → frontend Service → frontend Pods (nginx)
                                    ↓ /api proxy
                              backend Service → backend Pods → postgres StatefulSet
```

## Manifests

| Path | Resource | Purpose |
|------|----------|---------|
| `namespace.yaml` | Namespace `sms` | Isolated from `default` |
| `postgres/secret.yaml` | Secret | DB credentials |
| `postgres/configmap.yaml` | ConfigMap | Postgres config |
| `postgres/service.yaml` | Headless Service | Stable DNS for StatefulSet |
| `postgres/statefulset.yaml` | StatefulSet | PostgreSQL 16 + EBS PVC (gp2) |
| `backend/configmap.yaml` | ConfigMap | Datasource URL, CORS |
| `backend/service.yaml` | ClusterIP Service | Internal API :8080 |
| `backend/deployment.yaml` | Deployment | Spring Boot app |
| `frontend/configmap.yaml` | ConfigMap | nginx.conf with /api proxy |
| `frontend/service.yaml` | ClusterIP Service | Internal UI :80 |
| `frontend/deployment.yaml` | Deployment | React static + nginx |
| `ingress.yaml` | Ingress (ALB) | Public HTTP access |

## EKS prerequisites (one-time)

1. **EKS cluster** running in your AWS account
2. **kubectl** + **AWS CLI** installed locally
3. **AWS Load Balancer Controller** installed on the cluster  
   https://docs.aws.amazon.com/eks/latest/userguide/aws-load-balancer-controller.html
4. **EBS CSI driver** add-on enabled (for Postgres PVCs)
5. Configure kubectl:
   ```bash
   aws eks update-kubeconfig --name <cluster-name> --region <region>
   ```

## Manual deploy

```bash
export IMAGE_BACKEND=<dockerhub-user>/sms-backend:latest
export IMAGE_FRONTEND=<dockerhub-user>/sms-frontend:latest

chmod +x k8s/deploy.sh
./k8s/deploy.sh
```

Get the public URL:

```bash
kubectl get ingress sms-ingress -n sms -w
```

Test API:

```bash
ALB=$(kubectl get ingress sms-ingress -n sms -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
curl http://$ALB/api/students/stats
```

## CORS after ALB is ready

Update backend ConfigMap with your ALB URL:

```bash
ALB=$(kubectl get ingress sms-ingress -n sms -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
kubectl patch configmap backend-config -n sms --type merge \
  -p "{\"data\":{\"CORS_ALLOWED_ORIGINS\":\"http://localhost,http://localhost:5173,http://${ALB}\"}}"
kubectl rollout restart deployment/backend -n sms
```

## CD via GitHub Actions

On push to `main`, the `deploy-kubernetes` job runs after images are pushed.

Required GitHub Secrets:

| Secret | Example |
|--------|---------|
| `DOCKERHUB_USERNAME` | your-dockerhub-user |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `AWS_ACCESS_KEY_ID` | IAM access key |
| `AWS_SECRET_ACCESS_KEY` | IAM secret key |
| `AWS_REGION` | `eu-central-1` |
| `EKS_CLUSTER_NAME` | `my-eks-cluster` |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `ImagePullBackOff` | Check Docker Hub image name and that images are public |
| Ingress has no ADDRESS | Install AWS Load Balancer Controller; wait 2–3 min |
| Backend `CrashLoopBackOff` | Wait for postgres StatefulSet; check `kubectl logs -n sms deployment/backend` |
| PVC pending | Enable EBS CSI driver; verify `gp2` StorageClass exists |
| CORS errors in browser | Patch `backend-config` with ALB URL (see above) |

## Tear down

```bash
kubectl delete namespace sms
```

This removes all resources including the Postgres PVC.
