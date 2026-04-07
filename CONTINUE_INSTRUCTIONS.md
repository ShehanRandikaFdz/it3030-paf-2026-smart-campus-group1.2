# Smart Campus Operations Hub — Module C Context (Continue from Previous Chat)

## Project Path
```
D:\SLIIT\3rd Year\Y3 S2\PAF\it3030-paf-2026-smart-campus-group1.2
```

## Supabase Credentials (already set as system env vars)
- **Supabase URL**: `https://lcwywqhzfwsjqnusvbhw.supabase.co`
- **Supabase Anon Key**: `sb_publishable_wxDSHC20Jm53gWSkDKcGCg_hprqutLK`
- **SUPABASE_DB_PASSWORD**: `PAF@2026@SLIIT`
- **SUPABASE_SERVICE_KEY**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjd3l3cWh6ZndzanFudXN2Ymh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTQ2NDY0MiwiZXhwIjoyMDkxMDQwNjQyfQ.c-9qL0HPXMucLI3KhpcoEhyCKAC9_WmCqa6rRjAEDok`

## What Has Been Completed

### Database (✅ Done — SQL already run in Supabase)
- `database/schema.sql` — All 7 tables for the entire project (resources, bookings, incidents, incident_attachments, incident_comments, user_profiles, notifications) with seed data

### Backend — Spring Boot (✅ Code Complete, needs first run)
**Path**: `backend/`  
**Package**: `com.smartcampus`

Files created:
```
backend/
├── pom.xml                          (Spring Boot 3.x, JPA, PostgreSQL, Validation, Lombok)
├── mvnw.cmd + .mvn/wrapper/         (Maven wrapper for running without global Maven)
└── src/main/java/com/smartcampus/
    ├── SmartCampusApplication.java
    ├── common/
    │   ├── ApiResponse.java          (shared { success, message, data } wrapper)
    │   └── GlobalExceptionHandler.java
    ├── config/
    │   ├── CorsConfig.java           (allows localhost:5173)
    │   └── AppConfig.java            (RestTemplate bean for Supabase Storage)
    └── module_c/
        ├── controller/
        │   ├── IncidentController.java         (6 endpoints)
        │   ├── IncidentAttachmentController.java (3 endpoints)
        │   └── IncidentCommentController.java    (4 endpoints)
        ├── service/
        │   ├── IncidentService.java / IncidentServiceImpl.java
        │   ├── AttachmentService.java / AttachmentServiceImpl.java
        │   └── CommentService.java / CommentServiceImpl.java
        ├── repository/
        │   ├── IncidentRepository.java
        │   ├── IncidentAttachmentRepository.java
        │   └── IncidentCommentRepository.java
        ├── entity/
        │   ├── Incident.java
        │   ├── IncidentAttachment.java
        │   └── IncidentComment.java
        ├── dto/
        │   ├── IncidentRequestDTO.java
        │   ├── IncidentResponseDTO.java
        │   ├── StatusUpdateDTO.java
        │   ├── TechnicianAssignDTO.java
        │   ├── AttachmentResponseDTO.java
        │   ├── CommentRequestDTO.java
        │   └── CommentResponseDTO.java
        ├── enums/
        │   ├── IncidentStatus.java   (OPEN, IN_PROGRESS, RESOLVED, CLOSED, REJECTED)
        │   ├── IncidentCategory.java (ELECTRICAL, PLUMBING, EQUIPMENT_FAULT, NETWORK, CLEANING, SAFETY, OTHER)
        │   └── IncidentPriority.java (LOW, MEDIUM, HIGH, CRITICAL)
        └── exception/
            ├── IncidentNotFoundException.java
            ├── InvalidStatusTransitionException.java
            ├── AttachmentLimitExceededException.java
            ├── InvalidFileTypeException.java
            └── UnauthorizedActionException.java
```

**Configuration** (`application.properties`):
- PostgreSQL via Supabase pooler: `jdbc:postgresql://aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`
- `spring.jpa.hibernate.ddl-auto=update`
- Supabase Storage bucket: `incident-attachments`
- Uses env vars: `SUPABASE_DB_PASSWORD`, `SUPABASE_SERVICE_KEY`

