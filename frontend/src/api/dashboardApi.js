import axiosInstance from '../utils/axiosInstance';

export const getDashboardStats = () => axiosInstance.get('/api/v1/dashboard/stats');
