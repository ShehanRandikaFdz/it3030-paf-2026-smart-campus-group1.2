package com.smartcampus.module_d.service;

import com.smartcampus.module_d.enums.NotificationType;
import java.util.UUID;

/**
 * Notification Service Interface
 * To be fully implemented by Thisangi (Module D+E)
 * This is a stub interface for module integration
 */
public interface NotificationService {

    /**
     * Create and store a notification for a user
     * 
     * @param userId The target user UUID
     * @param title Notification title
     * @param message Notification message
     * @param type Notification type
     */
    void createNotification(UUID userId, String title, String message, NotificationType type);

    /**
     * Send email notification to user
     * 
     * @param email Recipient email
     * @param subject Email subject
     * @param body Email body
     */
    void sendEmail(String email, String subject, String body);
}
