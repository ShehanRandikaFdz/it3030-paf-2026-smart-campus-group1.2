import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBookingById, cancelBooking } from '../../api/bookingsApi';
import BookingStatusBadge from '../../components/bookings/BookingStatusBadge';
import '../bookings/BookingStyles.css';

/**
 * BookingDetailPage — View single booking details with action options
 */
const BookingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    loadBooking();
  }, [id]);

  const loadBooking = async () => {
    try {
      const response = await getBookingById(id);
      if (response.data.success) {
        setBooking(response.data.data);
      }
    } catch (err) {
      setError('Failed to load booking details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    setIsCancelling(true);
    try {
      await cancelBooking(id);
      navigate('/bookings', { state: { successMessage: 'Booking cancelled successfully' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel booking');
      setIsCancelling(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateTime = (dt) => {
    return dt ? new Date(dt).toLocaleString() : 'N/A';
  };

  if (isLoading) {
    return <div className="detail-page"><div className="loading">Loading booking...</div></div>;
  }

  if (!booking) {
    return (
      <div className="detail-page">
        <div className="error-state">
          <p>Booking not found</p>
          <button className="btn btn-primary" onClick={() => navigate('/bookings')}>
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-page">
      <div className="detail-header">
        <div className="header-content">
          <h1>{booking.title}</h1>
          <BookingStatusBadge status={booking.status} />
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/bookings')}>
          ← Back
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="detail-grid">
        <div className="detail-section">
          <h3>Booking Information</h3>
          <div className="detail-item">
            <label>Resource:</label>
            <span>{booking.resourceName || `Resource ${booking.resourceId}`}</span>
          </div>
          <div className="detail-item">
            <label>Date:</label>
            <span>{formatDate(booking.bookingDate)}</span>
          </div>
          <div className="detail-item">
            <label>Time:</label>
            <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
          </div>
          <div className="detail-item">
            <label>Attendees:</label>
            <span>{booking.attendees}</span>
          </div>
          <div className="detail-item">
            <label>Purpose:</label>
            <span className="pre-wrap">{booking.purpose}</span>
          </div>
        </div>

        <div className="detail-section">
          <h3>User Information</h3>
          <div className="detail-item">
            <label>Email:</label>
            <span>{booking.userEmail}</span>
          </div>
          <div className="detail-item">
            <label>Status:</label>
            <span>{booking.status}</span>
          </div>
          {booking.adminNote && (
            <div className="detail-item">
              <label>Admin Note:</label>
              <span className="pre-wrap">{booking.adminNote}</span>
            </div>
          )}
        </div>

        <div className="detail-section">
          <h3>Booking Timeline</h3>
          <div className="detail-item">
            <label>Created:</label>
            <span>{formatDateTime(booking.createdAt)}</span>
          </div>
          <div className="detail-item">
            <label>Updated:</label>
            <span>{formatDateTime(booking.updatedAt)}</span>
          </div>
          {booking.reviewedAt && (
            <>
              <div className="detail-item">
                <label>Reviewed:</label>
                <span>{formatDateTime(booking.reviewedAt)}</span>
              </div>
              <div className="detail-item">
                <label>Reviewed By:</label>
                <span>{booking.reviewedBy || 'N/A'}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {(booking.status === 'PENDING' || booking.status === 'APPROVED') && (
        <div className="detail-actions">
          <button
            className="btn btn-danger"
            onClick={handleCancel}
            disabled={isCancelling}
          >
            {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
          </button>
        </div>
      )}
    </div>
  );
};

export default BookingDetailPage;
