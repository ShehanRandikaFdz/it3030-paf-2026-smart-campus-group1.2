import axios from '../utils/axiosInstance';

export const createIncident = (data) =>
  axios.post('/api/v1/incidents', data);

export const getMyIncidents = (params) =>
  axios.get('/api/v1/incidents', { params });

export const getAllIncidents = (params) =>
  axios.get('/api/v1/incidents', { params: { ...params, all: true } });

export const getIncidentById = (id) =>
  axios.get(`/api/v1/incidents/${id}`);

export const updateIncidentStatus = (id, data) =>
  axios.put(`/api/v1/incidents/${id}/status`, data);

export const assignTechnician = (id, data) =>
  axios.put(`/api/v1/incidents/${id}/assign`, data);

export const deleteIncident = (id) =>
  axios.delete(`/api/v1/incidents/${id}`);

export const uploadAttachments = (id, files) => {
  const form = new FormData();
  files.forEach((f) => form.append('files', f));
  return axios.post(`/api/v1/incidents/${id}/attachments`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteAttachment = (id, attachmentId) =>
  axios.delete(`/api/v1/incidents/${id}/attachments/${attachmentId}`);

export const addComment = (id, data) =>
  axios.post(`/api/v1/incidents/${id}/comments`, data);

export const editComment = (id, commentId, data) =>
  axios.put(`/api/v1/incidents/${id}/comments/${commentId}`, data);

export const deleteComment = (id, commentId) =>
  axios.delete(`/api/v1/incidents/${id}/comments/${commentId}`);
