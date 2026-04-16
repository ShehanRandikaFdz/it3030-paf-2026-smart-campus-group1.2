package com.smartcampus.module_a.dto;

import com.smartcampus.module_a.enums.ResourceStatus;
import com.smartcampus.module_a.enums.ResourceType;
import lombok.Data;
import java.time.LocalTime;
import java.time.OffsetDateTime;

@Data
public class ResourceResponseDTO {
    private Long id;
    private String name;
    private ResourceType type;
    private Integer capacity;
    private String location;
    private String description;
    private ResourceStatus status;
    private LocalTime availabilityStart;
    private LocalTime availabilityEnd;
    private String availableDays;
    private String imageUrl;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
