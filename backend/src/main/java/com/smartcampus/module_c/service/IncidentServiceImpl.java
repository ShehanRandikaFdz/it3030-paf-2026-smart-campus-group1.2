package com.smartcampus.module_c.service;

import com.smartcampus.module_c.dto.*;
import com.smartcampus.module_c.entity.Incident;
import com.smartcampus.module_c.enums.IncidentCategory;
import com.smartcampus.module_c.enums.IncidentPriority;
import com.smartcampus.module_c.enums.IncidentStatus;
import com.smartcampus.module_c.exception.InvalidStatusTransitionException;
import com.smartcampus.module_c.repository.IncidentRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class IncidentServiceImpl implements IncidentService {

    private final IncidentRepository incidentRepository;

    @Override
    public IncidentResponseDTO createIncident(IncidentRequestDTO request, UUID userId, String userEmail) {
        Incident incident = Incident.builder()
                .resourceId(request.getResourceId())
                .location(request.getLocation())
                .reportedBy(userId)
                .reporterEmail(userEmail)
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .priority(request.getPriority())
                .status(IncidentStatus.OPEN)
                .contactPhone(request.getContactPhone())
                .build();

        Incident saved = incidentRepository.save(incident);
        return mapToResponseDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<IncidentResponseDTO> getIncidentsByUser(UUID userId, IncidentStatus statusFilter) {
        List<Incident> incidents = incidentRepository.findByReportedByWithStatusFilter(userId, statusFilter);
        return incidents.stream().map(this::mapToResponseDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<IncidentResponseDTO> getAllIncidents(IncidentStatus status, IncidentCategory category, IncidentPriority priority) {
        List<Incident> incidents = incidentRepository.findWithFilters(status, category, priority);
        return incidents.stream().map(this::mapToResponseDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public IncidentResponseDTO getIncidentById(Long id) {
        Incident incident = findIncidentOrThrow(id);
        return mapToDetailResponseDTO(incident);
    }

    @Override
    public IncidentResponseDTO updateIncidentStatus(Long id, IncidentUpdateStatusDTO request) {
        Incident incident = findIncidentOrThrow(id);
        IncidentStatus currentStatus = incident.getStatus();
        IncidentStatus newStatus = request.getStatus();

        validateStatusTransition(currentStatus, newStatus);

        // RESOLVED requires resolution notes
        if (newStatus == IncidentStatus.RESOLVED) {
            if (request.getResolutionNotes() == null || request.getResolutionNotes().isBlank()) {
                throw new InvalidStatusTransitionException("Resolution notes are required when resolving a ticket");
            }
            incident.setResolutionNotes(request.getResolutionNotes());
        }

        // REJECTED requires rejection reason
        if (newStatus == IncidentStatus.REJECTED) {
            if (request.getRejectionReason() == null || request.getRejectionReason().isBlank()) {
                throw new InvalidStatusTransitionException("Rejection reason is required when rejecting a ticket");
            }
            incident.setRejectionReason(request.getRejectionReason());
        }

        incident.setStatus(newStatus);
        Incident saved = incidentRepository.save(incident);
        return mapToResponseDTO(saved);
    }

    @Override
    public IncidentResponseDTO assignTechnician(Long id, AssignTechnicianDTO request) {
        Incident incident = findIncidentOrThrow(id);
        incident.setAssignedTo(request.getTechnicianId());
        incident.setAssigneeEmail(request.getTechnicianEmail());

        // Auto-transition to IN_PROGRESS if currently OPEN
        if (incident.getStatus() == IncidentStatus.OPEN) {
            incident.setStatus(IncidentStatus.IN_PROGRESS);
        }

        Incident saved = incidentRepository.save(incident);
        return mapToResponseDTO(saved);
    }

    @Override
    public void deleteIncident(Long id) {
        Incident incident = findIncidentOrThrow(id);
        incidentRepository.delete(incident);
    }

    // ---- Helper methods ----

    private Incident findIncidentOrThrow(Long id) {
        return incidentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Incident not found with id: " + id));
    }

    private void validateStatusTransition(IncidentStatus current, IncidentStatus target) {
        boolean valid = switch (target) {
            case IN_PROGRESS -> current == IncidentStatus.OPEN;
            case RESOLVED -> current == IncidentStatus.IN_PROGRESS;
            case CLOSED -> current == IncidentStatus.RESOLVED;
            case REJECTED -> current != IncidentStatus.CLOSED && current != IncidentStatus.REJECTED;
            case OPEN -> false; // Cannot transition back to OPEN
        };

        if (!valid) {
            throw new InvalidStatusTransitionException(
                    String.format("Cannot transition from %s to %s", current, target));
        }
    }

    private IncidentResponseDTO mapToResponseDTO(Incident incident) {
        return IncidentResponseDTO.builder()
                .id(incident.getId())
                .resourceId(incident.getResourceId())
                .location(incident.getLocation())
                .reportedBy(incident.getReportedBy())
                .reporterEmail(incident.getReporterEmail())
                .title(incident.getTitle())
                .description(incident.getDescription())
                .category(incident.getCategory())
                .priority(incident.getPriority())
                .status(incident.getStatus())
                .assignedTo(incident.getAssignedTo())
                .assigneeEmail(incident.getAssigneeEmail())
                .rejectionReason(incident.getRejectionReason())
                .contactPhone(incident.getContactPhone())
                .resolutionNotes(incident.getResolutionNotes())
                .attachmentsCount(incident.getAttachments() != null ? incident.getAttachments().size() : 0)
                .commentsCount(incident.getComments() != null ? incident.getComments().size() : 0)
                .createdAt(incident.getCreatedAt())
                .updatedAt(incident.getUpdatedAt())
                .build();
    }

    private IncidentResponseDTO mapToDetailResponseDTO(Incident incident) {
        IncidentResponseDTO dto = mapToResponseDTO(incident);

        if (incident.getAttachments() != null) {
            dto.setAttachments(incident.getAttachments().stream()
                    .map(a -> AttachmentResponseDTO.builder()
                            .id(a.getId())
                            .incidentId(incident.getId())
                            .fileName(a.getFileName())
                            .fileUrl(a.getFileUrl())
                            .fileSize(a.getFileSize())
                            .mimeType(a.getMimeType())
                            .uploadedBy(a.getUploadedBy())
                            .uploadedAt(a.getUploadedAt())
                            .build())
                    .collect(Collectors.toList()));
        }

        if (incident.getComments() != null) {
            dto.setComments(incident.getComments().stream()
                    .map(c -> CommentResponseDTO.builder()
                            .id(c.getId())
                            .incidentId(incident.getId())
                            .authorId(c.getAuthorId())
                            .authorEmail(c.getAuthorEmail())
                            .authorRole(c.getAuthorRole())
                            .content(c.getContent())
                            .isEdited(c.getIsEdited())
                            .createdAt(c.getCreatedAt())
                            .updatedAt(c.getUpdatedAt())
                            .build())
                    .collect(Collectors.toList()));
        }

        return dto;
    }
}
