// src/components/admin/IssuesList.jsx
/**
 * SEO Issues List Component
 * Displays prioritized list of SEO issues
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp, Sparkles, Loader2, Copy } from 'lucide-react';
import geminiService from '@/services/geminiService';

const severityConfig = {
    critical: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'Critical' },
    warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: 'Warning' },
    good: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', label: 'Passed' },
    info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'Info' }
};

function IssueItem({ check }) {
    const [expanded, setExpanded] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState(null);
    const [aiError, setAiError] = useState(null);

    const config = severityConfig[check.severity] || severityConfig.info;
    const Icon = config.icon;

    const handleFixWithAI = async () => {
        if (!geminiService.isEnabled) {
            alert('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to GitHub Secrets for production, or to your .env file for local development.');
            return;
        }

        setAiLoading(true);
        setAiError(null);
        setExpanded(true); // Auto-expand to show result

        try {
            const result = await geminiService.getQuickFix(check.message, JSON.stringify(check.details || ''));
            setAiSuggestion(result);
        } catch (err) {
            setAiError(err.message);
        }
        setAiLoading(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${config.bg} border ${config.border} rounded-xl p-4`}
        >
            <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 ${config.color} mt-0.5 flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <h4 className="font-medium text-white">{check.name}</h4>
                        <div className="flex items-center gap-2">
                            {/* AI Fix Button - Only for issues */}
                            {(check.severity === 'critical' || check.severity === 'warning') && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleFixWithAI(); }}
                                    disabled={aiLoading}
                                    className="flex items-center gap-1.5 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-full transition-colors disabled:opacity-50"
                                >
                                    {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                    {aiLoading ? 'Fixing...' : 'Fix with AI'}
                                </button>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.color} border ${config.border}`}>
                                {config.label}
                            </span>
                        </div>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{check.message}</p>

                    {(check.recommendation || check.details || aiSuggestion || aiError) && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 mt-2"
                        >
                            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            {expanded ? 'Less' : 'More details'}
                        </button>
                    )}

                    <AnimatePresence>
                        {expanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                {/* AI Error */}
                                {aiError && (
                                    <div className="mt-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                                        ❌ AI Error: {aiError}
                                    </div>
                                )}

                                {/* AI Suggestion */}
                                {aiSuggestion && (
                                    <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-purple-400 flex items-center gap-1">
                                                <Sparkles className="w-3 h-3" /> AI Suggestion
                                            </span>
                                            <button
                                                onClick={() => navigator.clipboard.writeText(aiSuggestion)}
                                                className="text-gray-400 hover:text-white"
                                                title="Copy"
                                            >
                                                <Copy className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-200 whitespace-pre-wrap font-mono bg-slate-900/50 p-2 rounded">
                                            {aiSuggestion}
                                        </p>
                                    </div>
                                )}

                                {check.recommendation && (
                                    <p className="text-sm text-blue-400 mt-2">
                                        💡 {check.recommendation}
                                    </p>
                                )}
                                {check.details && (
                                    <pre className="text-xs text-gray-500 mt-2 bg-slate-900/50 p-2 rounded overflow-x-auto">
                                        {JSON.stringify(check.details, null, 2)}
                                    </pre>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}

export function IssuesList({ checks, filter = 'all', maxItems = null }) {
    const filteredChecks = filter === 'all'
        ? checks
        : checks.filter(c => c.severity === filter);

    const sortedChecks = [...filteredChecks].sort((a, b) => {
        const order = { critical: 0, warning: 1, info: 2, good: 3 };
        return (order[a.severity] || 4) - (order[b.severity] || 4);
    });

    const displayChecks = maxItems ? sortedChecks.slice(0, maxItems) : sortedChecks;

    if (displayChecks.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                No issues found
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {displayChecks.map((check, idx) => (
                <IssueItem key={`${check.name}-${idx}`} check={check} />
            ))}
            {maxItems && sortedChecks.length > maxItems && (
                <p className="text-sm text-gray-500 text-center">
                    +{sortedChecks.length - maxItems} more issues
                </p>
            )}
        </div>
    );
}

export default IssuesList;
