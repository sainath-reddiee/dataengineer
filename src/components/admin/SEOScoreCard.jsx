// src/components/admin/SEOScoreCard.jsx
/**
 * SEO Score Card Component
 * Displays score with visual indicator
 */

import React from 'react';
import { motion } from 'framer-motion';

export function SEOScoreCard({ title, score, subtitle, icon: Icon, color = 'blue' }) {
    const getGrade = (s) => {
        if (s >= 90) return 'A+';
        if (s >= 80) return 'A';
        if (s >= 70) return 'B';
        if (s >= 60) return 'C';
        if (s >= 50) return 'D';
        return 'F';
    };

    const getColor = (s) => {
        if (s >= 80) return 'from-green-500 to-emerald-600';
        if (s >= 60) return 'from-yellow-500 to-amber-600';
        if (s >= 40) return 'from-orange-500 to-red-500';
        return 'from-red-500 to-red-700';
    };

    const colorClasses = {
        blue: 'from-blue-500 to-cyan-500',
        purple: 'from-purple-500 to-pink-500',
        green: 'from-green-500 to-emerald-500',
        orange: 'from-orange-500 to-amber-500'
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6 hover:border-slate-600 transition-all"
        >
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-sm font-medium text-gray-400">{title}</h3>
                    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
                </div>
                {Icon && (
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClasses[color]} bg-opacity-20`}>
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                )}
            </div>

            <div className="flex items-end gap-3">
                <span className="text-4xl font-bold text-white">{score}</span>
                <span className="text-lg text-gray-400 mb-1">/100</span>
                <span className={`text-lg font-bold mb-1 bg-gradient-to-r ${getColor(score)} bg-clip-text text-transparent`}>
                    {getGrade(score)}
                </span>
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full bg-gradient-to-r ${getColor(score)} rounded-full`}
                />
            </div>
        </motion.div>
    );
}

export default SEOScoreCard;
