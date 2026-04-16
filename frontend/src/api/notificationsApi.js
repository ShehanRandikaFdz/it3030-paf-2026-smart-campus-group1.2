import axiosInstance from '../utils/axiosInstance';

export const getNotifications = (params) => axiosInstance.get('/api/v1/notifications', { params });
export const getUnreadCount = () => axiosInstance.get('/api/v1/notifications/unread-count');
export const markAsRead = (id) => axiosInstance.put(`/api/v1/notifications/${id}/read`);
export const markAllAsRead = () => axiosInstance.put('/api/v1/notifications/read-all');
export const deleteNotification = (id) => axiosInstance.delete(`/api/v1/notifications/${id}`);