package com.smartcampus.module_b.service;

import com.smartcampus.module_b.dto.BookingRequestDTO;
import com.smartcampus.module_b.dto.BookingResponseDTO;
import com.smartcampus.module_b.dto.BookingReviewDTO;
import com.smartcampus.module_b.enums.BookingStatus;

import java.util.List;
import java.util.UUID;

public interface BookingService {

    /**
     * Create a new booking request
     */
    BookingResponseDTO createBooking(BookingRequestDTO request, UUID userId, String userEmail);

    /**
     * Get all bookings for a specific user with optional status filter
     */
    List<BookingResponseDTO> getMyBookings(UUID userId, BookingStatus statusFilter);

    /**
     * Get all bookings (admin only) with optional filters
     */
    List<BookingResponseDTO> getAllBookings(BookingStatus status, Long resourceId);

    /**
     * Get a single booking by ID
     */
    BookingResponseDTO getBookingById(Long id);

    /**
     * Review a booking (approve or reject) - admin only
     */
    BookingResponseDTO reviewBooking(Long id, BookingReviewDTO request, UUID adminId);

    /**
     * Cancel a booking - user can cancel their own bookings
     */
    void cancelBooking(Long id, UUID userId);

    /**
     * Check if a resource is available for the given time slot
     */
    boolean checkAvailability(Long resourceId, String bookingDate, String startTime, String endTime);
}
