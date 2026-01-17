// Article Selector Component
// Checkbox list for selecting articles to scan

import React from 'react';
import { CheckSquare, Square, MinusSquare } from 'lucide-react';

export function ArticleSelector({ articles, selected, onSelectionChange, disabled }) {
    const allSelected = articles.length > 0 && selected.size === articles.length;
    const someSelected = selected.size > 0 && selected.size < articles.length;

    const handleSelectAll = () => {
        if (allSelected) {
            onSelectionChange(new Set());
        } else {
            onSelectionChange(new Set(articles.map(a => a.id || a.url)));
        }
    };

    const handleToggle = (id) => {
        const newSelected = new Set(selected);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        onSelectionChange(newSelected);
    };

    return (
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900/50 border-b border-slate-700">
                <button
                    onClick={handleSelectAll}
                    disabled={disabled || articles.length === 0}
                    className="flex items-center gap-2 text-gray-300 hover:text-white disabled:opacity-50 transition-colors"
                >
                    {allSelected ? (
                        <CheckSquare className="w-5 h-5 text-purple-400" />
                    ) : someSelected ? (
                        <MinusSquare className="w-5 h-5 text-purple-400" />
                    ) : (
                        <Square className="w-5 h-5" />
                    )}
                    <span className="text-sm font-medium">
                        {allSelected ? 'Deselect All' : 'Select All'}
                    </span>
                </button>
                <span className="text-sm text-gray-400">
                    {selected.size} of {articles.length} selected
                </span>
            </div>

            {/* Article List */}
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-700/50">
                {articles.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500">
                        No articles to display
                    </div>
                ) : (
                    articles.map((article) => {
                        const id = article.id || article.url;
                        const isSelected = selected.has(id);
                        return (
                            <div
                                key={id}
                                onClick={() => !disabled && handleToggle(id)}
                                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isSelected ? 'bg-purple-500/10' : 'hover:bg-slate-700/30'
                                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isSelected ? (
                                    <CheckSquare className="w-5 h-5 text-purple-400 flex-shrink-0" />
                                ) : (
                                    <Square className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="text-white text-sm font-medium truncate">
                                        {article.title || 'Untitled'}
                                    </div>
                                    {article.category && (
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            {article.category}
                                        </div>
                                    )}
                                </div>
                                {article.score !== undefined && (
                                    <span className={`text-sm font-bold ${article.score >= 70 ? 'text-green-400' :
                                            article.score >= 40 ? 'text-yellow-400' : 'text-red-400'
                                        }`}>
                                        {article.score}
                                    </span>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default ArticleSelector;
