package com.smartcampus.module_c.controller;

import com.smartcampus.common.ApiResponse;
import com.smartcampus.common.security.CurrentUser;
import com.smartcampus.module_c.dto.AttachmentResponseDTO;
import com.smartcampus.module_c.service.AttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
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
            @CurrentUser String userId) {

        List<AttachmentResponseDTO> attachments = attachmentService.uploadAttachments(incidentId, files, UUID.fromString(userId));
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
            @CurrentUser String userId,
            Authentication authentication) {

        String userRole = extractRole(authentication);
        attachmentService.deleteAttachment(incidentId, attachmentId, UUID.fromString(userId), userRole);
        return ResponseEntity.ok(ApiResponse.success("Attachment deleted successfully"));
    }

    private String extractRole(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null) {
            return "USER";
        }
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring(5))
                .findFirst()
                .orElse("USER");
    }
}
