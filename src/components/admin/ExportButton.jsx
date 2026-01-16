// src/components/admin/ExportButton.jsx
/**
 * Export Button Component
 * Dropdown for exporting report in various formats
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Copy, FileText, Table, Code, Check } from 'lucide-react';
import { exportToMarkdown, exportToCSV, exportToJSON, downloadFile, copyToClipboard } from '@/utils/seo/exportUtils';

export function ExportButton({ report, filename = 'seo-report' }) {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleExport = async (format) => {
        let content, ext, type;

        switch (format) {
            case 'markdown':
                content = exportToMarkdown(report);
                ext = 'md';
                type = 'text/markdown';
                break;
            case 'csv':
                content = exportToCSV(report);
                ext = 'csv';
                type = 'text/csv';
                break;
            case 'json':
                content = exportToJSON(report);
                ext = 'json';
                type = 'application/json';
                break;
            case 'copy':
                await copyToClipboard(exportToMarkdown(report));
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                setOpen(false);
                return;
        }

        downloadFile(content, `${filename}.${ext}`, type);
        setOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 rounded-lg text-white transition-all"
            >
                <Download className="w-4 h-4" />
                <span>Export</span>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                        <button onClick={() => handleExport('markdown')} className="flex items-center gap-3 w-full px-4 py-3 hover:bg-slate-700 text-left text-white">
                            <FileText className="w-4 h-4 text-purple-400" />
                            <span>Markdown</span>
                        </button>
                        <button onClick={() => handleExport('csv')} className="flex items-center gap-3 w-full px-4 py-3 hover:bg-slate-700 text-left text-white">
                            <Table className="w-4 h-4 text-green-400" />
                            <span>CSV</span>
                        </button>
                        <button onClick={() => handleExport('json')} className="flex items-center gap-3 w-full px-4 py-3 hover:bg-slate-700 text-left text-white">
                            <Code className="w-4 h-4 text-blue-400" />
                            <span>JSON</span>
                        </button>
                        <button onClick={() => handleExport('copy')} className="flex items-center gap-3 w-full px-4 py-3 hover:bg-slate-700 text-left text-white border-t border-slate-700">
                            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                            <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default ExportButton;
