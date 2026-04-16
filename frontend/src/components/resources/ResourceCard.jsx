import React from 'react';
import { Link } from 'react-router-dom';
import ResourceStatusBadge from './ResourceStatusBadge';
import './ResourceCard.css';

const ResourceCard = ({ resource }) => {
  return (
    <div className="resource-card">
      <div className="resource-card-img">
        {resource.imageUrl ? (
           <img src={resource.imageUrl} alt={resource.name} />
        ) : (
           <div className="placeholder-img">{resource.type}</div>
        )}
      </div>
      <div className="resource-card-body">
        <div className="card-header">
           <h3>{resource.name}</h3>
           <ResourceStatusBadge status={resource.status} />
        </div>
        <p className="location">📍 {resource.location}</p>
        <div className="capacity">
           {resource.capacity ? `Capacity: ${resource.capacity}` : 'Equipment'}
        </div>
        <Link to={`/resources/${resource.id}`} className="view-btn">View Details</Link>
      </div>
    </div>
  );
};

export default ResourceCard;
