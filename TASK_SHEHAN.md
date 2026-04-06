# TASK_SHEHAN.md — Module C: Incident Tickets + Attachments + Technician Updates
**Member:** Shehan  
**Module:** C — Incident Tickets + Attachments + Technician Updates  
**Branch:** `feature/module-c-shehan`

---

## Your Responsibility Summary
You own the **incident ticketing** domain: backend API, 3 database tables, file upload handling via Supabase Storage, ticket lifecycle management, technician assignment, and the React UI for reporting and tracking incidents.

---

## Supabase Database — Your 3 Tables

### Table 1: `incidents`
```sql
CREATE TABLE incidents (
    id              BIGSERIAL PRIMARY KEY,
    resource_id     BIGINT REFERENCES resources(id),  -- optional (may be location-based)
    location        VARCHAR(150) NOT NULL,
    reported_by     UUID NOT NULL,               -- Supabase Auth user UUID
    reporter_email  VARCHAR(150) NOT NULL,
    title           VARCHAR(150) NOT NULL,
    description     TEXT NOT NULL,
    category        VARCHAR(50) NOT NULL,
    -- ELECTRICAL, PLUMBING, EQUIPMENT_FAULT, NETWORK, CLEANING, SAFETY, OTHER
    priority        VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    -- LOW, MEDIUM, HIGH, CRITICAL
    status          VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    -- OPEN, IN_PROGRESS, RESOLVED, CLOSED, REJECTED
    assigned_to     UUID,                        -- technician UUID
    assignee_email  VARCHAR(150),
    rejection_reason TEXT,
    contact_phone   VARCHAR(20),
    resolution_notes TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### Table 2: `incident_attachments`
```sql
CREATE TABLE incident_attachments (
    id          BIGSERIAL PRIMARY KEY,
    incident_id BIGINT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    file_name   VARCHAR(255) NOT NULL,
    file_url    TEXT NOT NULL,              -- Supabase Storage public URL
    file_size   BIGINT,                     -- bytes
    mime_type   VARCHAR(100),
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
-- Max 3 attachments per incident — enforce in service layer
```

### Table 3: `incident_comments`
```sql
CREATE TABLE incident_comments (
    id          BIGSERIAL PRIMARY KEY,
    incident_id BIGINT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    author_id   UUID NOT NULL,
    author_email VARCHAR(150) NOT NULL,
    author_role  VARCHAR(20) NOT NULL,     -- USER, ADMIN, TECHNICIAN
    content     TEXT NOT NULL,
    is_edited   BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Backend — Spring Boot

### Package: `com.smartcampus.module_c`
```
module_c/
├── controller/
│   ├── IncidentController.java
│   ├── IncidentAttachmentController.java
│   └── IncidentCommentController.java
├── service/
│   ├── IncidentService.java
│   ├── IncidentServiceImpl.java
│   ├── AttachmentService.java
│   ├── AttachmentServiceImpl.java        ← Supabase Storage upload logic
│   └── CommentService.java
├── repository/
│   ├── IncidentRepository.java
│   ├── AttachmentRepository.java
│   └── CommentRepository.java
├── entity/
│   ├── Incident.java
│   ├── IncidentAttachment.java
│   └── IncidentComment.java
├── dto/
│   ├── IncidentRequestDTO.java
│   ├── IncidentResponseDTO.java
│   ├── IncidentUpdateStatusDTO.java
│   ├── AssignTechnicianDTO.java
│   ├── CommentRequestDTO.java
│   └── CommentResponseDTO.java
└── enums/
    ├── IncidentStatus.java
    ├── IncidentCategory.java
    └── IncidentPriority.java
```

### Your REST Endpoints (minimum 4, different HTTP methods)

| # | Method | Endpoint | Role | Description |
|---|---|---|---|---|
| 1 | `POST` | `/api/v1/incidents` | USER | Create a new incident ticket |
| 2 | `GET` | `/api/v1/incidents` | USER/ADMIN | Get incidents (user: own; admin: all) |
| 3 | `GET` | `/api/v1/incidents/{id}` | USER/ADMIN | Get single incident with comments |
| 4 | `PUT` | `/api/v1/incidents/{id}/status` | ADMIN/TECH | Update ticket status + resolution notes |
| 5 | `PUT` | `/api/v1/incidents/{id}/assign` | ADMIN | Assign technician to ticket |
| 6 | `DELETE` | `/api/v1/incidents/{id}` | ADMIN | Delete an incident (admin only) |
| 7 | `POST` | `/api/v1/incidents/{id}/attachments` | USER | Upload attachments (max 3, multipart) |
| 8 | `DELETE` | `/api/v1/incidents/{id}/attachments/{attachmentId}` | USER/ADMIN | Delete an attachment |
| 9 | `POST` | `/api/v1/incidents/{id}/comments` | USER/ADMIN/TECH | Add a comment |
| 10 | `PUT` | `/api/v1/incidents/{id}/comments/{commentId}` | USER/ADMIN | Edit own comment |
| 11 | `DELETE` | `/api/v1/incidents/{id}/comments/{commentId}` | USER/ADMIN | Delete own comment |

### Ticket Workflow Rules
```
OPEN → IN_PROGRESS    (ADMIN or TECHNICIAN — after assignment)
IN_PROGRESS → RESOLVED (TECHNICIAN — must include resolution notes)
RESOLVED → CLOSED     (ADMIN or auto after N days)
Any status → REJECTED  (ADMIN only — must include rejection_reason)
```

### File Upload — Supabase Storage Integration

Supabase Storage is essentially an S3-compatible API. Use the Supabase Java client or plain HTTP:

```java
// AttachmentServiceImpl.java
@Service
public class AttachmentServiceImpl implements AttachmentService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.service-key}")    // from application.properties / env
    private String supabaseServiceKey;

    private final String BUCKET = "incident-attachments";

    public String uploadFile(MultipartFile file, Long incidentId) throws IOException {
        // Validate: max 3 attachments per incident
        long existingCount = attachmentRepository.countByIncidentId(incidentId);
        if (existingCount >= 3) {
            throw new AttachmentLimitException("Maximum 3 attachments allowed per incident");
        }

        // Validate file type (images only)
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new InvalidFileTypeException("Only image files are allowed");
        }

        // Validate file size (max 5MB)
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new FileTooLargeException("File size must not exceed 5MB");
        }

        // Upload to Supabase Storage via REST
        String fileName = incidentId + "/" + UUID.randomUUID() + "_" + file.getOriginalFilename();
        String uploadUrl = supabaseUrl + "/storage/v1/object/" + BUCKET + "/" + fileName;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + supabaseServiceKey);
        headers.setContentType(MediaType.parseMediaType(contentType));

        HttpEntity<byte[]> entity = new HttpEntity<>(file.getBytes(), headers);
        restTemplate.exchange(uploadUrl, HttpMethod.POST, entity, String.class);

        // Return public URL
        return supabaseUrl + "/storage/v1/object/public/" + BUCKET + "/" + fileName;
    }
}
```

### Comment Ownership Rules
```java
// In CommentServiceImpl.java
public void deleteComment(Long commentId, UUID requestingUserId, String requestingUserRole) {
    Comment comment = findCommentOrThrow(commentId);

    boolean isOwner = comment.getAuthorId().equals(requestingUserId);
    boolean isAdmin = "ADMIN".equals(requestingUserRole);

    if (!isOwner && !isAdmin) {
        throw new ForbiddenException("You can only delete your own comments");
    }
    commentRepository.delete(comment);
}
```

### Request / Response Examples

**POST `/api/v1/incidents`** — Request Body:
```json
{
  "resourceId": 3,
  "location": "Lab B202",
  "title": "Projector not displaying output",
  "description": "The ceiling projector in Lab B202 turns on but shows no image. Tried multiple laptops.",
  "category": "EQUIPMENT_FAULT",
  "priority": "HIGH",
  "contactPhone": "+94771234567"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Incident ticket created successfully",
  "data": {
    "id": 7,
    "title": "Projector not displaying output",
    "category": "EQUIPMENT_FAULT",
    "priority": "HIGH",
    "status": "OPEN",
    "location": "Lab B202",
    "attachmentsCount": 0,
    "commentsCount": 0,
    "createdAt": "2026-04-10T09:30:00"
  }
}
```

**PUT `/api/v1/incidents/{id}/status`** — Request Body:
```json
{
  "status": "RESOLVED",
  "resolutionNotes": "Replaced the HDMI cable. Projector now working correctly."
}
```

**POST `/api/v1/incidents/{id}/attachments`** — Multipart form:
```
Content-Type: multipart/form-data
files: [file1.jpg, file2.jpg]   (max 3 total including existing)
```

### Validation Rules
```java
// IncidentRequestDTO.java
@NotBlank(message = "Location is required")
private String location;

@NotBlank(message = "Title is required")
@Size(max = 150)
private String title;

@NotBlank(message = "Description is required")
@Size(min = 20, message = "Description must be at least 20 characters")
private String description;

@NotNull(message = "Category is required")
private IncidentCategory category;

@NotNull(message = "Priority is required")
private IncidentPriority priority;
```

### Dependency on Thisangi's Module
After status update, trigger a notification:
```java
@Autowired
private NotificationService notificationService;  // Thisangi's service

// After status change:
notificationService.createNotification(
    incident.getReportedBy(),
    "Ticket Status Updated",
    "Your incident '" + incident.getTitle() + "' is now " + newStatus,
    NotificationType.TICKET_STATUS_CHANGED
);

// After new comment:
notificationService.createNotification(
    incident.getReportedBy(),
    "New Comment on Your Ticket",
    commenterEmail + " commented on: " + incident.getTitle(),
    NotificationType.NEW_COMMENT
);
```

---

## Frontend — React Pages

### Your Pages/Components
```
src/pages/incidents/
├── IncidentListPage.jsx           — All user's incidents (with status filter)
├── IncidentFormPage.jsx           — Report new incident (with file upload)
├── IncidentDetailPage.jsx         — View ticket, attachments, comments thread
└── admin/
    └── AdminIncidentsPage.jsx     — Admin: all tickets, assign, change status
src/components/incidents/
├── IncidentCard.jsx
├── IncidentStatusBadge.jsx        — OPEN/IN_PROGRESS/RESOLVED/CLOSED/REJECTED
├── IncidentPriorityBadge.jsx      — LOW/MEDIUM/HIGH/CRITICAL
├── AttachmentUploader.jsx         — Drag-drop image uploader (max 3)
├── AttachmentGallery.jsx          — Thumbnail view of attachments
├── CommentThread.jsx              — List of comments
└── CommentInput.jsx               — Add/edit comment
src/api/incidentsApi.js
```

### API File (`src/api/incidentsApi.js`)
```javascript
import axios from '../utils/axiosInstance';

export const createIncident = (data) =>
  axios.post('/api/v1/incidents', data);

export const getMyIncidents = (params) =>
  axios.get('/api/v1/incidents', { params });

export const getAllIncidents = (params) =>       // admin
  axios.get('/api/v1/incidents', { params: { ...params, all: true } });

export const getIncidentById = (id) =>
  axios.get(`/api/v1/incidents/${id}`);

export const updateIncidentStatus = (id, data) =>
  axios.put(`/api/v1/incidents/${id}/status`, data);

export const assignTechnician = (id, data) =>   // admin
  axios.put(`/api/v1/incidents/${id}/assign`, data);

export const uploadAttachments = (id, files) => {
  const form = new FormData();
  files.forEach(f => form.append('files', f));
  return axios.post(`/api/v1/incidents/${id}/attachments`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const deleteAttachment = (id, attachmentId) =>
  axios.delete(`/api/v1/incidents/${id}/attachments/${attachmentId}`);

export const addComment = (id, data) =>
  axios.post(`/api/v1/incidents/${id}/comments`, data);

export const editComment = (id, commentId, data) =>
  axios.put(`/api/v1/incidents/${id}/comments/${commentId}`, data);

export const deleteComment = (id, commentId) =>
  axios.delete(`/api/v1/incidents/${id}/comments/${commentId}`);
```

### Routes
```jsx
<Route path="/incidents" element={<ProtectedRoute><IncidentListPage /></ProtectedRoute>} />
<Route path="/incidents/new" element={<ProtectedRoute><IncidentFormPage /></ProtectedRoute>} />
<Route path="/incidents/:id" element={<ProtectedRoute><IncidentDetailPage /></ProtectedRoute>} />
<Route path="/admin/incidents" element={<ProtectedRoute role="ADMIN"><AdminIncidentsPage /></ProtectedRoute>} />
```

---

## Testing Evidence Required

### Unit Tests
- `testCreateIncident_success()`
- `testCreateIncident_missingDescription_throwsValidationError()`
- `testUploadAttachment_exceedsLimit_throws400()`
- `testUploadAttachment_notImage_throws400()`
- `testUpdateStatus_toResolved_requiresNotes()`
- `testDeleteComment_notOwner_throws403()`
- `testDeleteComment_admin_canDeleteAny()`

### Postman Collection
1. Create incident (201)
2. Create incident — missing fields (400)
3. Get my incidents (200)
4. Get incident by ID with comments (200)
5. Upload attachments (200)
6. Upload 4th attachment — limit exceeded (400)
7. Upload non-image file (400)
8. Add comment (201)
9. Edit own comment (200)
10. Delete comment — not owner (403)
11. Admin: assign technician (200)
12. Technician: update status to RESOLVED with notes (200)
13. Admin: reject ticket with reason (200)

---

## application.properties — Add These

```properties
# Supabase Storage
supabase.url=https://xxxxxxxxxxx.supabase.co
supabase.service-key=${SUPABASE_SERVICE_KEY}   # set as env variable, never commit the actual key

# Multipart file upload
spring.servlet.multipart.enabled=true
spring.servlet.multipart.max-file-size=5MB
spring.servlet.multipart.max-request-size=15MB
```

---

## Timeline Suggestion

| Day | Task |
|---|---|
| Day 1 | Branch setup, create 3 Supabase tables, scaffold packages |
| Day 2 | Implement IncidentService + IncidentController (CRUD) |
| Day 3 | Implement AttachmentService + Supabase Storage upload |
| Day 4 | Implement CommentService with ownership rules |
| Day 5 | React: IncidentListPage, IncidentFormPage |
| Day 6 | React: IncidentDetailPage (comments + attachments UI) |
| Day 7 | React: AdminIncidentsPage (assign + status update) |
| Day 8 | Unit tests, Postman collection |
| Day 9 | End-to-end testing, bug fixes, coordinate notification calls with Thisangi |
| Day 10 | Report section + merge PR |

---

## Notes & Reminders
- **Supabase Storage bucket** needs to be created manually in the Supabase dashboard — create a bucket named `incident-attachments` with public access for image URLs, or private with signed URLs.
- **Never commit your Supabase service key.** Put it in `.env` or GitHub Secrets.
- **Comment ownership:** Users can edit/delete their own comments. Admins can delete any comment but cannot edit others' comments.
- The `TECHNICIAN` role is handled by Thisangi — coordinate so that tech users can call the status update endpoint.
- Seed the tables with at least 5 incidents covering different statuses, 2 with attachments, and 3 with comments for a good viva demo.
