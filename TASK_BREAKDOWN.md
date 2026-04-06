# IT3030 PAF Assignment 2026 — Task Breakdown
## Smart Campus Operations Hub
**Group Repository:** `it3030-paf-2026-smart-campus-groupXX`  
**Stack:** Spring Boot REST API + React + Supabase (PostgreSQL)  
**Deadline:** 27th April 2026, 11:45 PM (GMT +5:30)  
**Viva:** Starting 11th April 2026

---

## Team Allocation

| Member | Module | Focus Area |
|---|---|---|
| **Ranushi** | Module A | Facilities & Assets Catalogue + Resource Management |
| **Shashindi** | Module B | Booking Workflow + Conflict Checking |
| **Shehan** | Module C | Incident Tickets + Attachments + Technician Updates |
| **Thisangi** | Module D + E | Notifications + Role Management + OAuth |

---

## Shared Setup (All Members — Day 1)

### Repository Structure
```
it3030-paf-2026-smart-campus-groupXX/
├── backend/                   # Spring Boot project
│   ├── src/main/java/com/smartcampus/
│   │   ├── config/            # Security, CORS, Supabase config
│   │   ├── module_a/          # Ranushi
│   │   ├── module_b/          # Shashindi
│   │   ├── module_c/          # Shehan
│   │   ├── module_d/          # Thisangi
│   │   └── common/            # Shared DTOs, exceptions, responses
│   └── src/test/
├── frontend/                  # React (Vite) project
│   ├── src/
│   │   ├── components/        # Shared components
│   │   ├── pages/
│   │   │   ├── facilities/    # Ranushi
│   │   │   ├── bookings/      # Shashindi
│   │   │   ├── incidents/     # Shehan
│   │   │   └── notifications/ # Thisangi
│   │   ├── context/           # Auth context (Thisangi)
│   │   ├── hooks/             # Shared custom hooks
│   │   └── api/               # Axios API calls (one file per module)
├── .github/workflows/ci.yml   # GitHub Actions (Thisangi sets up)
└── README.md
```

### Supabase Database — Table Ownership

| Table | Owner | Notes |
|---|---|---|
| `resources` | Ranushi | Facilities & assets |
| `bookings` | Shashindi | Booking requests |
| `incidents` | Shehan | Incident tickets |
| `incident_attachments` | Shehan | File references |
| `incident_comments` | Shehan | Comments on tickets |
| `notifications` | Thisangi | User notifications |
| `users` (via Supabase Auth) | Thisangi | OAuth + roles |

### Shared Backend Files (set up together on Day 1)
- `ApiResponse.java` — standard response wrapper `{ success, message, data }`
- `GlobalExceptionHandler.java` — `@ControllerAdvice` for all modules
- `SecurityConfig.java` — Thisangi owns, others depend on it
- `SupabaseConfig.java` — JDBC datasource config for Supabase PostgreSQL
- `application.properties` — DB URL, Supabase keys (use `.env` / secrets)

### API Base URL Convention
```
/api/v1/resources        → Ranushi
/api/v1/bookings         → Shashindi
/api/v1/incidents        → Shehan
/api/v1/notifications    → Thisangi
/api/v1/auth             → Thisangi
/api/v1/users            → Thisangi
```

---

## Module Summaries

### Module A — Facilities & Assets Catalogue (Ranushi)
Manage bookable resources: lecture halls, labs, meeting rooms, equipment.  
**Min. endpoints:** GET all, GET by ID, POST create, PUT update, DELETE, GET search/filter.  
See `TASK_RANUSHI.md` for full details.

### Module B — Booking Management (Shashindi)
Booking workflow PENDING → APPROVED/REJECTED → CANCELLED. Conflict prevention.  
**Min. endpoints:** POST create booking, GET my bookings, GET all (admin), PUT approve/reject, PUT cancel.  
See `TASK_SHASHINDI.md` for full details.

### Module C — Incident Tickets (Shehan)
Ticket lifecycle OPEN → IN_PROGRESS → RESOLVED → CLOSED. Attachments, comments, technician assignment.  
**Min. endpoints:** POST create ticket, GET tickets, PUT update status, POST add comment, POST upload attachments.  
See `TASK_SHEHAN.md` for full details.

### Module D + E — Notifications + Auth (Thisangi)
OAuth 2.0 (Google), role-based access (USER/ADMIN/TECHNICIAN), in-app notifications.  
**Min. endpoints:** GET notifications, PUT mark read, POST login, GET user profile, PUT user role.  
See `TASK_THISANGI.md` for full details.

---

## Conflict Prevention Rules

### Backend — NO cross-module controller calls
- Each module's `Service` class must only inject its own `Repository`.
- If Module B needs Resource data, Shashindi calls Ranushi's **REST endpoint** via `RestTemplate`, or Ranushi exposes a package-internal `ResourceService` method — agree on one approach.
- **Recommended:** Expose a simple `ResourceAvailabilityService` interface with a single method `isResourceActive(Long id)` that Shashindi can inject.

### Frontend — one API file per module
```
src/api/resourcesApi.js     → Ranushi
src/api/bookingsApi.js      → Shashindi
src/api/incidentsApi.js     → Shehan
src/api/notificationsApi.js → Thisangi
src/api/authApi.js          → Thisangi
```
Never edit another member's API file.

### Git Branching Strategy (GitHub Flow)
```
main          ← protected; only merge via PR
feature/module-a-ranushi
feature/module-b-shashindi
feature/module-c-shehan
feature/module-d-thisangi
```
- Always `git pull origin main` before creating a new branch.
- One PR per feature. Request review from at least one teammate before merging.
- **Never commit directly to main.**

### Database — No overlapping table names
Each member owns their tables (see table ownership above). If you need a foreign key to another member's table, use the table name but **do not create/alter that table yourself** — ask the owner.

---

## Shared Non-Functional Requirements

- **Validation:** Use `@Valid` + `@NotNull`, `@Size`, etc. on all request DTOs.
- **Error Handling:** All errors must return `{ success: false, message: "...", errors: [...] }`.
- **HTTP Status Codes:** 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 500 Server Error.
- **Security:** No endpoint is open except `/api/v1/auth/**`. All others require valid JWT from Supabase.
- **CORS:** Configure in `SecurityConfig.java` to allow React frontend origin.

---

## GitHub Actions CI (Thisangi sets up)

File: `.github/workflows/ci.yml`
- Trigger: push to `main`, pull_request to `main`
- Jobs: `build-backend` (Maven test), `build-frontend` (npm run build)

---

## Submission Checklist

- [ ] All 4 members have ≥4 REST endpoints with different HTTP methods
- [ ] Supabase database connected and seeded with sample data
- [ ] GitHub Actions CI passing (green)
- [ ] React frontend consuming all API endpoints
- [ ] OAuth Google login working
- [ ] Role-based access enforced (USER vs ADMIN)
- [ ] README has setup instructions
- [ ] Report PDF: requirements, architecture diagrams, endpoint list, testing evidence
- [ ] Commit history shows individual contributions (no bulk commits)
- [ ] Report filename: `IT3030_PAF_Assignment_2026_GroupXX.pdf`
