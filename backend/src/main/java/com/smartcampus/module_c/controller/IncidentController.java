package com.smartcampus.module_c.controller;

import com.smartcampus.common.ApiResponse;
import com.smartcampus.module_c.dto.*;
import com.smartcampus.module_c.enums.IncidentCategory;
import com.smartcampus.module_c.enums.IncidentPriority;
import com.smartcampus.module_c.enums.IncidentStatus;
import com.smartcampus.module_c.service.IncidentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/incidents")
@RequiredArgsConstructor
public class IncidentController {

    private final IncidentService incidentService;

    /**
     * POST /api/v1/incidents — Create a new incident ticket
     * Headers: X-User-Id, X-User-Email (simulating auth)
     */
    @PostMapping
    public ResponseEntity<ApiResponse<IncidentResponseDTO>> createIncident(
            @Valid @RequestBody IncidentRequestDTO request,
            @RequestHeader("X-User-Id") UUID userId,
            @RequestHeader("X-User-Email") String userEmail) {

        IncidentResponseDTO incident = incidentService.createIncident(request, userId, userEmail);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Incident ticket created successfully", incident));
    }

    /**
     * GET /api/v1/incidents — Get incidents
     * If ?all=true (admin), returns all incidents with optional filters
     * Otherwise returns only the user's incidents
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<IncidentResponseDTO>>> getIncidents(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestParam(required = false) Boolean all,
            @RequestParam(required = false) IncidentStatus status,
            @RequestParam(required = false) IncidentCategory category,
            @RequestParam(required = false) IncidentPriority priority) {

        List<IncidentResponseDTO> incidents;

        if (Boolean.TRUE.equals(all)) {
            incidents = incidentService.getAllIncidents(status, category, priority);
        } else {
            incidents = incidentService.getIncidentsByUser(userId, status);
        }

        return ResponseEntity.ok(ApiResponse.success("Incidents retrieved successfully", incidents));
    }

    /**
     * GET /api/v1/incidents/{id} — Get single incident with comments and attachments
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<IncidentResponseDTO>> getIncidentById(@PathVariable Long id) {
        IncidentResponseDTO incident = incidentService.getIncidentById(id);
        return ResponseEntity.ok(ApiResponse.success("Incident retrieved successfully", incident));
    }

    /**
     * PUT /api/v1/incidents/{id}/status — Update ticket status
     * ADMIN/TECHNICIAN only
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<IncidentResponseDTO>> updateIncidentStatus(
            @PathVariable Long id,
            @Valid @RequestBody IncidentUpdateStatusDTO request) {

        IncidentResponseDTO incident = incidentService.updateIncidentStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success("Incident status updated successfully", incident));
    }

    /**
     * PUT /api/v1/incidents/{id}/assign — Assign technician to ticket
     * ADMIN only
     */
    @PutMapping("/{id}/assign")
    public ResponseEntity<ApiResponse<IncidentResponseDTO>> assignTechnician(
            @PathVariable Long id,
            @Valid @RequestBody AssignTechnicianDTO request) {

        IncidentResponseDTO incident = incidentService.assignTechnician(id, request);
        return ResponseEntity.ok(ApiResponse.success("Technician assigned successfully", incident));
    }

    /**
     * DELETE /api/v1/incidents/{id} — Delete an incident (admin only)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteIncident(@PathVariable Long id) {
        incidentService.deleteIncident(id);
        return ResponseEntity.ok(ApiResponse.success("Incident deleted successfully"));
    }
}
