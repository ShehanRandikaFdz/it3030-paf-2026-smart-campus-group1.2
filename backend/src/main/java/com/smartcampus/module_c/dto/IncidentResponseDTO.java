package com.smartcampus.module_c.dto;

import com.smartcampus.module_c.enums.IncidentCategory;
import com.smartcampus.module_c.enums.IncidentPriority;
import com.smartcampus.module_c.enums.IncidentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncidentResponseDTO {

    private Long id;
    private Long resourceId;
    private String location;
    private UUID reportedBy;
    private String reporterEmail;
    private String title;
    private String description;
    private IncidentCategory category;
    private IncidentPriority priority;
    private IncidentStatus status;
    private UUID assignedTo;
    private String assigneeEmail;
    private String rejectionReason;
    private String contactPhone;
    private String resolutionNotes;
    private int attachmentsCount;
    private int commentsCount;
    private List<AttachmentResponseDTO> attachments;
    private List<CommentResponseDTO> comments;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
