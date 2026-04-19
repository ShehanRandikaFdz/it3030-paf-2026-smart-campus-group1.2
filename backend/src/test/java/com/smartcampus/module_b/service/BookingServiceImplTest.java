package com.smartcampus.module_b.service;

import com.smartcampus.module_a.entity.Resource;
import com.smartcampus.module_a.enums.ResourceStatus;
import com.smartcampus.module_a.repository.ResourceRepository;
import com.smartcampus.module_b.dto.BookingRequestDTO;
import com.smartcampus.module_b.dto.BookingResponseDTO;
import com.smartcampus.module_b.dto.BookingReviewDTO;
import com.smartcampus.module_b.entity.Booking;
import com.smartcampus.module_b.enums.BookingStatus;
import com.smartcampus.module_b.exception.BookingConflictException;
import com.smartcampus.module_b.exception.InvalidBookingStatusException;
import com.smartcampus.module_b.exception.ResourceNotAvailableException;
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

    @Mock
    private ResourceRepository resourceRepository;   // ← required for new resource validation

    @InjectMocks
    private BookingServiceImpl bookingService;

    private UUID testUserId;
    private Booking sampleBooking;
    private Resource sampleResource;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();

        sampleResource = new Resource();
        sampleResource.setId(1L);
        sampleResource.setName("Lab A101");
        sampleResource.setStatus(ResourceStatus.ACTIVE);

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

    // ─── CREATE ──────────────────────────────────────────────────────────

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

        when(resourceRepository.findById(1L)).thenReturn(Optional.of(sampleResource));
        when(conflictCheckService.hasConflict(any(), any(), any(), any())).thenReturn(false);
        when(bookingRepository.save(any(Booking.class))).thenReturn(sampleBooking);

        BookingResponseDTO result = bookingService.createBooking(request, testUserId, "test@sliit.lk");

        assertNotNull(result);
        assertEquals("PAF Group Meeting", result.getTitle());
        assertEquals(BookingStatus.PENDING, result.getStatus());
        assertEquals("Lab A101", result.getResourceName());
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

        when(resourceRepository.findById(1L)).thenReturn(Optional.of(sampleResource));
        when(conflictCheckService.hasConflict(any(), any(), any(), any())).thenReturn(true);

        assertThrows(BookingConflictException.class, () ->
            bookingService.createBooking(request, testUserId, "test@sliit.lk"));
    }

    @Test
    @DisplayName("Should throw ResourceNotAvailableException for inactive resource")
    void createBooking_InactiveResource() {
        sampleResource.setStatus(ResourceStatus.OUT_OF_SERVICE);

        BookingRequestDTO request = new BookingRequestDTO();
        request.setResourceId(1L);
        request.setBookingDate(LocalDate.now().plusDays(1));
        request.setStartTime(LocalTime.of(10, 0));
        request.setEndTime(LocalTime.of(12, 0));

        when(resourceRepository.findById(1L)).thenReturn(Optional.of(sampleResource));

        assertThrows(ResourceNotAvailableException.class, () ->
            bookingService.createBooking(request, testUserId, "test@sliit.lk"));
    }

    // ─── UPDATE ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("Should update PENDING booking successfully")
    void updateBooking_Success() {
        BookingRequestDTO request = new BookingRequestDTO();
        request.setResourceId(1L);
        request.setTitle("Updated Title");
        request.setPurpose("Updated purpose");
        request.setBookingDate(LocalDate.now().plusDays(2));
        request.setStartTime(LocalTime.of(14, 0));
        request.setEndTime(LocalTime.of(16, 0));
        request.setAttendees(8);

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(sampleBooking));
        when(resourceRepository.findById(1L)).thenReturn(Optional.of(sampleResource));
        when(conflictCheckService.hasConflict(any(), any(), any(), any(), any())).thenReturn(false);
        when(bookingRepository.save(any(Booking.class))).thenReturn(sampleBooking);

        BookingResponseDTO result = bookingService.updateBooking(1L, request, testUserId);

        assertNotNull(result);
        verify(bookingRepository, times(1)).save(any(Booking.class));
    }

    @Test
    @DisplayName("Should throw when updating non-PENDING booking")
    void updateBooking_NotPending() {
        sampleBooking.setStatus(BookingStatus.APPROVED);

        BookingRequestDTO request = new BookingRequestDTO();
        request.setResourceId(1L);
        request.setBookingDate(LocalDate.now().plusDays(2));
        request.setStartTime(LocalTime.of(14, 0));
        request.setEndTime(LocalTime.of(16, 0));

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(sampleBooking));

        assertThrows(InvalidBookingStatusException.class, () ->
            bookingService.updateBooking(1L, request, testUserId));
    }

    @Test
    @DisplayName("Should throw when updating another user's booking")
    void updateBooking_NotOwner() {
        UUID otherUser = UUID.randomUUID();

        BookingRequestDTO request = new BookingRequestDTO();
        request.setResourceId(1L);
        request.setBookingDate(LocalDate.now().plusDays(1));
        request.setStartTime(LocalTime.of(10, 0));
        request.setEndTime(LocalTime.of(12, 0));

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(sampleBooking));

        assertThrows(RuntimeException.class, () ->
            bookingService.updateBooking(1L, request, otherUser));
    }

    @Test
    @DisplayName("Should throw BookingConflictException when updated slot conflicts")
    void updateBooking_Conflict() {
        BookingRequestDTO request = new BookingRequestDTO();
        request.setResourceId(1L);
        request.setBookingDate(LocalDate.now().plusDays(1));
        request.setStartTime(LocalTime.of(10, 0));
        request.setEndTime(LocalTime.of(12, 0));

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(sampleBooking));
        when(resourceRepository.findById(1L)).thenReturn(Optional.of(sampleResource));
        when(conflictCheckService.hasConflict(any(), any(), any(), any(), any())).thenReturn(true);

        assertThrows(BookingConflictException.class, () ->
            bookingService.updateBooking(1L, request, testUserId));
    }

    // ─── READ ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Should get booking by ID successfully")
    void getBookingById_Success() {
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(sampleBooking));
        when(resourceRepository.findById(1L)).thenReturn(Optional.of(sampleResource));

        BookingResponseDTO result = bookingService.getBookingById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Lab A101", result.getResourceName());
    }

    @Test
    @DisplayName("Should throw when booking not found by ID")
    void getBookingById_NotFound() {
        when(bookingRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () ->
            bookingService.getBookingById(999L));
    }

    // ─── REVIEW (ADMIN) ───────────────────────────────────────────────────

    @Test
    @DisplayName("Should approve pending booking successfully")
    void reviewBooking_Approve() {
        BookingReviewDTO review = new BookingReviewDTO();
        review.setAction(BookingStatus.APPROVED);
        review.setAdminNote("Looks good");

        UUID adminId = UUID.randomUUID();
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(sampleBooking));
        when(bookingRepository.save(any(Booking.class))).thenReturn(sampleBooking);
        when(resourceRepository.findById(1L)).thenReturn(Optional.of(sampleResource));

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

        assertThrows(InvalidBookingStatusException.class, () ->
            bookingService.reviewBooking(1L, review, UUID.randomUUID()));
    }

    // ─── CANCEL ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("Should cancel own PENDING booking successfully")
    void cancelBooking_Success() {
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(sampleBooking));

        assertDoesNotThrow(() -> bookingService.cancelBooking(1L, testUserId));
        assertEquals(BookingStatus.CANCELLED, sampleBooking.getStatus());
    }

    @Test
    @DisplayName("Should throw when cancelling another user's booking")
    void cancelBooking_NotOwner() {
        UUID otherUserId = UUID.randomUUID();
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(sampleBooking));

        assertThrows(RuntimeException.class, () ->
            bookingService.cancelBooking(1L, otherUserId));
    }

    // ─── AVAILABILITY ─────────────────────────────────────────────────────

    @Test
    @DisplayName("Should return true when slot is available")
    void checkAvailability_Available() {
        when(conflictCheckService.hasConflict(any(), any(), any(), any())).thenReturn(false);

        boolean result = bookingService.checkAvailability(1L, "2026-05-01", "10:00", "12:00");

        assertTrue(result);
    }

    @Test
    @DisplayName("Should return false when slot is not available")
    void checkAvailability_NotAvailable() {
        when(conflictCheckService.hasConflict(any(), any(), any(), any())).thenReturn(true);

        boolean result = bookingService.checkAvailability(1L, "2026-05-01", "10:00", "12:00");

        assertFalse(result);
    }
}
