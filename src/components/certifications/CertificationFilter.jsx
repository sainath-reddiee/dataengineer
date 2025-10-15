// src/components/certifications/CertificationFilter.jsx - FINAL CORRECTED VERSION
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';

const CertificationFilter = ({ filters, setFilters, providers, levels }) => {
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 sticky top-24">
      <h3 className="text-xl font-bold mb-6 text-white">Filter Resources</h3>
      <div className="space-y-6">
        <div>
          <Label htmlFor="search">Search by Name</Label>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              type="text" 
              name="search" 
              id="search"
              placeholder="e.g., SAA-C03" 
              value={filters.search}
              onChange={handleFilterChange}
              className="pl-10"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="provider">Provider</Label>
          <select 
            name="provider" 
            id="provider"
            value={filters.provider}
            onChange={handleFilterChange}
            className="mt-2 w-full bg-slate-700/50 p-2 rounded-md border border-slate-600 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Providers</option>
            {/* CORRECTED LOGIC: Use p.slug and p.name */}
            {providers.map(p => <option key={p.slug} value={p.slug}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <Label htmlFor="level">Level</Label>
          <select 
            name="level" 
            id="level"
            value={filters.level}
            onChange={handleFilterChange}
            className="mt-2 w-full bg-slate-700/50 p-2 rounded-md border border-slate-600 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Levels</option>
            {/* CORRECTED LOGIC: Use l.slug and l.name */}
            {levels.map(l => <option key={l.slug} value={l.slug}>{l.name}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
};

export default CertificationFilter;