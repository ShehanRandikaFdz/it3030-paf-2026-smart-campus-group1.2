import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBookingById, cancelBooking } from '../../api/bookingsApi';
import BookingStatusBadge from '../../components/bookings/BookingStatusBadge';
import BookingFormModal from '../../components/bookings/BookingFormModal';
import '../bookings/BookingStyles.css';

/**
 * BookingDetailPage — Full view of a single booking with:
 *   READ   – all booking fields
 *   UPDATE – Edit button (PENDING only) opens BookingFormModal in edit mode
 *   CANCEL – Cancel button (PENDING / APPROVED)
 */
const BookingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadBooking();
  }, [id]);

  const loadBooking = async () => {
    try {
      const response = await getBookingById(id);
      if (response.data.success) setBooking(response.data.data);
    } catch {
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

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSuccessMessage('Booking updated successfully!');
    loadBooking();
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

  const formatTime = (time) =>
    new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit',
    });

  const formatDateTime = (dt) => (dt ? new Date(dt).toLocaleString() : 'N/A');

  if (isLoading) return <div className="detail-page"><div className="loading">Loading booking...</div></div>;

  if (!booking) return (
    <div className="detail-page">
      <div className="error-state">
        <p>Booking not found</p>
        <button className="btn btn-primary" onClick={() => navigate('/bookings')}>Back to Bookings</button>
      </div>
    </div>
  );

  const canEdit   = booking.status === 'PENDING';
  const canCancel = booking.status === 'PENDING' || booking.status === 'APPROVED';

  return (
    <div className="detail-page">
      {/* Header */}
      <div className="detail-header">
        <div className="header-content">
          <h1>{booking.title}</h1>
          <BookingStatusBadge status={booking.status} />
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/bookings')}>← Back</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      {/* Detail Grid */}
      <div className="detail-grid">
        {/* Booking Information */}
        <div className="detail-section">
          <h3>Booking Information</h3>
          <div className="detail-item">
            <label>Resource</label>
            <span>{booking.resourceName || `Resource ${booking.resourceId}`}</span>
          </div>
          <div className="detail-item">
            <label>Date</label>
            <span>{formatDate(booking.bookingDate)}</span>
          </div>
          <div className="detail-item">
            <label>Time</label>
            <span>{formatTime(booking.startTime)} – {formatTime(booking.endTime)}</span>
          </div>
          <div className="detail-item">
            <label>Attendees</label>
            <span>{booking.attendees}</span>
          </div>
          <div className="detail-item">
            <label>Purpose</label>
            <span className="pre-wrap">{booking.purpose}</span>
          </div>
        </div>

        {/* User & Status */}
        <div className="detail-section">
          <h3>Booking Status</h3>
          <div className="detail-item">
            <label>Requested By</label>
            <span>{booking.userEmail}</span>
          </div>
          <div className="detail-item">
            <label>Status</label>
            <span><BookingStatusBadge status={booking.status} /></span>
          </div>
          {booking.adminNote && (
            <div className="detail-item">
              <label>Admin Note</label>
              <span className="pre-wrap admin-note-box">{booking.adminNote}</span>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="detail-section">
          <h3>Booking Timeline</h3>
          <div className="detail-item">
            <label>Created</label>
            <span>{formatDateTime(booking.createdAt)}</span>
          </div>
          <div className="detail-item">
            <label>Last Updated</label>
            <span>{formatDateTime(booking.updatedAt)}</span>
          </div>
          {booking.reviewedAt && (
            <>
              <div className="detail-item">
                <label>Reviewed At</label>
                <span>{formatDateTime(booking.reviewedAt)}</span>
              </div>
              <div className="detail-item">
                <label>Reviewed By (Admin ID)</label>
                <span className="mono">{booking.reviewedBy || 'N/A'}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="detail-actions">
        {canEdit && (
          <button className="btn btn-edit" onClick={() => setShowEditModal(true)}>
            ✏️ Edit Booking
          </button>
        )}
        {canCancel && (
          <button className="btn btn-danger" onClick={handleCancel} disabled={isCancelling}>
            {isCancelling ? 'Cancelling...' : '🚫 Cancel Booking'}
          </button>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <BookingFormModal
          editBooking={booking}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default BookingDetailPage;
