// src/pages/admin/ContentCalendarPage.jsx
// Content calendar with AI-free auto-suggestions based on article analysis.

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Trash2, Check, Clock, AlertTriangle, Sparkles, Loader2, ExternalLink } from 'lucide-react';
import wordpressApi from '@/services/wordpressApi';
import { scoreArticlesBatch } from '@/utils/rankIntelligence';
import { clusterArticles } from '@/utils/topicClusters';
import { getAllRanks } from '@/utils/rankTracker';
import {
    getTasks, addTask, updateTask, removeTask, getOverdue, generateSuggestions
} from '@/utils/contentCalendar';

const PRIORITY_COLORS = {
    high:   'bg-red-500/20 text-red-300 border-red-500/40',
    medium: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    low:    'bg-blue-500/20 text-blue-300 border-blue-500/40',
};

const STATUS_COLORS = {
    pending:       'bg-slate-700/50 text-gray-300 border-slate-600',
    'in-progress': 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    done:          'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
};

export function ContentCalendarPage() {
    const [tasks, setTasks] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [filter, setFilter] = useState('all');
    const [newTask, setNewTask] = useState({
        title: '', targetDate: '', type: 'new', targetKeyword: '', priority: 'medium'
    });

    useEffect(() => {
        loadAll();
    }, []);

    async function loadAll() {
        setLoading(true);
        try {
            setTasks(getTasks());

            const data = await wordpressApi.getAllPosts(1, 100);
            const ranks = getAllRanks();
            const scored = scoreArticlesBatch(data.posts || [], { rankData: ranks });

            const enriched = (data.posts || []).map(p => ({
                ...p,
                articleHealth: scored.find(s => s.slug === p.slug)?.articleHealth || 50,
            }));
            const { clusters } = clusterArticles(enriched);

            const suggs = generateSuggestions(scored, clusters, ranks);
            setSuggestions(suggs);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    }

    const handleAddTask = () => {
        if (!newTask.title || !newTask.targetDate) return;
        addTask(newTask);
        setTasks(getTasks());
        setNewTask({ title: '', targetDate: '', type: 'new', targetKeyword: '', priority: 'medium' });
        setShowAddForm(false);
    };

    const handleSuggestionToTask = (sugg) => {
        const defaultDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
        addTask({
            title: sugg.title,
            targetDate: defaultDate,
            type: sugg.type,
            priority: sugg.priority,
            targetKeyword: sugg.targetKeyword || '',
            articleSlug: sugg.articleSlug || '',
            notes: sugg.reason,
        });
        setTasks(getTasks());
    };

    const handleStatusChange = (id, status) => {
        updateTask(id, { status });
        setTasks(getTasks());
    };

    const handleRemove = (id) => {
        if (!confirm('Remove this task?')) return;
        removeTask(id);
        setTasks(getTasks());
    };

    const filteredTasks = tasks
        .filter(t => filter === 'all' || t.status === filter)
        .sort((a, b) => a.targetDate.localeCompare(b.targetDate));

    const stats = {
        total: tasks.length,
        overdue: getOverdue().length,
        pending: tasks.filter(t => t.status === 'pending').length,
        done: tasks.filter(t => t.status === 'done').length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                <span className="ml-3 text-gray-400">Loading calendar...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                        <Calendar className="w-8 h-8 text-blue-400" />
                        Content Calendar
                    </h1>
                    <p className="text-gray-400">Plan what to write, update, and optimize — with AI-free suggestions from your data.</p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 text-sm"
                >
                    <Plus className="w-4 h-4" /> Add Task
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-800/40 border border-slate-700 rounded-xl text-center">
                    <div className="text-xl font-bold text-white">{stats.total}</div>
                    <div className="text-[11px] text-gray-400 uppercase tracking-wider">Total Tasks</div>
                </div>
                <div className="p-3 bg-red-900/20 border border-red-800/30 rounded-xl text-center">
                    <div className="text-xl font-bold text-red-400">{stats.overdue}</div>
                    <div className="text-[11px] text-gray-400 uppercase tracking-wider">Overdue</div>
                </div>
                <div className="p-3 bg-amber-900/20 border border-amber-800/30 rounded-xl text-center">
                    <div className="text-xl font-bold text-amber-400">{stats.pending}</div>
                    <div className="text-[11px] text-gray-400 uppercase tracking-wider">Pending</div>
                </div>
                <div className="p-3 bg-emerald-900/20 border border-emerald-800/30 rounded-xl text-center">
                    <div className="text-xl font-bold text-emerald-400">{stats.done}</div>
                    <div className="text-[11px] text-gray-400 uppercase tracking-wider">Done</div>
                </div>
            </div>

            {/* Add Form */}
            {showAddForm && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl space-y-3"
                >
                    <input
                        type="text"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        placeholder="Task title (e.g., Write: Snowflake Cortex Search guide)"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <input
                            type="date"
                            value={newTask.targetDate}
                            onChange={(e) => setNewTask({ ...newTask, targetDate: e.target.value })}
                            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
                        />
                        <select
                            value={newTask.type}
                            onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
                            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
                        >
                            <option value="new">New Article</option>
                            <option value="update">Update Existing</option>
                            <option value="optimize">Optimize (SEO/CTR)</option>
                        </select>
                        <select
                            value={newTask.priority}
                            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                        <input
                            type="text"
                            value={newTask.targetKeyword}
                            onChange={(e) => setNewTask({ ...newTask, targetKeyword: e.target.value })}
                            placeholder="Target keyword (optional)"
                            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleAddTask}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                        >
                            Add
                        </button>
                        <button
                            onClick={() => setShowAddForm(false)}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Auto-Suggestions */}
            {suggestions.length > 0 && (
                <div className="p-4 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-800/30 rounded-xl">
                    <h3 className="text-sm font-semibold text-purple-300 flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4" />
                        AI-Free Suggestions (based on your article data)
                    </h3>
                    <div className="space-y-2">
                        {suggestions.map((s, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${PRIORITY_COLORS[s.priority]}`}>
                                    {s.priority.toUpperCase()}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-gray-200 font-medium">{s.title}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{s.reason}</div>
                                    {s.projectedLift && (
                                        <div className="text-xs text-emerald-400 mt-0.5">{s.projectedLift}</div>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleSuggestionToTask(s)}
                                    className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs rounded flex items-center gap-1 shrink-0"
                                >
                                    <Plus className="w-3 h-3" /> Add
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filter + Task List */}
            <div className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                    <h3 className="text-sm font-semibold text-white">Your Calendar</h3>
                    <div className="flex gap-1">
                        {['all', 'pending', 'in-progress', 'done'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-2.5 py-1 text-xs rounded border transition ${
                                    filter === f
                                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                        : 'bg-slate-900/50 text-gray-400 border-slate-700 hover:text-gray-200'
                                }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredTasks.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                        No tasks yet. Add one above or accept a suggestion.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-700/50">
                        {filteredTasks.map(t => {
                            const overdue = t.targetDate < new Date().toISOString().split('T')[0] && t.status !== 'done';
                            return (
                                <div key={t.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-800/60 transition">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[t.priority]}`}>
                                                {t.priority?.toUpperCase()}
                                            </span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_COLORS[t.status]}`}>
                                                {t.status}
                                            </span>
                                            <span className="text-[10px] text-gray-500 uppercase">{t.type}</span>
                                            {overdue && (
                                                <span className="text-[10px] text-red-400 flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" /> Overdue
                                                </span>
                                            )}
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {t.targetDate}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-200 mt-1">{t.title}</div>
                                        {t.targetKeyword && (
                                            <div className="text-xs text-blue-300 mt-0.5">Target: {t.targetKeyword}</div>
                                        )}
                                        {t.notes && (
                                            <div className="text-xs text-gray-500 mt-1 italic">{t.notes}</div>
                                        )}
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        {t.status !== 'done' && (
                                            <button
                                                onClick={() => handleStatusChange(t.id, t.status === 'pending' ? 'in-progress' : 'done')}
                                                className="p-1.5 text-gray-400 hover:text-emerald-400"
                                                title={t.status === 'pending' ? 'Start' : 'Complete'}
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                        )}
                                        {t.articleSlug && (
                                            <a
                                                href={`https://dataengineerhub.blog/articles/${t.articleSlug}`}
                                                target="_blank"
                                                rel="noopener"
                                                className="p-1.5 text-gray-400 hover:text-blue-400"
                                                title="View article"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        )}
                                        <button
                                            onClick={() => handleRemove(t.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-400"
                                            title="Remove"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ContentCalendarPage;
