// src/pages/admin/ScheduledScansPage.jsx
/**
 * Scheduled Scans Page
 * UI for managing automated periodic scans with advanced configuration
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Plus, Trash2, Play, AlertCircle, X, Smartphone, Monitor, Mail, Layers } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export function ScheduledScansPage() {
    const { toast } = useToast();
    const [scans, setScans] = useState([
        { id: 1, name: 'Weekly Site Audit', frequency: 'Weekly', nextRun: '2024-03-25T09:00:00', status: 'Active', target: 'All Pages', device: 'Desktop', depth: 'Full' },
        { id: 2, name: 'Daily Critical Check', frequency: 'Daily', nextRun: '2024-03-19T08:00:00', status: 'Paused', target: 'Homepage Only', device: 'Mobile', depth: 'Single' }
    ]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newScan, setNewScan] = useState({
        name: '',
        target: '',
        frequency: 'Weekly',
        device: 'Desktop',
        depth: 'Standard',
        email: ''
    });

    const handleRunNow = (name) => {
        toast({
            title: "Scan Started",
            description: `Analyzing ${name}... (Check history for results)`,
        });
    };

    const handleDelete = (id) => {
        setScans(scans.filter(s => s.id !== id));
        toast({
            title: "Schedule Deleted",
            description: "The scan schedule has been removed.",
            variant: "destructive"
        });
    };

    const handleSaveSchedule = (e) => {
        e.preventDefault();

        if (!newScan.name || !newScan.target) {
            toast({ title: "Validation Error", description: "Name and Target URL are required.", variant: "destructive" });
            return;
        }

        const newId = scans.length + 1;
        const scanEntry = {
            id: newId,
            name: newScan.name,
            frequency: newScan.frequency,
            nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'Active',
            target: newScan.target,
            device: newScan.device,
            depth: newScan.depth
        };

        setScans([...scans, scanEntry]);
        setIsModalOpen(false);
        setNewScan({ name: '', target: '', frequency: 'Weekly', device: 'Desktop', depth: 'Standard', email: '' });

        toast({
            title: "Schedule Created",
            description: `Scheduled "${newScan.name}" for ${newScan.frequency} execution.`,
        });
    };

    const daysUntil = (dateStr) => {
        const diff = new Date(dateStr) - new Date();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days > 0 ? `in ${days} days` : 'Today';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Scheduled Scans</h1>
                    <p className="text-gray-400">Automate your SEO monitoring</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors">
                    <Plus className="w-5 h-5" />
                    New Schedule
                </button>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-blue-400 mt-1" />
                <div>
                    <h4 className="font-bold text-blue-400">Automated Monitoring</h4>
                    <p className="text-sm text-gray-300 mt-1">
                        Scheduled scans run automatically in the background. You will receive an email digest if critical issues are found.
                        <br />
                        <span className="text-xs text-blue-300/60 mt-2 block">* This feature requires a backend cron job service which is currently being configured.</span>
                    </p>
                </div>
            </div>

            {/* Scans List */}
            <div className="grid gap-4">
                {scans.map((scan) => (
                    <motion.div
                        key={scan.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 flex items-center justify-between group hover:border-blue-500/30 transition-all"
                    >
                        <div className="flex items-center gap-6">
                            <div className={`p-3 rounded-xl ${scan.status === 'Active' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">{scan.name}</h3>
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" /> {scan.frequency}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        {scan.device === 'Mobile' ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                                        {scan.device || 'Desktop'}
                                    </span>
                                    <span>•</span>
                                    <span>Target: {scan.target}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-xs text-gray-500 uppercase tracking-wider">Next Run</p>
                                <p className="text-white font-mono">{new Date(scan.nextRun).toLocaleDateString()}</p>
                                <p className="text-xs text-blue-400">{daysUntil(scan.nextRun)}</p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleRunNow(scan.name)}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-lg" title="Run Now">
                                    <Play className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(scan.id)}
                                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg" title="Delete">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Advanced Configuration Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-slate-800">
                                <h2 className="text-xl font-bold text-white">Configure New Scan</h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveSchedule} className="p-6 space-y-6">
                                {/* Basic Info */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400">Scan Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Weekly Site Audit"
                                            value={newScan.name}
                                            onChange={e => setNewScan({ ...newScan, name: e.target.value })}
                                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400">Target URL / Path</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. /blog or https://example.com"
                                            value={newScan.target}
                                            onChange={e => setNewScan({ ...newScan, target: e.target.value })}
                                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Configuration Metrics */}
                                <div className="grid grid-cols-3 gap-6">
                                    {/* Frequency */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                            <Clock className="w-4 h-4" /> Frequency
                                        </label>
                                        <select
                                            value={newScan.frequency}
                                            onChange={e => setNewScan({ ...newScan, frequency: e.target.value })}
                                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                                        >
                                            <option value="Daily">Daily</option>
                                            <option value="Weekly">Weekly</option>
                                            <option value="Monthly">Monthly</option>
                                        </select>
                                    </div>

                                    {/* Device */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                            <Smartphone className="w-4 h-4" /> Device
                                        </label>
                                        <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                                            <button
                                                type="button"
                                                onClick={() => setNewScan({ ...newScan, device: 'Desktop' })}
                                                className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${newScan.device === 'Desktop' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                            >
                                                Desktop
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setNewScan({ ...newScan, device: 'Mobile' })}
                                                className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${newScan.device === 'Mobile' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                            >
                                                Mobile
                                            </button>
                                        </div>
                                    </div>

                                    {/* Crawler Depth */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                            <Layers className="w-4 h-4" /> Depth
                                        </label>
                                        <select
                                            value={newScan.depth}
                                            onChange={e => setNewScan({ ...newScan, depth: e.target.value })}
                                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                                        >
                                            <option value="Single">Single Page</option>
                                            <option value="Standard">Standard (2 Levels)</option>
                                            <option value="Deep">Deep Crawl (All)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Notifications */}
                                <div className="space-y-2 border-t border-slate-800 pt-4">
                                    <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                        <Mail className="w-4 h-4" /> Email Notifications
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="Enter email for alerts (optional)"
                                        value={newScan.email}
                                        onChange={e => setNewScan({ ...newScan, email: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                                    />
                                    <p className="text-xs text-gray-500">We'll alert you if critical issues count exceeds 5.</p>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-4 pt-4 border-t border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-6 py-2 text-gray-400 hover:text-white font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20"
                                    >
                                        Create Schedule
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default ScheduledScansPage;
