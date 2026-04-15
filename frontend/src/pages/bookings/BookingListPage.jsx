import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyBookings, cancelBooking } from '../../api/bookingsApi';
import BookingCard from '../../components/bookings/BookingCard';
import BookingStatusBadge from '../../components/bookings/BookingStatusBadge';
import '../bookings/BookingStyles.css';

/**
 * BookingListPage — User's own bookings with status filters and actions
 */
const BookingListPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      const response = await getMyBookings({});
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

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await cancelBooking(id);
      setSuccessMessage('Booking cancelled successfully');
      loadBookings();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  return (
    <div className="list-page">
      <div className="page-header">
        <div>
          <h1>My Bookings</h1>
          <p>Manage your resource booking requests</p>
        </div>
        <button 
          className="btn btn-primary btn-lg"
          onClick={() => navigate('/bookings/new')}
        >
          + New Booking
        </button>
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
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading bookings...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="empty-state">
          <p>No bookings found</p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/bookings/new')}
          >
            Create your first booking
          </button>
        </div>
      ) : (
        <div className="cards-grid">
          {filteredBookings.map(booking => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onViewDetails={(id) => navigate(`/bookings/${id}`)}
              onCancel={handleCancelBooking}
              showActions={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingListPage;
