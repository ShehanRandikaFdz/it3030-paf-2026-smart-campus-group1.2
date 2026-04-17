# Ranushi – Module A: Facilities & Assets Catalogue
## IT3030 PAF Assignment 2026

> **Your module:** Facilities & Assets Catalogue
> **Branch naming:** `feature/ranushi/facilities-api` and `feature/ranushi/facilities-ui`

---

## Your Responsibility Summary

You own everything related to **resources** (lecture halls, labs, meeting rooms, equipment). You build the catalogue that all other modules depend on — Shashindi's bookings and Shehan's tickets both reference your `resources` table.

---

## Backend — Spring Boot API

### Entity: `Resource.java`
```java
// Location: src/main/java/com/smartcampus/model/entity/Resource.java

@Entity
@Table(name = "resources")
public class Resource {
    private Long id;
    private String name;
    private String type;          // LECTURE_HALL, LAB, MEETING_ROOM, EQUIPMENT
    private Integer capacity;     // null for equipment
    private String location;      // e.g. "Block A, Floor 2"
    private String status;        // ACTIVE, OUT_OF_SERVICE
    private String availabilityWindows; // e.g. "Mon-Fri 08:00-18:00"
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### DTO: `ResourceRequestDTO.java` and `ResourceResponseDTO.java`
```java
// Request DTO (for POST and PUT)
public class ResourceRequestDTO {
    @NotBlank private String name;
    @NotBlank private String type;
    private Integer capacity;
    @NotBlank private String location;
    @NotBlank private String status;
    private String availabilityWindows;
}

