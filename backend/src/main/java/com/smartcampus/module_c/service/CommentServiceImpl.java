package com.smartcampus.module_c.service;

import com.smartcampus.module_c.dto.CommentRequestDTO;
import com.smartcampus.module_c.dto.CommentResponseDTO;
import com.smartcampus.module_c.entity.Incident;
import com.smartcampus.module_c.entity.IncidentComment;
import com.smartcampus.module_c.exception.ForbiddenException;
import com.smartcampus.module_c.repository.CommentRepository;
import com.smartcampus.module_c.repository.IncidentRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final IncidentRepository incidentRepository;

    @Override
    public CommentResponseDTO addComment(Long incidentId, CommentRequestDTO request, UUID userId, String userEmail, String userRole) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new EntityNotFoundException("Incident not found with id: " + incidentId));

        IncidentComment comment = IncidentComment.builder()
                .incident(incident)
                .authorId(userId)
                .authorEmail(userEmail)
                .authorRole(userRole)
                .content(request.getContent())
                .isEdited(false)
                .build();

        IncidentComment saved = commentRepository.save(comment);
        return mapToResponseDTO(saved, incidentId);
    }

    @Override
    public CommentResponseDTO editComment(Long incidentId, Long commentId, CommentRequestDTO request, UUID userId) {
        IncidentComment comment = findCommentOrThrow(commentId);

        if (!comment.getIncident().getId().equals(incidentId)) {
            throw new EntityNotFoundException("Comment does not belong to the specified incident");
        }

        if (!comment.getAuthorId().equals(userId)) {
            throw new ForbiddenException("You can only edit your own comments");
        }

        comment.setContent(request.getContent());
        comment.setIsEdited(true);

        IncidentComment saved = commentRepository.save(comment);
        return mapToResponseDTO(saved, incidentId);
    }

    @Override
    public void deleteComment(Long incidentId, Long commentId, UUID userId, String userRole) {
        IncidentComment comment = findCommentOrThrow(commentId);

        if (!comment.getIncident().getId().equals(incidentId)) {
            throw new EntityNotFoundException("Comment does not belong to the specified incident");
        }

        boolean isOwner = comment.getAuthorId().equals(userId);
        boolean isAdmin = "ADMIN".equals(userRole);

        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("You can only delete your own comments");
        }

        commentRepository.delete(comment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommentResponseDTO> getCommentsByIncidentId(Long incidentId) {
        return commentRepository.findByIncidentIdOrderByCreatedAtAsc(incidentId).stream()
                .map(c -> mapToResponseDTO(c, incidentId))
                .toList();
    }

    // ---- Private helpers ----

    private IncidentComment findCommentOrThrow(Long commentId) {
        return commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("Comment not found with id: " + commentId));
    }

    private CommentResponseDTO mapToResponseDTO(IncidentComment comment, Long incidentId) {
        return CommentResponseDTO.builder()
                .id(comment.getId())
                .incidentId(incidentId)
                .authorId(comment.getAuthorId())
                .authorEmail(comment.getAuthorEmail())
                .authorRole(comment.getAuthorRole())
                .content(comment.getContent())
                .isEdited(comment.getIsEdited())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }
}
