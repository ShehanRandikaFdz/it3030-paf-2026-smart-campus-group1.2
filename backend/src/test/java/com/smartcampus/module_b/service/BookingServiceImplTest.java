package com.smartcampus.module_b.service;

import com.smartcampus.module_b.dto.BookingRequestDTO;
import com.smartcampus.module_b.dto.BookingResponseDTO;
import com.smartcampus.module_b.dto.BookingReviewDTO;
import com.smartcampus.module_b.entity.Booking;
import com.smartcampus.module_b.enums.BookingStatus;
import com.smartcampus.module_b.exception.BookingConflictException;
import com.smartcampus.module_b.exception.InvalidBookingStatusException;
import com.smartcampus.module_b.repository.BookingRepository;
import com.smartcampus.module_d.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceImplTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private ConflictCheckService conflictCheckService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private BookingServiceImpl bookingService;

    private UUID testUserId;
    private Booking sampleBooking;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        sampleBooking = Booking.builder()
                .id(1L)
                .resourceId(1L)
                .userId(testUserId)
                .userEmail("test@sliit.lk")
                .title("PAF Group Meeting")
                .purpose("Project discussion")
                .bookingDate(LocalDate.now().plusDays(1))
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(12, 0))
                .attendees(5)
                .status(BookingStatus.PENDING)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Should create booking successfully when no conflicts")
    void createBooking_Success() {
        BookingRequestDTO request = new BookingRequestDTO();
        request.setResourceId(1L);
        request.setTitle("PAF Group Meeting");
        request.setPurpose("Project discussion");
        request.setBookingDate(LocalDate.now().plusDays(1));
        request.setStartTime(LocalTime.of(10, 0));
        request.setEndTime(LocalTime.of(12, 0));
        request.setAttendees(5);

        when(conflictCheckService.hasConflict(any(), any(), any(), any())).thenReturn(false);
        when(bookingRepository.save(any(Booking.class))).thenReturn(sampleBooking);

        BookingResponseDTO result = bookingService.createBooking(request, testUserId, "test@sliit.lk");

        assertNotNull(result);
        assertEquals("PAF Group Meeting", result.getTitle());
        assertEquals(BookingStatus.PENDING, result.getStatus());
        verify(bookingRepository, times(1)).save(any(Booking.class));
    }

    @Test
    @DisplayName("Should throw BookingConflictException when time slot conflicts")
    void createBooking_Conflict() {
        BookingRequestDTO request = new BookingRequestDTO();
        request.setResourceId(1L);
        request.setBookingDate(LocalDate.now().plusDays(1));
        request.setStartTime(LocalTime.of(10, 0));
        request.setEndTime(LocalTime.of(12, 0));

        when(conflictCheckService.hasConflict(any(), any(), any(), any())).thenReturn(true);

        assertThrows(BookingConflictException.class, () -> {
            bookingService.createBooking(request, testUserId, "test@sliit.lk");
        });
    }

    @Test
    @DisplayName("Should get booking by ID successfully")
    void getBookingById_Success() {
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(sampleBooking));

        BookingResponseDTO result = bookingService.getBookingById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    @DisplayName("Should throw when booking not found by ID")
    void getBookingById_NotFound() {
        when(bookingRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> {
            bookingService.getBookingById(999L);
        });
    }

    @Test
    @DisplayName("Should approve pending booking successfully")
    void reviewBooking_Approve() {
        BookingReviewDTO review = new BookingReviewDTO();
        review.setAction(BookingStatus.APPROVED);
        review.setAdminNote("Looks good");

        UUID adminId = UUID.randomUUID();
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(sampleBooking));
        when(bookingRepository.save(any(Booking.class))).thenReturn(sampleBooking);

        BookingResponseDTO result = bookingService.reviewBooking(1L, review, adminId);

        assertNotNull(result);
        verify(bookingRepository, times(1)).save(any(Booking.class));
    }

    @Test
    @DisplayName("Should throw when reviewing non-PENDING booking")
    void reviewBooking_InvalidStatus() {
        sampleBooking.setStatus(BookingStatus.APPROVED);

        BookingReviewDTO review = new BookingReviewDTO();
        review.setAction(BookingStatus.APPROVED);

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(sampleBooking));

        assertThrows(InvalidBookingStatusException.class, () -> {
            bookingService.reviewBooking(1L, review, UUID.randomUUID());
        });
    }

    @Test
    @DisplayName("Should cancel own booking successfully")
    void cancelBooking_Success() {
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(sampleBooking));

        assertDoesNotThrow(() -> bookingService.cancelBooking(1L, testUserId));
        assertEquals(BookingStatus.CANCELLED, sampleBooking.getStatus());
    }

    @Test
    @DisplayName("Should throw when cancelling other user's booking")
    void cancelBooking_NotOwner() {
        UUID otherUserId = UUID.randomUUID();
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(sampleBooking));

        assertThrows(RuntimeException.class, () -> {
            bookingService.cancelBooking(1L, otherUserId);
        });
    }

    @Test
    @DisplayName("Should check availability correctly")
    void checkAvailability_Available() {
        when(conflictCheckService.hasConflict(any(), any(), any(), any())).thenReturn(false);

        boolean result = bookingService.checkAvailability(1L, "2026-05-01", "10:00", "12:00");

        assertTrue(result);
    }

    @Test
    @DisplayName("Should return false when slot not available")
    void checkAvailability_NotAvailable() {
        when(conflictCheckService.hasConflict(any(), any(), any(), any())).thenReturn(true);

        boolean result = bookingService.checkAvailability(1L, "2026-05-01", "10:00", "12:00");

        assertFalse(result);
    }
}
