import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyBookings, cancelBooking } from '../../api/bookingsApi';
import BookingCard from '../../components/bookings/BookingCard';
import BookingStatusBadge from '../../components/bookings/BookingStatusBadge';
import BookingFormModal from '../../components/bookings/BookingFormModal';
import '../bookings/BookingStyles.css';

/**
 * BookingListPage — User's own bookings with status filters and actions
 */
const BookingListPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      const response = await getMyBookings({});
      if (response.data.success) {
        setBookings(response.data.data);
        filterBookings(response.data.data, statusFilter, searchTerm);
      }
    } catch (err) {
      setError('Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const filterBookings = (allBookings, status, search) => {
    let filtered = allBookings;
    
    // Apply status filter
    if (status) {
      filtered = filtered.filter(b => b.status === status);
    }
    
    // Apply search filter
    if (search && search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(b => 
        b.title.toLowerCase().includes(searchLower) ||
        b.purpose.toLowerCase().includes(searchLower) ||
        b.resourceName?.toLowerCase().includes(searchLower) ||
        b.userEmail.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredBookings(filtered);
  };

  const handleStatusFilter = (status) => {
    const newStatus = status === statusFilter ? null : status;
    setStatusFilter(newStatus);
    filterBookings(bookings, newStatus, searchTerm);
  };

  const handleSearch = (e) => {
    const search = e.target.value;
    setSearchTerm(search);
    filterBookings(bookings, statusFilter, search);
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await cancelBooking(id);
      setSuccessMessage('Booking cancelled successfully');
      loadBookings();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const handleBookingCreated = () => {
    setSuccessMessage('Booking created successfully! It is now pending admin review.');
    setShowFormModal(false);
    loadBookings();
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="list-page">
      <div className="page-header">
        <div>
          <h1>My Bookings</h1>
          <p>Manage your resource booking requests</p>
        </div>
        <button 
          className="btn btn-primary btn-lg"
          onClick={() => setShowFormModal(true)}
        >
          + New Booking
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      <div className="search-bar">
        <input
          type="text"
          placeholder="🔍 Search bookings by title, resource, or email..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      <div className="filter-bar">
        <h3>Filter by Status:</h3>
        <div className="filter-buttons">
          {['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(status => (
            <button
              key={status}
              className={`btn btn-sm ${statusFilter === status ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => handleStatusFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading bookings...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="empty-state">
          <p>No bookings found</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowFormModal(true)}
          >
            Create your first booking
          </button>
        </div>
      ) : (
        <div className="cards-grid">
          {filteredBookings.map(booking => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onViewDetails={(id) => navigate(`/bookings/${id}`)}
              onCancel={handleCancelBooking}
              showActions={true}
            />
          ))}
        </div>
      )}

      {showFormModal && (
        <BookingFormModal
          onClose={() => setShowFormModal(false)}
          onSuccess={handleBookingCreated}
        />
      )}
    </div>
  );
};

export default BookingListPage;
