package com.smartcampus.module_b.service;

import com.smartcampus.module_b.dto.BookingRequestDTO;
import com.smartcampus.module_b.dto.BookingResponseDTO;
import com.smartcampus.module_b.dto.BookingReviewDTO;
import com.smartcampus.module_b.entity.Booking;
import com.smartcampus.module_b.enums.BookingStatus;
import com.smartcampus.module_b.exception.BookingConflictException;
import com.smartcampus.module_b.exception.InvalidBookingStatusException;
import com.smartcampus.module_b.exception.ResourceNotAvailableException;
import com.smartcampus.module_b.repository.BookingRepository;
import com.smartcampus.module_a.repository.ResourceRepository;
import com.smartcampus.module_a.enums.ResourceStatus;
import com.smartcampus.module_d.enums.NotificationType;
import com.smartcampus.module_d.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final ConflictCheckService conflictCheckService;
    private final NotificationService notificationService;
    private final ResourceRepository resourceRepository;

    // ──────────────────────────── CREATE ────────────────────────────

    @Override
    public BookingResponseDTO createBooking(BookingRequestDTO request, UUID userId, String userEmail) {
        // Validate resource exists and is ACTIVE
        var resource = resourceRepository.findById(request.getResourceId())
                .orElseThrow(() -> new ResourceNotAvailableException(
                        "Resource not found: " + request.getResourceId()));

        if (resource.getStatus() != ResourceStatus.ACTIVE) {
            throw new ResourceNotAvailableException(
                    "Resource '" + resource.getName() + "' is not available for booking (status: "
                    + resource.getStatus() + ")");
        }

        // Check for time conflicts
        if (conflictCheckService.hasConflict(
                request.getResourceId(),
                request.getBookingDate(),
                request.getStartTime(),
                request.getEndTime())) {
            throw new BookingConflictException(
                "This resource is already booked for the requested time slot");
        }

        // Create and save
        Booking booking = Booking.builder()
                .resourceId(request.getResourceId())
                .userId(userId)
                .userEmail(userEmail)
                .title(request.getTitle())
                .purpose(request.getPurpose())
                .bookingDate(request.getBookingDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .attendees(request.getAttendees() != null ? request.getAttendees() : 1)
                .status(BookingStatus.PENDING)
                .build();

        Booking saved = bookingRepository.save(booking);

        notificationService.createNotification(
            userId,
            "Booking Request Submitted",
            "Your booking for '" + resource.getName() + "' on " + request.getBookingDate() + " is pending review.",
            NotificationType.BOOKING_CREATED);

        return mapToResponseDTO(saved, resource.getName());
    }

    // ──────────────────────────── UPDATE (CRUD) ────────────────────────────

    @Override
    public BookingResponseDTO updateBooking(Long id, BookingRequestDTO request, UUID userId) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Ownership check
        if (!booking.getUserId().equals(userId)) {
            throw new RuntimeException("You can only edit your own bookings");
        }

        // Only PENDING bookings can be edited
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new InvalidBookingStatusException(
                "Only PENDING bookings can be edited. Current status: " + booking.getStatus());
        }

        // Validate target resource
        var resource = resourceRepository.findById(request.getResourceId())
                .orElseThrow(() -> new ResourceNotAvailableException(
                        "Resource not found: " + request.getResourceId()));

        if (resource.getStatus() != ResourceStatus.ACTIVE) {
            throw new ResourceNotAvailableException(
                    "Resource '" + resource.getName() + "' is not available for booking");
        }

        // Conflict check — exclude this booking's own ID so it doesn't conflict with itself
        if (conflictCheckService.hasConflict(
                request.getResourceId(),
                request.getBookingDate(),
                request.getStartTime(),
                request.getEndTime(),
                id)) {
            throw new BookingConflictException(
                "The updated time slot conflicts with an existing approved booking");
        }

        // Apply updates
        booking.setResourceId(request.getResourceId());
        booking.setTitle(request.getTitle());
        booking.setPurpose(request.getPurpose());
        booking.setBookingDate(request.getBookingDate());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setAttendees(request.getAttendees() != null ? request.getAttendees() : 1);

        Booking updated = bookingRepository.save(booking);
        return mapToResponseDTO(updated, resource.getName());
    }

    // ──────────────────────────── READ ────────────────────────────

    @Override
    public List<BookingResponseDTO> getMyBookings(UUID userId, BookingStatus statusFilter) {
        return bookingRepository.findByUserIdWithStatusFilter(userId, statusFilter)
                .stream()
                .map(this::mapToResponseDTOWithResourceLookup)
                .collect(Collectors.toList());
    }

    @Override
    public List<BookingResponseDTO> getAllBookings(BookingStatus status, Long resourceId) {
        return bookingRepository.findAllWithFilters(status, resourceId)
                .stream()
                .map(this::mapToResponseDTOWithResourceLookup)
                .collect(Collectors.toList());
    }

    @Override
    public BookingResponseDTO getBookingById(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        return mapToResponseDTOWithResourceLookup(booking);
    }

    // ──────────────────────────── ADMIN REVIEW ────────────────────────────

    @Override
    public BookingResponseDTO reviewBooking(Long id, BookingReviewDTO request, UUID adminId) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new InvalidBookingStatusException(
                "Booking can only be reviewed when status is PENDING");
        }

        if (request.getAction() != BookingStatus.APPROVED &&
            request.getAction() != BookingStatus.REJECTED) {
            throw new InvalidBookingStatusException(
                "Action must be either APPROVED or REJECTED");
        }

        booking.setStatus(request.getAction());
        booking.setAdminNote(request.getAdminNote());
        booking.setReviewedBy(adminId);
        booking.setReviewedAt(OffsetDateTime.now());

        Booking updated = bookingRepository.save(booking);

        String resourceName = resourceRepository.findById(booking.getResourceId())
                .map(r -> r.getName())
                .orElse("Resource " + booking.getResourceId());

        if (request.getAction() == BookingStatus.APPROVED) {
            notificationService.createNotification(
                booking.getUserId(),
                "Booking Approved",
                "Your booking for '" + resourceName + "' on " + booking.getBookingDate() + " has been approved.",
                NotificationType.BOOKING_APPROVED);
        } else {
            notificationService.createNotification(
                booking.getUserId(),
                "Booking Rejected",
                "Your booking for '" + resourceName + "' was rejected. Reason: "
                    + (request.getAdminNote() != null ? request.getAdminNote() : "No reason provided"),
                NotificationType.BOOKING_REJECTED);
        }

        return mapToResponseDTOWithResourceLookup(updated);
    }

    // ──────────────────────────── CANCEL ────────────────────────────

    @Override
    public void cancelBooking(Long id, UUID userId) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getUserId().equals(userId)) {
            throw new RuntimeException("You can only cancel your own bookings");
        }

        if (booking.getStatus() != BookingStatus.PENDING &&
            booking.getStatus() != BookingStatus.APPROVED) {
            throw new InvalidBookingStatusException(
                "Only PENDING or APPROVED bookings can be cancelled");
        }

        if (booking.getBookingDate().isBefore(LocalDate.now())) {
            throw new InvalidBookingStatusException(
                "Cannot cancel bookings for past dates");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
    }

    // ──────────────────────────── AVAILABILITY CHECK ────────────────────────────

    @Override
    public boolean checkAvailability(Long resourceId, String bookingDateStr,
                                     String startTimeStr, String endTimeStr) {
        try {
            LocalDate bookingDate = LocalDate.parse(bookingDateStr);
            LocalTime startTime = LocalTime.parse(startTimeStr);
            LocalTime endTime = LocalTime.parse(endTimeStr);
            return !conflictCheckService.hasConflict(resourceId, bookingDate, startTime, endTime);
        } catch (Exception e) {
            throw new RuntimeException("Invalid date or time format", e);
        }
    }

    // ──────────────────────────── HELPERS ────────────────────────────

    private BookingResponseDTO mapToResponseDTOWithResourceLookup(Booking booking) {
        String resourceName = resourceRepository.findById(booking.getResourceId())
                .map(r -> r.getName())
                .orElse("Resource " + booking.getResourceId());
        return mapToResponseDTO(booking, resourceName);
    }

    private BookingResponseDTO mapToResponseDTO(Booking booking, String resourceName) {
        return BookingResponseDTO.builder()
                .id(booking.getId())
                .resourceId(booking.getResourceId())
                .resourceName(resourceName)
                .userId(booking.getUserId())
                .userEmail(booking.getUserEmail())
                .title(booking.getTitle())
                .purpose(booking.getPurpose())
                .bookingDate(booking.getBookingDate())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .attendees(booking.getAttendees())
                .status(booking.getStatus())
                .adminNote(booking.getAdminNote())
                .reviewedBy(booking.getReviewedBy())
                .reviewedAt(booking.getReviewedAt())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .build();
    }
}
