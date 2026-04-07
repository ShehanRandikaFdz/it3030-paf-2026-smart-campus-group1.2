package com.smartcampus.module_c.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponseDTO {

    private Long id;
    private Long incidentId;
    private UUID authorId;
    private String authorEmail;
    private String authorRole;
    private String content;
    private Boolean isEdited;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
