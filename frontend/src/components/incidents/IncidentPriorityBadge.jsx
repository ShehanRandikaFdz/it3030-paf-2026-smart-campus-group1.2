import React from 'react';
import './IncidentPriorityBadge.css';

const PRIORITY_CONFIG = {
  LOW: { label: 'Low', className: 'priority-low' },
  MEDIUM: { label: 'Medium', className: 'priority-medium' },
  HIGH: { label: 'High', className: 'priority-high' },
  CRITICAL: { label: 'Critical', className: 'priority-critical' },
};

export default function IncidentPriorityBadge({ priority }) {
  const config = PRIORITY_CONFIG[priority] || { label: priority, className: '' };
  return (
    <span className={`priority-badge ${config.className}`}>
      {config.label}
    </span>
  );
}
