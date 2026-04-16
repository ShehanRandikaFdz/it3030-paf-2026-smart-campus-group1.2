import axios from '../utils/axiosInstance';

/**
 * Bookings API — Module B
 * All API calls for booking management
 */

export const createBooking = (data) =>
  axios.post('/api/v1/bookings', data);

export const getMyBookings = (params) =>
  axios.get('/api/v1/bookings/my', { params });

export const getBookingById = (id) =>
  axios.get(`/api/v1/bookings/${id}`);

export const getAllBookings = (params) =>
  axios.get('/api/v1/bookings', { params });

export const reviewBooking = (id, data) =>
  axios.put(`/api/v1/bookings/${id}/review`, data);

export const cancelBooking = (id) =>
  axios.put(`/api/v1/bookings/${id}/cancel`);

export const checkAvailability = (resourceId, date, startTime, endTime) =>
  axios.get('/api/v1/bookings/availability', {
    params: { resourceId, bookingDate: date, startTime, endTime }
  });
