# Student Management System

A full-stack monorepo for managing students with CRUD operations.

**Repository:** https://github.com/tamarastamatovska/student-management-system

**Stack:** React (Vite + TypeScript + MUI) · Spring Boot 3 · PostgreSQL · Docker · GitHub Actions

[![CI](https://github.com/tamarastamatovska/student-management-system/actions/workflows/ci.yml/badge.svg)](https://github.com/tamarastamatovska/student-management-system/actions/workflows/ci.yml)

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
├── .github/workflows/ci.yml   # GitHub Actions CI
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

## CI pipeline (GitHub Actions)

On every **push** and **pull request** to `main`:

1. Run backend tests (`mvn test`)
2. Build frontend (`npm ci && npm run build`)

On **push to main** only:

3. Build and push Docker images to Docker Hub:
   - `<username>/sms-backend:latest`
   - `<username>/sms-frontend:latest`

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token ([create here](https://hub.docker.com/settings/security)) |

## API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | List students (`?search=` `?major=`) |
| GET | `/api/students/stats` | Dashboard statistics |
| GET | `/api/students/{id}` | Get one student |
| POST | `/api/students` | Create student |
| PUT | `/api/students/{id}` | Update student |
| DELETE | `/api/students/{id}` | Delete student |

## Assignment checklist

- [x] Public Git repository
- [x] Dockerized frontend and backend (`backend/Dockerfile`, `frontend/Dockerfile`)
- [x] Docker Compose orchestration (postgres + backend + frontend)
- [x] CI pipeline (GitHub Actions — build, test, publish to Docker Hub)
- [ ] CD deployment (out of scope for now)

## Environment variables

See [`.env.example`](.env.example) for configurable values. Copy to `.env` for local overrides (never commit `.env`).
