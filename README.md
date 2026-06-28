# Student Management System

A full-stack monorepo for managing students with CRUD operations.

**Repository:** https://github.com/tamarastamatovska/student-management-system

**Stack:** React (Vite + TypeScript + MUI) · Spring Boot 3 · PostgreSQL · Docker · GitHub Actions · Kubernetes (EKS)

[![CI/CD](https://github.com/tamarastamatovska/student-management-system/actions/workflows/ci.yml/badge.svg)](https://github.com/tamarastamatovska/student-management-system/actions/workflows/ci.yml)

## Architecture

Three services (assignment requirement):

| Service | Technology | Port |
|---------|------------|------|
| Frontend | React + Nginx | 80 |
| Backend | Spring Boot REST API | 8080 |
| Database | PostgreSQL 16 | 5433 (host) / 5432 (container) |

```
Browser → Frontend (Nginx) → Backend (Spring Boot) → PostgreSQL
                ↓ proxy /api
```

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- For local dev without full Docker: JDK 17+, Node.js 18+

## Quick start — full stack with Docker Compose

```bash
docker compose up --build -d
```

| URL | Description |
|-----|-------------|
| http://localhost | Web UI |
| http://localhost:8080/api/students | REST API |

Stop:

```bash
docker compose down
```

## Local development (hybrid)

Run only the database in Docker, then start backend and frontend locally:

```bash
# 1. Database only
docker compose up postgres -d

# 2. Backend
cd backend
.\mvnw.cmd spring-boot:run   # Windows PowerShell
# ./mvnw spring-boot:run     # macOS/Linux

# 3. Frontend
cd frontend
npm install
npm run dev
```

| URL | Description |
|-----|-------------|
| http://localhost:5173 | Web UI (Vite dev server) |
| http://localhost:8080 | REST API |

PostgreSQL is on **localhost:5433** for local dev.

Set `JAVA_HOME` to your JDK folder (e.g. `C:\Users\stama\.jdks\ms-17.0.19`) with no trailing spaces.

## Project structure

```
student-management-system/
├── .github/workflows/ci.yml   # GitHub Actions CI/CD
├── k8s/                     # Kubernetes manifests (EKS)
├── docker-compose.yml         # postgres + backend + frontend
├── pom.xml                    # Maven parent (backend module)
├── backend/
│   ├── Dockerfile
│   └── src/...
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/...
└── package.json               # Root dev scripts
```

## CI/CD pipeline (GitHub Actions)

Everything runs through GitHub Actions — no manual deploy needed.

| Workflow | When | What |
|----------|------|------|
| **CI/CD** | Push/PR to `main` | Test → Docker Hub → deploy to EKS |
| **Provision EKS** | Manual once | Create cluster + add-ons |
| **Destroy EKS** | Manual when done | Delete cluster (save credits) |

On every **push** and **pull request** to `main`:

1. Run backend tests (`mvn test`)
2. Build frontend (`npm ci && npm run build`)

On **push to main** only:

3. Build and push Docker images to Docker Hub
4. Deploy to EKS (namespace `sms`) via `k8s/deploy.sh`
5. Patch CORS and print live URL in job Summary

### Required GitHub configuration

**Secrets** (Settings → Actions → Secrets):

| Secret | Description |
|--------|-------------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `AWS_ACCESS_KEY_ID` | IAM key for EKS (same user that provisions cluster) |
| `AWS_SECRET_ACCESS_KEY` | IAM secret for EKS |
| `EKS_CLUSTER_NAME` | `sms-cluster` |

**Variables** (Settings → Actions → Variables):

| Variable | Description |
|----------|-------------|
| `AWS_REGION` | `eu-north-1` (Europe Stockholm) — use a **variable**, not a secret, so deploy URLs appear correctly in CI summaries |

### First-time AWS setup

Step-by-step guide: **[k8s/AWS-SETUP.md](k8s/AWS-SETUP.md)**

1. Create IAM user `github-actions` + access keys in AWS Console
2. Add GitHub Secrets and the `AWS_REGION` **variable** (see [k8s/AWS-SETUP.md](k8s/AWS-SETUP.md))
3. Run **Provision EKS** workflow once
4. Push to `main` — app deploys automatically

*(AWS Educate learning portal only? See [k8s/AWS-EDUCATE.md](k8s/AWS-EDUCATE.md) — a standard AWS account like yours is easier.)*

## Kubernetes (Amazon EKS)

Manifests in [`k8s/`](k8s/) deploy all three services to namespace **`sms`**:

| Resource | App component |
|----------|---------------|
| StatefulSet + Secret + ConfigMap | PostgreSQL database |
| Deployment + Service + ConfigMap | Backend API |
| Deployment + Service + ConfigMap | Frontend (nginx) |
| Ingress (ALB) | Public HTTP URL |

Details: **[k8s/README.md](k8s/README.md)** · Setup: **[k8s/AWS-SETUP.md](k8s/AWS-SETUP.md)**

## API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | List students (`?search=` `?major=`) |
| GET | `/api/students/stats` | Dashboard statistics |
| GET | `/api/students/{id}` | Get one student |
| POST | `/api/students` | Create student |
| PUT | `/api/students/{id}` | Update student |
| DELETE | `/api/students/{id}` | Delete student |



## Environment variables

See [`.env.example`](.env.example) for configurable values. Copy to `.env` for local overrides (never commit `.env`).
