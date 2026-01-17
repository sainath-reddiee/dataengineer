// Manual URL Input Component
// Textarea for pasting URLs to scan

import React, { useState, useEffect } from 'react';
import { Link, Trash2, Check, AlertCircle } from 'lucide-react';

export function ManualUrlInput({ onUrlsLoad, initialUrls = [] }) {
    const [input, setInput] = useState('');
    const [urls, setUrls] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (initialUrls.length > 0) {
            setInput(initialUrls.join('\n'));
            setUrls(initialUrls);
        }
    }, []);

    const parseUrls = (text) => {
        const parsed = text
            .split(/[\n\r]+/)
            .map(line => line.trim())
            .filter(line => {
                try {
                    if (!line.startsWith('http')) return false;
                    new URL(line);
                    return true;
                } catch {
                    return false;
                }
            });
        return [...new Set(parsed)]; // Remove duplicates
    };

    const handleInputChange = (e) => {
        const text = e.target.value;
        setInput(text);
        setError('');
        const parsed = parseUrls(text);
        setUrls(parsed);
    };

    const handleLoad = () => {
        if (urls.length === 0) {
            setError('No valid URLs found. Enter URLs starting with http:// or https://');
            return;
        }
        onUrlsLoad(urls.map(url => ({ url, title: new URL(url).pathname.split('/').pop() || 'Untitled' })));
    };

    const handleClear = () => {
        setInput('');
        setUrls([]);
        setError('');
    };

    return (
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Link className="w-5 h-5 text-purple-400" />
                Manual URL Input
            </h3>

            <textarea
                value={input}
                onChange={handleInputChange}
                placeholder={`Paste URLs here, one per line:\nhttps://example.com/article-1\nhttps://medium.com/@user/post\nhttps://dev.to/user/article`}
                className="w-full h-40 bg-slate-900/50 border border-slate-600 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm resize-none"
            />

            {error && (
                <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                    <span className={`text-sm ${urls.length > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                        {urls.length} valid URL{urls.length !== 1 ? 's' : ''} detected
                    </span>
                    {urls.length > 0 && urls.length < input.split('\n').filter(l => l.trim()).length && (
                        <span className="text-yellow-400 text-xs">
                            ({input.split('\n').filter(l => l.trim()).length - urls.length} invalid)
                        </span>
                    )}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleClear}
                        className="px-4 py-2 text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Clear
                    </button>
                    <button
                        onClick={handleLoad}
                        disabled={urls.length === 0}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Check className="w-4 h-4" />
                        Load {urls.length} URLs
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ManualUrlInput;
