# Kubernetes Deployment (Amazon EKS)

Deploy the Student Management System to namespace `sms` on Amazon EKS.

**Full setup via GitHub Actions:** see **[AWS-SETUP.md](AWS-SETUP.md)** (standard AWS account).

For AWS Educate Starter / classroom accounts only: **[AWS-EDUCATE.md](AWS-EDUCATE.md)**.

## Architecture

```
Internet → AWS LoadBalancer → frontend Service (LoadBalancer) → frontend Pods (nginx)
                                        ↓ /api proxy
                                  backend Service → backend Pods → postgres StatefulSet
```

On `t3.micro` (Free Tier), we use a **LoadBalancer Service** instead of ALB Ingress — no in-cluster ALB controller pod needed. See `ingress.yaml` for optional ALB Ingress on larger clusters.

## GitHub Actions workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR to `main` | Test, Docker Hub publish, deploy to EKS |
| `provision-eks.yml` | Manual (once) | Create cluster + add-ons |
| `destroy-eks.yml` | Manual | Delete cluster to save credits |

## Manifests

| Path | Resource | Purpose |
|------|----------|---------|
| `namespace.yaml` | Namespace `sms` | Isolated from `default` |
| `postgres/secret.yaml` | Secret | DB credentials |
| `postgres/configmap.yaml` | ConfigMap | Postgres config |
| `postgres/service.yaml` | Headless Service | Stable DNS for StatefulSet |
| `postgres/statefulset.yaml` | StatefulSet | PostgreSQL 16 + EBS PVC (ebs-csi-gp3) |
| `backend/configmap.yaml` | ConfigMap | Datasource URL, CORS |
| `backend/service.yaml` | ClusterIP Service | Internal API :8080 |
| `backend/deployment.yaml` | Deployment | Spring Boot app |
| `frontend/configmap.yaml` | ConfigMap | nginx.conf with /api proxy |
| `frontend/service.yaml` | LoadBalancer Service | Public HTTP URL |
| `frontend/deployment.yaml` | Deployment | React static + nginx |
| `storageclass.yaml` | StorageClass | EBS CSI gp3 (default) |
| `ingress.yaml` | Ingress (ALB) | Optional — requires ALB controller + larger nodes |
| `eksctl.yaml` | eksctl config | Standard AWS cluster (any region via secrets) |
| `eksctl-educate.yaml` | eksctl config | Educate-only fallback (`us-east-1`) |
| `install-cluster-addons.sh` | Script | EBS CSI driver only |

## Required GitHub Secrets

| Secret | Example |
|--------|---------|
| `DOCKERHUB_USERNAME` | your-dockerhub-user |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `AWS_ACCESS_KEY_ID` | IAM access key |
| `AWS_SECRET_ACCESS_KEY` | IAM secret key |
| `AWS_REGION` | `eu-north-1` |
| `EKS_CLUSTER_NAME` | `sms-cluster` |

## One-time setup

1. Add GitHub Secrets (see table above)
2. Run **Provision EKS** workflow in Actions tab
3. Push to `main` — **CI/CD** deploys automatically

Live URL appears in the deploy job **Summary**.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `ImagePullBackOff` | Make Docker Hub images public |
| Ingress has no ADDRESS | Wait for frontend LoadBalancer: `kubectl get svc frontend -n sms` |
| Backend `CrashLoopBackOff` | Wait for postgres; check logs |
| PVC pending | Provision EKS installs EBS CSI driver |
| CORS errors | Re-run CI/CD (CORS patched automatically) |
| `Too many pods` on t3.micro | Run **Destroy EKS** then **Provision EKS** (recreates node with higher pod limit) |
| Deploy auth errors | Same IAM user must have created the cluster |

## Tear down

Run the **Destroy EKS** workflow in GitHub Actions, or manually:

```bash
eksctl delete cluster --name sms-cluster --region us-east-1
```
