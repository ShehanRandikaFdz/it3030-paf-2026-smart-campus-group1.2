import React, { useState } from 'react';
import { reviewBooking } from '../../api/bookingsApi';
import '../../pages/bookings/BookingStyles.css';

/**
 * BookingReviewModal — Admin modal for approving/rejecting bookings
 */
const BookingReviewModal = ({ booking, onClose, onReviewComplete }) => {
  const [action, setAction] = useState('APPROVED');
  const [adminNote, setAdminNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await reviewBooking(booking.id, {
        action,
        adminNote
      });

      if (response.data.success) {
        onReviewComplete(response.data.data);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error reviewing booking');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Review Booking</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="booking-info">
            <p><strong>Title:</strong> {booking.title}</p>
            <p><strong>User:</strong> {booking.userEmail}</p>
            <p><strong>Resource:</strong> {booking.resourceName || `Resource ${booking.resourceId}`}</p>
            <p><strong>Date:</strong> {new Date(booking.bookingDate).toLocaleDateString()}</p>
            <p><strong>Time:</strong> {booking.startTime} - {booking.endTime}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Action *</label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="form-control"
              >
                <option value="APPROVED">Approve</option>
                <option value="REJECTED">Reject</option>
              </select>
            </div>

            <div className="form-group">
              <label>Admin Note</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Add a note (required for rejection)"
                className="form-control"
                rows="3"
                maxLength={500}
              />
              <small>{adminNote.length}/500 characters</small>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`btn btn-${action === 'APPROVED' ? 'success' : 'danger'}`}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : `${action}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingReviewModal;
