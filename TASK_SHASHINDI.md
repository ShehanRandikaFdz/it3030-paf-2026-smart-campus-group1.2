# TASK_SHASHINDI.md — Module B: Booking Management
**Member:** Shashindi  
**Module:** B — Booking Workflow + Conflict Checking  
**Branch:** `feature/module-b-shashindi`

---

## Your Responsibility Summary
You own the **bookings** domain end-to-end: backend API, database table, conflict detection logic, and React UI for booking requests and admin review. You depend on Ranushi's `ResourceService` for resource validation — coordinate with her early.

---

## Supabase Database — Your Table

### Table: `bookings`
```sql
CREATE TABLE bookings (
    id              BIGSERIAL PRIMARY KEY,
    resource_id     BIGINT NOT NULL REFERENCES resources(id),
    user_id         UUID   NOT NULL,          -- Supabase Auth user UUID
    user_email      VARCHAR(150) NOT NULL,
    title           VARCHAR(150) NOT NULL,
    purpose         TEXT NOT NULL,
    booking_date    DATE NOT NULL,
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    attendees       INT DEFAULT 1,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    -- PENDING, APPROVED, REJECTED, CANCELLED
    admin_note      TEXT,                     -- reason for rejection / admin note
    reviewed_by     UUID,                     -- admin user UUID
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast conflict checking:
CREATE INDEX idx_bookings_resource_date
    ON bookings(resource_id, booking_date, status);
```

---

## Backend — Spring Boot

### Package: `com.smartcampus.module_b`
```
module_b/
├── controller/
│   └── BookingController.java
├── service/
│   ├── BookingService.java
│   ├── BookingServiceImpl.java
│   └── ConflictCheckService.java       ← your most important class
├── repository/
│   └── BookingRepository.java
├── entity/
│   └── Booking.java
├── dto/
│   ├── BookingRequestDTO.java
│   ├── BookingResponseDTO.java
│   └── BookingReviewDTO.java           (approve/reject payload)
└── enums/
    └── BookingStatus.java              (PENDING, APPROVED, REJECTED, CANCELLED)
```

### Your REST Endpoints (minimum 4, different HTTP methods)

| # | Method | Endpoint | Role | Description |
|---|---|---|---|---|
| 1 | `POST` | `/api/v1/bookings` | USER | Create a new booking request |
| 2 | `GET` | `/api/v1/bookings/my` | USER | Get current user's own bookings |
| 3 | `GET` | `/api/v1/bookings/{id}` | USER/ADMIN | Get single booking by ID |
| 4 | `GET` | `/api/v1/bookings` | ADMIN | Get all bookings (with filters) |
| 5 | `PUT` | `/api/v1/bookings/{id}/review` | ADMIN | Approve or reject a booking |
| 6 | `PUT` | `/api/v1/bookings/{id}/cancel` | USER | Cancel an approved/pending booking |
| 7 | `GET` | `/api/v1/bookings/availability` | USER | Check resource availability for a time slot |

### Conflict Checking Logic — Core of Your Module

The `ConflictCheckService` must prevent double-booking of the same resource:

```java
// ConflictCheckService.java
@Service
public class ConflictCheckService {

    @Autowired
    private BookingRepository bookingRepository;

    /**
     * Returns true if an APPROVED booking already exists for the resource
     * that overlaps with the requested [startTime, endTime] on the same date.
     */
    public boolean hasConflict(Long resourceId, LocalDate date,
                               LocalTime startTime, LocalTime endTime,
                               Long excludeBookingId) {
        return bookingRepository.existsConflict(
            resourceId, date, startTime, endTime,
            excludeBookingId, BookingStatus.APPROVED
        );
    }
}
```

```java
// BookingRepository.java — custom JPQL query
@Query("""
    SELECT COUNT(b) > 0 FROM Booking b
    WHERE b.resourceId = :resourceId
      AND b.bookingDate = :date
      AND b.status = :status
      AND b.id != :excludeId
      AND b.startTime < :endTime
      AND b.endTime > :startTime
""")
boolean existsConflict(
    @Param("resourceId") Long resourceId,
    @Param("date") LocalDate date,
    @Param("startTime") LocalTime startTime,
    @Param("endTime") LocalTime endTime,
    @Param("excludeId") Long excludeId,
    @Param("status") BookingStatus status
);
```

