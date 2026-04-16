package com.smartcampus.module_b.service;

import com.smartcampus.module_b.enums.BookingStatus;
import com.smartcampus.module_b.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Service responsible for conflict detection in booking time slots.
 * Prevents double-booking of the same resource by checking for overlapping APPROVED bookings.
 */
@Service
@RequiredArgsConstructor
public class ConflictCheckService {

    private final BookingRepository bookingRepository;

    /**
     * Checks if a booking conflict exists for the given resource and time slot.
     * 
     * @param resourceId The ID of the resource to check
     * @param date The booking date
     * @param startTime The booking start time
     * @param endTime The booking end time
     * @param excludeBookingId The booking ID to exclude from check (useful for updates, use 0L for new bookings)
     * @return true if a conflict exists, false otherwise
     */
    public boolean hasConflict(Long resourceId, LocalDate date,
                               LocalTime startTime, LocalTime endTime,
                               Long excludeBookingId) {
        // Use -1 as default exclude ID for new bookings, ensuring it never matches real IDs
        if (excludeBookingId == null) {
            excludeBookingId = -1L;
        }
        
        return bookingRepository.existsConflict(
            resourceId,
            date,
            startTime,
            endTime,
            excludeBookingId,
            BookingStatus.APPROVED
        );
    }

    /**
     * Convenience method for checking conflicts on new bookings (without ID)
     */
    public boolean hasConflict(Long resourceId, LocalDate date,
                               LocalTime startTime, LocalTime endTime) {
        return hasConflict(resourceId, date, startTime, endTime, -1L);
    }
}
