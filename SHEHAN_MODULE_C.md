# Shehan – Module C: Incident Tickets, Attachments & Technician Updates
## IT3030 PAF Assignment 2026

> **Your module:** Maintenance & Incident Ticketing
> **Branch naming:** `feature/shehan/tickets-api` and `feature/shehan/tickets-ui`

---

## Your Responsibility Summary

You own everything related to **incident tickets** — users report faults, staff get assigned, technicians update status, and the team adds comments. You also handle **file uploads** (up to 3 image attachments per ticket) using Supabase Storage.

---

## Backend — Spring Boot API

### Entities

#### `Ticket.java`
```java
@Entity
@Table(name = "tickets")
public class Ticket {
    private Long id;

    @ManyToOne
    @JoinColumn(name = "resource_id", nullable = true)
    private Resource resource;       // optional — from Ranushi

    private String location;         // free text location if not a specific resource
    private String category;         // ELECTRICAL, PLUMBING, IT_EQUIPMENT, FURNITURE, OTHER
    private String description;
    private String priority;         // LOW, MEDIUM, HIGH, CRITICAL
    private String contactDetails;   // preferred contact for follow-up

    private String status;           // OPEN, IN_PROGRESS, RESOLVED, CLOSED, REJECTED
    private Long assignedTo;         // technician user ID (nullable)
    private String resolutionNotes;

    private Long createdBy;          // user ID who reported

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

#### `TicketComment.java`
```java
@Entity
@Table(name = "ticket_comments")
public class TicketComment {
    private Long id;

    @ManyToOne
    @JoinColumn(name = "ticket_id")
    private Ticket ticket;

    private Long authorId;
    private String authorName;       // denormalized for display
    private String content;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

#### `TicketAttachment.java`
```java
@Entity
@Table(name = "ticket_attachments")
public class TicketAttachment {
    private Long id;

    @ManyToOne
    @JoinColumn(name = "ticket_id")
    private Ticket ticket;

    private String fileUrl;          // Supabase Storage URL
    private String fileName;
    private Long uploadedBy;

    private LocalDateTime createdAt;
}
```

### DTOs
```java
// TicketRequestDTO.java
public class TicketRequestDTO {
    private Long resourceId;         // optional
    @NotBlank private String location;
    @NotBlank private String category;
    @NotBlank private String description;
    @NotBlank private String priority;
    private String contactDetails;
}

// TicketStatusUpdateDTO.java
public class TicketStatusUpdateDTO {
    @NotBlank private String status;
    private String resolutionNotes;  // required if status = RESOLVED or CLOSED
    private String rejectReason;     // required if status = REJECTED
}

// TicketAssignDTO.java
public class TicketAssignDTO {
    @NotNull private Long technicianId;
}

// CommentRequestDTO.java
public class CommentRequestDTO {
    @NotBlank private String content;
}

// TicketResponseDTO.java — full ticket with attachments + comments
public class TicketResponseDTO {
    private Long id;
    private Long resourceId;
    private String resourceName;
    private String location;
    private String category;
    private String description;
    private String priority;
    private String status;
    private Long assignedTo;
    private String assignedToName;
    private String resolutionNotes;
    private Long createdBy;
    private List<AttachmentDTO> attachments;
    private List<CommentDTO> comments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### Repository: `TicketRepository.java`
```java
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    Page<Ticket> findByCreatedBy(Long userId, Pageable pageable);
    Page<Ticket> findByStatus(String status, Pageable pageable);
    Page<Ticket> findByAssignedTo(Long technicianId, Pageable pageable);

    @Query("SELECT t FROM Ticket t WHERE " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:priority IS NULL OR t.priority = :priority) AND " +
           "(:category IS NULL OR t.category = :category)")
    Page<Ticket> findWithFilters(
        @Param("status") String status,
        @Param("priority") String priority,
        @Param("category") String category,
        Pageable pageable);
}

public interface TicketCommentRepository extends JpaRepository<TicketComment, Long> {
    List<TicketComment> findByTicketIdOrderByCreatedAtAsc(Long ticketId);
}

