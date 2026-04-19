import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBooking } from '../../api/bookingsApi';
import { getAllResources } from '../../api/resourcesApi';
import AvailabilityChecker from '../../components/bookings/AvailabilityChecker';
import AvailabilityCalendar from '../../components/bookings/AvailabilityCalendar';
import '../bookings/BookingStyles.css';

/**
 * BookingFormPage — Standalone page to CREATE a new booking.
 * Resources are loaded dynamically from the API (no hardcoded list).
 * Embeds AvailabilityCalendar to help users pick a free slot visually.
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
    attendees: 1,
  });

  const [resources, setResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Fetch ACTIVE resources for the dropdown
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

  // Called when user clicks a slot in AvailabilityCalendar
  const handleSlotSelect = (startTime, endTime) => {
    setFormData(prev => ({ ...prev, startTime, endTime }));
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
      const payload = {
        ...formData,
        resourceId: Number(formData.resourceId),
        attendees: Number(formData.attendees),
      };
      const response = await createBooking(payload);
      if (response.data.success) {
        navigate('/bookings', {
          state: { successMessage: 'Booking submitted! Pending admin review.' },
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
        <div>
          <h1>New Booking Request</h1>
          <p>Request a campus resource for your event or meeting</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/bookings')}>← Back</button>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>

          {/* ── Resource & Details ── */}
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

            <div className="form-group">
              <label htmlFor="title">Booking Title *</label>
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

          {/* ── Booking Details ── */}
          <div className="form-section">
            <h3>Date & Time</h3>

            <div className="form-row">
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
            </div>

            <div className="form-row">
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

            {/* Real-time availability check */}
            {formData.resourceId && formData.bookingDate && formData.startTime && formData.endTime && (
              <AvailabilityChecker
                resourceId={formData.resourceId}
                bookingDate={formData.bookingDate}
                startTime={formData.startTime}
                endTime={formData.endTime}
                onAvailabilityChange={setIsAvailable}
              />
            )}

            {/* Visual slot calendar */}
            {formData.resourceId && formData.bookingDate && (
              <div className="calendar-toggle-row">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowCalendar(v => !v)}
                >
                  {showCalendar ? '🗕 Hide Calendar' : '📅 View Available Slots'}
                </button>
              </div>
            )}

            {showCalendar && formData.resourceId && formData.bookingDate && (
              <AvailabilityCalendar
                resourceId={formData.resourceId}
                bookingDate={formData.bookingDate}
                onSlotSelect={handleSlotSelect}
              />
            )}
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
              {isLoading ? 'Submitting...' : '📤 Submit Booking Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingFormPage;
