package com.smartcampus.module_a.entity;

import com.smartcampus.module_a.enums.ResourceStatus;
import com.smartcampus.module_a.enums.ResourceType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalTime;
import java.time.OffsetDateTime;

@Entity
@Table(name = "resources")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Resource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ResourceType type;

    private Integer capacity;

    @Column(nullable = false, length = 150)
    private String location;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ResourceStatus status = ResourceStatus.ACTIVE;

    @Column(name = "availability_start")
    private LocalTime availabilityStart;

    @Column(name = "availability_end")
    private LocalTime availabilityEnd;

    @Column(name = "available_days", length = 50)
    private String availableDays;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
