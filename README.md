# Employee Management System

A full-stack task management app. Administrators add employees, assign tasks and see what is overdue. Employees accept or decline work, report progress and close tasks out.

**Stack:** React 19 · Tailwind CSS 4 · Spring Boot 3 (Java 21) · Spring Security + JWT · Spring Data JPA · MySQL · Docker

## Features

**Administrator**
- Overview: open, completed and overdue counts, a status breakdown and the most overdue tasks
- Tasks: create, edit, delete; search, filter by status, priority, employee or overdue; paginated
- Employees: add, edit, remove; search; per-employee task counts; paginated

**Employee**
- Sees only their own tasks, filterable by status with live counts, searchable and paginated
- Accepts or declines a task, updates progress, marks it completed or failed

## Architecture

```
React (Vite)  ──  /api  ──►  Spring Boot REST API  ──►  MySQL
   │                              │
   │  JWT in Authorization header │  JwtAuthenticationFilter → role checks (@PreAuthorize)
   └──────────────────────────────┘
```

```
.
├── src/                     React app (pages, components, api client, contexts, hooks)
├── backend/
│   └── src/main/java/com/lokesh/ems/
│       ├── config/          security chain, CORS, demo data seeder
│       ├── security/        JWT service, auth filter, user lookup
│       ├── controller/      REST endpoints
│       ├── service/         business rules (task lifecycle, validation)
│       ├── repository/      Spring Data JPA + dynamic filtering (Specifications)
│       ├── model/ dto/      entities and request/response records
│       └── exception/       one place that turns errors into JSON responses
├── Dockerfile, nginx.conf   frontend image
├── docker-compose.yml       MySQL + API + frontend
└── .github/workflows/       CI: backend tests, frontend lint and build
```

### Task lifecycle

```
PENDING ──accept──► IN_PROGRESS ──► COMPLETED
   │                    └────────► FAILED
   └──decline──► DECLINED
```

COMPLETED, FAILED and DECLINED are final. The rules live in `TaskStatus.canTransitionTo` and are enforced on the server, so the UI cannot bypass them. Invalid moves return `409 Conflict`.

## API

All endpoints except login require `Authorization: Bearer <token>`.

| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | public | Exchange email and password for a JWT |
| GET | `/api/auth/me` | any | Current user |
| GET | `/api/stats/overview` | admin | Task counts, overdue count, employee count |
| GET | `/api/stats/me` | employee | Counts for the signed-in employee |
| GET | `/api/employees?q=&page=&size=` | admin | Search employees (with task counts) |
| GET | `/api/employees/options` | admin | Id and name list for dropdowns |
| POST / PUT / DELETE | `/api/employees[/{id}]` | admin | Manage employees (deleting also deletes their tasks) |
| GET | `/api/tasks?q=&status=&priority=&assigneeId=&overdue=&page=&size=` | admin | Search and filter all tasks |
| POST / PUT / DELETE | `/api/tasks[/{id}]` | admin | Manage tasks |
| GET | `/api/tasks/mine?q=&status=&page=&size=` | employee | My tasks |
| PATCH | `/api/tasks/{id}/status` | employee (assignee) | Move a task through its lifecycle |
| PATCH | `/api/tasks/{id}/progress` | employee (assignee) | Set 0–100 while in progress |

Errors share one shape: `{ timestamp, status, error, message, fieldErrors? }`.

## Run it

### Option 1: Docker (everything)

```bash
cp .env.example .env        # then edit the passwords and JWT_SECRET
docker compose up --build
```

Open http://localhost:3000.

### Option 2: local development

Requires Java 21, Maven, Node 22 and a running MySQL.

```bash
# terminal 1: API on :8080
cd backend
# set SPRING_PROFILES_ACTIVE=dev (uses a dev-only JWT secret) and DB_PASSWORD if your MySQL root password is not "root"
SPRING_PROFILES_ACTIVE=dev mvn spring-boot:run

# terminal 2: React on :5173 (proxies /api to :8080)
npm install
npm run dev
```

### Demo accounts

Created on first start when `SEED_DATA=true`.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `Admin@123` |
| Employee | `emp1@example.com` … `emp10@example.com` | `Employee@123` |

Set `SEED_DATA=false` (and `VITE_SHOW_DEMO=false` at frontend build time) for anything other than a demo.

## Tests

```bash
cd backend && mvn test
```

- `TaskStatusTest`: the lifecycle rules
- `JwtServiceTest`: valid, tampered, expired, wrong-secret and too-short-secret cases
- `ApiIntegrationTest`: runs the real Spring context against in-memory H2: login, role checks, the full task lifecycle, invalid transitions, ownership checks, validation errors, filtering and pagination, employee CRUD

## Configuration

| Variable | Where | Default | Notes |
|---|---|---|---|
| `JWT_SECRET` | backend | none (required) | 32+ characters; the app refuses to start without it |
| `JWT_EXPIRATION_MINUTES` | backend | 120 | |
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | backend | local MySQL | |
| `CORS_ALLOWED_ORIGINS` | backend | `http://localhost:5173` | comma-separated; needed only when the frontend is on another origin |
| `SEED_DATA` | backend | `true` | |
| `VITE_API_URL` | frontend build | `/api` | full URL when the API is hosted separately |
| `VITE_SHOW_DEMO` | frontend build | `true` | `false` hides the demo-account shortcuts |

## Deploying the frontend separately (for example on Vercel)

The frontend no longer works on its own: it needs the API. Host the backend somewhere that can run Java and MySQL, then set `VITE_API_URL=https://<your-api-host>/api` in the frontend build settings and `CORS_ALLOWED_ORIGINS=https://<your-frontend-host>` on the backend.

## Design decisions

- **Stateless JWT, role read from the database on every request.** Deleting an employee or changing a role takes effect immediately instead of when the token expires.
- **Counts are computed with grouped queries, never stored.** The original app kept counters next to the tasks and they drifted out of sync.
- **Server-side filtering and pagination** with JPA Specifications. Page size is capped at 50 and sort order is fixed, so clients cannot request arbitrary sorts or huge pages.
- **`@EntityGraph` on the paged task query** loads assignee and creator in one query instead of one per row.
- **Same error for unknown email and wrong password**, and a dummy password check for unknown emails, so responses do not reveal which accounts exist.
- **No default JWT secret.** Startup fails loudly instead of running with a guessable key.
- **Token storage.** The token is kept in `localStorage` (when "keep me logged in" is ticked) or `sessionStorage`. That is simple and common for SPAs but readable by any script on the page; an httpOnly cookie plus CSRF protection would be the stricter choice.

## Known limitations

- Schema is managed with `spring.jpa.hibernate.ddl-auto=update`. A production deployment should use a migration tool such as Flyway.
- No refresh tokens; a user signs in again when the token expires.
- No frontend tests yet.
- Login is not rate-limited.
