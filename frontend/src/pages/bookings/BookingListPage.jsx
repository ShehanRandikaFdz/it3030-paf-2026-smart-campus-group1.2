import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyBookings, cancelBooking } from '../../api/bookingsApi';
import BookingCard from '../../components/bookings/BookingCard';
import BookingFormModal from '../../components/bookings/BookingFormModal';
import '../bookings/BookingStyles.css';

/**
 * BookingListPage — User's own bookings with full CRUD actions.
 *
 * CREATE  → "+ New Booking" opens BookingFormModal (create mode)
 * READ    → card list with search + status filter
 * UPDATE  → "✏️ Edit" on PENDING card opens BookingFormModal (edit mode)
 * DELETE  → "Cancel" on PENDING/APPROVED card calls cancelBooking
 */
const BookingListPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null); // null = create, booking = edit
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
    } catch {
      setError('Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const filterBookings = (all, status, search) => {
    let list = all;
    if (status) list = list.filter(b => b.status === status);
    if (search?.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.purpose.toLowerCase().includes(q) ||
        b.resourceName?.toLowerCase().includes(q) ||
        b.userEmail.toLowerCase().includes(q)
      );
    }
    setFilteredBookings(list);
  };

  const handleStatusFilter = (status) => {
    const next = status === statusFilter ? null : status;
    setStatusFilter(next);
    filterBookings(bookings, next, searchTerm);
  };

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearchTerm(q);
    filterBookings(bookings, statusFilter, q);
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await cancelBooking(id);
      flash('success', 'Booking cancelled successfully.');
      loadBookings();
    } catch (err) {
      flash('error', err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  // Open modal in CREATE mode
  const handleNewBooking = () => {
    setEditingBooking(null);
    setShowModal(true);
  };

  // Open modal in EDIT mode
  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
    setShowModal(true);
  };

  const handleModalSuccess = () => {
    setShowModal(false);
    setEditingBooking(null);
    flash('success', editingBooking
      ? 'Booking updated successfully!'
      : 'Booking created! Pending admin review.');
    loadBookings();
  };

  const flash = (type, msg) => {
    if (type === 'success') { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(''), 4000); }
    else { setError(msg); setTimeout(() => setError(''), 5000); }
  };

  const statusCounts = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].reduce((acc, s) => {
    acc[s] = bookings.filter(b => b.status === s).length;
    return acc;
  }, {});

  return (
    <div className="list-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>My Bookings</h1>
          <p>Manage your resource booking requests</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={handleNewBooking}>
          + New Booking
        </button>
      </div>

      {/* Alerts */}
      {error && <div className="alert alert-danger">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      {/* Search */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="🔍 Search by title, resource, purpose..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
          id="booking-search"
        />
      </div>

      {/* Status Filter */}
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
              <span className="count">{statusCounts[status]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="loading">Loading bookings...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="empty-state">
          <p>No bookings found</p>
          <button className="btn btn-primary" onClick={handleNewBooking}>
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
              onEdit={handleEditBooking}
              onCancel={handleCancelBooking}
              showActions
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <BookingFormModal
          onClose={() => { setShowModal(false); setEditingBooking(null); }}
          onSuccess={handleModalSuccess}
          editBooking={editingBooking}
        />
      )}
    </div>
  );
};

export default BookingListPage;
