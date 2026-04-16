import React, { useEffect, useState } from 'react';
import { getNotifications, markAsRead, deleteNotification } from '../../api/notificationsApi';
import NotificationItem from './NotificationItem';

export default function NotificationPanel({ onClose }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getNotifications({ page: 0, size: 5 })
            .then(res => setNotifications(res.data.data || []))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const handleMarkRead = async (id) => {
        await markAsRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const handleDelete = async (id) => {
        await deleteNotification(id);
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <>
            <div className="panel-header">
                <h4>Notifications</h4>
                <button onClick={onClose} className="close-panel-btn">✕</button>
            </div>
            <div className="panel-list">
                {loading ? (
                    <div className="empty-panel">Loading...</div>
                ) : notifications.length === 0 ? (
                    <div className="empty-panel">No notifications</div>
                ) : (
                    notifications.map(n => (
                        <NotificationItem
                            key={n.id}
                            notification={n}
                            onMarkRead={handleMarkRead}
                            onDelete={handleDelete}
                        />
                    ))
                )}
            </div>
        </>
    );
}