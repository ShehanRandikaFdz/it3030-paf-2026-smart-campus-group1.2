package com.smartcampus.module_d.dto;

import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDTO {
    private UUID id;
    private String email;
    private String fullName;
    private String role;
    private String avatarUrl;
    private OffsetDateTime createdAt;
}