// Response DTO (what you return to clients)
public class ResourceResponseDTO {
    private Long id;
    private String name;
    private String type;
    private Integer capacity;
    private String location;
    private String status;
    private String availabilityWindows;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### Repository: `ResourceRepository.java`
```java
// Location: src/main/java/com/smartcampus/repository/ResourceRepository.java

public interface ResourceRepository extends JpaRepository<Resource, Long> {
    List<Resource> findByType(String type);
    List<Resource> findByLocationContainingIgnoreCase(String location);
    List<Resource> findByTypeAndStatus(String type, String status);
    Page<Resource> findByTypeAndCapacityGreaterThanEqual(
        String type, int capacity, Pageable pageable);
    // Custom query for search with multiple optional filters
    @Query("SELECT r FROM Resource r WHERE " +
           "(:type IS NULL OR r.type = :type) AND " +
           "(:location IS NULL OR LOWER(r.location) LIKE LOWER(CONCAT('%', :location, '%'))) AND " +
           "(:minCapacity IS NULL OR r.capacity >= :minCapacity) AND " +
           "(:status IS NULL OR r.status = :status)")
    Page<Resource> searchResources(
        @Param("type") String type,
        @Param("location") String location,
        @Param("minCapacity") Integer minCapacity,
        @Param("status") String status,
        Pageable pageable);
}
```

### Service: `ResourceService.java`
```java
// Location: src/main/java/com/smartcampus/service/ResourceService.java

@Service
public class ResourceService {
    public Page<ResourceResponseDTO> getAllResources(Pageable pageable) { ... }
    public ResourceResponseDTO getResourceById(Long id) { ... }
    public ResourceResponseDTO createResource(ResourceRequestDTO dto) { ... }
    public ResourceResponseDTO updateResource(Long id, ResourceRequestDTO dto) { ... }
    public void deleteResource(Long id) { ... }
    public Page<ResourceResponseDTO> searchResources(
        String type, String location, Integer minCapacity, String status, Pageable pageable) { ... }
}
```

### Controller: `ResourceController.java`
```java
// Location: src/main/java/com/smartcampus/controller/ResourceController.java

@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    // GET /api/resources?page=0&size=10
    @GetMapping
    public ResponseEntity<Page<ResourceResponseDTO>> getAllResources(Pageable pageable) { ... }

    // GET /api/resources/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ResourceResponseDTO> getResourceById(@PathVariable Long id) { ... }

    // GET /api/resources/search?type=LAB&location=Block+A&minCapacity=30&status=ACTIVE
    @GetMapping("/search")
    public ResponseEntity<Page<ResourceResponseDTO>> searchResources(
        @RequestParam(required = false) String type,
        @RequestParam(required = false) String location,
        @RequestParam(required = false) Integer minCapacity,
        @RequestParam(required = false) String status,
        Pageable pageable) { ... }

    // POST /api/resources  → ADMIN only
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResourceResponseDTO> createResource(
        @Valid @RequestBody ResourceRequestDTO dto) { ... }

    // PUT /api/resources/{id}  → ADMIN only
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResourceResponseDTO> updateResource(
        @PathVariable Long id, @Valid @RequestBody ResourceRequestDTO dto) { ... }

    // DELETE /api/resources/{id}  → ADMIN only
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteResource(@PathVariable Long id) { ... }
}
```

### HTTP Status Codes to Use
| Situation | Status Code |
|---|---|
| Resource found / list returned | `200 OK` |
| Resource created successfully | `201 Created` |
| Resource deleted | `204 No Content` |
| Resource not found | `404 Not Found` |
| Validation error (bad input) | `400 Bad Request` |
| User not ADMIN | `403 Forbidden` |

---

## Supabase Table — Your Responsibility

```sql
-- Create this table in Supabase SQL editor
CREATE TABLE resources (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT')),
    capacity INTEGER,
    location VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'OUT_OF_SERVICE')),
    availability_windows TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for search performance
CREATE INDEX idx_resources_type ON resources(type);
CREATE INDEX idx_resources_status ON resources(status);
CREATE INDEX idx_resources_location ON resources(location);

-- Seed data (add a few test resources)
INSERT INTO resources (name, type, capacity, location, status, availability_windows) VALUES
('Lecture Hall A101', 'LECTURE_HALL', 120, 'Block A, Floor 1', 'ACTIVE', 'Mon-Fri 08:00-18:00'),
('Computer Lab B202', 'LAB', 40, 'Block B, Floor 2', 'ACTIVE', 'Mon-Sat 08:00-20:00'),
('Meeting Room C301', 'MEETING_ROOM', 12, 'Block C, Floor 3', 'ACTIVE', 'Mon-Fri 09:00-17:00'),
('Projector #001', 'EQUIPMENT', NULL, 'AV Store, Block A', 'ACTIVE', 'Mon-Fri 08:00-18:00');
```

---

## Frontend — React Pages

### Files You Own
```
src/
  ├── api/resourcesApi.js            ← your API call functions
  ├── pages/
  │   └── facilities/
  │       ├── ResourceListPage.jsx   ← list + search + filter
  │       ├── ResourceDetailPage.jsx ← single resource view
  │       └── ResourceFormPage.jsx   ← create/edit form (ADMIN only)
  └── components/
      └── facilities/
          ├── ResourceCard.jsx       ← reusable card component
          └── ResourceSearchBar.jsx  ← search/filter component
```

### API File: `src/api/resourcesApi.js`
```javascript
import axios from 'axios';

const BASE = '/api/resources';

export const getResources = (params) => axios.get(BASE, { params });
export const getResourceById = (id) => axios.get(`${BASE}/${id}`);
export const searchResources = (params) => axios.get(`${BASE}/search`, { params });
export const createResource = (data) => axios.post(BASE, data);
export const updateResource = (id, data) => axios.put(`${BASE}/${id}`, data);
export const deleteResource = (id) => axios.delete(`${BASE}/${id}`);
```

### Pages to Build
1. **ResourceListPage** — table/grid of all resources, search bar at top, filter by type/status, pagination
2. **ResourceDetailPage** — shows all resource metadata, "Book this resource" button (links to Shashindi's booking page)
3. **ResourceFormPage** — form for ADMIN to add or edit a resource (show/hide based on role)

---

## Your Minimum Endpoints (Assignment Requirement)

You need at least **4 endpoints using different HTTP methods**. You have:

| # | Method | Endpoint | ✓ |
|---|---|---|---|
| 1 | `GET` | `/api/resources` | ✓ |
| 2 | `GET` | `/api/resources/search` | ✓ |
| 3 | `POST` | `/api/resources` | ✓ |
| 4 | `PUT` | `/api/resources/{id}` | ✓ |
| 5 | `DELETE` | `/api/resources/{id}` | ✓ |
| 6 | `GET` | `/api/resources/{id}` | ✓ |

You have 6 endpoints — well above the minimum of 4.

---

## Integration Points (Coordinate with teammates)

| Teammate | What they need from you |
|---|---|
| **Shashindi** | `resource_id` FK in bookings table; `GET /api/resources/{id}` to validate resource exists before booking |
| **Shehan** | `resource_id` FK in tickets table (nullable); resource list for ticket creation form dropdown |
| **Thisangi** | Resource entity exists before auth policies are applied; RLS rules on `resources` table |

---

## Testing (Your responsibility)

1. **Postman collection** — test all 6 endpoints with valid and invalid inputs
2. **Unit test** — `ResourceServiceTest.java` testing `createResource()` and `searchResources()`
3. **Integration test** — test the controller endpoints with MockMvc

---

## Git Commit Examples

```bash
git commit -m "feat: add Resource entity and Supabase table schema"
git commit -m "feat: implement ResourceRepository with search query"
git commit -m "feat: implement ResourceService CRUD methods"
git commit -m "feat: add ResourceController with GET and POST endpoints"
git commit -m "feat: add DELETE and PUT endpoints with ADMIN authorization"
git commit -m "feat: add ResourceListPage with search and filter UI"
git commit -m "feat: add ResourceFormPage for ADMIN create/edit"
git commit -m "test: add unit tests for ResourceService"
```

---

## Report Contribution (Your Section)

Write these sections in the group report:
- **Module A Requirements** — list of functional requirements for the catalogue
- **Resource API endpoints** — your endpoint table
- **Resource DB table** — your table design with field descriptions
- **Frontend screenshots** — ResourceListPage and ResourceFormPage
