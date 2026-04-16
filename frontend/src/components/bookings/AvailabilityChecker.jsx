import React, { useState, useEffect } from 'react';
import { checkAvailability } from '../../api/bookingsApi';
import '../../pages/bookings/BookingStyles.css';

/**
 * AvailabilityChecker — Real-time booking slot availability checker
 */
const AvailabilityChecker = ({ resourceId, bookingDate, startTime, endTime, onAvailabilityChange }) => {
  const [isAvailable, setIsAvailable] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!resourceId || !bookingDate || !startTime || !endTime) {
      setIsAvailable(null);
      return;
    }

    const checkSlot = async () => {
      setIsLoading(true);
      try {
        const response = await checkAvailability(resourceId, bookingDate, startTime, endTime);
        if (response.data.success) {
          setIsAvailable(response.data.data);
          onAvailabilityChange(response.data.data);
        }
      } catch (error) {
        console.error('Error checking availability:', error);
        setIsAvailable(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSlot();
  }, [resourceId, bookingDate, startTime, endTime, onAvailabilityChange]);

  if (isAvailable === null) return null;

  return (
    <div className={`availability-checker ${isAvailable ? 'available' : 'unavailable'}`}>
      {isLoading ? (
        <span>⏳ Checking availability...</span>
      ) : isAvailable ? (
        <span className="status-available">✓ This slot is available</span>
      ) : (
        <span className="status-unavailable">✗ This slot is already booked</span>
      )}
    </div>
  );
};

export default AvailabilityChecker;
