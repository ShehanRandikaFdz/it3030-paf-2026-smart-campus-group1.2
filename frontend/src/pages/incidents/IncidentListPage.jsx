import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyIncidents, getAllIncidents } from '../../api/incidentsApi';
import { getCurrentUser } from '../../utils/axiosInstance';
import IncidentCard from '../../components/incidents/IncidentCard';
import './IncidentListPage.css';

const STATUSES = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];

export default function IncidentListPage() {
  const [incidents, setIncidents] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  useEffect(() => {
    fetchIncidents();
  }, [statusFilter]);

  const fetchIncidents = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = currentUser.role === 'ADMIN'
        ? await getAllIncidents(params)
        : await getMyIncidents(params);

      setIncidents(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch incidents');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="incident-list-page">
      <div className="page-header">
        <div>
          <h1>🎫 Incident Tickets</h1>
          <p className="page-subtitle">
            {currentUser.role === 'ADMIN' ? 'All campus incidents' : 'Your reported incidents'}
          </p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/incidents/new')}>
          ➕ Report Incident
        </button>
      </div>

      <div className="filter-bar">
        {STATUSES.map((s) => (
          <button
            key={s}
            className={`filter-btn ${statusFilter === s ? 'active' : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'ALL' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading && <div className="loading-spinner">Loading...</div>}
      {error && <div className="error-message">❌ {error}</div>}

      {!loading && !error && incidents.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <h3>No incidents found</h3>
          <p>No incidents match your current filter.</p>
          <button className="btn-primary" onClick={() => navigate('/incidents/new')}>
            Report an Incident
          </button>
        </div>
      )}

      <div className="incident-grid">
        {incidents.map((incident) => (
          <IncidentCard key={incident.id} incident={incident} />
        ))}
      </div>
    </div>
  );
}
