import React from 'react';
import '../../pages/bookings/BookingStyles.css';

/**
 * BookingCard — Display individual booking summary
 */
const BookingCard = ({ booking, onViewDetails, onCancel, showActions = false }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="card booking-card">
      <div className="card-header">
        <h3>{booking.title}</h3>
        <span className={`badge status-${booking.status?.toLowerCase()}`}>
          {booking.status}
        </span>
      </div>
      <div className="card-body">
        <p><strong>Resource:</strong> {booking.resourceName || `Resource ${booking.resourceId}`}</p>
        <p><strong>Date:</strong> {formatDate(booking.bookingDate)}</p>
        <p><strong>Time:</strong> {formatTime(booking.startTime)} - {formatTime(booking.endTime)}</p>
        <p><strong>Attendees:</strong> {booking.attendees}</p>
        <p className="truncate"><strong>Purpose:</strong> {booking.purpose}</p>
      </div>
      {showActions && (
        <div className="card-footer">
          <button
            className="btn btn-sm btn-primary"
            onClick={() => onViewDetails(booking.id)}
          >
            View Details
          </button>
          {booking.status === 'PENDING' || booking.status === 'APPROVED' ? (
            <button
              className="btn btn-sm btn-danger"
              onClick={() => onCancel(booking.id)}
            >
              Cancel
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default BookingCard;
