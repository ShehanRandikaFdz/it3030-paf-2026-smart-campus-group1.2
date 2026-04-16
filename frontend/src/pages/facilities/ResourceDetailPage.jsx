import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getResourceById, deleteResource } from '../../api/resourcesApi';
import ResourceStatusBadge from '../../components/resources/ResourceStatusBadge';
import './ResourceDetailPage.css';

const ResourceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);

  // Assuming role is kept in localStorage from Module C
  const userRole = localStorage.getItem('userRole') || 'USER'; 

  useEffect(() => {
    const fetchResource = async () => {
      try {
        const res = await getResourceById(id);
        if (res.data.success) {
          setResource(res.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch resource', error);
      } finally {
        setLoading(false);
      }
    };
    fetchResource();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        await deleteResource(id);
        navigate('/resources');
      } catch (error) {
        console.error('Failed to delete resource', error);
      }
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!resource) return <div className="no-data">Resource not found.</div>;

  return (
    <div className="resource-detail-page">
      <Link to="/resources" className="back-link">← Back to Resources</Link>
      
      <div className="resource-header">
        <h1>{resource.name}</h1>
        <ResourceStatusBadge status={resource.status} />
      </div>

      <div className="resource-content">
        <div className="resource-main">
          {resource.imageUrl ? (
            <img src={resource.imageUrl} alt={resource.name} className="resource-hero-img" />
          ) : (
            <div className="resource-hero-placeholder">{resource.type}</div>
          )}
          
          <div className="resource-description">
            <h3>Description</h3>
            <p>{resource.description || 'No description provided.'}</p>
          </div>
        </div>

        <div className="resource-sidebar">
          <div className="sidebar-section">
            <h3>Details</h3>
            <p><strong>Type:</strong> {resource.type}</p>
            <p><strong>Location:</strong> {resource.location}</p>
            {resource.capacity && <p><strong>Capacity:</strong> {resource.capacity}</p>}
            <p><strong>Available Days:</strong> {resource.availableDays || 'N/A'}</p>
            <p><strong>Hours:</strong> {resource.availabilityStart} - {resource.availabilityEnd}</p>
          </div>

          <div className="sidebar-actions">
            {/* Future Integration: Booking Module */}
            <button className="book-btn" disabled={resource.status !== 'ACTIVE'}>
              {resource.status === 'ACTIVE' ? 'Book Now' : 'Unavailable'}
            </button>

            {userRole === 'ADMIN' && (
              <div className="admin-actions">
                <Link to={`/admin/resources/${id}/edit`} className="edit-btn">Edit</Link>
                <button onClick={handleDelete} className="delete-btn">Delete</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceDetailPage;
