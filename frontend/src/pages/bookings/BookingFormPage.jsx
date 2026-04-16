import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBooking } from '../../api/bookingsApi';
import AvailabilityChecker from '../../components/bookings/AvailabilityChecker';
import '../bookings/BookingStyles.css';

/**
 * BookingFormPage — Form to create a new booking request
 */
const BookingFormPage = () => {
  const navigate = useNavigate();
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
  const [submitError, setSubmitError] = useState('');

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
      setSubmitError('Selected time slot is not available. Please choose a different time.');
      return;
    }

    setIsLoading(true);
    setSubmitError('');

    try {
      const response = await createBooking(formData);
      if (response.data.success) {
        navigate('/bookings', { 
          state: { successMessage: 'Booking created successfully! It is now pending admin review.' }
        });
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setIsLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="form-page">
      <div className="page-header">
        <h1>Create New Booking</h1>
        <p>Request a resource for your upcoming event or meeting</p>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Resource Details</h3>
            
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
                placeholder="Describe the purpose of your booking..."
                rows="3"
                maxLength={1000}
                required
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Booking Details</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="bookingDate">Booking Date *</label>
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
                <label htmlFor="startTime">Start Time *</label>
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
                <label htmlFor="endTime">End Time *</label>
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
              <label htmlFor="attendees">Number of Attendees *</label>
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
          </div>

          {submitError && <div className="alert alert-danger">{submitError}</div>}

          <div className="form-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/bookings')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isLoading || !isAvailable}
            >
              {isLoading ? 'Creating...' : 'Submit Booking Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingFormPage;
