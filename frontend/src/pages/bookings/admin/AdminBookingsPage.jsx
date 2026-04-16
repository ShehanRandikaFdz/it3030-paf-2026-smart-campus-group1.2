import React, { useState, useEffect } from 'react';
import { getAllBookings } from '../../../api/bookingsApi';
import BookingCard from '../../../components/bookings/BookingCard';
import BookingReviewModal from '../../../components/bookings/BookingReviewModal';
import '../BookingStyles.css';

/**
 * AdminBookingsPage — Admin view for managing all bookings
 */
const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState(null);
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
        setBookings(response.data.data);
        filterBookings(response.data.data, statusFilter);
      }
    } catch (err) {
      setError('Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const filterBookings = (allBookings, status) => {
    if (status) {
      setFilteredBookings(allBookings.filter(b => b.status === status));
    } else {
      setFilteredBookings(allBookings);
    }
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status === statusFilter ? null : status);
    filterBookings(bookings, status === statusFilter ? null : status);
  };

  const handleReviewComplete = (updatedBooking) => {
    setBookings(bookings.map(b => b.id === updatedBooking.id ? updatedBooking : b));
    filterBookings(
      bookings.map(b => b.id === updatedBooking.id ? updatedBooking : b),
      statusFilter
    );
    setSuccessMessage(`Booking ${updatedBooking.status.toLowerCase()}`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="list-page">
      <div className="page-header">
        <div>
          <h1>All Bookings</h1>
          <p>Manage resource booking requests</p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

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
              <span className="count">
                {bookings.filter(b => b.status === status).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading bookings...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="empty-state">
          <p>No bookings to display</p>
        </div>
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
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map(booking => (
                <tr key={booking.id} className={`row-status-${booking.status?.toLowerCase()}`}>
                  <td>{booking.title}</td>
                  <td>{booking.userEmail}</td>
                  <td>{booking.resourceName || `Resource ${booking.resourceId}`}</td>
                  <td>{new Date(booking.bookingDate).toLocaleDateString()}</td>
                  <td>{booking.startTime} - {booking.endTime}</td>
                  <td>
                    <span className={`badge status-${booking.status?.toLowerCase()}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td>
                    {booking.status === 'PENDING' && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => setActiveReviewBooking(booking)}
                      >
                        Review
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
