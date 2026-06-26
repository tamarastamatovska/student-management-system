# AWS setup + GitHub Actions (full CD pipeline)

Use this guide with a **standard AWS account** (like the one in your AWS Console). This works better than AWS Educate for EKS and GitHub Actions because you get full IAM access.

| Workflow | When it runs | What it does |
|----------|--------------|--------------|
| **CI/CD** | Every push/PR to `main` | Test → build → push Docker Hub → deploy to EKS |
| **Provision EKS** | Manual (Actions tab, once) | Create cluster + install add-ons |
| **Destroy EKS** | Manual (when demo is done) | Delete cluster to stop charges |

**Recommended region:** `eu-north-1` (Europe Stockholm — matches your console)  
**Cluster name:** `sms-cluster`  
**Node type:** `2× t3.micro` (Free Tier — required on Free account plan)

New AWS accounts often receive **~$200 free credits** for the first months. Delete the cluster when done to avoid ongoing charges.

### Free account plan

New AWS accounts on the **Free account plan** only allow **t3.micro** instances. This repo uses **2 nodes** so pods can spread (one node is too small for EKS + full app).

| Setting | Value |
|---------|-------|
| Instance | `t3.micro` |
| Node count | **2** |
| Public URL | LoadBalancer Service (no ALB controller pod) |
| Postgres image | `postgres:16-alpine` |

**After pulling these changes:** run **Destroy EKS** → **Provision EKS** → **CI/CD** (existing 1-node cluster cannot be resized in place).

Optional larger nodes (leave Free plan): use `k8s/eksctl-medium.yaml` (`t3.medium`, 1 node) after billing upgrade.

---

## Step 1 — You already have AWS

You're in the AWS Console — that's what you need. Keep your region as **Europe (Stockholm)** / `eu-north-1` (top-right in the console).

---

## Step 2 — Create IAM user for GitHub Actions

1. In AWS Console, search **IAM**
2. **Users** → **Create user** → name: `github-actions`
3. **Attach policies directly** → add:
   - `AdministratorAccess`  
     *(simplest for a student project; use narrower policies in production)*
4. Create the user
5. Open the user → **Security credentials** → **Create access key**
6. Choose **Application running outside AWS**
7. **Save the Access Key ID and Secret** — you add these to GitHub next

> Use the **same IAM user** for both **Provision EKS** and **CI/CD** workflows.

---

## Step 3 — Add GitHub Secrets

Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret | Value |
|--------|-------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `AWS_ACCESS_KEY_ID` | From Step 2 |
| `AWS_SECRET_ACCESS_KEY` | From Step 2 |
| `AWS_REGION` | `eu-north-1` |
| `EKS_CLUSTER_NAME` | `sms-cluster` |

---

## Step 4 — Make Docker Hub images public

1. https://hub.docker.com/ → your `sms-backend` and `sms-frontend` repos
2. **Settings** → **Visibility** → **Public**

EKS must pull images without login.

---

## Step 5 — Push code to GitHub

```powershell
cd d:\student-management-system
git add .
git commit -m "Configure AWS setup for standard account"
git push origin main
```

---

## Step 6 — Provision EKS (one-time, ~15–20 min)

1. GitHub → **Actions** → **Provision EKS**
2. **Run workflow** → **Run workflow**
3. Wait until green

This creates cluster `sms-cluster` in `eu-north-1` with EBS CSI + ALB controller.

---

## Step 7 — Deploy the app (automatic)

Push to `main` or re-run **CI/CD**. The workflow will:

1. Run tests
2. Push Docker images
3. Deploy to namespace `sms`
4. Patch CORS
5. Show **live app URL** in the job **Summary** tab

---

## Step 8 — Demo & tear down

**Demo:** Show green Actions runs + live URL from Summary + CRUD in browser.

**Tear down when finished:**

1. **Actions** → **Destroy EKS** → **Run workflow**

Or in AWS Console → search **EKS** → delete cluster `sms-cluster`.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Provision fails: credentials | Check all 6 GitHub Secrets |
| Provision fails: region | `AWS_REGION` must match console (`eu-north-1`) |
| `ImagePullBackOff` | Make Docker Hub repos public |
| Ingress has no ADDRESS | Re-run Provision EKS; wait 5 min |
| Deploy auth error | Same IAM user must have created the cluster |
| Unexpected charges | Run **Destroy EKS** as soon as demo is done |

---

## AWS Educate?

If you only have the **Courses & labs** Educate portal (no AWS Console button), use this **standard AWS** guide instead. See [AWS-EDUCATE.md](AWS-EDUCATE.md) only if your school gives you an Educate **Starter Account** or **AWS Academy** classroom.
