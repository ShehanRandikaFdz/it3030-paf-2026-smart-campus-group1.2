package com.smartcampus.module_c.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignTechnicianDTO {

    @NotNull(message = "Technician ID is required")
    private UUID technicianId;

    @NotBlank(message = "Technician email is required")
    @Email(message = "Invalid email format")
    private String technicianEmail;
}
