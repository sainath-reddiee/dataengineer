// Feed URL Input Component
// Parse sitemap, RSS, JSON, or plain text feeds

import React, { useState } from 'react';
import { Rss, Loader2, Check, AlertCircle, FileText, Code, List } from 'lucide-react';
import feedParser from '@/services/feedParser';

export function FeedUrlInput({ onUrlsLoad }) {
    const [feedUrl, setFeedUrl] = useState('');
    const [format, setFormat] = useState('auto');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    const formats = [
        { id: 'auto', label: 'Auto-detect', icon: FileText },
        { id: 'sitemap', label: 'Sitemap', icon: Code },
        { id: 'rss', label: 'RSS/Atom', icon: Rss },
        { id: 'json', label: 'JSON', icon: Code },
        { id: 'text', label: 'Plain Text', icon: List }
    ];

    const handleLoad = async () => {
        if (!feedUrl.trim()) {
            setError('Please enter a feed URL');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const urls = await feedParser.parseUrl(feedUrl, format);
            if (urls.length === 0) {
                setError('No URLs found in the feed');
            } else {
                setResult({ count: urls.length, urls });
            }
        } catch (err) {
            setError(err.message || 'Failed to parse feed');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        if (result?.urls) {
            onUrlsLoad(result.urls.map(url => ({
                url,
                title: new URL(url).pathname.split('/').filter(Boolean).pop() || 'Untitled'
            })));
        }
    };

    return (
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Rss className="w-5 h-5 text-purple-400" />
                Feed / Sitemap URL
            </h3>

            <div className="flex gap-2 mb-4">
                <input
                    type="url"
                    value={feedUrl}
                    onChange={(e) => { setFeedUrl(e.target.value); setError(''); setResult(null); }}
                    placeholder="https://example.com/sitemap.xml"
                    className="flex-1 bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                    onClick={handleLoad}
                    disabled={loading || !feedUrl.trim()}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    {loading ? 'Loading...' : 'Load'}
                </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                {formats.map(f => (
                    <button
                        key={f.id}
                        onClick={() => setFormat(f.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-colors ${format === f.id
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-700/50 text-gray-400 hover:text-white'
                            }`}
                    >
                        <f.icon className="w-3.5 h-3.5" />
                        {f.label}
                    </button>
                ))}
            </div>

            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                </div>
            )}

            {result && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-green-400">
                            <Check className="w-5 h-5" />
                            <span className="font-medium">Found {result.count} URLs</span>
                        </div>
                        <button
                            onClick={handleConfirm}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            Load All URLs
                        </button>
                    </div>
                    <div className="mt-3 max-h-32 overflow-y-auto">
                        <div className="text-xs text-gray-400 space-y-1">
                            {result.urls.slice(0, 5).map((url, i) => (
                                <div key={i} className="truncate">{url}</div>
                            ))}
                            {result.urls.length > 5 && (
                                <div className="text-gray-500">...and {result.urls.length - 5} more</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-4 text-xs text-gray-500">
                Supports: XML Sitemap, RSS/Atom feeds, JSON feeds, plain text (one URL per line)
            </div>
        </div>
    );
}

export default FeedUrlInput;
