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
public class AttachmentResponseDTO {

    private Long id;
    private Long incidentId;
    private String fileName;
    private String fileUrl;
    private Long fileSize;
    private String mimeType;
    private UUID uploadedBy;
    private OffsetDateTime uploadedAt;
}
