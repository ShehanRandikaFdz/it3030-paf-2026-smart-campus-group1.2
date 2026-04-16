import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { createResource, getResourceById, updateResource } from '../../../api/resourcesApi';
import './ResourceFormPage.css';

const ResourceFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    type: 'LECTURE_HALL',
    capacity: '',
    location: '',
    description: '',
    availabilityStart: '08:00',
    availabilityEnd: '18:00',
    availableDays: 'MON,TUE,WED,THU,FRI',
    status: 'ACTIVE',
    imageUrl: ''
  });

  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      const fetchResource = async () => {
        try {
          const res = await getResourceById(id);
          if (res.data.success) {
            setFormData(res.data.data);
          }
        } catch (error) {
          console.error('Failed to fetch resource', error);
        } finally {
          setLoading(false);
        }
      };
      fetchResource();
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? (value ? parseInt(value) : '') : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (payload.type === 'EQUIPMENT' && !payload.capacity) {
        payload.capacity = 1;
      }
      
      if (isEdit) {
        await updateResource(id, payload);
      } else {
        await createResource(payload);
      }
      navigate('/admin/resources');
    } catch (error) {
      console.error('Failed to submit resource form', error);
      alert('Failed to save resource. Check console logs.');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="resource-form-page">
      <Link to="/admin/resources" className="back-link">← Back to Manage Resources</Link>
      <div className="form-container">
        <h1>{isEdit ? 'Edit Resource' : 'Create New Resource'}</h1>
        
        <form onSubmit={handleSubmit} className="resource-form">
          <div className="form-group">
            <label>Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required maxLength="100" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select name="type" value={formData.type} onChange={handleChange}>
                <option value="LECTURE_HALL">Lecture Hall</option>
                <option value="LAB">Lab</option>
                <option value="MEETING_ROOM">Meeting Room</option>
                <option value="EQUIPMENT">Equipment</option>
              </select>
            </div>
            <div className="form-group">
              <label>Capacity</label>
              <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} min="1" />
            </div>
          </div>

          <div className="form-group">
            <label>Location</label>
            <input type="text" name="location" value={formData.location} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows="4" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Time</label>
              <input type="time" name="availabilityStart" value={formData.availabilityStart || ''} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>End Time</label>
              <input type="time" name="availabilityEnd" value={formData.availabilityEnd || ''} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>Available Days (comma separated)</label>
            <input type="text" name="availableDays" value={formData.availableDays || ''} onChange={handleChange} placeholder="e.g. MON,TUE,WED,THU,FRI" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="ACTIVE">Active</option>
                <option value="OUT_OF_SERVICE">Out of Service</option>
                <option value="UNDER_MAINTENANCE">Maintenance</option>
              </select>
            </div>
            <div className="form-group">
              <label>Image URL</label>
              <input type="text" name="imageUrl" value={formData.imageUrl || ''} onChange={handleChange} placeholder="https://example.com/image.jpg" />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn">{isEdit ? 'Update Resource' : 'Create Resource'}</button>
            <Link to="/admin/resources" className="cancel-btn">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResourceFormPage;
