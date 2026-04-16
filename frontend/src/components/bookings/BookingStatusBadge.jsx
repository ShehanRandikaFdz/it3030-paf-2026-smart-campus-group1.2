import React from 'react';
import '../../pages/bookings/BookingStyles.css';

/**
 * BookingStatusBadge — Display booking status with appropriate styling
 */
const BookingStatusBadge = ({ status }) => {
  const getStatusClass = () => {
    switch (status) {
      case 'PENDING':
        return 'status-pending';
      case 'APPROVED':
        return 'status-approved';
      case 'REJECTED':
        return 'status-rejected';
      case 'CANCELLED':
        return 'status-cancelled';
      default:
        return 'status-default';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'PENDING':
        return '⏳ Pending';
      case 'APPROVED':
        return '✓ Approved';
      case 'REJECTED':
        return '✗ Rejected';
      case 'CANCELLED':
        return '✗ Cancelled';
      default:
        return status;
    }
  };

  return (
    <span className={`badge ${getStatusClass()}`}>
      {getStatusLabel()}
    </span>
  );
};

export default BookingStatusBadge;
