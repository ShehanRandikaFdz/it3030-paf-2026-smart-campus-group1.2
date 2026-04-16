import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { getCurrentUser, setCurrentRole } from './utils/axiosInstance';
import IncidentListPage from './pages/incidents/IncidentListPage';
import IncidentFormPage from './pages/incidents/IncidentFormPage';
import IncidentDetailPage from './pages/incidents/IncidentDetailPage';
import AdminIncidentsPage from './pages/incidents/admin/AdminIncidentsPage';
import BookingListPage from './pages/bookings/BookingListPage';
import BookingDetailPage from './pages/bookings/BookingDetailPage';
import AdminBookingsPage from './pages/bookings/admin/AdminBookingsPage';
import './App.css';
import './pages/bookings/BookingStyles.css';

function Navbar() {
  const currentUser = getCurrentUser();
  const [role, setRole] = React.useState(currentUser.role);

  const handleRoleChange = (newRole) => {
    setCurrentRole(newRole);
    setRole(newRole);
    window.location.reload();
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🏫</span>
          <span className="brand-text">Smart Campus</span>
        </Link>
        <div className="navbar-links">
          <Link to="/incidents" className="nav-link">🎫 My Tickets</Link>
          <Link to="/incidents/new" className="nav-link">➕ Report Incident</Link>
          <Link to="/bookings" className="nav-link">📅 My Bookings</Link>
          {role === 'ADMIN' && (
            <>
              <Link to="/admin/incidents" className="nav-link admin-link">🛠️ Admin Tickets</Link>
              <Link to="/admin/bookings" className="nav-link admin-link">📋 Admin Bookings</Link>
            </>
          )}
        </div>
        <div className="navbar-user">
          <span className="user-email">{currentUser.email}</span>
          <select
            className="role-switcher"
            value={role}
            onChange={(e) => handleRoleChange(e.target.value)}
          >
            <option value="USER">👤 User</option>
            <option value="ADMIN">🔑 Admin</option>
            <option value="TECHNICIAN">🔧 Technician</option>
          </select>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/incidents" replace />} />
            <Route path="/incidents" element={<IncidentListPage />} />
            <Route path="/incidents/new" element={<IncidentFormPage />} />
            <Route path="/incidents/:id" element={<IncidentDetailPage />} />
            <Route path="/admin/incidents" element={<AdminIncidentsPage />} />
            <Route path="/bookings" element={<BookingListPage />} />
            <Route path="/bookings/:id" element={<BookingDetailPage />} />
            <Route path="/admin/bookings" element={<AdminBookingsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
