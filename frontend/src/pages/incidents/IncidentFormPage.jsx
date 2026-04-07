import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createIncident, uploadAttachments } from '../../api/incidentsApi';
import AttachmentUploader from '../../components/incidents/AttachmentUploader';
import './IncidentFormPage.css';

const CATEGORIES = [
  { value: 'ELECTRICAL', label: '⚡ Electrical' },
  { value: 'PLUMBING', label: '🔧 Plumbing' },
  { value: 'EQUIPMENT_FAULT', label: '🖥️ Equipment Fault' },
  { value: 'NETWORK', label: '📡 Network' },
  { value: 'CLEANING', label: '🧹 Cleaning' },
  { value: 'SAFETY', label: '⚠️ Safety' },
  { value: 'OTHER', label: '📋 Other' },
];

const PRIORITIES = [
  { value: 'LOW', label: 'Low', color: '#6b7280' },
  { value: 'MEDIUM', label: 'Medium', color: '#3b82f6' },
  { value: 'HIGH', label: 'High', color: '#f59e0b' },
  { value: 'CRITICAL', label: 'Critical', color: '#ef4444' },
];

export default function IncidentFormPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState({
    title: '',
    location: '',
    description: '',
    category: '',
    priority: 'MEDIUM',
    contactPhone: '',
    resourceId: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = { ...form };
      if (!payload.resourceId) delete payload.resourceId;
      if (!payload.contactPhone) delete payload.contactPhone;
      else payload.resourceId = parseInt(payload.resourceId);

      const res = await createIncident(payload);
      const incidentId = res.data.data.id;

      // Upload attachments if any
      if (files.length > 0) {
        await uploadAttachments(incidentId, files);
      }

      navigate(`/incidents/${incidentId}`);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors
        ? JSON.stringify(err.response.data.errors)
        : 'Failed to create incident';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="incident-form-page">
      <div className="form-header">
        <button className="btn-back" onClick={() => navigate('/incidents')}>← Back</button>
        <h1>📝 Report an Incident</h1>
        <p className="form-subtitle">Fill in the details to report a campus incident</p>
      </div>

      {error && <div className="form-error">❌ {error}</div>}

      <form onSubmit={handleSubmit} className="incident-form">
        <div className="form-section">
          <h3>Incident Details</h3>

          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              placeholder="Brief summary of the issue"
              maxLength={150}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select id="category" name="category" value={form.category} onChange={handleChange} required>
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Priority *</label>
              <div className="priority-selector">
                {PRIORITIES.map((p) => (
                  <label
                    key={p.value}
                    className={`priority-option ${form.priority === p.value ? 'selected' : ''}`}
                    style={{ '--priority-color': p.color }}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value={p.value}
                      checked={form.priority === p.value}
                      onChange={handleChange}
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="location">Location *</label>
            <input
              id="location"
              name="location"
              type="text"
              value={form.location}
              onChange={handleChange}
              placeholder="e.g., Lab B202, Building A 3rd Floor"
              maxLength={150}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description * <span className="hint">(min 20 characters)</span></label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the issue in detail..."
              rows={5}
              minLength={20}
              required
            />
            <span className="char-count">{form.description.length} characters</span>
          </div>
        </div>

        <div className="form-section">
          <h3>Additional Information</h3>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contactPhone">Contact Phone</label>
              <input
                id="contactPhone"
                name="contactPhone"
                type="tel"
                value={form.contactPhone}
                onChange={handleChange}
                placeholder="+94771234567"
                maxLength={20}
              />
            </div>

            <div className="form-group">
              <label htmlFor="resourceId">Resource ID (optional)</label>
              <input
                id="resourceId"
                name="resourceId"
                type="number"
                value={form.resourceId}
                onChange={handleChange}
                placeholder="Associated resource"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Attachments</h3>
          <AttachmentUploader files={files} setFiles={setFiles} />
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/incidents')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : '🚀 Submit Incident'}
          </button>
        </div>
      </form>
    </div>
  );
}
