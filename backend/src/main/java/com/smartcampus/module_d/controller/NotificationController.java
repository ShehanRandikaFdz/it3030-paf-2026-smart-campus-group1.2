package com.smartcampus.module_d.controller;

import com.smartcampus.common.ApiResponse;
import com.smartcampus.common.security.CurrentUser;
import com.smartcampus.module_d.dto.NotificationResponseDTO;
import com.smartcampus.module_d.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponseDTO>>> getNotifications(
            @CurrentUser String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<NotificationResponseDTO> notifications = notificationService
                .getNotificationsForUser(UUID.fromString(userId), PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success("Notifications fetched", notifications));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(@CurrentUser String userId) {
        long count = notificationService.getUnreadCount(UUID.fromString(userId));
        return ResponseEntity.ok(ApiResponse.success("Unread count", count));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long id,
            @CurrentUser String userId) {
        notificationService.markAsRead(id, UUID.fromString(userId));
        return ResponseEntity.ok(ApiResponse.success("Marked as read"));
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(@CurrentUser String userId) {
        notificationService.markAllAsRead(UUID.fromString(userId));
        return ResponseEntity.ok(ApiResponse.success("All marked as read"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(
            @PathVariable Long id,
            @CurrentUser String userId) {
        notificationService.deleteNotification(id, UUID.fromString(userId));
        return ResponseEntity.ok(ApiResponse.success("Notification deleted"));
    }
}