**Security**: Currently DISABLED. User identity simulated via headers: `X-User-Id`, `X-User-Email`, `X-User-Role`.

**13 REST Endpoints**:
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/incidents | Create incident |
| GET | /api/v1/incidents | List (own or all with ?all=true) |
| GET | /api/v1/incidents/{id} | Get by ID (with attachments + comments) |
| PUT | /api/v1/incidents/{id}/status | Update status (workflow validated) |
| PUT | /api/v1/incidents/{id}/assign | Assign technician |
| DELETE | /api/v1/incidents/{id} | Delete |
| POST | /api/v1/incidents/{id}/attachments | Upload images (multipart) |
| GET | /api/v1/incidents/{id}/attachments | List attachments |
| DELETE | /api/v1/incidents/{id}/attachments/{aid} | Delete attachment |
| POST | /api/v1/incidents/{id}/comments | Add comment |
| GET | /api/v1/incidents/{id}/comments | List comments |
| PUT | /api/v1/incidents/{id}/comments/{cid} | Edit comment (owner only) |
| DELETE | /api/v1/incidents/{id}/comments/{cid} | Delete comment (owner/admin) |

### Frontend — React + Vite (✅ Code Complete, build passes)
**Path**: `frontend/`

Files created:
```
frontend/
├── .env                             (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY, VITE_API_BASE_URL)
├── index.html                       (updated title + meta)
└── src/
    ├── App.jsx                      (Router + Navbar with role switcher)
    ├── App.css                      (Dark theme, Inter font, glassmorphic navbar)
    ├── utils/
    │   ├── supabase.js              (Supabase client)
    │   └── axiosInstance.js          (axios with X-User-* headers, role switching via localStorage)
    ├── api/
    │   └── incidentsApi.js           (all 13 endpoint functions)
    ├── components/incidents/
    │   ├── IncidentCard.jsx + .css
    │   ├── IncidentStatusBadge.jsx + .css
    │   ├── IncidentPriorityBadge.jsx + .css
    │   ├── AttachmentUploader.jsx + .css   (drag-drop, preview, slot tracking)
    │   ├── AttachmentGallery.jsx + .css
    │   ├── CommentThread.jsx + .css        (inline edit, role-colored avatars)
    │   └── CommentInput.jsx + .css
    └── pages/incidents/
        ├── IncidentListPage.jsx + .css     (grid + status filter tabs)
        ├── IncidentFormPage.jsx + .css     (create form with file upload)
        ├── IncidentDetailPage.jsx + .css   (full view: description, attachments, comments, sidebar)
        └── admin/
            └── AdminIncidentsPage.jsx + .css (table + modals for status/assign)
```

**Routes**:
- `/incidents` — Incident list (user's own / all for admin)
- `/incidents/new` — Report incident form
- `/incidents/:id` — Incident detail view
- `/admin/incidents` — Admin management panel

**Demo Role Switcher**: Navbar dropdown switches between USER, ADMIN, TECHNICIAN (stored in localStorage).

**Demo Users** (matching seed data):
- USER: `11111111-1111-1111-1111-111111111111` / `student1@campus.lk`
- TECHNICIAN: `22222222-2222-2222-2222-222222222222` / `tech1@campus.lk`
- ADMIN: `33333333-3333-3333-3333-333333333333` / `admin@campus.lk`

## How to Run

### Frontend (already has dependencies installed)
```powershell
cd "D:\SLIIT\3rd Year\Y3 S2\PAF\it3030-paf-2026-smart-campus-group1.2\frontend"
npm run dev
# → http://localhost:5173
```

### Backend (Maven wrapper included, first run downloads Maven)
```powershell
cd "D:\SLIIT\3rd Year\Y3 S2\PAF\it3030-paf-2026-smart-campus-group1.2\backend"
.\mvnw.cmd spring-boot:run
# → http://localhost:8080
```

## What's NOT Done Yet
- Backend hasn't been run/tested yet (no first build done)
- Supabase Storage bucket `incident-attachments` needs to be created manually (Dashboard → Storage)
- Security/Auth integration (deferred until Thisangi's module)
- Notification integration (deferred until Thisangi's module)
- Unit tests not written yet
