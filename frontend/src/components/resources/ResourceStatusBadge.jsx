import React from 'react';
import './ResourceStatusBadge.css';

const ResourceStatusBadge = ({ status }) => {
  const getBadgeClass = () => {
    switch (status) {
      case 'ACTIVE': return 'badge-active';
      case 'OUT_OF_SERVICE': return 'badge-oos';
      case 'UNDER_MAINTENANCE': return 'badge-maintenance';
      default: return '';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'ACTIVE': return 'Active';
      case 'OUT_OF_SERVICE': return 'Out of Service';
      case 'UNDER_MAINTENANCE': return 'Maintenance';
      default: return status;
    }
  };

  return (
    <span className={`resource-status-badge ${getBadgeClass()}`}>
      {getLabel()}
    </span>
  );
};

export default ResourceStatusBadge;
