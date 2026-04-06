# TASK_RANUSHI.md — Module A: Facilities & Assets Catalogue
**Member:** Ranushi  
**Module:** A — Facilities & Assets Catalogue + Resource Management  
**Branch:** `feature/module-a-ranushi`

---

## Your Responsibility Summary
You own the **resources** domain end-to-end: backend API, database table, and React UI pages for managing bookable campus resources (lecture halls, labs, meeting rooms, equipment).

---

## Supabase Database — Your Table

### Table: `resources`
```sql
CREATE TABLE resources (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    type          VARCHAR(50)  NOT NULL,   -- LECTURE_HALL, LAB, MEETING_ROOM, EQUIPMENT
    capacity      INT,                      -- NULL for equipment
    location      VARCHAR(150) NOT NULL,
    description   TEXT,
    status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE, OUT_OF_SERVICE, UNDER_MAINTENANCE
    availability_start  TIME,              -- e.g. 08:00
    availability_end    TIME,              -- e.g. 18:00
    available_days      VARCHAR(50),       -- e.g. "MON,TUE,WED,THU,FRI"
    image_url     TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Backend — Spring Boot

### Package: `com.smartcampus.module_a`
```
module_a/
├── controller/
│   └── ResourceController.java
├── service/
│   ├── ResourceService.java          (interface)
│   └── ResourceServiceImpl.java
├── repository/
│   └── ResourceRepository.java       (extends JpaRepository)
├── entity/
│   └── Resource.java                 (@Entity)
├── dto/
│   ├── ResourceRequestDTO.java       (create/update payload)
│   └── ResourceResponseDTO.java      (API response shape)
└── enums/
    ├── ResourceType.java             (LECTURE_HALL, LAB, MEETING_ROOM, EQUIPMENT)
    └── ResourceStatus.java           (ACTIVE, OUT_OF_SERVICE, UNDER_MAINTENANCE)
```

### Your REST Endpoints (minimum 4, different HTTP methods)

| # | Method | Endpoint | Role | Description |
|---|---|---|---|---|
| 1 | `GET` | `/api/v1/resources` | PUBLIC | Get all resources (paginated, filterable) |
| 2 | `GET` | `/api/v1/resources/{id}` | PUBLIC | Get a single resource by ID |
| 3 | `GET` | `/api/v1/resources/search` | PUBLIC | Search/filter by type, capacity, location, status |
| 4 | `POST` | `/api/v1/resources` | ADMIN | Create a new resource |
| 5 | `PUT` | `/api/v1/resources/{id}` | ADMIN | Update a resource's details |
| 6 | `PATCH` | `/api/v1/resources/{id}/status` | ADMIN | Change resource status only |
| 7 | `DELETE` | `/api/v1/resources/{id}` | ADMIN | Delete a resource (soft delete recommended) |

### Request / Response Examples

**POST `/api/v1/resources`** — Request Body:
```json
{
  "name": "Lab A101",
  "type": "LAB",
  "capacity": 30,
  "location": "Block A, Floor 1",
  "description": "Computer lab with 30 workstations",
  "availabilityStart": "08:00",
  "availabilityEnd": "18:00",
  "availableDays": "MON,TUE,WED,THU,FRI",
  "status": "ACTIVE"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Resource created successfully",
  "data": {
    "id": 1,
    "name": "Lab A101",
    "type": "LAB",
    "capacity": 30,
    "location": "Block A, Floor 1",
    "status": "ACTIVE"
  }
}
```

**GET `/api/v1/resources/search?type=LAB&capacity=20&location=Block A`**
```json
{
  "success": true,
  "data": [ ... ],
  "total": 5,
  "page": 0,
  "size": 10
}
```

### Validation Rules (ResourceRequestDTO)
```java
@NotBlank(message = "Name is required")
@Size(max = 100)
private String name;

@NotNull(message = "Type is required")
private ResourceType type;

@NotBlank(message = "Location is required")
private String location;

