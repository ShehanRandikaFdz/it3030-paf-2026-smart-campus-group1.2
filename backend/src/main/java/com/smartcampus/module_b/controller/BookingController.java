package com.smartcampus.module_b.controller;

import com.smartcampus.common.ApiResponse;
import com.smartcampus.common.security.CurrentUser;
import com.smartcampus.module_b.dto.BookingRequestDTO;
import com.smartcampus.module_b.dto.BookingResponseDTO;
import com.smartcampus.module_b.dto.BookingReviewDTO;
import com.smartcampus.module_b.enums.BookingStatus;
import com.smartcampus.module_b.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for Booking Management (Module B)
 * 
 * Endpoints:
 * - POST   /api/v1/bookings — Create booking
 * - GET    /api/v1/bookings — Get all bookings (admin)
 * - GET    /api/v1/bookings/my — Get my bookings
 * - GET    /api/v1/bookings/{id} — Get single booking
 * - PUT    /api/v1/bookings/{id}/review — Approve/reject booking (admin)
 * - PUT    /api/v1/bookings/{id}/cancel — Cancel booking (user)
 * - GET    /api/v1/bookings/availability — Check availability
 */
@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    /**
     * POST /api/v1/bookings — Create a new booking request
     * User identity is extracted from the JWT token via @CurrentUser
     * Status: 201 Created on success
     * Status: 409 Conflict if time slot is already booked
     * Status: 400 Bad Request if validation fails
     */
    @PostMapping
    public ResponseEntity<ApiResponse<BookingResponseDTO>> createBooking(
            @Valid @RequestBody BookingRequestDTO request,
            @CurrentUser String userId,
            @RequestHeader(value = "X-User-Email", defaultValue = "") String userEmail) {

        BookingResponseDTO booking = bookingService.createBooking(request, UUID.fromString(userId), userEmail);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Booking request submitted successfully", booking));
    }

    /**
     * GET /api/v1/bookings — Get all bookings (admin only)
     * Query params: status (optional), resourceId (optional)
     * Returns paginated list of all bookings with optional filters
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<BookingResponseDTO>>> getAllBookings(
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) Long resourceId) {

        List<BookingResponseDTO> bookings = bookingService.getAllBookings(status, resourceId);
        return ResponseEntity.ok(
                ApiResponse.success("Bookings retrieved successfully", bookings));
    }

    /**
     * GET /api/v1/bookings/my — Get current user's bookings
     * Query params: status (optional)
     * Returns bookings created by the current user
     */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<BookingResponseDTO>>> getMyBookings(
            @CurrentUser String userId,
            @RequestParam(required = false) BookingStatus status) {

        List<BookingResponseDTO> bookings = bookingService.getMyBookings(UUID.fromString(userId), status);
        return ResponseEntity.ok(
                ApiResponse.success("Your bookings retrieved successfully", bookings));
    }

    /**
     * GET /api/v1/bookings/{id} — Get single booking by ID
     * Returns detailed booking information including timestamps
     * Status: 404 Not Found if booking doesn't exist
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingResponseDTO>> getBookingById(@PathVariable Long id) {
        BookingResponseDTO booking = bookingService.getBookingById(id);
        return ResponseEntity.ok(
                ApiResponse.success("Booking retrieved successfully", booking));
    }

    /**
     * PUT /api/v1/bookings/{id}/review — Admin reviews (approves/rejects) a booking
     * Request body: action (APPROVED or REJECTED), adminNote (optional)
     * Only PENDING bookings can be reviewed
     * Status: 200 OK on success
     * Status: 400 Bad Request if booking is not in PENDING status
     */
    @PutMapping("/{id}/review")
    public ResponseEntity<ApiResponse<BookingResponseDTO>> reviewBooking(
            @PathVariable Long id,
            @Valid @RequestBody BookingReviewDTO request,
            @CurrentUser String adminId) {

        BookingResponseDTO booking = bookingService.reviewBooking(id, request, UUID.fromString(adminId));
        return ResponseEntity.ok(
                ApiResponse.success("Booking reviewed successfully", booking));
    }

    /**
     * PUT /api/v1/bookings/{id}/cancel — User cancels their own booking
     * Constraints:
     * - Can only cancel PENDING or APPROVED bookings
     * - Cannot cancel bookings for past dates
     * - User can only cancel their own bookings
     * Status: 200 OK on success
     * Status: 400 Bad Request if cancellation is invalid
     * Status: 403 Forbidden if not the booking owner
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelBooking(
            @PathVariable Long id,
            @CurrentUser String userId) {

        bookingService.cancelBooking(id, UUID.fromString(userId));
        return ResponseEntity.ok(
                ApiResponse.success("Booking cancelled successfully", null));
    }

    /**
     * GET /api/v1/bookings/availability — Check if a time slot is available
     * Query params: resourceId, bookingDate (YYYY-MM-DD), startTime (HH:mm), endTime (HH:mm)
     * Returns: boolean indicating availability (true = available, false = conflict)
     * Status: 200 OK on success
     * Status: 400 Bad Request if parameters are invalid
     */
    @GetMapping("/availability")
    public ResponseEntity<ApiResponse<Boolean>> checkAvailability(
            @RequestParam Long resourceId,
            @RequestParam String bookingDate,
            @RequestParam String startTime,
            @RequestParam String endTime) {

        boolean available = bookingService.checkAvailability(resourceId, bookingDate, startTime, endTime);
        return ResponseEntity.ok(
                ApiResponse.success("Availability checked successfully", available));
    }
}
