package com.smartcampus.module_a.dto;

import com.smartcampus.module_a.enums.ResourceStatus;
import com.smartcampus.module_a.enums.ResourceType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalTime;


@Data
public class ResourceRequestDTO {
    @NotBlank(message = "Name is required")
    @Size(max = 100)
    private String name;

    @NotNull(message = "Type is required")
    private ResourceType type;

    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    @NotBlank(message = "Location is required")
    private String location;

    private String description;

    private ResourceStatus status = ResourceStatus.ACTIVE;

    private LocalTime availabilityStart;

    private LocalTime availabilityEnd;

    private String availableDays;
}
