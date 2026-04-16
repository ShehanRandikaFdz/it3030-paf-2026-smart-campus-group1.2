package com.smartcampus.module_d.dto;

import com.smartcampus.module_d.enums.NotificationType;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponseDTO {
    private Long id;
    private UUID userId;
    private String title;
    private String message;
    private NotificationType type;
    private boolean isRead;
    private Long relatedId;
    private String relatedType;
    private OffsetDateTime createdAt;
}