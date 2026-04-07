package com.smartcampus.module_c.service;

import com.smartcampus.module_c.dto.CommentRequestDTO;
import com.smartcampus.module_c.dto.CommentResponseDTO;

import java.util.List;
import java.util.UUID;

public interface CommentService {

    CommentResponseDTO addComment(Long incidentId, CommentRequestDTO request, UUID userId, String userEmail, String userRole);

    CommentResponseDTO editComment(Long incidentId, Long commentId, CommentRequestDTO request, UUID userId);

    void deleteComment(Long incidentId, Long commentId, UUID userId, String userRole);

    List<CommentResponseDTO> getCommentsByIncidentId(Long incidentId);
}
