import axiosInstance from '../utils/axiosInstance';

export const getMyProfile = () => axiosInstance.get('/api/v1/users/me');
export const updateUserRole = (userId, role) => axiosInstance.put(`/api/v1/users/${userId}/role`, { role });
export const getAllUsers = () => axiosInstance.get('/api/v1/users');