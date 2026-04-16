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
import com.smartcampus.module_d.enums.NotificationType;
import com.smartcampus.module_d.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
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
    // TODO: Inject ResourceService when Ranushi provides it
    // private final ResourceService resourceService;

    @Override
    public BookingResponseDTO createBooking(BookingRequestDTO request, UUID userId, String userEmail) {
        // Validation: Check if resource exists and is active
        // TODO: Uncomment when ResourceService is available
        // if (!resourceService.isResourceActive(request.getResourceId())) {
        //     throw new ResourceNotAvailableException("Resource is not available for booking");
        // }

        // Check for time conflicts
        if (conflictCheckService.hasConflict(
                request.getResourceId(),
                request.getBookingDate(),
                request.getStartTime(),
                request.getEndTime()
        )) {
            throw new BookingConflictException(
                "This resource is already booked for the requested time slot"
            );
        }

        // Create and save the booking
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

        Booking savedBooking = bookingRepository.save(booking);

        // Trigger notification
        notificationService.createNotification(
            userId,
            "Booking Request Submitted",
            "Your booking request has been submitted and is pending admin review.",
            NotificationType.BOOKING_CREATED
        );

        return mapToResponseDTO(savedBooking);
    }

    @Override
    public List<BookingResponseDTO> getMyBookings(UUID userId, BookingStatus statusFilter) {
        List<Booking> bookings = bookingRepository.findByUserIdWithStatusFilter(userId, statusFilter);
        return bookings.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<BookingResponseDTO> getAllBookings(BookingStatus status, Long resourceId) {
        List<Booking> bookings = bookingRepository.findAllWithFilters(status, resourceId);
        return bookings.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public BookingResponseDTO getBookingById(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        return mapToResponseDTO(booking);
    }

    @Override
    public BookingResponseDTO reviewBooking(Long id, BookingReviewDTO request, UUID adminId) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Validate status transition: only PENDING bookings can be reviewed
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new InvalidBookingStatusException(
                "Booking can only be reviewed when status is PENDING"
            );
        }

        // Validate action: only APPROVED or REJECTED allowed
        if (request.getAction() != BookingStatus.APPROVED && 
            request.getAction() != BookingStatus.REJECTED) {
            throw new InvalidBookingStatusException(
                "Action must be either APPROVED or REJECTED"
            );
        }

        // If rejecting, admin note is recommended (but not required)
        booking.setStatus(request.getAction());
        booking.setAdminNote(request.getAdminNote());
        booking.setReviewedBy(adminId);
        booking.setReviewedAt(OffsetDateTime.now());

        Booking updatedBooking = bookingRepository.save(booking);

        // Trigger notification based on action
        if (request.getAction() == BookingStatus.APPROVED) {
            notificationService.createNotification(
                booking.getUserId(),
                "Booking Approved",
                "Your booking has been approved.",
                NotificationType.BOOKING_APPROVED
            );
        } else {
            notificationService.createNotification(
                booking.getUserId(),
                "Booking Rejected",
                "Your booking has been rejected. Reason: " + (request.getAdminNote() != null ? request.getAdminNote() : "No reason provided"),
                NotificationType.BOOKING_REJECTED
            );
        }

        return mapToResponseDTO(updatedBooking);
    }

    @Override
    public void cancelBooking(Long id, UUID userId) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Check ownership: user can only cancel their own bookings
        if (!booking.getUserId().equals(userId)) {
            throw new RuntimeException("You can only cancel your own bookings");
        }

        // Check if booking can be cancelled: must be PENDING or APPROVED, and date must be future/today
        if (booking.getStatus() != BookingStatus.PENDING && 
            booking.getStatus() != BookingStatus.APPROVED) {
            throw new InvalidBookingStatusException(
                "Only PENDING or APPROVED bookings can be cancelled"
            );
        }

        // Check if booking date is in future or today
        if (booking.getBookingDate().isBefore(LocalDate.now())) {
            throw new InvalidBookingStatusException(
                "Cannot cancel bookings for past dates"
            );
        }

        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
    }

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

    /**
     * Helper method to convert Booking entity to ResponseDTO
     */
    private BookingResponseDTO mapToResponseDTO(Booking booking) {
        return BookingResponseDTO.builder()
                .id(booking.getId())
                .resourceId(booking.getResourceId())
                .resourceName("Resource " + booking.getResourceId()) // TODO: Get actual resource name from ResourceService
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
