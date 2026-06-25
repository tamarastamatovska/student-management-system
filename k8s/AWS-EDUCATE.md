# AWS Educate + GitHub Actions (full CD pipeline)

Everything runs through **GitHub Actions** — no local `kubectl` deploy needed.

| Workflow | When it runs | What it does |
|----------|--------------|--------------|
| **CI/CD** | Every push/PR to `main` | Test → build → push Docker Hub → deploy to EKS |
| **Provision EKS** | Manual (Actions tab, once) | Create cluster + install add-ons |
| **Destroy EKS** | Manual (when demo is done) | Delete cluster to save credits |

**Region:** `us-east-1` only (AWS Educate Starter requirement)  
**Cluster name:** `sms-cluster` (default in `eksctl-educate.yaml`)

---

## Step 1 — Create AWS Educate account

1. Go to **https://aws.amazon.com/education/awseducate/**
2. Click **Register**
3. Fill in name, email, country (**North Macedonia**), date of birth
4. Select program: **AWS Educate**
5. Verify your email
6. Wait for approval email (usually **15–30 minutes**)
7. Set password and log in to the Educate portal

No credit card required.

---

## Step 2 — Open AWS Console (us-east-1)

1. From Educate portal → **AWS Console**
2. Set region to **US East (N. Virginia)** / `us-east-1`

---

## Step 3 — Create IAM access keys for GitHub Actions

GitHub Actions needs AWS credentials to create the cluster and deploy.

1. In AWS Console, search **IAM**
2. **Users** → **Create user** → name: `github-actions`
3. Attach policies (for a student project, use):
   - `AmazonEKSClusterPolicy`
   - `AmazonEKSWorkerNodePolicy`
   - `AmazonEKS_CNI_Policy`
   - `AmazonEC2ContainerRegistryReadOnly`
   - `ElasticLoadBalancingFullAccess`
   - `IAMFullAccess` *(needed for eksctl + ALB controller IRSA; tighten in production)*
4. Open the user → **Security credentials** → **Create access key**
5. Choose **Application running outside AWS**
6. **Save the Access Key ID and Secret** — you add these to GitHub next

> **Educate note:** If IAM user creation is blocked on your Starter account, contact AWS Educate support or ask your instructor for an AWS Academy account. GitHub Actions CD requires programmatic access keys.

---

## Step 4 — Add GitHub Secrets

Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret | Value |
|--------|-------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username *(already set)* |
| `DOCKERHUB_TOKEN` | Docker Hub access token *(already set)* |
| `AWS_ACCESS_KEY_ID` | From Step 3 |
| `AWS_SECRET_ACCESS_KEY` | From Step 3 |
| `AWS_REGION` | `us-east-1` |
| `EKS_CLUSTER_NAME` | `sms-cluster` |

---

## Step 5 — Make Docker Hub images public

GitHub Actions pushes images on every `main` push. EKS must pull them without login.

1. Go to **https://hub.docker.com/**
2. Open `sms-backend` and `sms-frontend` repositories
3. **Settings** → **Visibility** → **Public** (or ensure they are public)

---

## Step 6 — Provision EKS (one-time, ~20 min)

1. Push this repo to GitHub (if not already)
2. Go to **Actions** → **Provision EKS**
3. Click **Run workflow** → **Run workflow**
4. Wait until the job is green (~15–20 minutes first time)

This creates:
- EKS cluster `sms-cluster` (1× `m5.large`, no NAT — Educate-safe)
- EBS CSI driver (Postgres storage)
- AWS Load Balancer Controller (public URL)

---

## Step 7 — Deploy the app (automatic)

Push any commit to `main` (or re-run **CI/CD** workflow):

```
git push origin main
```

The **CI/CD** workflow will:
1. Run tests
2. Build and push Docker images
3. Deploy to namespace `sms` on EKS
4. Wait for ALB URL and patch CORS
5. Print **live app URL** in the job **Summary** tab

Open the URL from the workflow summary to use the app.

---

## Step 8 — Demo for assignment

Show your instructor:

1. Public GitHub repo
2. **Actions** tab — green **CI/CD** runs
3. **Summary** on latest deploy job — live ALB URL
4. Live CRUD in the browser
5. `k8s/` manifests in the repo

---

## Step 9 — Tear down (save credits)

When finished:

1. **Actions** → **Destroy EKS** → **Run workflow**
2. Wait for green checkmark

EKS costs ~$70+/month for control plane alone — delete the cluster as soon as the demo is done.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Provision EKS fails: IAM / EC2 permissions | Use `us-east-1`, `m5.large`, Educate config in `eksctl-educate.yaml` |
| Cannot create IAM user on Educate | Contact Educate support; try AWS Academy via school |
| CI/CD deploy fails: cluster not found | Run **Provision EKS** first |
| `ImagePullBackOff` | Make Docker Hub repos public |
| Ingress has no ADDRESS | Re-run **Provision EKS** (ALB controller); wait 5 min |
| CORS errors | Re-run **CI/CD** — CORS is patched automatically |
| Workflow fails on AWS secrets | Verify all 6 secrets in Step 4 |

---

## Cost reminder

| Resource | ~Monthly |
|----------|----------|
| EKS control plane | $73 |
| 1× m5.large | $70 |
| ALB | $16 |

Educate credits (~$25–$100) are limited. **Provision only when needed, Destroy when done.**
