import React, { useState, useEffect } from 'react';
import { getAllIncidents, updateIncidentStatus, assignTechnician, deleteIncident } from '../../../api/incidentsApi';
import IncidentStatusBadge from '../../../components/incidents/IncidentStatusBadge';
import IncidentPriorityBadge from '../../../components/incidents/IncidentPriorityBadge';
import './AdminIncidentsPage.css';

const STATUSES = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];

export default function AdminIncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionModal, setActionModal] = useState(null); // { type, incident }

  useEffect(() => { fetchIncidents(); }, [statusFilter]);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await getAllIncidents(params);
      setIncidents(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load incidents');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, data) => {
    try {
      await updateIncidentStatus(id, data);
      setActionModal(null);
      await fetchIncidents();
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAssign = async (id, data) => {
    try {
      await assignTechnician(id, data);
      setActionModal(null);
      await fetchIncidents();
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this incident permanently?')) return;
    try {
      await deleteIncident(id);
      await fetchIncidents();
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="admin-incidents-page">
      <div className="page-header">
        <h1>🛠️ Admin — Incident Management</h1>
        <p className="page-subtitle">Manage all campus incident tickets</p>
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

      {!loading && (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Location</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Reporter</th>
                <th>Assigned To</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc) => (
                <tr key={inc.id}>
                  <td className="cell-id">#{inc.id}</td>
                  <td className="cell-title">
                    <a href={`/incidents/${inc.id}`}>{inc.title}</a>
                  </td>
                  <td>{inc.location}</td>
                  <td className="cell-category">{inc.category?.replace('_', ' ')}</td>
                  <td><IncidentPriorityBadge priority={inc.priority} /></td>
                  <td><IncidentStatusBadge status={inc.status} /></td>
                  <td className="cell-email">{inc.reporterEmail}</td>
                  <td className="cell-email">{inc.assigneeEmail || '—'}</td>
                  <td>
                    <div className="action-buttons">
                      {inc.status === 'OPEN' && (
                        <button
                          className="action-btn assign"
                          onClick={() => setActionModal({ type: 'assign', incident: inc })}
                        >
                          Assign
                        </button>
                      )}
                      {['OPEN', 'IN_PROGRESS', 'RESOLVED'].includes(inc.status) && (
                        <button
                          className="action-btn status"
                          onClick={() => setActionModal({ type: 'status', incident: inc })}
                        >
                          Status
                        </button>
                      )}
                      <button className="action-btn delete" onClick={() => handleDelete(inc.id)}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {incidents.length === 0 && (
                <tr><td colSpan={9} className="no-data">No incidents found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <ActionModal
          type={actionModal.type}
          incident={actionModal.incident}
          onClose={() => setActionModal(null)}
          onStatusUpdate={handleStatusUpdate}
          onAssign={handleAssign}
        />
      )}
    </div>
  );
}

function ActionModal({ type, incident, onClose, onStatusUpdate, onAssign }) {
  const [status, setStatus] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [techId, setTechId] = useState('22222222-2222-2222-2222-222222222222');
  const [techEmail, setTechEmail] = useState('tech1@campus.lk');

  const getAvailableStatuses = () => {
    switch (incident.status) {
      case 'OPEN': return ['IN_PROGRESS', 'REJECTED'];
      case 'IN_PROGRESS': return ['RESOLVED', 'REJECTED'];
      case 'RESOLVED': return ['CLOSED'];
      default: return [];
    }
  };

  const handleSubmitStatus = () => {
    const data = { status };
    if (status === 'RESOLVED') data.resolutionNotes = resolutionNotes;
    if (status === 'REJECTED') data.rejectionReason = rejectionReason;
    onStatusUpdate(incident.id, data);
  };

  const handleSubmitAssign = () => {
    onAssign(incident.id, { technicianId: techId, technicianEmail: techEmail });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{type === 'assign' ? '👷 Assign Technician' : '📝 Update Status'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <p className="modal-incident-title">Ticket #{incident.id}: {incident.title}</p>

        {type === 'status' && (
          <div className="modal-body">
            <label>New Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Select status</option>
              {getAvailableStatuses().map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>

            {status === 'RESOLVED' && (
              <div className="modal-field">
                <label>Resolution Notes *</label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe how the issue was resolved..."
                  rows={3}
                />
              </div>
            )}
            {status === 'REJECTED' && (
              <div className="modal-field">
                <label>Rejection Reason *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Reason for rejection..."
                  rows={3}
                />
              </div>
            )}

            <button
              className="btn-primary"
              onClick={handleSubmitStatus}
              disabled={!status || (status === 'RESOLVED' && !resolutionNotes) || (status === 'REJECTED' && !rejectionReason)}
            >
              Update Status
            </button>
          </div>
        )}

        {type === 'assign' && (
          <div className="modal-body">
            <div className="modal-field">
              <label>Technician ID</label>
              <input value={techId} onChange={(e) => setTechId(e.target.value)} />
            </div>
            <div className="modal-field">
              <label>Technician Email</label>
              <input value={techEmail} onChange={(e) => setTechEmail(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={handleSubmitAssign} disabled={!techId || !techEmail}>
              Assign Technician
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
