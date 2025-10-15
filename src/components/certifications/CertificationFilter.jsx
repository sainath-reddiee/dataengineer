// src/components/certifications/CertificationFilter.jsx - FINAL VERSION WITH MODERN UI
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'; // Import our new component

const CertificationFilter = ({ filters, setFilters, providers, levels }) => {
  // Use a single handler for all select components
  const handleSelectChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleInputChange = (e) => {
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
              onChange={handleInputChange}
              className="pl-10"
            />
          </div>
        </div>
        
        {/* Provider Dropdown */}
        <div>
          <Label htmlFor="provider">Provider</Label>
          <Select name="provider" value={filters.provider} onValueChange={(value) => handleSelectChange('provider', value)}>
            <SelectTrigger id="provider" className="mt-2">
              <SelectValue placeholder="All Providers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {providers.map(p => <SelectItem key={p.slug} value={p.slug}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Level Dropdown */}
        <div>
          <Label htmlFor="level">Level</Label>
          <Select name="level" value={filters.level} onValueChange={(value) => handleSelectChange('level', value)}>
            <SelectTrigger id="level" className="mt-2">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {levels.map(l => <SelectItem key={l.slug} value={l.slug}>{l.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default CertificationFilter;