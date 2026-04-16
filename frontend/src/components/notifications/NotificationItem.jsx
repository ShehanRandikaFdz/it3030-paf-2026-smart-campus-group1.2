import React from 'react';

export default function NotificationItem({ notification, onMarkRead, onDelete }) {
    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return new Date(date).toLocaleDateString();
    };

    return (
        <div className={`notification-item ${!notification.isRead ? 'unread' : ''}`}>
            <div className="notification-icon">🔔</div>
            <div className="notification-content">
                <div className="notification-title">{notification.title}</div>
                <div className="notification-message">{notification.message}</div>
                <div className="notification-time">{timeAgo(notification.createdAt)}</div>
                <div className="notification-actions">
                    {!notification.isRead && (
                        <button onClick={() => onMarkRead(notification.id)} className="btn-mark-read">
                            Mark read
                        </button>
                    )}
                    <button onClick={() => onDelete(notification.id)} className="btn-delete">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}