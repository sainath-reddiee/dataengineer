// Scan Queue Component
// Queue management with pause, resume, and progress tracking

import React from 'react';
import { Play, Pause, Square, Trash2, CheckCircle, Loader2, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function ScanQueue({
    queue,
    currentIndex,
    status, // 'idle' | 'running' | 'paused' | 'completed'
    onStart,
    onPause,
    onResume,
    onCancel,
    onClear
}) {
    const completedCount = queue.filter(item => item.status === 'done').length;
    const errorCount = queue.filter(item => item.status === 'error').length;
    const progress = queue.length > 0 ? (completedCount / queue.length) * 100 : 0;

    const getStatusIcon = (itemStatus) => {
        switch (itemStatus) {
            case 'done': return <CheckCircle className="w-4 h-4 text-green-400" />;
            case 'scanning': return <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />;
            case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />;
            default: return <Clock className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusColor = (itemStatus) => {
        switch (itemStatus) {
            case 'done': return 'bg-green-500/10 border-green-500/30';
            case 'scanning': return 'bg-purple-500/10 border-purple-500/30';
            case 'error': return 'bg-red-500/10 border-red-500/30';
            default: return 'bg-slate-800/50 border-slate-700';
        }
    };

    if (queue.length === 0) return null;

    return (
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900/50 border-b border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Play className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold">Scan Queue</h3>
                        <p className="text-sm text-gray-400">{queue.length} articles</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {status === 'idle' && (
                        <button
                            onClick={onStart}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <Play className="w-4 h-4" />
                            Start
                        </button>
                    )}
                    {status === 'running' && (
                        <button
                            onClick={onPause}
                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <Pause className="w-4 h-4" />
                            Pause
                        </button>
                    )}
                    {status === 'paused' && (
                        <button
                            onClick={onResume}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <Play className="w-4 h-4" />
                            Resume
                        </button>
                    )}
                    {(status === 'running' || status === 'paused') && (
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <Square className="w-4 h-4" />
                            Cancel
                        </button>
                    )}
                    {(status === 'idle' || status === 'completed') && (
                        <button
                            onClick={onClear}
                            className="px-4 py-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="px-6 py-4 border-b border-slate-700">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">
                        {status === 'completed' ? 'Completed' : status === 'running' ? 'Scanning...' : status === 'paused' ? 'Paused' : 'Ready'}
                    </span>
                    <span className="text-sm text-white font-medium">
                        {completedCount}/{queue.length}
                        {errorCount > 0 && <span className="text-red-400 ml-2">({errorCount} errors)</span>}
                    </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    />
                </div>
            </div>

            {/* Queue Items */}
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-700/50">
                {queue.map((item, index) => (
                    <div
                        key={item.id || item.url || index}
                        className={`flex items-center gap-3 px-6 py-3 ${getStatusColor(item.status)}`}
                    >
                        {getStatusIcon(item.status)}
                        <div className="flex-1 min-w-0">
                            <div className="text-sm text-white truncate">{item.title || 'Untitled'}</div>
                            {item.url && (
                                <div className="text-xs text-gray-500 truncate">{item.url}</div>
                            )}
                        </div>
                        {item.score !== undefined && (
                            <span className={`text-sm font-bold ${item.score >= 70 ? 'text-green-400' :
                                    item.score >= 40 ? 'text-yellow-400' : 'text-red-400'
                                }`}>
                                {item.score}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ScanQueue;
