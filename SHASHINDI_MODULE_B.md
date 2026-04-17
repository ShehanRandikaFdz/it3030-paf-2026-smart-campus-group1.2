# Shashindi – Module B: Booking Management & Conflict Checking
## IT3030 PAF Assignment 2026

> **Your module:** Booking Management
> **Branch naming:** `feature/shashindi/booking-api` and `feature/shashindi/booking-ui`

---

## Your Responsibility Summary

You own everything related to **bookings** — requesting, approving, rejecting, and cancelling resource reservations. Your most critical feature is **conflict checking**: preventing two bookings for the same resource at overlapping times.

---

## Backend — Spring Boot API

### Entity: `Booking.java`
```java
// Location: src/main/java/com/smartcampus/model/entity/Booking.java

@Entity
@Table(name = "bookings")
public class Booking {
    private Long id;

    @ManyToOne
    @JoinColumn(name = "resource_id")
    private Resource resource;       // from Ranushi's module

    private Long userId;             // from Supabase Auth

    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private String purpose;
    private Integer attendees;       // nullable for equipment

    private String status;           // PENDING, APPROVED, REJECTED, CANCELLED
    private String adminNote;        // reason for rejection / cancellation note

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### DTO Classes
```java
// BookingRequestDTO.java — for creating a booking
public class BookingRequestDTO {
    @NotNull private Long resourceId;
    @NotNull private LocalDate date;
    @NotNull private LocalTime startTime;
    @NotNull private LocalTime endTime;
    @NotBlank private String purpose;
    private Integer attendees;
}

// BookingActionDTO.java — for approve/reject actions
public class BookingActionDTO {
    private String adminNote;   // required for REJECTED, optional for APPROVED
}

// BookingResponseDTO.java — what you return
public class BookingResponseDTO {
    private Long id;
    private Long resourceId;
    private String resourceName;    // include resource name for UI convenience
    private String resourceLocation;
    private Long userId;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private String purpose;
    private Integer attendees;
    private String status;
    private String adminNote;
    private LocalDateTime createdAt;
}
```

### Repository: `BookingRepository.java`
```java
// Location: src/main/java/com/smartcampus/repository/BookingRepository.java

public interface BookingRepository extends JpaRepository<Booking, Long> {

    // Find bookings by user
    Page<Booking> findByUserId(Long userId, Pageable pageable);

    // Find bookings for admin (all, with optional status filter)
    Page<Booking> findByStatus(String status, Pageable pageable);

    // CONFLICT CHECK QUERY — this is the most important method you write!
    // Finds overlapping bookings for the same resource on the same date
    @Query("SELECT b FROM Booking b WHERE " +
           "b.resource.id = :resourceId AND " +
           "b.date = :date AND " +
           "b.status IN ('PENDING', 'APPROVED') AND " +
           "b.startTime < :endTime AND " +
           "b.endTime > :startTime")
    List<Booking> findConflictingBookings(
        @Param("resourceId") Long resourceId,
        @Param("date") LocalDate date,
        @Param("startTime") LocalTime startTime,
        @Param("endTime") LocalTime endTime);

    // For checking conflicts excluding a specific booking (for future edit support)
    @Query("SELECT b FROM Booking b WHERE " +
           "b.resource.id = :resourceId AND " +
           "b.date = :date AND " +
           "b.id != :excludeId AND " +
           "b.status IN ('PENDING', 'APPROVED') AND " +
           "b.startTime < :endTime AND " +
           "b.endTime > :startTime")
    List<Booking> findConflictingBookingsExcluding(
        @Param("resourceId") Long resourceId,
        @Param("date") LocalDate date,
        @Param("startTime") LocalTime startTime,
        @Param("endTime") LocalTime endTime,
        @Param("excludeId") Long excludeId);

    // Availability check endpoint support
    List<Booking> findByResourceIdAndDateAndStatusIn(
        Long resourceId, LocalDate date, List<String> statuses);
}
```

### Service: `BookingService.java`
```java
// Location: src/main/java/com/smartcampus/service/BookingService.java

@Service
public class BookingService {

    // KEY METHOD — called during createBooking
    private void checkForConflicts(Long resourceId, LocalDate date,
                                   LocalTime startTime, LocalTime endTime) {
        List<Booking> conflicts = bookingRepository.findConflictingBookings(
            resourceId, date, startTime, endTime);
        if (!conflicts.isEmpty()) {
            throw new BookingConflictException(
                "Resource is already booked during this time. " +
                "Conflicting booking ID: " + conflicts.get(0).getId());
        }
    }

