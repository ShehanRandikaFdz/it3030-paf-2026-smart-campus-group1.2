package com.smartcampus.module_d.service;

import com.smartcampus.common.exception.ForbiddenException;
import com.smartcampus.common.exception.ResourceNotFoundException;
import com.smartcampus.module_d.dto.NotificationResponseDTO;
import com.smartcampus.module_d.entity.Notification;
import com.smartcampus.module_d.enums.NotificationType;
import com.smartcampus.module_d.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    private UUID testUserId;
    private Notification sampleNotification;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        sampleNotification = Notification.builder()
                .id(1L)
                .userId(testUserId)
                .title("Booking Approved")
                .message("Your booking has been approved.")
                .type(NotificationType.BOOKING_APPROVED)
                .isRead(false)
                .createdAt(OffsetDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Should create notification successfully")
    void createNotification_Success() {
        when(notificationRepository.save(any(Notification.class))).thenReturn(sampleNotification);

        assertDoesNotThrow(() -> notificationService.createNotification(
                testUserId, "Test", "Test message", NotificationType.BOOKING_CREATED));

        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    @DisplayName("Should get notifications for user")
    void getNotificationsForUser_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Notification> page = new PageImpl<>(List.of(sampleNotification));
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(testUserId, pageable))
                .thenReturn(page);

        List<NotificationResponseDTO> result = notificationService.getNotificationsForUser(testUserId, pageable);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Booking Approved", result.get(0).getTitle());
    }

    @Test
    @DisplayName("Should get unread count")
    void getUnreadCount_Success() {
        when(notificationRepository.countByUserIdAndIsRead(testUserId, false)).thenReturn(5L);

        long count = notificationService.getUnreadCount(testUserId);

        assertEquals(5L, count);
    }

    @Test
    @DisplayName("Should mark notification as read")
    void markAsRead_Success() {
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(sampleNotification));
        when(notificationRepository.save(any(Notification.class))).thenReturn(sampleNotification);

        assertDoesNotThrow(() -> notificationService.markAsRead(1L, testUserId));
        assertTrue(sampleNotification.isRead());
    }

    @Test
    @DisplayName("Should throw when marking another user's notification as read")
    void markAsRead_Forbidden() {
        UUID otherUser = UUID.randomUUID();
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(sampleNotification));

        assertThrows(ForbiddenException.class, () -> {
            notificationService.markAsRead(1L, otherUser);
        });
    }

    @Test
    @DisplayName("Should throw when notification not found")
    void markAsRead_NotFound() {
        when(notificationRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            notificationService.markAsRead(999L, testUserId);
        });
    }

    @Test
    @DisplayName("Should delete own notification successfully")
    void deleteNotification_Success() {
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(sampleNotification));
        doNothing().when(notificationRepository).delete(sampleNotification);

        assertDoesNotThrow(() -> notificationService.deleteNotification(1L, testUserId));
        verify(notificationRepository, times(1)).delete(sampleNotification);
    }

    @Test
    @DisplayName("Should throw when deleting another user's notification")
    void deleteNotification_Forbidden() {
        UUID otherUser = UUID.randomUUID();
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(sampleNotification));

        assertThrows(ForbiddenException.class, () -> {
            notificationService.deleteNotification(1L, otherUser);
        });
    }
}