public interface TicketAttachmentRepository extends JpaRepository<TicketAttachment, Long> {
    List<TicketAttachment> findByTicketId(Long ticketId);
    int countByTicketId(Long ticketId);  // for enforcing max 3 attachments
}
```

### Service: `TicketService.java`
```java
@Service
public class TicketService {

    // CREATE — any authenticated user
    public TicketResponseDTO createTicket(TicketRequestDTO dto, Long userId) {
        // Create with status = OPEN
        // Trigger notification to ADMINs (call Thisangi's NotificationService)
    }

    // UPDATE STATUS — ADMIN or assigned TECHNICIAN
    public TicketResponseDTO updateStatus(Long id, TicketStatusUpdateDTO dto, Long userId) {
        // Validate status transition:
        // OPEN → IN_PROGRESS, REJECTED
        // IN_PROGRESS → RESOLVED, OPEN
        // RESOLVED → CLOSED
        // Trigger notification to ticket creator
    }

    // ASSIGN TECHNICIAN — ADMIN only
    public TicketResponseDTO assignTechnician(Long id, TicketAssignDTO dto) {
        // Set assignedTo field
        // Trigger notification to assigned technician
    }

    // UPLOAD ATTACHMENT
    public AttachmentDTO uploadAttachment(Long ticketId, MultipartFile file, Long userId) {
        // 1. Count existing attachments — throw error if already 3
        int count = attachmentRepository.countByTicketId(ticketId);
        if (count >= 3) throw new MaxAttachmentsException("Maximum 3 attachments allowed per ticket");

        // 2. Validate file type (only images: jpg, png, gif, webp)
        // 3. Upload to Supabase Storage bucket "ticket-attachments"
        // 4. Save URL to ticket_attachments table
    }

    // COMMENT — validate ownership for edit/delete
    public CommentDTO addComment(Long ticketId, CommentRequestDTO dto, Long userId) { ... }

    public CommentDTO editComment(Long ticketId, Long commentId, CommentRequestDTO dto, Long userId) {
        // Only author can edit their own comment
        TicketComment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        if (!comment.getAuthorId().equals(userId)) {
            throw new ForbiddenException("You can only edit your own comments");
        }
        // update content
    }

    public void deleteComment(Long ticketId, Long commentId, Long userId, boolean isAdmin) {
        // Author can delete their own; ADMIN can delete any
    }
}
```

### Controller: `TicketController.java`
```java
@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    // GET /api/tickets?status=OPEN&priority=HIGH&page=0&size=10
    @GetMapping
    public ResponseEntity<Page<TicketResponseDTO>> getTickets(
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String priority,
        @RequestParam(required = false) String category,
        Pageable pageable, Authentication auth) { ... }

    // GET /api/tickets/{id}
    @GetMapping("/{id}")
    public ResponseEntity<TicketResponseDTO> getTicketById(
        @PathVariable Long id) { ... }

    // POST /api/tickets
    @PostMapping
    public ResponseEntity<TicketResponseDTO> createTicket(
        @Valid @RequestBody TicketRequestDTO dto, Authentication auth) { ... }

    // PUT /api/tickets/{id}/status
    @PutMapping("/{id}/status")
    public ResponseEntity<TicketResponseDTO> updateStatus(
        @PathVariable Long id,
        @Valid @RequestBody TicketStatusUpdateDTO dto,
        Authentication auth) { ... }

    // PUT /api/tickets/{id}/assign  → ADMIN only
    @PutMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TicketResponseDTO> assignTechnician(
        @PathVariable Long id,
        @RequestBody TicketAssignDTO dto) { ... }

    // POST /api/tickets/{id}/comments
    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentDTO> addComment(
        @PathVariable Long id,
        @Valid @RequestBody CommentRequestDTO dto,
        Authentication auth) { ... }

    // PUT /api/tickets/{ticketId}/comments/{commentId}
    @PutMapping("/{ticketId}/comments/{commentId}")
    public ResponseEntity<CommentDTO> editComment(
        @PathVariable Long ticketId,
        @PathVariable Long commentId,
        @Valid @RequestBody CommentRequestDTO dto,
        Authentication auth) { ... }

    // DELETE /api/tickets/{ticketId}/comments/{commentId}
    @DeleteMapping("/{ticketId}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
        @PathVariable Long ticketId,
        @PathVariable Long commentId,
        Authentication auth) { ... }

    // POST /api/tickets/{id}/attachments  (multipart/form-data)
    @PostMapping("/{id}/attachments")
    public ResponseEntity<AttachmentDTO> uploadAttachment(
        @PathVariable Long id,
        @RequestParam("file") MultipartFile file,
        Authentication auth) { ... }
}
```

### HTTP Status Codes to Use
| Situation | Code |
|---|---|
| Ticket / comment created | `201 Created` |
| Data fetched / updated | `200 OK` |
| Comment deleted | `204 No Content` |
| Not found | `404 Not Found` |
| Not your comment | `403 Forbidden` |
| More than 3 attachments | `400 Bad Request` |
| Invalid file type | `400 Bad Request` |
| Validation error | `400 Bad Request` |

---

## Supabase Setup — Your Responsibility

### Tables
```sql
-- AFTER Ranushi creates resources table

