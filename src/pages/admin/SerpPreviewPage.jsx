// src/pages/admin/SerpPreviewPage.jsx
/**
 * SERP Preview Page - See how pages look in search results
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Globe, Monitor, Smartphone, Loader2 } from 'lucide-react';

export function SerpPreviewPage() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [device, setDevice] = useState('desktop');
    const [mode, setMode] = useState('fetch'); // 'fetch' or 'manual'
    const [manualData, setManualData] = useState({
        title: 'Your Amazing Page Title Goes Here',
        description: 'This is a sample meta description. Write something catchy to attract clicks! Ideally between 120 and 160 characters.',
        url: 'https://example.com/your-slug',
        favicon: ''
    });

    const handlePreview = async () => {
        if (!url.trim()) return;

        setLoading(true);
        try {
            let finalUrl = url.trim();
            if (!finalUrl.startsWith('http')) finalUrl = 'https://' + finalUrl;

            const proxyUrl = finalUrl.includes('dataengineerhub.blog')
                ? finalUrl
                : `https://api.allorigins.win/raw?url=${encodeURIComponent(finalUrl)}`;

            const response = await fetch(proxyUrl);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const title = doc.querySelector('title')?.textContent || 'No title found';
            const description = doc.querySelector('meta[name="description"]')?.content || 'No description found';
            const favicon = doc.querySelector('link[rel="icon"]')?.href || '';

            setPreview({
                url: finalUrl,
                title,
                description,
                favicon,
                displayUrl: new URL(finalUrl).hostname + new URL(finalUrl).pathname
            });
        } catch (err) {
            console.error('Preview failed:', err);
        } finally {
            setLoading(false);
        }
    };

    // Use manual data if in manual mode, otherwise fetched preview
    const activePreview = mode === 'manual' ? {
        title: manualData.title,
        description: manualData.description,
        displayUrl: manualData.url.replace(/^https?:\/\//, ''),
        favicon: manualData.favicon,
        url: manualData.url
    } : preview;


    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">SERP Preview</h1>
                <p className="text-gray-400">See how your page appears in search results</p>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-4 border-b border-slate-700 pb-1">
                <button
                    onClick={() => setMode('fetch')}
                    className={`px-4 py-2 font-medium text-sm transition-colors ${mode === 'fetch' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
                >
                    Fetch URL
                </button>
                <button
                    onClick={() => setMode('manual')}
                    className={`px-4 py-2 font-medium text-sm transition-colors ${mode === 'manual' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
                >
                    Manual Editor (Real-time)
                </button>
            </div>

            {/* Fetch Mode Input */}
            {mode === 'fetch' && (
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Enter URL to preview"
                                className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <button
                            onClick={handlePreview}
                            disabled={loading}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
                            Preview
                        </button>
                    </div>
                </div>
            )}

            {/* Manual Edit Mode Inputs */}
            {mode === 'manual' && (
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Page Title</label>
                        <input
                            type="text"
                            value={manualData.title}
                            onChange={(e) => setManualData({ ...manualData, title: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Meta Description</label>
                        <textarea
                            value={manualData.description}
                            onChange={(e) => setManualData({ ...manualData, description: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-blue-500 min-h-[80px]"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Display URL</label>
                        <input
                            type="text"
                            value={manualData.url}
                            onChange={(e) => setManualData({ ...manualData, url: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-blue-500"
                        />
                    </div>
                </div>
            )}

            {/* Device Toggle */}
            {(activePreview || mode === 'manual') && (
                <div className="flex justify-center gap-2">
                    <button
                        onClick={() => setDevice('desktop')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${device === 'desktop' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-gray-400'}`}
                    >
                        <Monitor className="w-4 h-4" /> Desktop
                    </button>
                    <button
                        onClick={() => setDevice('mobile')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${device === 'mobile' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-gray-400'}`}
                    >
                        <Smartphone className="w-4 h-4" /> Mobile
                    </button>
                </div>
            )}

            {/* Preview Card */}
            {(activePreview || mode === 'manual') && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center">
                    <div className={`bg-white rounded-xl p-6 ${device === 'desktop' ? 'w-full max-w-2xl' : 'w-80'}`}>
                        {/* Google Logo */}
                        <div className="mb-6">
                            <svg viewBox="0 0 272 92" className="h-8">
                                <path fill="#4285F4" d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" />
                                <path fill="#EA4335" d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" />
                                <path fill="#FBBC05" d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z" />
                                <path fill="#4285F4" d="M225 3v65h-9.5V3h9.5z" />
                                <path fill="#34A853" d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z" />
                                <path fill="#EA4335" d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z" />
                            </svg>
                        </div>

                        {/* Search Result */}
                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                                    {activePreview.favicon ? (
                                        <img src={activePreview.favicon} alt="" className="w-4 h-4" />
                                    ) : (
                                        <Globe className="w-4 h-4 text-gray-400" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 truncate">{activePreview.displayUrl}</p>
                                </div>
                            </div>
                            <h3 className="text-xl text-blue-700 hover:underline cursor-pointer leading-tight">
                                {activePreview.title.length > 60 ? activePreview.title.substring(0, 60) + '...' : activePreview.title}
                            </h3>
                            <p className={`text-sm text-gray-600 mt-1 ${device === 'mobile' ? 'line-clamp-2' : 'line-clamp-3'}`}>
                                {activePreview.description.length > 160 ? activePreview.description.substring(0, 160) + '...' : activePreview.description}
                            </p>
                        </div>

                        {/* Meta Info */}
                        <div className="border-t pt-4 mt-4">
                            <div className="text-xs text-gray-500 space-y-1">
                                <p>
                                    Title: {activePreview.title.length} characters
                                    {activePreview.title.length > 60 && ' ⚠️ Too long (Google cuts off at ~60)'}
                                    {activePreview.title.length < 30 && ' ⚠️ Too short'}
                                </p>
                                <p>
                                    Description: {activePreview.description.length} characters
                                    {(activePreview.description.length < 120 || activePreview.description.length > 160) && ' ⚠️ Recommended: 120-160 chars'}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

export default SerpPreviewPage;
