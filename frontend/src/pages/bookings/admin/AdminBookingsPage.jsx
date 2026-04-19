import React, { useState, useEffect } from 'react';
import { getAllBookings, cancelBooking } from '../../../api/bookingsApi';
import BookingReviewModal from '../../../components/bookings/BookingReviewModal';
import '../BookingStyles.css';

/**
 * AdminBookingsPage — Admin view for managing ALL bookings.
 * Features:
 *  - Status-filtered table with counts
 *  - Review (approve/reject) modal for PENDING
 *  - Force-cancel any PENDING or APPROVED booking
 *  - Search by title / user email / resource
 */
const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeReviewBooking, setActiveReviewBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      const response = await getAllBookings({});
      if (response.data.success) {
        const data = response.data.data;
        setBookings(data);
        applyFilters(data, statusFilter, searchTerm);
      }
    } catch {
      setError('Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = (all, status, search) => {
    let list = all;
    if (status) list = list.filter(b => b.status === status);
    if (search?.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        b.title?.toLowerCase().includes(q) ||
        b.userEmail?.toLowerCase().includes(q) ||
        b.resourceName?.toLowerCase().includes(q)
      );
    }
    setFilteredBookings(list);
  };

  const handleStatusFilter = (status) => {
    const next = status === statusFilter ? null : status;
    setStatusFilter(next);
    applyFilters(bookings, next, searchTerm);
  };

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearchTerm(q);
    applyFilters(bookings, statusFilter, q);
  };

  const handleReviewComplete = (updated) => {
    const newList = bookings.map(b => b.id === updated.id ? updated : b);
    setBookings(newList);
    applyFilters(newList, statusFilter, searchTerm);
    flash('success', `Booking ${updated.status.toLowerCase()} successfully.`);
    setActiveReviewBooking(null);
  };

  const handleForceCancel = async (id) => {
    if (!window.confirm('Force-cancel this booking? This cannot be undone.')) return;
    try {
      await cancelBooking(id);
      flash('success', 'Booking force-cancelled.');
      loadBookings();
    } catch (err) {
      flash('error', err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const flash = (type, msg) => {
    if (type === 'success') { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(''), 4000); }
    else { setError(msg); setTimeout(() => setError(''), 5000); }
  };

  const statusCounts = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].reduce((acc, s) => {
    acc[s] = bookings.filter(b => b.status === s).length;
    return acc;
  }, {});

  const formatDate = (d) => new Date(d).toLocaleDateString();

  return (
    <div className="list-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>All Bookings</h1>
          <p>Review and manage all resource booking requests</p>
        </div>
        <div className="header-stats">
          <span className="stat-badge pending">{statusCounts.PENDING} Pending</span>
          <span className="stat-badge approved">{statusCounts.APPROVED} Approved</span>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      {/* Search */}
      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search by title, user email, or resource..."
          value={searchTerm}
          onChange={handleSearch}
          id="admin-booking-search"
        />
      </div>

      {/* Status Filter */}
      <div className="filter-bar">
        <h3>Filter by Status:</h3>
        <div className="filter-buttons">
          {['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(status => (
            <button
              key={status}
              className={`btn btn-sm ${statusFilter === status ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => handleStatusFilter(status)}
            >
              {status}
              <span className="count">{statusCounts[status]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="loading">Loading bookings...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="empty-state"><p>No bookings to display</p></div>
      ) : (
        <div className="admin-bookings-table">
          <table className="bookings-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>User</th>
                <th>Resource</th>
                <th>Date</th>
                <th>Time</th>
                <th>Attendees</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map(booking => (
                <tr key={booking.id} className={`row-status-${booking.status?.toLowerCase()}`}>
                  <td>
                    <strong>{booking.title}</strong>
                    {booking.adminNote && (
                      <div className="admin-note-small">📝 {booking.adminNote}</div>
                    )}
                  </td>
                  <td>{booking.userEmail}</td>
                  <td>{booking.resourceName || `Resource ${booking.resourceId}`}</td>
                  <td>{formatDate(booking.bookingDate)}</td>
                  <td className="mono">{booking.startTime} – {booking.endTime}</td>
                  <td>{booking.attendees}</td>
                  <td>
                    <span className={`badge status-${booking.status?.toLowerCase()}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="action-cell">
                    {booking.status === 'PENDING' && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => setActiveReviewBooking(booking)}
                      >
                        Review
                      </button>
                    )}
                    {(booking.status === 'PENDING' || booking.status === 'APPROVED') && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleForceCancel(booking.id)}
                      >
                        Cancel
                      </button>
                    )}
                    {booking.status !== 'PENDING' && booking.status !== 'APPROVED' && (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {activeReviewBooking && (
        <BookingReviewModal
          booking={activeReviewBooking}
          onClose={() => setActiveReviewBooking(null)}
          onReviewComplete={handleReviewComplete}
        />
      )}
    </div>
  );
};

export default AdminBookingsPage;
