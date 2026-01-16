// src/components/admin/AdminLayout.jsx
/**
 * Admin Layout with Sidebar Navigation
 */

import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, Search, Layers, GitCompare,
    Code2, Eye, Sparkles, LogOut, ChevronLeft, CheckSquare, Calendar
} from 'lucide-react';
import { AdminAuth, useAdminAuth } from './AdminAuth';

const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/admin/scanner', icon: Search, label: 'SEO Scanner' },
    { path: '/admin/bulk', icon: Layers, label: 'Bulk Scan' },
    { path: '/admin/compare', icon: GitCompare, label: 'Compare URLs' },
    { path: '/admin/schema', icon: Code2, label: 'Schema Generator' },
    { path: '/admin/serp', icon: Eye, label: 'SERP Preview' },
    { path: '/admin/ai-suite', icon: Sparkles, label: 'AI Suite' },
    { path: '/admin/checklist', icon: CheckSquare, label: 'Checklist' },
    { path: '/admin/schedule', icon: Calendar, label: 'Scheduled Scans' },
];

function AdminNav() {
    const location = useLocation();
    const { logout } = useAdminAuth();

    return (
        <aside className="w-64 bg-slate-800/50 backdrop-blur-xl border-r border-slate-700 min-h-screen flex flex-col">
            <div className="p-4 border-b border-slate-700">
                <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white mb-4">
                    <ChevronLeft className="w-4 h-4" />
                    <span className="text-sm">Back to Blog</span>
                </Link>
                <h1 className="text-xl font-bold gradient-text">SEO Toolkit</h1>
                <p className="text-xs text-gray-500">Admin Dashboard</p>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = item.exact
                        ? location.pathname === item.path
                        : location.pathname.startsWith(item.path);

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border border-blue-500/30'
                                : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-700">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}

export function AdminLayout() {
    return (
        <AdminAuth>
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
                <AdminNav />
                <main className="flex-1 p-6 overflow-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Outlet />
                    </motion.div>
                </main>
            </div>
        </AdminAuth>
    );
}

export default AdminLayout;
