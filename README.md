# Student Management System

A full-stack monorepo for managing students with CRUD operations.

PostgreSQL runs on **localhost:5433** (mapped from container port 5432 to avoid conflicts with a local Postgres install).

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for PostgreSQL)
- JDK 17+
- Maven 3.9+ (or use included `mvnw.cmd` / `./mvnw` in `backend/`)
- Node.js 18+

## Project structure

```
student-management-system/
├── backend/           # Spring Boot REST API
├── frontend/          # React + Vite + MUI
├── docker-compose.yml # PostgreSQL for local dev
└── package.json       # Root dev scripts
```

## Quick start

### 1. Start the database

```bash
docker compose up -d
```

### 2. Start the backend

```bash
cd backend
./mvnw spring-boot:run   # macOS/Linux
.\mvnw.cmd spring-boot:run   # Windows PowerShell
```

Set `JAVA_HOME` to your JDK folder (e.g. `C:\Users\stama\.jdks\ms-17.0.19`) with **no trailing spaces**.

API runs at `http://localhost:8080`

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

UI runs at `http://localhost:5173`

### Root scripts (optional)

From the repo root:

```bash
npm run db:up      # Start PostgreSQL
npm run backend    # Start Spring Boot
npm run frontend   # Start Vite dev server
```

## API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | List all students |
| GET | `/api/students/{id}` | Get one student |
| POST | `/api/students` | Create student |
| PUT | `/api/students/{id}` | Update student |
| DELETE | `/api/students/{id}` | Delete student |
| GET | `/api/students/stats` | Dashboard stats (total, majors) |

Query params for `GET /api/students`:
- `search` — filter by name or email
- `major` — filter by major

### Example create request

```bash
curl -X POST http://localhost:8080/api/students \
  -H "Content-Type: application/json" \
  -d "{\"firstName\":\"Jane\",\"lastName\":\"Doe\",\"email\":\"jane@example.com\"}"
```

## Student fields

| Field | Required | Notes |
|-------|----------|-------|
| firstName | Yes | |
| lastName | Yes | |
| email | Yes | Must be unique |
| phone | No | |
| dateOfBirth | No | ISO date (`YYYY-MM-DD`) |
| major | No | |
| enrollmentDate | No | Defaults to today on create |

## Smoke test checklist

- [ ] `docker compose up -d` — Postgres healthy on port **5433**
- [ ] Backend starts on `:8080` without errors
- [ ] `GET http://localhost:8080/api/students` returns `[]`
- [ ] Frontend loads at `http://localhost:5173`
- [ ] Create a student → appears in table
- [ ] Edit student → changes persist after refresh
- [ ] Delete student → removed from DB
- [ ] Duplicate email → shows error message (409)