CREATE TABLE tickets (
    id BIGSERIAL PRIMARY KEY,
    resource_id BIGINT REFERENCES resources(id) ON DELETE SET NULL,
    location VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL
        CHECK (category IN ('ELECTRICAL', 'PLUMBING', 'IT_EQUIPMENT', 'FURNITURE', 'OTHER')),
    description TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL
        CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    contact_details TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN'
        CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED')),
    assigned_to UUID REFERENCES auth.users(id),
    resolution_notes TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ticket_comments (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id),
    author_name VARCHAR(255),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ticket_attachments (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_created_by ON tickets(created_by);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_comments_ticket_id ON ticket_comments(ticket_id);
```

### Supabase Storage (for attachments)
```sql
-- In Supabase dashboard → Storage → Create bucket
-- Bucket name: "ticket-attachments"
-- Set to private (only authenticated users)

-- Storage policy: allow authenticated uploads
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Allow users to read their own ticket files
CREATE POLICY "Users can read ticket attachments"
ON storage.objects FOR SELECT
USING (auth.role() = 'authenticated');
```

### Supabase Storage Java Integration
```java
// Add to your service for uploading to Supabase Storage
// Use the Supabase REST API directly from Spring Boot

@Value("${supabase.url}")
private String supabaseUrl;

@Value("${supabase.service-key}")  // service_role key (NOT the anon key)
private String serviceKey;

public String uploadToSupabaseStorage(MultipartFile file, String ticketId) throws IOException {
    String fileName = ticketId + "/" + UUID.randomUUID() + "_" + file.getOriginalFilename();

    RestTemplate rest = new RestTemplate();
    HttpHeaders headers = new HttpHeaders();
    headers.set("Authorization", "Bearer " + serviceKey);
    headers.setContentType(MediaType.parseMediaType(file.getContentType()));

    HttpEntity<byte[]> entity = new HttpEntity<>(file.getBytes(), headers);

    String uploadUrl = supabaseUrl + "/storage/v1/object/ticket-attachments/" + fileName;
    rest.exchange(uploadUrl, HttpMethod.POST, entity, String.class);

    // Return the public URL
    return supabaseUrl + "/storage/v1/object/public/ticket-attachments/" + fileName;
}
```

---

## Frontend — React Pages

### Files You Own
```
src/
  ├── api/ticketsApi.js
  ├── pages/
  │   └── tickets/
  │       ├── TicketListPage.jsx      ← list with filters
  │       ├── CreateTicketPage.jsx    ← form with file upload
  │       ├── TicketDetailPage.jsx    ← full view with comments + attachments
  │       └── AdminTicketsPage.jsx    ← admin: assign + change status
  └── components/
      └── tickets/
          ├── TicketCard.jsx
          ├── TicketStatusBadge.jsx   ← colored badge per status
          ├── CommentSection.jsx      ← comment list + add comment
          └── AttachmentUpload.jsx    ← drag/drop up to 3 images
```

### API File: `src/api/ticketsApi.js`
```javascript
import axios from 'axios';

const BASE = '/api/tickets';

export const getTickets = (params) => axios.get(BASE, { params });
export const getTicketById = (id) => axios.get(`${BASE}/${id}`);
export const createTicket = (data) => axios.post(BASE, data);
export const updateTicketStatus = (id, data) => axios.put(`${BASE}/${id}/status`, data);
export const assignTechnician = (id, data) => axios.put(`${BASE}/${id}/assign`, data);
export const addComment = (id, data) => axios.post(`${BASE}/${id}/comments`, data);
export const editComment = (ticketId, commentId, data) =>
  axios.put(`${BASE}/${ticketId}/comments/${commentId}`, data);
export const deleteComment = (ticketId, commentId) =>
  axios.delete(`${BASE}/${ticketId}/comments/${commentId}`);
export const uploadAttachment = (id, formData) =>
  axios.post(`${BASE}/${id}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
```

---

## Your Minimum Endpoints (Assignment Requirement)

| # | Method | Endpoint | ✓ |
|---|---|---|---|
| 1 | `GET` | `/api/tickets` | ✓ |
| 2 | `GET` | `/api/tickets/{id}` | ✓ |
| 3 | `POST` | `/api/tickets` | ✓ |
| 4 | `PUT` | `/api/tickets/{id}/status` | ✓ |
| 5 | `PUT` | `/api/tickets/{id}/assign` | ✓ |
| 6 | `POST` | `/api/tickets/{id}/comments` | ✓ |
| 7 | `PUT` | `/api/tickets/{ticketId}/comments/{commentId}` | ✓ |
| 8 | `DELETE` | `/api/tickets/{ticketId}/comments/{commentId}` | ✓ |
| 9 | `POST` | `/api/tickets/{id}/attachments` | ✓ |

9 endpoints — strongest count in the team.

---

## Integration Points (Coordinate with teammates)

| Teammate | What you need / give |
|---|---|
| **Ranushi** | You need `resources` table to exist; optionally use `GET /api/resources` to populate dropdown in ticket creation form |
| **Thisangi** | Call `notificationService.send()` after status change and new comment — agree method signature with Thisangi; also need the `users` table for displaying commenter names |
| **Shashindi** | No direct dependency — just same DB |

---

## Ticket Status Workflow

```
        CREATE
           ↓
         OPEN ──────────────────────────→ REJECTED (admin)
           │
           ↓ (admin assigns + starts work)
       IN_PROGRESS ──────────────────── back to OPEN (if needed)
           │
           ↓ (technician marks resolved)
        RESOLVED
           │
           ↓ (admin closes after verification)
         CLOSED
```

---

## Testing (Your responsibility)

1. **Postman** — test all 9 endpoints including file upload (use form-data)
2. **Unit tests** — `TicketServiceTest.java`
   - Test max 3 attachments constraint
   - Test comment ownership (can't edit others' comments)
   - Test status transition logic
3. **Test file upload** — try uploading a 4th image (should fail with 400)

---

## Git Commit Examples

```bash
git commit -m "feat: add Ticket, TicketComment, TicketAttachment entities"
git commit -m "feat: implement TicketRepository with filter query"
git commit -m "feat: implement TicketService CRUD and status transitions"
git commit -m "feat: add Supabase Storage upload integration"
git commit -m "feat: add TicketController with GET and POST endpoints"
git commit -m "feat: add comment endpoints with ownership enforcement"
git commit -m "feat: add file upload endpoint with 3-attachment limit"
git commit -m "feat: add TicketListPage with filters"
git commit -m "feat: add CreateTicketPage with drag-drop file upload"
git commit -m "feat: add TicketDetailPage with CommentSection"
git commit -m "test: add TicketService unit tests"
```

---

## Report Contribution (Your Section)

- **Module C Requirements** — functional requirements for incident ticketing
- **Ticket workflow diagram** — state machine (OPEN → ... → CLOSED)
- **File upload approach** — explain Supabase Storage integration
- **Comment ownership rules** — explain who can edit/delete what
- **Endpoint table** — your 9 endpoints
- **Screenshots** — CreateTicketPage, TicketDetailPage, attachment upload, admin assignment view