    public BookingResponseDTO createBooking(BookingRequestDTO dto, Long userId) {
        // 1. Validate resource exists (call ResourceRepository)
        // 2. Validate resource is ACTIVE
        // 3. Validate startTime is before endTime
        // 4. Check for conflicts ← CRITICAL
        // 5. Create booking with status = PENDING
        // 6. Trigger notification (call NotificationService from Thisangi)
        checkForConflicts(dto.getResourceId(), dto.getDate(), dto.getStartTime(), dto.getEndTime());
        // ...save and return
    }

    public BookingResponseDTO approveBooking(Long id, BookingActionDTO dto) {
        // 1. Find booking, throw 404 if not found
        // 2. Check current status is PENDING
        // 3. Set status = APPROVED
        // 4. Trigger notification to the booking owner
    }

    public BookingResponseDTO rejectBooking(Long id, BookingActionDTO dto) {
        // 1. Find booking, check status is PENDING
        // 2. Set status = REJECTED, set adminNote
        // 3. Trigger notification
    }

    public BookingResponseDTO cancelBooking(Long id, Long requestingUserId) {
        // 1. Find booking
        // 2. Check user owns booking or is ADMIN
        // 3. Check status is APPROVED or PENDING
        // 4. Set status = CANCELLED
        // 5. Trigger notification
    }

    public List<TimeSlotDTO> getAvailability(Long resourceId, LocalDate date) {
        // Returns list of already-booked time slots for a given resource + date
        // UI uses this to show a visual calendar of availability
    }
}
```

### Custom Exception: `BookingConflictException.java`
```java
// Location: src/main/java/com/smartcampus/exception/BookingConflictException.java

@ResponseStatus(HttpStatus.CONFLICT)
public class BookingConflictException extends RuntimeException {
    public BookingConflictException(String message) {
        super(message);
    }
}
// This returns HTTP 409 Conflict automatically
```

### Controller: `BookingController.java`
```java
@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    // GET /api/bookings?page=0&size=10&status=PENDING
    // USER sees own; ADMIN sees all
    @GetMapping
    public ResponseEntity<Page<BookingResponseDTO>> getBookings(
        @RequestParam(required = false) String status,
        Pageable pageable,
        Authentication auth) { ... }

    // GET /api/bookings/{id}
    @GetMapping("/{id}")
    public ResponseEntity<BookingResponseDTO> getBookingById(
        @PathVariable Long id, Authentication auth) { ... }

    // POST /api/bookings
    @PostMapping
    public ResponseEntity<BookingResponseDTO> createBooking(
        @Valid @RequestBody BookingRequestDTO dto, Authentication auth) { ... }

    // PUT /api/bookings/{id}/approve  → ADMIN only
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingResponseDTO> approveBooking(
        @PathVariable Long id, @RequestBody BookingActionDTO dto) { ... }

    // PUT /api/bookings/{id}/reject  → ADMIN only
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingResponseDTO> rejectBooking(
        @PathVariable Long id, @RequestBody BookingActionDTO dto) { ... }

    // PUT /api/bookings/{id}/cancel  → owner or ADMIN
    @PutMapping("/{id}/cancel")
    public ResponseEntity<BookingResponseDTO> cancelBooking(
        @PathVariable Long id, Authentication auth) { ... }

    // GET /api/resources/{id}/availability?date=2026-04-15
    @GetMapping("/resources/{resourceId}/availability")
    public ResponseEntity<List<TimeSlotDTO>> getAvailability(
        @PathVariable Long resourceId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) { ... }
}
```

### HTTP Status Codes to Use
| Situation | Code |
|---|---|
| Booking created | `201 Created` |
| Booking found / list returned | `200 OK` |
| Status updated | `200 OK` |
| Booking deleted/cancelled | `200 OK` (return updated object) |
| Booking not found | `404 Not Found` |
| Time conflict | `409 Conflict` |
| Validation error | `400 Bad Request` |
| Not authorized (not owner/admin) | `403 Forbidden` |
| Resource is OUT_OF_SERVICE | `400 Bad Request` |

---

## Supabase Table — Your Responsibility

```sql
-- Create in Supabase SQL editor AFTER Ranushi creates resources table

