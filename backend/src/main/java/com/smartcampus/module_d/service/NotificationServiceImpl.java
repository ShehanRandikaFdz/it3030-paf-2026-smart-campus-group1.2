package com.smartcampus.module_d.service;

import com.smartcampus.common.exception.ForbiddenException;
import com.smartcampus.common.exception.ResourceNotFoundException;
import com.smartcampus.module_d.dto.NotificationResponseDTO;
import com.smartcampus.module_d.entity.Notification;
import com.smartcampus.module_d.enums.NotificationType;
import com.smartcampus.module_d.repository.NotificationRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class NotificationServiceImpl implements NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Override
    public void createNotification(UUID userId, String title, String message, NotificationType type) {
        createNotification(userId, title, message, type, null, null);
    }

    @Override
    public void createNotification(UUID userId, String title, String message,
                                   NotificationType type, Long relatedId, String relatedType) {
        Notification notification = Notification.builder()
                .userId(userId)
                .title(title)
                .message(message)
                .type(type)
                .isRead(false)
                .relatedId(relatedId)
                .relatedType(relatedType)
                .build();
        notificationRepository.save(notification);
    }

    @Override
    public List<NotificationResponseDTO> getNotificationsForUser(UUID userId, Pageable pageable) {
        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .stream()
                .map(this::map)
                .collect(Collectors.toList());
    }

    @Override
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndIsRead(userId, false);
    }

    @Override
    @Transactional
    public void markAsRead(Long notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        if (!notification.getUserId().equals(userId)) {
            throw new ForbiddenException("Not allowed");
        }
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead(UUID userId) {
        notificationRepository.markAllAsReadByUserId(userId);
    }

    @Override
    @Transactional
    public void deleteNotification(Long notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        if (!notification.getUserId().equals(userId)) {
            throw new ForbiddenException("Not allowed");
        }
        notificationRepository.delete(notification);
    }

    @Override
    public void sendEmail(String email, String subject, String body) {
        // TODO: Integrate with email service (e.g., SendGrid, SMTP)
        System.out.println("EMAIL - Recipient: " + email + ", Subject: " + subject);
    }

    private NotificationResponseDTO map(Notification n) {
        return NotificationResponseDTO.builder()
                .id(n.getId())
                .userId(n.getUserId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .isRead(n.isRead())
                .relatedId(n.getRelatedId())
                .relatedType(n.getRelatedType())
                .createdAt(n.getCreatedAt())
                .build();
    }
}