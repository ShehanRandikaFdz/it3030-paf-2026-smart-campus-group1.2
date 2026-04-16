package com.smartcampus.module_d.service;

import com.smartcampus.module_d.enums.NotificationType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.UUID;

/**
 * Stub implementation of NotificationService
 * To be fully implemented by Thisangi (Module D+E)
 * Currently logs notifications - will be replaced with real implementation
 */
@Slf4j
@Service
public class NotificationServiceStub implements NotificationService {

    @Override
    public void createNotification(UUID userId, String title, String message, NotificationType type) {
        log.info("NOTIFICATION [{}] - User: {}, Title: {}, Message: {}", 
            type, userId, title, message);
        // TODO: Implement by Thisangi
        // - Store in database
        // - Send email if enabled
        // - Push notification if enabled
    }

    @Override
    public void sendEmail(String email, String subject, String body) {
        log.info("EMAIL - Recipient: {}, Subject: {}", email, subject);
        // TODO: Implement by Thisangi using email service
    }
}