### Booking Workflow Rules
```
PENDING   → APPROVED  (admin action)
PENDING   → REJECTED  (admin action, reason required)
APPROVED  → CANCELLED (user action, only if future date)
PENDING   → CANCELLED (user action)
```
- A booking can only be cancelled if `bookingDate` is in the future (or today).
- When a booking is APPROVED, trigger a notification to the user (call Thisangi's `NotificationService`).
- When a booking is REJECTED, trigger a notification with the admin's reason.

### Request / Response Examples

**POST `/api/v1/bookings`** — Request Body:
```json
{
  "resourceId": 1,
  "title": "IT Project Meeting",
  "purpose": "Weekly sprint planning for the PAF assignment",
  "bookingDate": "2026-04-15",
  "startTime": "10:00",
  "endTime": "12:00",
  "attendees": 4
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Booking request submitted successfully",
  "data": {
    "id": 42,
    "resourceId": 1,
    "resourceName": "Lab A101",
    "title": "IT Project Meeting",
    "bookingDate": "2026-04-15",
    "startTime": "10:00",
    "endTime": "12:00",
    "status": "PENDING"
  }
}
```

**PUT `/api/v1/bookings/{id}/review`** — Request Body:
```json
{
  "action": "APPROVED",
  "adminNote": "Approved. Please ensure lab is locked after use."
}
```

**Conflict Response (409 Conflict):**
```json
{
  "success": false,
  "message": "This resource is already booked for the requested time slot",
  "data": null
}
```

### Validation Rules (BookingRequestDTO)
```java
@NotNull(message = "Resource ID is required")
private Long resourceId;

@NotBlank(message = "Title is required")
@Size(max = 150)
private String title;

@NotNull(message = "Booking date is required")
@FutureOrPresent(message = "Booking date cannot be in the past")
private LocalDate bookingDate;

@NotNull
private LocalTime startTime;

@NotNull
private LocalTime endTime;
// Custom validator: endTime must be after startTime
```

### Dependency on Ranushi's Module
At booking creation, validate:
1. The resource exists → call `ResourceService.getResourceById(resourceId)` (Ranushi's method)
2. The resource is ACTIVE → call `ResourceService.isResourceActive(resourceId)` (Ranushi's method)

```java
// In BookingServiceImpl.java
@Autowired
private ResourceService resourceService;   // Ranushi's service

public BookingResponseDTO createBooking(BookingRequestDTO dto, UUID userId) {
    // 1. Check resource exists and is active
    if (!resourceService.isResourceActive(dto.getResourceId())) {
        throw new ResourceNotAvailableException("Resource is not available for booking");
    }
    // 2. Check for time conflicts
    if (conflictCheckService.hasConflict(...)) {
        throw new BookingConflictException("Time slot already booked");
    }
    // 3. Save booking...
    // 4. Notify user (Thisangi's service)
    notificationService.sendBookingConfirmation(savedBooking);
}
```

### Dependency on Thisangi's Module
Call this after approve/reject (Thisangi will implement it):
```java
@Autowired
private NotificationService notificationService;

// After approval:
notificationService.createNotification(
    booking.getUserId(),
    "Booking Approved",
    "Your booking for " + resourceName + " on " + bookingDate + " has been approved.",
    NotificationType.BOOKING_APPROVED
);
```

---

## Frontend — React Pages

### Your Pages/Components
```
src/pages/bookings/
├── BookingListPage.jsx         — User's own bookings (with status filters)
├── BookingFormPage.jsx         — New booking request form
├── BookingDetailPage.jsx       — View single booking details
└── admin/
    └── AdminBookingsPage.jsx   — Admin view: all bookings, approve/reject
src/components/bookings/
├── BookingCard.jsx             — Booking summary card
├── BookingStatusBadge.jsx      — PENDING/APPROVED/REJECTED/CANCELLED badge
├── BookingReviewModal.jsx      — Approve/Reject modal for admin
└── AvailabilityChecker.jsx     — Check slot availability before submitting
src/api/bookingsApi.js          — All Axios calls for this module
```

### API File (`src/api/bookingsApi.js`)
```javascript
import axios from '../utils/axiosInstance';

export const createBooking = (data) =>
  axios.post('/api/v1/bookings', data);

export const getMyBookings = (params) =>
  axios.get('/api/v1/bookings/my', { params });

export const getBookingById = (id) =>
  axios.get(`/api/v1/bookings/${id}`);

export const getAllBookings = (params) =>       // admin
  axios.get('/api/v1/bookings', { params });

export const reviewBooking = (id, data) =>     // admin: approve/reject
  axios.put(`/api/v1/bookings/${id}/review`, data);

export const cancelBooking = (id) =>
  axios.put(`/api/v1/bookings/${id}/cancel`);

export const checkAvailability = (resourceId, date, startTime, endTime) =>
  axios.get('/api/v1/bookings/availability', {
    params: { resourceId, date, startTime, endTime }
  });
```

### Routes
```jsx
<Route path="/bookings" element={<ProtectedRoute><BookingListPage /></ProtectedRoute>} />
<Route path="/bookings/new" element={<ProtectedRoute><BookingFormPage /></ProtectedRoute>} />
<Route path="/bookings/:id" element={<ProtectedRoute><BookingDetailPage /></ProtectedRoute>} />
<Route path="/admin/bookings" element={<ProtectedRoute role="ADMIN"><AdminBookingsPage /></ProtectedRoute>} />
```

---

## Testing Evidence Required

### Unit Tests (BookingServiceImplTest.java)
- `testCreateBooking_success()`
- `testCreateBooking_conflictDetected_throws409()`
- `testCreateBooking_resourceNotActive_throwsException()`
- `testApproveBooking_success()`
- `testRejectBooking_requiresReason()`
- `testCancelBooking_pastDate_throwsException()`

### Postman Collection
1. Create booking — success (201)
2. Create booking — conflict (409)
3. Create booking — resource inactive (400)
4. Create booking — past date (400)
5. Get my bookings (200)
6. Admin: get all bookings (200)
7. Admin: approve booking (200)
8. Admin: reject booking with reason (200)
9. User: cancel own booking (200)
10. Check availability (200)

---

## Timeline Suggestion

| Day | Task |
|---|---|
| Day 1 | Branch setup, Supabase table, scaffold Spring Boot package |
| Day 2 | Implement ConflictCheckService + custom JPQL query |
| Day 3-4 | BookingService, Controller — all 7 endpoints |
| Day 5-6 | React: BookingFormPage, BookingListPage |
| Day 7 | React: AdminBookingsPage, BookingReviewModal |
| Day 8 | Unit tests, Postman collection |
| Day 9 | Integration testing with Ranushi's module, bug fixes |
| Day 10 | Report section + merge PR |

---

## Notes & Reminders
- **Coordinate with Ranushi on Day 1** about `ResourceService.isResourceActive()` — you need it before you can test booking creation.
- **Coordinate with Thisangi on Day 1** about the `NotificationService` interface — even a stub method is enough to start.
- The conflict check is the most important and unique part of your module — make sure it is thoroughly tested.
- Seed the bookings table with sample data covering all 4 statuses for a convincing viva demo.
