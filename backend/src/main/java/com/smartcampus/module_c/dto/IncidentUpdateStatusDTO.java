package com.smartcampus.module_c.dto;

import com.smartcampus.module_c.enums.IncidentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncidentUpdateStatusDTO {

    @NotNull(message = "Status is required")
    private IncidentStatus status;

    private String resolutionNotes;

    private String rejectionReason;
}
