package com.smartcampus.module_c.controller;

import com.smartcampus.common.ApiResponse;
import com.smartcampus.module_c.dto.CommentRequestDTO;
import com.smartcampus.module_c.dto.CommentResponseDTO;
import com.smartcampus.module_c.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
            @RequestHeader("X-User-Id") UUID userId,
            @RequestHeader("X-User-Email") String userEmail,
            @RequestHeader(value = "X-User-Role", defaultValue = "USER") String userRole) {

        CommentResponseDTO comment = commentService.addComment(incidentId, request, userId, userEmail, userRole);
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
            @RequestHeader("X-User-Id") UUID userId) {

        CommentResponseDTO comment = commentService.editComment(incidentId, commentId, request, userId);
        return ResponseEntity.ok(ApiResponse.success("Comment updated successfully", comment));
    }

    /**
     * DELETE /api/v1/incidents/{incidentId}/comments/{commentId} — Delete own comment (or admin)
     */
    @DeleteMapping("/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable Long incidentId,
            @PathVariable Long commentId,
            @RequestHeader("X-User-Id") UUID userId,
            @RequestHeader(value = "X-User-Role", defaultValue = "USER") String userRole) {

        commentService.deleteComment(incidentId, commentId, userId, userRole);
        return ResponseEntity.ok(ApiResponse.success("Comment deleted successfully"));
    }
}
