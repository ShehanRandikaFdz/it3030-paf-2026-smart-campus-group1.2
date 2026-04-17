package com.smartcampus.module_d.service;

import com.smartcampus.module_d.dto.NotificationResponseDTO;
import com.smartcampus.module_d.enums.NotificationType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.UUID;


@Slf4j
// @Service
public class NotificationServiceStub implements NotificationService {

    @Override
    public void createNotification(UUID userId, String title, String message, NotificationType type) {
        log.info("NOTIFICATION [{}] - User: {}, Title: {}, Message: {}",
                type, userId, title, message);
    }

    @Override
    public void createNotification(UUID userId, String title, String message,
                                   NotificationType type, Long relatedId, String relatedType) {
        log.info("NOTIFICATION [{}] - User: {}, Title: {}, Message: {}, RelatedId: {}, RelatedType: {}",
                type, userId, title, message, relatedId, relatedType);
    }

    @Override
    public List<NotificationResponseDTO> getNotificationsForUser(UUID userId, Pageable pageable) {
        log.info("Fetching notifications for user: {}", userId);
        return Collections.emptyList(); // return empty for now
    }

    @Override
    public long getUnreadCount(UUID userId) {
        log.info("Getting unread count for user: {}", userId);
        return 0;
    }

    @Override
    public void markAsRead(Long notificationId, UUID userId) {
        log.info("Marking notification as read: {}, User: {}", notificationId, userId);
    }

    @Override
    public void markAllAsRead(UUID userId) {
        log.info("Marking all notifications as read for user: {}", userId);
    }

    @Override
    public void deleteNotification(Long id, UUID userId) {
        log.info("Deleting notification: {}, User: {}", id, userId);
    }

    @Override
    public void sendEmail(String email, String subject, String body) {
        log.info("EMAIL - Recipient: {}, Subject: {}", email, subject);
    }
}