import axios from '../utils/axiosInstance';

/**
 * Bookings API — Module B
 * Full CRUD for booking management
 */

// ─── CREATE ───────────────────────────────────────────────
export const createBooking = (data) =>
  axios.post('/api/v1/bookings', data);

// ─── READ ─────────────────────────────────────────────────
export const getMyBookings = (params) =>
  axios.get('/api/v1/bookings/my', { params });

export const getBookingById = (id) =>
  axios.get(`/api/v1/bookings/${id}`);

export const getAllBookings = (params) =>
  axios.get('/api/v1/bookings', { params });

// ─── UPDATE ───────────────────────────────────────────────
export const updateBooking = (id, data) =>
  axios.put(`/api/v1/bookings/${id}`, data);

export const reviewBooking = (id, data) =>
  axios.put(`/api/v1/bookings/${id}/review`, data);

// ─── DELETE / CANCEL ──────────────────────────────────────
export const cancelBooking = (id) =>
  axios.put(`/api/v1/bookings/${id}/cancel`);

// ─── AVAILABILITY ─────────────────────────────────────────
export const checkAvailability = (resourceId, date, startTime, endTime) =>
  axios.get('/api/v1/bookings/availability', {
    params: { resourceId, bookingDate: date, startTime, endTime }
  });

/**
 * Fetches all APPROVED bookings for a resource on a date, for the calendar view.
 * Returns an array of { startTime, endTime } slots.
 */
export const getBookedSlots = (resourceId, date) =>
  axios.get('/api/v1/bookings', {
    params: { resourceId, status: 'APPROVED' }
  }).then(res => {
    const all = res.data?.data || [];
    return all.filter(b => b.bookingDate === date);
  });
