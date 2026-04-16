package com.smartcampus.module_d.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_profiles")
@Getter
@Setter
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {
    @Id
    private UUID id;
    private String email;
    @Column(name = "full_name")
    private String fullName;
    private String role;
    @Column(name = "avatar_url")
    private String avatarUrl;
    @Column(name = "created_at")
    private OffsetDateTime createdAt;
}