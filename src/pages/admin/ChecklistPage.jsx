/**
 * Interactive SEO Checklist Page
 * Manual checks for comprehensive SEO that automated tools might miss
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Square, Save, RotateCcw, ClipboardCheck, AlertCircle } from 'lucide-react';

const CHECKLIST_STORAGE_KEY = 'seo_toolkit_checklist_v1';

const CHECKLIST_SECTIONS = [
    {
        title: 'Content Quality',
        items: [
            { id: 'content_1', label: 'Keyword in H1 tag?' },
            { id: 'content_2', label: 'Keyword in first 100 words?' },
            { id: 'content_3', label: 'Content length > 1000 words?' },
            { id: 'content_4', label: 'Used subheadings (H2, H3) logically?' },
            { id: 'content_5', label: 'Images have descriptive Alt text?' }
        ]
    },
    {
        title: 'Technical SEO',
        items: [
            { id: 'tech_1', label: 'Fast page load speed (< 2s)?' },
            { id: 'tech_2', label: 'Mobile responsive design verified?' },
            { id: 'tech_3', label: 'Canonical tag is correct?' },
            { id: 'tech_4', label: 'No broken links?' },
            { id: 'tech_5', label: 'Schema markup verified?' }
        ]
    },
    {
        title: 'Meta Data',
        items: [
            { id: 'meta_1', label: 'Meta Title is unique & clickable?' },
            { id: 'meta_2', label: 'Meta Description includes CTA?' },
            { id: 'meta_3', label: 'URL slug is clean and short?' }
        ]
    }
];

export function ChecklistPage() {
    const [checkedItems, setCheckedItems] = useState({});
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const saved = localStorage.getItem(CHECKLIST_STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setCheckedItems(parsed);
                updateProgress(parsed);
            } catch (e) {
                console.error('Failed to load checklist', e);
            }
        }
    }, []);

    const updateProgress = (items) => {
        const total = CHECKLIST_SECTIONS.reduce((acc, sec) => acc + sec.items.length, 0);
        const completed = Object.values(items).filter(Boolean).length;
        setProgress(Math.round((completed / total) * 100));
    };

    const toggleItem = (id) => {
        const newItems = { ...checkedItems, [id]: !checkedItems[id] };
        setCheckedItems(newItems);
        updateProgress(newItems);
        localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(newItems));
    };

    const resetChecklist = () => {
        if (window.confirm('Reset all progress?')) {
            setCheckedItems({});
            setProgress(0);
            localStorage.removeItem(CHECKLIST_STORAGE_KEY);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">SEO Pre-Publish Checklist</h1>
                    <p className="text-gray-400">Manual verification for perfect optimization</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end mr-4">
                        <span className="text-2xl font-bold text-green-400">{progress}%</span>
                        <span className="text-xs text-gray-400">Completed</span>
                    </div>
                    <button
                        onClick={resetChecklist}
                        className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        title="Reset Checklist"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {CHECKLIST_SECTIONS.map((section, idx) => (
                    <motion.div
                        key={section.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6"
                    >
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <ClipboardCheck className="w-5 h-5 text-purple-400" />
                            {section.title}
                        </h3>
                        <div className="space-y-3">
                            {section.items.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => toggleItem(item.id)}
                                    className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border ${checkedItems[item.id]
                                            ? 'bg-green-500/10 border-green-500/30'
                                            : 'bg-slate-700/30 border-transparent hover:bg-slate-700/50'
                                        }`}
                                >
                                    <div className={`mt-0.5 ${checkedItems[item.id] ? 'text-green-400' : 'text-gray-500'}`}>
                                        {checkedItems[item.id] ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                    </div>
                                    <span className={`${checkedItems[item.id] ? 'text-gray-200 line-through decoration-gray-500/50' : 'text-gray-300'}`}>
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                    <h4 className="text-sm font-bold text-blue-400">Pro Tip</h4>
                    <p className="text-sm text-gray-400 mt-1">
                        Use this checklist alongside the <strong>SEO Scanner</strong>. While the scanner finds technical issues, this checklist ensures human-centric quality checks like content flow and readability.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ChecklistPage;
