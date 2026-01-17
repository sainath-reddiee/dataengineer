// Advanced Filters Component
// Filter articles by search, category, score range, and issue type

import React from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';

export function AdvancedFilters({ filters, onFiltersChange, categories = [] }) {
    const scoreRanges = [
        { id: 'all', label: 'All Scores', min: 0, max: 100 },
        { id: 'critical', label: 'Critical (<40)', min: 0, max: 39 },
        { id: 'needs-work', label: 'Needs Work (40-69)', min: 40, max: 69 },
        { id: 'good', label: 'Good (70+)', min: 70, max: 100 }
    ];

    const handleSearchChange = (value) => {
        onFiltersChange({ ...filters, search: value });
    };

    const handleCategoryChange = (value) => {
        onFiltersChange({ ...filters, category: value || null });
    };

    const handleScoreChange = (rangeId) => {
        const range = scoreRanges.find(r => r.id === rangeId);
        onFiltersChange({
            ...filters,
            scoreMin: range?.min ?? 0,
            scoreMax: range?.max ?? 100
        });
    };

    const handleReset = () => {
        onFiltersChange({
            search: '',
            category: null,
            scoreMin: 0,
            scoreMax: 100
        });
    };

    const hasActiveFilters = filters.search || filters.category ||
        filters.scoreMin > 0 || filters.scoreMax < 100;

    const currentScoreRange = scoreRanges.find(r =>
        r.min === filters.scoreMin && r.max === filters.scoreMax
    )?.id || 'all';

    return (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
            <div className="flex flex-wrap gap-3 items-center">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        value={filters.search || ''}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Search by title or URL..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                </div>

                {/* Category Dropdown */}
                {categories.length > 0 && (
                    <div className="relative">
                        <select
                            value={filters.category || ''}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className="appearance-none px-4 py-2 pr-8 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                )}

                {/* Score Range Dropdown */}
                <div className="relative">
                    <select
                        value={currentScoreRange}
                        onChange={(e) => handleScoreChange(e.target.value)}
                        className="appearance-none px-4 py-2 pr-8 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                    >
                        {scoreRanges.map(range => (
                            <option key={range.id} value={range.id}>{range.label}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>

                {/* Reset Button */}
                {hasActiveFilters && (
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 px-3 py-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-sm"
                    >
                        <X className="w-4 h-4" />
                        Reset
                    </button>
                )}
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700">
                    <Filter className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-gray-400">Active filters:</span>
                    {filters.search && (
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">
                            "{filters.search}"
                        </span>
                    )}
                    {filters.category && (
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-xs">
                            {filters.category}
                        </span>
                    )}
                    {(filters.scoreMin > 0 || filters.scoreMax < 100) && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded text-xs">
                            Score: {filters.scoreMin}-{filters.scoreMax}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

export default AdvancedFilters;
