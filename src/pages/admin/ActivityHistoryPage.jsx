// Activity History — unified timeline of all admin tool actions.
// Shows what you did, when, on which article, with full result data.

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Trash2, ChevronDown, ChevronRight, Filter,
    Clock, Sparkle, TrendingUp, FileSearch, Search, Zap,
    Wrench, MousePointerClick, ExternalLink, AlertTriangle,
} from 'lucide-react';
import activityHistory from '@/services/activityHistory';

// Tool metadata for display
const TOOL_META = {
    'smart-linking':        { label: 'Smart Linking',       icon: Sparkle,          color: 'purple' },
    'trend-intelligence':   { label: 'Trend Intelligence',  icon: TrendingUp,       color: 'blue' },
    'article-writer':       { label: 'AI Article Writer',   icon: FileSearch,       color: 'pink' },
    'seo-scanner':          { label: 'SEO Scanner',         icon: Search,           color: 'green' },
    'ctr-lab':              { label: 'CTR Lab',             icon: Zap,              color: 'yellow' },
    'content-optimizer':    { label: 'Content Optimizer',   icon: TrendingUp,       color: 'cyan' },
    'article-fixer':        { label: 'Article Fixer',       icon: Wrench,           color: 'orange' },
    'ctr-fixer':            { label: 'CTR Fixer',           icon: MousePointerClick, color: 'amber' },
};

const COLOR_MAP = {
    purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    blue:   'bg-blue-500/20 text-blue-300 border-blue-500/30',
    pink:   'bg-pink-500/20 text-pink-300 border-pink-500/30',
    green:  'bg-green-500/20 text-green-300 border-green-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    cyan:   'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    orange: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    amber:  'bg-amber-500/20 text-amber-300 border-amber-500/30',
    gray:   'bg-slate-500/20 text-gray-300 border-slate-500/30',
};

function formatRelativeTime(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
}

function ToolBadge({ tool }) {
    const meta = TOOL_META[tool] || { label: tool, icon: Activity, color: 'gray' };
    const Icon = meta.icon;
    const colorClass = COLOR_MAP[meta.color] || COLOR_MAP.gray;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${colorClass}`}>
            <Icon className="w-3 h-3" />
            {meta.label}
        </span>
    );
}

function EntryCard({ entry, onDelete }) {
    const [expanded, setExpanded] = useState(false);

    const hasData = entry.data && Object.keys(entry.data).length > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="border border-slate-700 rounded-xl bg-slate-800/40 hover:bg-slate-800/60 transition"
        >
            <div
                className="flex items-start gap-3 p-4 cursor-pointer"
                onClick={() => hasData && setExpanded(!expanded)}
            >
                {/* Timeline dot */}
                <div className="mt-1 w-2.5 h-2.5 rounded-full bg-blue-400 ring-4 ring-blue-400/10 flex-shrink-0" />

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <ToolBadge tool={entry.tool} />
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(entry.timestamp)}
                        </span>
                    </div>

                    <p className="text-sm text-white font-medium truncate">{entry.title || entry.action}</p>

                    {entry.slug && (
                        <Link
                            to={`/articles/${entry.slug}`}
                            className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-1"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ExternalLink className="w-3 h-3" />
                            {entry.slug}
                        </Link>
                    )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                    {hasData && (
                        expanded
                            ? <ChevronDown className="w-4 h-4 text-gray-500" />
                            : <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
                        className="p-1 text-gray-600 hover:text-red-400 rounded transition"
                        title="Delete entry"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Expanded detail view */}
            <AnimatePresence>
                {expanded && hasData && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 pt-0 border-t border-slate-700/50">
                            <pre className="mt-3 bg-slate-900/80 rounded-lg p-3 text-[11px] text-gray-300 whitespace-pre-wrap max-h-[300px] overflow-y-auto font-mono leading-relaxed border border-slate-700/50">
                                {JSON.stringify(entry.data, null, 2)}
                            </pre>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export function ActivityHistoryPage() {
    const [entries, setEntries] = useState([]);
    const [filterTool, setFilterTool] = useState('all');
    const [filterSlug, setFilterSlug] = useState('');
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    useEffect(() => {
        loadEntries();
    }, [filterTool, filterSlug]);

    function loadEntries() {
        const opts = {};
        if (filterTool !== 'all') opts.tool = filterTool;
        if (filterSlug.trim()) opts.slug = filterSlug.trim();
        setEntries(activityHistory.getHistory(opts));
    }

    function handleDelete(id) {
        activityHistory.deleteEntry(id);
        loadEntries();
    }

    function handleClearAll() {
        activityHistory.clearHistory();
        setEntries([]);
        setShowClearConfirm(false);
    }

    const tools = activityHistory.getTools();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <Activity className="w-7 h-7 text-blue-400" />
                    Activity History
                </h1>
                <p className="text-gray-400">
                    Everything you've done across admin tools — review past results, track decisions, pick up where you left off.
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                        value={filterTool}
                        onChange={(e) => setFilterTool(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-gray-300 text-xs rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All tools</option>
                        {tools.map(t => (
                            <option key={t} value={t}>
                                {TOOL_META[t]?.label || t}
                            </option>
                        ))}
                    </select>
                </div>

                <input
                    type="text"
                    placeholder="Filter by article slug..."
                    value={filterSlug}
                    onChange={(e) => setFilterSlug(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-gray-300 text-xs rounded-lg px-3 py-2 w-full sm:w-56 focus:ring-blue-500 focus:border-blue-500"
                />

                <div className="flex items-center gap-2 ml-auto">
                    <span className="text-[11px] text-gray-500">{entries.length} entries</span>
                    {entries.length > 0 && (
                        showClearConfirm ? (
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] text-red-400">Clear all?</span>
                                <button onClick={handleClearAll} className="px-2 py-1 text-[10px] bg-red-600/30 hover:bg-red-600/50 text-red-300 rounded border border-red-500/30">Yes</button>
                                <button onClick={() => setShowClearConfirm(false)} className="px-2 py-1 text-[10px] bg-slate-700 hover:bg-slate-600 text-gray-300 rounded">No</button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowClearConfirm(true)}
                                className="px-2 py-1 text-[10px] text-gray-500 hover:text-red-400 flex items-center gap-1 transition"
                            >
                                <Trash2 className="w-3 h-3" /> Clear
                            </button>
                        )
                    )}
                </div>
            </div>

            {/* Timeline */}
            {entries.length === 0 ? (
                <div className="text-center py-16">
                    <Activity className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No activity recorded yet.</p>
                    <p className="text-gray-600 text-xs mt-1">Use any admin tool — Smart Linking, Trend Intelligence, Article Writer, etc. — and your actions will appear here.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {entries.map(entry => (
                            <EntryCard key={entry.id} entry={entry} onDelete={handleDelete} />
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

export default ActivityHistoryPage;