@Min(value = 1, message = "Capacity must be at least 1")
private Integer capacity;      // optional for EQUIPMENT type
```

### Internal Method for Module B (Shashindi will use this)
Expose this in `ResourceService` interface — Shashindi will inject it:
```java
// In ResourceService.java
boolean isResourceActive(Long resourceId);
ResourceResponseDTO getResourceById(Long resourceId);
```

---

## Frontend — React Pages

### Your Pages/Components
```
src/pages/facilities/
├── ResourceListPage.jsx        — Shows all resources with search/filter
├── ResourceDetailPage.jsx      — Single resource view
└── admin/
    ├── ResourceFormPage.jsx    — Create / Edit resource (Admin only)
    └── ResourceManagePage.jsx  — Admin table view with status controls
src/components/resources/
├── ResourceCard.jsx            — Card UI for a resource
├── ResourceFilter.jsx          — Filter bar (type, location, capacity)
└── ResourceStatusBadge.jsx     — ACTIVE / OUT_OF_SERVICE badge
src/api/resourcesApi.js         — All Axios calls for this module
```

### API File (`src/api/resourcesApi.js`)
```javascript
import axios from '../utils/axiosInstance';  // shared instance with auth headers

export const getAllResources = (params) =>
  axios.get('/api/v1/resources', { params });

export const getResourceById = (id) =>
  axios.get(`/api/v1/resources/${id}`);

export const searchResources = (filters) =>
  axios.get('/api/v1/resources/search', { params: filters });

export const createResource = (data) =>
  axios.post('/api/v1/resources', data);

export const updateResource = (id, data) =>
  axios.put(`/api/v1/resources/${id}`, data);

export const updateResourceStatus = (id, status) =>
  axios.patch(`/api/v1/resources/${id}/status`, { status });

export const deleteResource = (id) =>
  axios.delete(`/api/v1/resources/${id}`);
```

### Routes (add to `src/App.jsx` — coordinate with Thisangi for auth guards)
```jsx
<Route path="/resources" element={<ResourceListPage />} />
<Route path="/resources/:id" element={<ResourceDetailPage />} />
{/* Admin only: */}
<Route path="/admin/resources" element={<ProtectedRoute role="ADMIN"><ResourceManagePage /></ProtectedRoute>} />
<Route path="/admin/resources/new" element={<ProtectedRoute role="ADMIN"><ResourceFormPage /></ProtectedRoute>} />
<Route path="/admin/resources/:id/edit" element={<ProtectedRoute role="ADMIN"><ResourceFormPage /></ProtectedRoute>} />
```

---

## Testing Evidence Required

### Unit Tests (ResourceServiceImplTest.java)
- `testCreateResource_success()`
- `testCreateResource_duplicateName_throwsException()`
- `testGetResourceById_notFound_throws404()`
- `testSearchResources_byType()`
- `testUpdateResourceStatus_toOutOfService()`

### Postman Collection
Include in report:
1. Create resource (201)
2. Get all resources (200)
3. Get resource by ID — valid (200)
4. Get resource by ID — invalid (404)
5. Search by type=LAB (200)
6. Update resource (200)
7. Change status to OUT_OF_SERVICE (200)
8. Delete resource (200 or 204)
9. Create resource without auth (401)
10. Create resource as USER role (403)

---

## Timeline Suggestion

| Day | Task |
|---|---|
| Day 1 | Set up branch, create Supabase table, scaffold Spring Boot package |
| Day 2-3 | Implement Entity, Repository, Service, Controller |
| Day 4-5 | React pages: ResourceListPage, ResourceCard, ResourceFilter |
| Day 6-7 | Admin pages: ResourceFormPage, ResourceManagePage |
| Day 8 | Write unit tests, Postman collection |
| Day 9 | Code review, bug fixes, merge PR |
| Day 10 | Report section: your endpoint list + architecture contribution |

---

## Notes & Reminders
- Do NOT touch any file outside `module_a/` in the backend or `facilities/` in the frontend without telling the team.
- The `ProtectedRoute` component is created by **Thisangi** — ask her for it before building admin pages.
- The `axiosInstance` with auth headers is set up by **Thisangi** — import from `../utils/axiosInstance`.
- Seed the `resources` table with at least 10 sample records for the viva demo.
- Keep commit messages clear: `feat(module-a): add resource search endpoint` not just `update`.
