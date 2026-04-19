import React, { useState, useEffect, useCallback } from 'react';
import { getAllBookings } from '../../api/bookingsApi';
import '../../pages/bookings/BookingStyles.css';

/**
 * AvailabilityCalendar — Visual time-slot grid showing booked vs available slots
 * for a chosen resource and date. Allows clicking a slot to auto-fill start/end times.
 *
 * Props:
 *   resourceId     – Long
 *   bookingDate    – "YYYY-MM-DD"
 *   onSlotSelect   – (startTime, endTime) => void   (called when user clicks a free slot)
 *   excludeId      – Long (optional) — booking to exclude (for edit mode)
 */
const AvailabilityCalendar = ({ resourceId, bookingDate, onSlotSelect, excludeId }) => {
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Generate 30-min slots from 07:00 to 21:00
  const slots = [];
  for (let h = 7; h < 21; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  slots.push('21:00');

  const fetchBookedSlots = useCallback(async () => {
    if (!resourceId || !bookingDate) return;
    setLoading(true);
    try {
      const res = await getAllBookings({ resourceId, status: 'APPROVED' });
      const all = res.data?.data || [];
      const filtered = all
        .filter(b => b.bookingDate === bookingDate && b.id !== excludeId)
        .map(b => ({ start: b.startTime, end: b.endTime }));
      setBookedSlots(filtered);
    } catch {
      setBookedSlots([]);
    } finally {
      setLoading(false);
    }
  }, [resourceId, bookingDate, excludeId]);

  useEffect(() => {
    fetchBookedSlots();
  }, [fetchBookedSlots]);

  const isBooked = (slotTime) => {
    return bookedSlots.some(b => slotTime >= b.start && slotTime < b.end);
  };

  const handleSlotClick = (slotTime, idx) => {
    const endIdx = Math.min(idx + 2, slots.length - 1); // default 1-hour slot
    const endTime = slots[endIdx];
    setSelectedSlot(slotTime);
    if (onSlotSelect) {
      onSlotSelect(slotTime, endTime);
    }
  };

  if (!resourceId || !bookingDate) {
    return (
      <div className="calendar-placeholder">
        <span>📅 Select a resource and date to view availability</span>
      </div>
    );
  }

  return (
    <div className="availability-calendar">
      <div className="calendar-header">
        <h4>📅 Time Slot Availability</h4>
        <span className="calendar-date">{new Date(bookingDate + 'T00:00:00').toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        })}</span>
      </div>

      {loading ? (
        <div className="calendar-loading">Checking availability...</div>
      ) : (
        <>
          <div className="calendar-legend">
            <span className="legend-item"><span className="legend-dot available-dot" />Available</span>
            <span className="legend-item"><span className="legend-dot booked-dot" />Booked</span>
            <span className="legend-item"><span className="legend-dot selected-dot" />Selected</span>
          </div>
          <div className="calendar-grid">
            {slots.slice(0, -1).map((slot, idx) => {
              const booked = isBooked(slot);
              const isSelected = selectedSlot === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  className={`slot-btn ${booked ? 'slot-booked' : 'slot-available'} ${isSelected ? 'slot-selected' : ''}`}
                  onClick={() => !booked && handleSlotClick(slot, idx)}
                  disabled={booked}
                  title={booked ? `Booked: ${slot}` : `Click to select ${slot}`}
                >
                  <span className="slot-time">{slot}</span>
                </button>
              );
            })}
          </div>
          {bookedSlots.length === 0 && (
            <p className="calendar-all-free">✅ All slots are currently available for this date.</p>
          )}
        </>
      )}
    </div>
  );
};

export default AvailabilityCalendar;
