import React, { useEffect, useState } from 'react';
import { searchResources } from '../../api/resourcesApi';
import ResourceCard from '../../components/resources/ResourceCard';
import ResourceFilter from '../../components/resources/ResourceFilter';
import './ResourceListPage.css';

const ResourceListPage = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    location: '',
    capacity: '',
    status: ''
  });

  const fetchResources = async () => {
    setLoading(true);
    try {
      const activeFilters = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''));
      const res = await searchResources(activeFilters);
      if (res.data.success) {
        setResources(res.data.data.content);
      }
    } catch (error) {
      console.error('Failed to fetch resources', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
    // eslint-disable-next-line
  }, []);

  const handleSearch = () => {
    fetchResources();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Facilities & Assets</h1>
        <p>Browse and book campus resources</p>
      </div>

      <ResourceFilter filters={filters} setFilters={setFilters} onSearch={handleSearch} />

      {loading ? (
        <div className="loading">Loading resources...</div>
      ) : (
        <div className="resource-grid">
          {resources.length > 0 ? (
            resources.map(res => (
              <ResourceCard key={res.id} resource={res} />
            ))
          ) : (
            <div className="no-data">No resources found matching the criteria.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResourceListPage;