CREATE TABLE bookings (
    id BIGSERIAL PRIMARY KEY,
    resource_id BIGINT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    purpose TEXT NOT NULL,
    attendees INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    admin_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure start_time < end_time at DB level too
    CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Indexes
CREATE INDEX idx_bookings_resource_date ON bookings(resource_id, date);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- RLS: Users see only their own; Admins see all
-- (Thisangi will help configure this)
```

---

## Frontend — React Pages

### Files You Own
```
src/
  ├── api/bookingsApi.js
  ├── pages/
  │   └── bookings/
  │       ├── BookingListPage.jsx     ← user's own bookings
  │       ├── CreateBookingPage.jsx   ← booking form
  │       ├── BookingDetailPage.jsx   ← single booking view
  │       └── AdminBookingsPage.jsx   ← admin view all + approve/reject
  └── components/
      └── bookings/
          ├── BookingCard.jsx
          ├── ConflictWarning.jsx     ← shown when time is already taken
          └── AvailabilityCalendar.jsx ← visual slot picker
```

### API File: `src/api/bookingsApi.js`
```javascript
import axios from 'axios';

const BASE = '/api/bookings';

export const getMyBookings = (params) => axios.get(BASE, { params });
export const getBookingById = (id) => axios.get(`${BASE}/${id}`);
export const createBooking = (data) => axios.post(BASE, data);
export const approveBooking = (id, data) => axios.put(`${BASE}/${id}/approve`, data);
export const rejectBooking = (id, data) => axios.put(`${BASE}/${id}/reject`, data);
export const cancelBooking = (id) => axios.put(`${BASE}/${id}/cancel`);
export const getAvailability = (resourceId, date) =>
  axios.get(`${BASE}/resources/${resourceId}/availability`, { params: { date } });
```

---

## Your Minimum Endpoints (Assignment Requirement)

| # | Method | Endpoint | ✓ |
|---|---|---|---|
| 1 | `GET` | `/api/bookings` | ✓ |
| 2 | `POST` | `/api/bookings` | ✓ |
| 3 | `PUT` | `/api/bookings/{id}/approve` | ✓ |
| 4 | `PUT` | `/api/bookings/{id}/reject` | ✓ |
| 5 | `PUT` | `/api/bookings/{id}/cancel` | ✓ |
| 6 | `GET` | `/api/resources/{id}/availability` | ✓ |
| 7 | `GET` | `/api/bookings/{id}` | ✓ |

7 endpoints — well above the minimum of 4.

---

## Integration Points (Coordinate with teammates)

| Teammate | What you need from them / what you give |
|---|---|
| **Ranushi** | You need `GET /api/resources/{id}` to validate resource before booking; you need `resources` table to exist first |
| **Shehan** | Nothing directly — but inform him booking `resource_id` is the same FK |
| **Thisangi** | Call `notificationService.send(userId, type, message)` after approve/reject/cancel — agree the method signature with Thisangi first |

---

## Critical Logic — Conflict Check Explained

```
New booking request: Resource R, Date D, 10:00 → 12:00

Conflicting if any existing PENDING or APPROVED booking for R on D satisfies:
  existing.startTime < 12:00  AND  existing.endTime > 10:00

Examples:
  09:00 → 11:00  CONFLICTS  (ends after 10:00, starts before 12:00)
  10:30 → 11:30  CONFLICTS
  11:00 → 13:00  CONFLICTS
  08:00 → 10:00  NO CONFLICT  (ends exactly at 10:00, not after)
  12:00 → 14:00  NO CONFLICT  (starts exactly at 12:00, not before)
```

---

## Testing (Your responsibility)

1. **Postman** — test each endpoint, especially conflict cases
2. **Unit test** — `BookingServiceTest.java` — test `checkForConflicts()` with overlapping and non-overlapping cases
3. Test these scenarios explicitly:
   - Create booking → succeeds (no conflict)
   - Create second booking for same slot → returns 409
   - Approve booking → status changes to APPROVED
   - Reject booking → status changes to REJECTED with reason
   - Cancel booking → only owner or ADMIN can cancel

---

## Git Commit Examples

```bash
git commit -m "feat: add Booking entity and Supabase schema"
git commit -m "feat: implement conflict check query in BookingRepository"
git commit -m "feat: implement BookingService with conflict detection"
git commit -m "feat: add BookingController POST and GET endpoints"
git commit -m "feat: add approve/reject/cancel endpoints with ADMIN guard"
git commit -m "feat: add availability endpoint for time slot checking"
git commit -m "feat: add CreateBookingPage with availability picker"
git commit -m "feat: add AdminBookingsPage with approve/reject actions"
git commit -m "test: add BookingService unit tests for conflict scenarios"
```

---

## Report Contribution (Your Section)

- **Module B Requirements** — functional requirements for booking workflow
- **Conflict detection logic** — explain the query and algorithm
- **Booking workflow diagram** — PENDING → APPROVED/REJECTED/CANCELLED state diagram
- **Endpoint table** — your 7 endpoints
- **Screenshots** — CreateBookingPage, AdminBookingsPage, conflict warning
