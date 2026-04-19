import React, { useState, useEffect } from 'react';
import { createBooking, updateBooking } from '../../api/bookingsApi';
import { getAllResources } from '../../api/resourcesApi';
import AvailabilityChecker from './AvailabilityChecker';
import AvailabilityCalendar from './AvailabilityCalendar';

/**
 * BookingFormModal — Modal for CREATING or EDITING a booking.
 *
 * Props:
 *   onClose      – () => void
 *   onSuccess    – () => void
 *   editBooking  – (optional) existing booking object to pre-populate for edit mode
 */
const BookingFormModal = ({ onClose, onSuccess, editBooking }) => {
  const isEditMode = !!editBooking;

  const [formData, setFormData] = useState({
    resourceId: editBooking?.resourceId || '',
    title: editBooking?.title || '',
    purpose: editBooking?.purpose || '',
    bookingDate: editBooking?.bookingDate || '',
    startTime: editBooking?.startTime || '',
    endTime: editBooking?.endTime || '',
    attendees: editBooking?.attendees || 1,
  });

  const [resources, setResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Load active resources for the dropdown
  useEffect(() => {
    getAllResources({ status: 'ACTIVE', size: 100 })
      .then(res => {
        const data = res.data?.data?.content || res.data?.data || [];
        setResources(Array.isArray(data) ? data : []);
      })
      .catch(() => setResources([]))
      .finally(() => setResourcesLoading(false));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Called by AvailabilityCalendar when user clicks a slot
  const handleSlotSelect = (startTime, endTime) => {
    setFormData(prev => ({ ...prev, startTime, endTime }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAvailable) {
      setError('Selected time slot is not available. Please choose a different time.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        resourceId: Number(formData.resourceId),
        attendees: Number(formData.attendees),
      };

      if (isEditMode) {
        await updateBooking(editBooking.id, payload);
      } else {
        await createBooking(payload);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} booking`);
    } finally {
      setIsLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-card-wide" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>{isEditMode ? '✏️ Edit Booking' : '📋 New Booking Request'}</h2>
          <button className="close-btn" onClick={onClose} type="button">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Resource */}
          <div className="form-group">
            <label htmlFor="modal-resourceId">Resource *</label>
            <select
              id="modal-resourceId"
              name="resourceId"
              value={formData.resourceId}
              onChange={handleInputChange}
              className="form-control"
              required
            >
              <option value="">Select a resource...</option>
              {resourcesLoading ? (
                <option disabled>Loading resources...</option>
              ) : (
                resources.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} — {r.location} {r.capacity ? `(cap: ${r.capacity})` : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Title */}
          <div className="form-group">
            <label htmlFor="modal-title">Title *</label>
            <input
              id="modal-title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="form-control"
              placeholder="e.g., PAF Group Meeting"
              maxLength={150}
              required
            />
          </div>

          {/* Purpose */}
          <div className="form-group">
            <label htmlFor="modal-purpose">Purpose *</label>
            <textarea
              id="modal-purpose"
              name="purpose"
              value={formData.purpose}
              onChange={handleInputChange}
              className="form-control"
              placeholder="Describe the purpose of your booking..."
              rows="2"
              maxLength={1000}
              required
            />
          </div>

          {/* Date + Attendees row */}
          <div className="form-row-compact">
            <div className="form-group">
              <label htmlFor="modal-bookingDate">Date *</label>
              <input
                id="modal-bookingDate"
                type="date"
                name="bookingDate"
                value={formData.bookingDate}
                onChange={handleInputChange}
                className="form-control"
                min={today}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="modal-attendees">Attendees *</label>
              <input
                id="modal-attendees"
                type="number"
                name="attendees"
                value={formData.attendees}
                onChange={handleInputChange}
                className="form-control"
                min="1"
                max="500"
                required
              />
            </div>
          </div>

          {/* Time row */}
          <div className="form-row-compact">
            <div className="form-group">
              <label htmlFor="modal-startTime">Start Time *</label>
              <input
                id="modal-startTime"
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className="form-control"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="modal-endTime">End Time *</label>
              <input
                id="modal-endTime"
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className="form-control"
                required
              />
            </div>
          </div>

          {/* Availability real-time check */}
          {formData.resourceId && formData.bookingDate && formData.startTime && formData.endTime && (
            <AvailabilityChecker
              resourceId={formData.resourceId}
              bookingDate={formData.bookingDate}
              startTime={formData.startTime}
              endTime={formData.endTime}
              onAvailabilityChange={setIsAvailable}
            />
          )}

          {/* Visual Calendar toggle */}
          {formData.resourceId && formData.bookingDate && (
            <div className="calendar-toggle-row">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setShowCalendar(v => !v)}
              >
                {showCalendar ? '🗕 Hide Calendar' : '📅 View Slot Calendar'}
              </button>
            </div>
          )}

          {showCalendar && formData.resourceId && formData.bookingDate && (
            <AvailabilityCalendar
              resourceId={formData.resourceId}
              bookingDate={formData.bookingDate}
              onSlotSelect={handleSlotSelect}
              excludeId={isEditMode ? editBooking.id : null}
            />
          )}

          {error && <div className="alert alert-danger">{error}</div>}

          <div className="modal-footer-compact">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !isAvailable}
            >
              {isLoading
                ? (isEditMode ? 'Saving...' : 'Creating...')
                : (isEditMode ? '💾 Save Changes' : '📤 Submit Request')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingFormModal;
