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
import IncidentListPage from './pages/incidents/IncidentListPage';
import IncidentFormPage from './pages/incidents/IncidentFormPage';
import IncidentDetailPage from './pages/incidents/IncidentDetailPage';
import AdminIncidentsPage from './pages/incidents/admin/AdminIncidentsPage';
import UserProfilePage from './pages/UserProfilePage';
import LoginPage from './pages/LoginPage';

import './App.css';

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

          {currentUser?.role === 'ADMIN' && (
            <Link to="/admin/incidents" className="nav-link admin-link">
              🛠️ Admin Panel
            </Link>
          )}
        </div>

        <div className="navbar-user">
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
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        window.location.href = '/login';
        return;
      }

      const userId = session.user.id;
      const email = session.user.email || '';

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('id, email, role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Failed to load user profile:', error.message);
      }

      setAuthData({
        id: userId,
        email: profile?.email || email,
        role: profile?.role || 'USER',
      });

      window.location.href = '/me';
    };

    finishLogin();
  }, []);

  return <div>Signing you in...</div>;
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

  if (loading) {
    return <div>Loading...</div>;
  }

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

            <Route element={<AdminRoute />}>
              <Route path="/admin/incidents" element={<AdminIncidentsPage />} />
            </Route>
          </Route>
        </Routes>
      </div>
    </Router>
  );
}