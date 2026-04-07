import React from 'react';
import { useNavigate } from 'react-router-dom';
import IncidentStatusBadge from './IncidentStatusBadge';
import IncidentPriorityBadge from './IncidentPriorityBadge';
import './IncidentCard.css';

export default function IncidentCard({ incident }) {
  const navigate = useNavigate();

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="incident-card" onClick={() => navigate(`/incidents/${incident.id}`)}>
      <div className="incident-card-header">
        <div className="incident-card-badges">
          <IncidentStatusBadge status={incident.status} />
          <IncidentPriorityBadge priority={incident.priority} />
        </div>
        <span className="incident-card-category">{incident.category?.replace('_', ' ')}</span>
      </div>
      <h3 className="incident-card-title">{incident.title}</h3>
      <p className="incident-card-location">📍 {incident.location}</p>
      <p className="incident-card-description">{incident.description?.substring(0, 120)}...</p>
      <div className="incident-card-footer">
        <span className="incident-card-time">🕐 {timeAgo(incident.createdAt)}</span>
        <div className="incident-card-stats">
          {incident.attachmentsCount > 0 && (
            <span className="incident-card-stat">📎 {incident.attachmentsCount}</span>
          )}
          {incident.commentsCount > 0 && (
            <span className="incident-card-stat">💬 {incident.commentsCount}</span>
          )}
        </div>
      </div>
    </div>
  );
}
