package com.smartcampus.module_b.dto;

import com.smartcampus.module_b.enums.BookingStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingReviewDTO {

    @NotNull(message = "Action is required")
    private BookingStatus action;

    @Size(max = 500, message = "Admin note must not exceed 500 characters")
    private String adminNote;
}
