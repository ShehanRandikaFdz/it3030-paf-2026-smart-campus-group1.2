import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  Outlet,
} from 'react-router-dom';
import {
  getCurrentUser,
  setAuthData,
  clearAuthData,
  signInWithGoogle,
  signOut,
} from './utils/axiosInstance';
import { supabase } from './utils/supabase';

import NotificationBell from './components/notifications/NotificationBell';

import IncidentListPage from './pages/incidents/IncidentListPage';
import IncidentFormPage from './pages/incidents/IncidentFormPage';
import IncidentDetailPage from './pages/incidents/IncidentDetailPage';
import AdminIncidentsPage from './pages/incidents/admin/AdminIncidentsPage';
import UserProfilePage from './pages/UserProfilePage';
import LoginPage from './pages/LoginPage';
import ResourceListPage from './pages/facilities/ResourceListPage';
import ResourceDetailPage from './pages/facilities/ResourceDetailPage';
import ResourceManagePage from './pages/facilities/admin/ResourceManagePage';
import ResourceFormPage from './pages/facilities/admin/ResourceFormPage';
import BookingListPage from './pages/bookings/BookingListPage';
import BookingFormPage from './pages/bookings/BookingFormPage';
import BookingDetailPage from './pages/bookings/BookingDetailPage';
import AdminBookingsPage from './pages/bookings/admin/AdminBookingsPage';
import './components/notifications/Notifications.css';
import './App.css';
import './pages/bookings/BookingStyles.css';
import NotificationsPage from './pages/notifications/NotificationsPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import UserManagePage from './pages/admin/UserManagePage';

function Navbar() {
  const currentUser = getCurrentUser();

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🏫</span>
          <span className="brand-text">Smart Campus</span>
        </Link>

        <div className="navbar-links">
          <Link to="/me" className="nav-link">👤 Profile</Link>
          <Link to="/incidents" className="nav-link">🎫 My Tickets</Link>
          <Link to="/incidents/new" className="nav-link">➕ Report</Link>
          <Link to="/resources" className="nav-link">🏢 Facilities</Link>
          <Link to="/bookings" className="nav-link">📅 My Bookings</Link>
          <Link to="/bookings/new" className="nav-link">📝 New Booking</Link>

          {currentUser?.role === 'ADMIN' && (
            <>
              <Link to="/admin/incidents" className="nav-link admin-link">🛠️ Incidents Admin</Link>
              <Link to="/admin/resources" className="nav-link admin-link">⚙️ Facilities Admin</Link>
              <Link to="/admin/bookings" className="nav-link admin-link">📋 Admin Bookings</Link>
              <Link to="/admin/users" className="nav-link admin-link">👥 User Management</Link>
            </>
          )}
        </div>

        <div className="navbar-user">
          <NotificationBell />
          <span className="user-email">{currentUser?.email || ''}</span>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

function AuthCallbackPage() {
  React.useEffect(() => {
    const finishLogin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { window.location.href = '/login'; return; }

      const userId = session.user.id;
      const email = session.user.email || '';
      const fullName = session.user.user_metadata?.full_name || '';

      // Save/update user_profiles for Google users
      await supabase.from('user_profiles').upsert({
        id: userId,
        email: email,
        full_name: fullName,
        role: 'USER',
      }, { onConflict: 'id', ignoreDuplicates: true });

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, email, role')
        .eq('id', userId)
        .single();

      setAuthData({
        id: userId,
        email: profile?.email || email,
        role: profile?.role || 'USER',
      });

      window.location.href = '/me';
    };

    finishLogin();
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100%',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: '1rem',
        color: '#f4f4f5',
        backgroundColor: '#0f0f17',
        margin: 0,
        padding: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(139, 92, 246, 0.3)',
            borderTopColor: '#a78bfa',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <span>Signing you in...</span>
        <style>
          {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
        </style>
      </div>
    </div>
  );
}

function AuthGate() {
  const [loading, setLoading] = React.useState(true);
  const [authenticated, setAuthenticated] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    const syncAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          const userId = session.user.id;
          const email = session.user.email || '';

          let role = 'USER';

          try {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('role, email')
              .eq('id', userId)
              .single();

            role = profile?.role || 'USER';
          } catch (err) {
            console.error("Profile fetch failed:", err);
          }

          setAuthData({
            id: userId,
            email: email,
            role: role,
          });

          setAuthenticated(true);
        } else {
          clearAuthData();
          setAuthenticated(false);
        }
      } catch (err) {
        console.error("Auth error:", err);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    syncAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuthenticated(true);
      } else {
        clearAuthData();
        setAuthenticated(false);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Navbar />
      <main className="app-main">
        <Outlet />
      </main>
    </>
  );
}

function AdminRoute() {
  const currentUser = getCurrentUser();

  if (currentUser?.role !== 'ADMIN') {
    return <Navigate to="/incidents" replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          <Route element={<AuthGate />}>
            <Route path="/" element={<Navigate to="/me" replace />} />
            <Route path="/me" element={<UserProfilePage />} />
            <Route path="/incidents" element={<IncidentListPage />} />
            <Route path="/incidents/new" element={<IncidentFormPage />} />
            <Route path="/incidents/:id" element={<IncidentDetailPage />} />
            <Route path="/resources" element={<ResourceListPage />} />
            <Route path="/resources/:id" element={<ResourceDetailPage />} />
            <Route path="/bookings" element={<BookingListPage />} />
            <Route path="/bookings/new" element={<BookingFormPage />} />
            <Route path="/bookings/:id" element={<BookingDetailPage />} />

            <Route element={<AdminRoute />}>
              <Route path="/admin/incidents" element={<AdminIncidentsPage />} />
              <Route path="/admin/resources" element={<ResourceManagePage />} />
              <Route path="/admin/resources/new" element={<ResourceFormPage />} />
              <Route path="/admin/resources/:id/edit" element={<ResourceFormPage />} />
              <Route path="/admin/bookings" element={<AdminBookingsPage />} />
              <Route path="/admin/users" element={<UserManagePage />} />
            </Route>
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}
