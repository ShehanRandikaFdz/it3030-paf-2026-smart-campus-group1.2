import React, { useEffect, useState } from 'react';
import { getNotifications, markAllAsRead, deleteNotification, markAsRead } from '../../api/notificationsApi';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        getNotifications({ page: 0, size: 20 })
            .then(res => setNotifications(res.data.data || []))
            .catch(() => setError('Failed to load notifications'))
            .finally(() => setLoading(false));
    }, []);

    const handleMarkAll = async () => {
        await markAllAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const handleMarkRead = async (id) => {
        await markAsRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const handleDelete = async (id) => {
        await deleteNotification(id);
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>🔔 Notifications</h2>
                <button onClick={handleMarkAll}
                    style={{ padding: '8px 16px', cursor: 'pointer', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px' }}>
                    Mark All as Read
                </button>
            </div>
            {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    <p>No notifications yet</p>
                </div>
            ) : (
                notifications.map(n => (
                    <div key={n.id} style={{
                        padding: '16px', marginBottom: '10px', borderRadius: '8px',
                        background: n.isRead ? '#fff' : '#f0f7ff',
                        border: '1px solid #eee',
                        borderLeft: n.isRead ? '1px solid #eee' : '4px solid #3b82f6'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <strong>{n.title}</strong>
                            <small style={{ color: '#999' }}>{new Date(n.createdAt).toLocaleString()}</small>
                        </div>
                        <p style={{ margin: '8px 0', color: '#555' }}>{n.message}</p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {!n.isRead && (
                                <button onClick={() => handleMarkRead(n.id)}
                                    style={{ fontSize: '12px', padding: '4px 10px', cursor: 'pointer' }}>
                                    Mark Read
                                </button>
                            )}
                            <button onClick={() => handleDelete(n.id)}
                                style={{ fontSize: '12px', padding: '4px 10px', cursor: 'pointer', color: 'red' }}>
                                Delete
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}