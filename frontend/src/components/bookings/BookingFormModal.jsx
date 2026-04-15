import React, { useState } from 'react';
import { createBooking } from '../../api/bookingsApi';
import AvailabilityChecker from './AvailabilityChecker';
import { checkAvailability } from '../../api/bookingsApi';

/**
 * BookingFormModal — Modal popup for creating a new booking
 */
const BookingFormModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    resourceId: '',
    title: '',
    purpose: '',
    bookingDate: '',
    startTime: '',
    endTime: '',
    attendees: 1
  });
  const [isAvailable, setIsAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
      const response = await createBooking(formData);
      if (response.data.success) {
        onSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setIsLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Booking Request</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="resourceId">Resource *</label>
            <select
              id="resourceId"
              name="resourceId"
              value={formData.resourceId}
              onChange={handleInputChange}
              className="form-control"
              required
            >
              <option value="">Select a resource...</option>
              <option value="1">Lab A101</option>
              <option value="2">Lab B202</option>
              <option value="3">Lecture Hall C101</option>
              <option value="4">Lecture Hall D201</option>
              <option value="5">Meeting Room E101</option>
              <option value="6">Meeting Room E102</option>
              <option value="7">Portable Projector #1</option>
              <option value="9">Conference Hall F001</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
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

          <div className="form-group">
            <label htmlFor="purpose">Purpose *</label>
            <textarea
              id="purpose"
              name="purpose"
              value={formData.purpose}
              onChange={handleInputChange}
              className="form-control"
              placeholder="Describe the purpose..."
              rows="2"
              maxLength={1000}
              required
            />
          </div>

          <div className="form-row-compact">
            <div className="form-group">
              <label htmlFor="bookingDate">Date *</label>
              <input
                id="bookingDate"
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
              <label htmlFor="startTime">Start *</label>
              <input
                id="startTime"
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="endTime">End *</label>
              <input
                id="endTime"
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className="form-control"
                required
              />
            </div>
          </div>

          {formData.resourceId && formData.bookingDate && formData.startTime && formData.endTime && (
            <AvailabilityChecker
              resourceId={formData.resourceId}
              bookingDate={formData.bookingDate}
              startTime={formData.startTime}
              endTime={formData.endTime}
              onAvailabilityChange={setIsAvailable}
            />
          )}

          <div className="form-group">
            <label htmlFor="attendees">Attendees *</label>
            <input
              id="attendees"
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

          {error && <div className="alert alert-danger">{error}</div>}

          <div className="modal-footer-compact">
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
              className="btn btn-primary"
              disabled={isLoading || !isAvailable}
            >
              {isLoading ? 'Creating...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingFormModal;
