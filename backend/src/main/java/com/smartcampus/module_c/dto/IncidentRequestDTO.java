package com.smartcampus.module_c.dto;

import com.smartcampus.module_c.enums.IncidentCategory;
import com.smartcampus.module_c.enums.IncidentPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncidentRequestDTO {

    private Long resourceId;

    @NotBlank(message = "Location is required")
    @Size(max = 150, message = "Location must not exceed 150 characters")
    private String location;

    @NotBlank(message = "Title is required")
    @Size(max = 150, message = "Title must not exceed 150 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(min = 20, message = "Description must be at least 20 characters")
    private String description;

    @NotNull(message = "Category is required")
    private IncidentCategory category;

    @NotNull(message = "Priority is required")
    private IncidentPriority priority;

    @Size(max = 20, message = "Contact phone must not exceed 20 characters")
    private String contactPhone;
}
