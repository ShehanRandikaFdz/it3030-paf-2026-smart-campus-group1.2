import React from 'react';
import './IncidentStatusBadge.css';

const STATUS_CONFIG = {
  OPEN: { label: 'Open', className: 'status-open' },
  IN_PROGRESS: { label: 'In Progress', className: 'status-in-progress' },
  RESOLVED: { label: 'Resolved', className: 'status-resolved' },
  CLOSED: { label: 'Closed', className: 'status-closed' },
  REJECTED: { label: 'Rejected', className: 'status-rejected' },
};

export default function IncidentStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, className: '' };
  return (
    <span className={`status-badge ${config.className}`}>
      {config.label}
    </span>
  );
}
