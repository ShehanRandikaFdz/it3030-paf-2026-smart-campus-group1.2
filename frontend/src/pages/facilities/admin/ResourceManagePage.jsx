import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllResources, updateResourceStatus, deleteResource } from '../../../api/resourcesApi';
import './ResourceManagePage.css';

const ResourceManagePage = () => {
  const [resources, setResources] = useState([]);

  const fetchResources = async () => {
    try {
      const res = await getAllResources({ size: 100 });
      if (res.data.success) {
        setResources(res.data.data.content);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateResourceStatus(id, newStatus);
      fetchResources();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm('Delete this resource?')) {
      try {
        await deleteResource(id);
        fetchResources();
      } catch(err) {
        console.error('Failed to delete', err);
      }
    }
  };

  return (
    <div className="admin-manage-page">
      <div className="manage-header">
        <h1>Manage Resources</h1>
        <Link to="/admin/resources/new" className="create-btn">+ Add New Resource</Link>
      </div>

      <table className="manage-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Type</th>
            <th>Location</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {resources.map(res => (
            <tr key={res.id}>
              <td>{res.id}</td>
              <td>{res.name}</td>
              <td>{res.type}</td>
              <td>{res.location}</td>
              <td>
                <select 
                  value={res.status} 
                  onChange={(e) => handleStatusChange(res.id, e.target.value)}
                  className="status-select"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="OUT_OF_SERVICE">OUT OF SERVICE</option>
                  <option value="UNDER_MAINTENANCE">MAINTENANCE</option>
                </select>
              </td>
              <td className="actions-cell">
                <Link to={`/admin/resources/${res.id}/edit`} className="action-edit">Edit</Link>
                <button onClick={() => handleDelete(res.id)} className="action-delete">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResourceManagePage;
