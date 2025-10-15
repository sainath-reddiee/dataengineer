// src/components/certifications/CertificationFilter.jsx
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CertificationFilter = ({ filters, setFilters, providers }) => {
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 sticky top-24">
      <h3 className="text-xl font-bold mb-6">Filter Resources</h3>
      <div className="space-y-6">
        <div>
          <Label htmlFor="search">Search by Name</Label>
          <Input 
            type="text" 
            name="search" 
            id="search"
            placeholder="e.g., AWS Solutions Architect" 
            value={filters.search}
            onChange={handleFilterChange}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="provider">Provider</Label>
          <select 
            name="provider" 
            id="provider"
            value={filters.provider}
            onChange={handleFilterChange}
            className="mt-2 w-full bg-slate-700/50 p-2 rounded-md border border-slate-600"
          >
            <option value="all">All Providers</option>
            {providers.map(p => <option key={p} value={p.toLowerCase()}>{p}</option>)}
          </select>
        </div>
        {/* Add more filters for level and resource_type as needed */}
      </div>
    </div>
  );
};

export default CertificationFilter;