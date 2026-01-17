// Scan Source Selector Component
// Tab navigation for choosing scan source

import React from 'react';
import { Globe, Edit3, Rss } from 'lucide-react';

export function ScanSourceSelector({ source, onChange, counts }) {
    const sources = [
        { id: 'wordpress', label: 'WordPress', icon: Globe, count: counts?.wordpress || 0 },
        { id: 'manual', label: 'Manual URLs', icon: Edit3, count: counts?.manual || 0 },
        { id: 'feed', label: 'Feed/Sitemap', icon: Rss, count: counts?.feed || 0 }
    ];

    return (
        <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl border border-slate-700">
            {sources.map(s => (
                <button
                    key={s.id}
                    onClick={() => onChange(s.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${source === s.id
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                            : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                >
                    <s.icon className="w-5 h-5" />
                    <span className="font-medium">{s.label}</span>
                    {s.count > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs ${source === s.id ? 'bg-purple-800/50' : 'bg-slate-900/50'
                            }`}>
                            {s.count}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}

export default ScanSourceSelector;
