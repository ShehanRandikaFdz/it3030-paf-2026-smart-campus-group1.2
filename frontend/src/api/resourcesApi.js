import axios from '../utils/axiosInstance';

export const getAllResources = (params) =>
  axios.get('/api/v1/resources', { params });

export const getResourceById = (id) =>
  axios.get(`/api/v1/resources/${id}`);

export const searchResources = (filters) =>
  axios.get('/api/v1/resources/search', { params: filters });

export const createResource = (data) =>
  axios.post('/api/v1/resources', data);

export const updateResource = (id, data) =>
  axios.put(`/api/v1/resources/${id}`, data);

export const updateResourceStatus = (id, status) =>
  axios.patch(`/api/v1/resources/${id}/status`, { status });

export const deleteResource = (id) =>
  axios.delete(`/api/v1/resources/${id}`);
