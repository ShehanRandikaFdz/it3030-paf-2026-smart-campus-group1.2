# Module C: Incident Ticketing API Documentation & Viva Preparation

This document outlines the API endpoints you developed for Module C (Incident Ticketing). It breaks down the CRUD operations (Create, Read, Update, Delete) and provides common viva questions and answers regarding your architectural and implementation choices.

## 1. Incident Tickets API (`IncidentController.java`)

Base URL: `/api/v1/incidents`

### Create
* **Endpoint:** `POST /api/v1/incidents`
* **Purpose:** Creates a new incident ticket.
* **Why this HTTP method:** `POST` is the REST standard for creating new resources on the server.
* **Key Annotations:**
    * `@RequestBody`: Maps the incoming JSON body to the `IncidentRequestDTO` object.
    * `@Valid`: Triggers Spring Validation (e.g., ensuring title is not empty) before the method runs.
    * `@CurrentUser`: A custom argument resolver that extracts the `userId` directly from the validated JWT token, ensuring secure identity mapping without trusting client-provided IDs.

### Read
* **Endpoint:** `GET /api/v1/incidents`
* **Purpose:** Retrieves a list of incidents. Handles both "My Incidents" (for normal users) and "All Incidents" (for admins).
* **Why this HTTP method:** `GET` is used for safely fetching data without modifying the server state.
* **Key Annotations:**
    * `@RequestParam`: Extracts query parameters from the URL (e.g., `?all=true&status=OPEN`). These are optional (`required = false`) and allow flexible filtering on the database level.
* **Endpoint:** `GET /api/v1/incidents/{id}`
* **Purpose:** Retrieves a single incident by its ID, along with its comments and attachments.
* **Key Annotations:**
    * `@PathVariable`: Extracts the `{id}` from the URL path.

### Update
* **Endpoint:** `PUT /api/v1/incidents/{id}/status` & `PUT /api/v1/incidents/{id}/assign`
* **Purpose:** Updates specific aspects of a ticket (changing status to IN_PROGRESS, or assigning a technician).
* **Why this HTTP method:** `PUT` (or alternatively `PATCH`) is used to update existing resources. We use specific path endings like `/status` and `/assign` to clearly define *what* is being updated, rather than updating the entire object.

### Delete
* **Endpoint:** `DELETE /api/v1/incidents/{id}`
* **Purpose:** Removes an incident from the system (Admin only).
* **Why this HTTP method:** `DELETE` is the standard REST method for resource removal.

---

## 2. Comments API (`IncidentCommentController.java`)

Base URL: `/api/v1/incidents/{incidentId}/comments`

* **Create (`POST`):** Adds a comment to a specific incident.
* **Read (`GET`):** Retrieves all comments for a specific incident.
* **Update (`PUT /{commentId}`):** Edits an existing comment. The service layer verifies that the `userId` matches the comment owner so users can only edit their own comments.
* **Delete (`DELETE /{commentId}`):** Removes a comment. Allowed if the user is the owner, or if the user is an `ADMIN`.

---

## 3. Attachments API (`IncidentAttachmentController.java`)

Base URL: `/api/v1/incidents/{incidentId}/attachments`

* **Create (`POST`):** Uploads up to 3 files.
    * **Key Difference:** Instead of `@RequestBody` (which is for JSON), this uses `@RequestParam("files") List<MultipartFile> files`. This is necessary to handle `multipart/form-data` encoding which is required for binary file uploads.
    * **Under the hood:** The files are pushed to an AWS/Supabase S3 bucket, and only the generated URL and metadata are saved to your database.
* **Read (`GET`):** Returns the URLs and metadata of attached files.
* **Delete (`DELETE /{attachmentId}`):** Deletes the attachment from both the database and the S3 storage bucket.

---

## 💡 Top Viva Questions & Answers

**Q1: Why did you use DTOs (Data Transfer Objects) instead of returning your Entities directly?**
> **A:** Using DTOs (`IncidentRequestDTO`, `IncidentResponseDTO`) separates the database layer (Entities) from the API layer. It prevents sensitive data from leaking, stops infinite recursion issues (especially with relationships like OneToMany comments), and allows us to shape the JSON exactly how the frontend needs it without changing database tables.

**Q2: How is security handled on your POST and PUT endpoints?**
> **A:** We use a stateless architecture with JWT (JSON Web Tokens). A custom filter (`SupabaseJwtFilter`) intercepts the request, validates the token signature, and extracts the user ID and role. In the controller, I use `@CurrentUser` to grab that ID securely—meaning a user cannot easily forge a request to act as someone else.

**Q3: Explain what `@RestController` and `@RequestMapping` do.**
> **A:** `@RestController` is a convenience annotation that combines `@Controller` and `@ResponseBody`. It tells Spring that this class will handle web requests and that the returned objects should be automatically serialized into JSON. `@RequestMapping` sets the base URL path for all endpoints in that specific controller file.

**Q4: Why use `@PathVariable` vs `@RequestParam`?**
> **A:** `@PathVariable` is used to identify a specific resource in the URI path itself (e.g., `/incidents/5` where 5 is the ID). `@RequestParam` is used to sort, filter, or pass optional configuration parameters via the query string (e.g., `/incidents?status=OPEN`).

**Q5: How did you handle file uploads in Module C?**
> **A:** I used Spring's `MultipartFile` interface to receive the binary data via a `POST` request. Because storing large blobs in a relational DB is inefficient, the service layer uploads the binary data to Supabase Storage (an S3-compatible object store) and only saves the resulting direct URL string in the relational database.

**Q6: What happens if a user submits a blank title or invalid data to your POST endpoint?**
> **A:** The `@Valid` annotation triggers Spring Validation on the DTO. If constraints (like `@NotBlank` or size limits) are violated, Spring automatically aborts the request and returns a `400 Bad Request` before my controller logic even executes.

**Q7: How did you implement responses?**
> **A:** I wrapped all return objects in a generic `ApiResponse<T>` wrapper and returned them inside a `ResponseEntity`. This ensures a standardized JSON structure across the entire app containing a message, status, and the data payload, and it allows me to explicitly set HTTP status codes like `201 Created` or `200 OK`.
