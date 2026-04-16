import React from 'react';
import './ResourceFilter.css';

const ResourceFilter = ({ filters, setFilters, onSearch }) => {

  const handleChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleApply = () => {
    onSearch();
  };

  return (
    <div className="resource-filter">
      <div className="filter-group">
        <label>Type</label>
        <select name="type" value={filters.type || ''} onChange={handleChange}>
          <option value="">All Types</option>
          <option value="LECTURE_HALL">Lecture Hall</option>
          <option value="LAB">Lab</option>
          <option value="MEETING_ROOM">Meeting Room</option>
          <option value="EQUIPMENT">Equipment</option>
        </select>
      </div>
      <div className="filter-group">
        <label>Location</label>
        <input type="text" name="location" value={filters.location || ''} onChange={handleChange} placeholder="e.g. Block A" />
      </div>
      <div className="filter-group">
        <label>Min Capacity</label>
        <input type="number" name="capacity" value={filters.capacity || ''} onChange={handleChange} placeholder="e.g. 30" />
      </div>
      <div className="filter-group">
        <label>Status</label>
        <select name="status" value={filters.status || ''} onChange={handleChange}>
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="OUT_OF_SERVICE">Out of Service</option>
          <option value="UNDER_MAINTENANCE">Maintenance</option>
        </select>
      </div>
      <button className="apply-filter-btn" onClick={handleApply}>Search</button>
    </div>
  );
};

export default ResourceFilter;
