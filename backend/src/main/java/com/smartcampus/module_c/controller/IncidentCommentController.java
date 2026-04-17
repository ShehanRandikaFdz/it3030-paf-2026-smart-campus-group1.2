package com.smartcampus.module_c.controller;

import com.smartcampus.common.ApiResponse;
import com.smartcampus.common.security.CurrentUser;
import com.smartcampus.module_c.dto.CommentRequestDTO;
import com.smartcampus.module_c.dto.CommentResponseDTO;
import com.smartcampus.module_c.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/incidents/{incidentId}/comments")
@RequiredArgsConstructor
public class IncidentCommentController {

    private final CommentService commentService;

    /**
     * POST /api/v1/incidents/{incidentId}/comments — Add a comment
     */
    @PostMapping
    public ResponseEntity<ApiResponse<CommentResponseDTO>> addComment(
            @PathVariable Long incidentId,
            @Valid @RequestBody CommentRequestDTO request,
            @CurrentUser String userId,
            @RequestHeader(value = "X-User-Email", defaultValue = "") String userEmail,
            Authentication authentication) {

        String userRole = extractRole(authentication);
        CommentResponseDTO comment = commentService.addComment(incidentId, request, UUID.fromString(userId), userEmail, userRole);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Comment added successfully", comment));
    }

    /**
     * GET /api/v1/incidents/{incidentId}/comments — Get all comments for an incident
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CommentResponseDTO>>> getComments(
            @PathVariable Long incidentId) {

        List<CommentResponseDTO> comments = commentService.getCommentsByIncidentId(incidentId);
        return ResponseEntity.ok(ApiResponse.success("Comments retrieved successfully", comments));
    }

    /**
     * PUT /api/v1/incidents/{incidentId}/comments/{commentId} — Edit own comment
     */
    @PutMapping("/{commentId}")
    public ResponseEntity<ApiResponse<CommentResponseDTO>> editComment(
            @PathVariable Long incidentId,
            @PathVariable Long commentId,
            @Valid @RequestBody CommentRequestDTO request,
            @CurrentUser String userId) {

        CommentResponseDTO comment = commentService.editComment(incidentId, commentId, request, UUID.fromString(userId));
        return ResponseEntity.ok(ApiResponse.success("Comment updated successfully", comment));
    }

    /**
     * DELETE /api/v1/incidents/{incidentId}/comments/{commentId} — Delete own comment (or admin)
     */
    @DeleteMapping("/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable Long incidentId,
            @PathVariable Long commentId,
            @CurrentUser String userId,
            Authentication authentication) {

        String userRole = extractRole(authentication);
        commentService.deleteComment(incidentId, commentId, UUID.fromString(userId), userRole);
        return ResponseEntity.ok(ApiResponse.success("Comment deleted successfully"));
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
