package com.smartcampus.module_c.controller;

import com.smartcampus.common.ApiResponse;
import com.smartcampus.module_c.dto.AttachmentResponseDTO;
import com.smartcampus.module_c.service.AttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/incidents/{incidentId}/attachments")
@RequiredArgsConstructor
public class IncidentAttachmentController {

    private final AttachmentService attachmentService;

    /**
     * POST /api/v1/incidents/{incidentId}/attachments — Upload attachments (max 3 total)
     */
    @PostMapping
    public ResponseEntity<ApiResponse<List<AttachmentResponseDTO>>> uploadAttachments(
            @PathVariable Long incidentId,
            @RequestParam("files") List<MultipartFile> files,
            @RequestHeader("X-User-Id") UUID userId) {

        List<AttachmentResponseDTO> attachments = attachmentService.uploadAttachments(incidentId, files, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Attachments uploaded successfully", attachments));
    }

    /**
     * GET /api/v1/incidents/{incidentId}/attachments — Get all attachments for an incident
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<AttachmentResponseDTO>>> getAttachments(
            @PathVariable Long incidentId) {

        List<AttachmentResponseDTO> attachments = attachmentService.getAttachmentsByIncidentId(incidentId);
        return ResponseEntity.ok(ApiResponse.success("Attachments retrieved successfully", attachments));
    }

    /**
     * DELETE /api/v1/incidents/{incidentId}/attachments/{attachmentId} — Delete an attachment
     */
    @DeleteMapping("/{attachmentId}")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(
            @PathVariable Long incidentId,
            @PathVariable Long attachmentId,
            @RequestHeader("X-User-Id") UUID userId,
            @RequestHeader(value = "X-User-Role", defaultValue = "USER") String userRole) {

        attachmentService.deleteAttachment(incidentId, attachmentId, userId, userRole);
        return ResponseEntity.ok(ApiResponse.success("Attachment deleted successfully"));
    }
}
