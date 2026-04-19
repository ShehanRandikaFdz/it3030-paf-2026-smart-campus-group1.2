import React from 'react';
import '../../pages/bookings/BookingStyles.css';

/**
 * BookingCard — Display individual booking summary with CRUD actions.
 *
 * Props:
 *   booking      – booking object
 *   onViewDetails – (id) => void
 *   onEdit        – (booking) => void  [shown for PENDING only]
 *   onCancel      – (id) => void       [shown for PENDING / APPROVED]
 *   showActions   – boolean
 */
const BookingCard = ({ booking, onViewDetails, onEdit, onCancel, showActions = false }) => {
  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-US', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    });

  const formatTime = (time) =>
    new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit',
    });

  const canEdit   = booking.status === 'PENDING';
  const canCancel = booking.status === 'PENDING' || booking.status === 'APPROVED';

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
        <p><strong>Time:</strong> {formatTime(booking.startTime)} – {formatTime(booking.endTime)}</p>
        <p><strong>Attendees:</strong> {booking.attendees}</p>
        <p className="truncate"><strong>Purpose:</strong> {booking.purpose}</p>
        {booking.adminNote && (
          <p className="admin-note-snippet">
            <strong>Note:</strong> {booking.adminNote}
          </p>
        )}
      </div>

      {showActions && (
        <div className="card-footer">
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => onViewDetails(booking.id)}
          >
            View
          </button>
          {canEdit && onEdit && (
            <button
              className="btn btn-sm btn-edit"
              onClick={() => onEdit(booking)}
            >
              ✏️ Edit
            </button>
          )}
          {canCancel && onCancel && (
            <button
              className="btn btn-sm btn-danger"
              onClick={() => onCancel(booking.id)}
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingCard;
