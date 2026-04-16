package com.smartcampus.module_d.service;

import com.smartcampus.module_d.dto.NotificationResponseDTO;
import com.smartcampus.module_d.enums.NotificationType;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.UUID;

public interface NotificationService {

    void createNotification(UUID userId, String title, String message,
                            NotificationType type);

    void createNotification(UUID userId, String title, String message,
                            NotificationType type, Long relatedId, String relatedType);

    List<NotificationResponseDTO> getNotificationsForUser(UUID userId, Pageable pageable);

    long getUnreadCount(UUID userId);

    void markAsRead(Long notificationId, UUID userId);

    void markAllAsRead(UUID userId);

    void deleteNotification(Long notificationId, UUID userId);

    void sendEmail(String email, String subject, String body);
}
