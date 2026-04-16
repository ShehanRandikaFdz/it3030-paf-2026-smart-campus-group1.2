import React, { useEffect, useState, useRef } from 'react';
import { getUnreadCount } from '../../api/notificationsApi';
import NotificationPanel from './NotificationPanel';

export default function NotificationBell() {
    const [count, setCount] = useState(0);
    const [open, setOpen] = useState(false);
    const panelRef = useRef(null);
    const buttonRef = useRef(null);

    useEffect(() => {
        getUnreadCount()
            .then(res => setCount(res.data.data || 0))
            .catch(() => setCount(0));
    }, []);

    // Close panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target) &&
                buttonRef.current && !buttonRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <div
                ref={buttonRef}
                className="notification-bell"
                onClick={() => setOpen(!open)}
            >
                <span className="bell-icon">🔔</span>
                {count > 0 && (
                    <span className="bell-badge">{count > 9 ? '9+' : count}</span>
                )}
            </div>
            {open && (
                <div ref={panelRef} className="notification-panel">
                    <NotificationPanel onClose={() => setOpen(false)} />
                </div>
            )}
        </div>
    );
}