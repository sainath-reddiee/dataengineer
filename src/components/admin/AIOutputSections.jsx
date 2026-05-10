// src/components/admin/AIOutputSections.jsx
// Parses AI-generated fix/suggestion text into structured sections with per-section copy buttons.

import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';

/**
 * Safe clipboard write — handles missing clipboard API (insecure contexts, older browsers).
 */
function safeCopy(text) {
    if (navigator.clipboard?.writeText) {
        return navigator.clipboard.writeText(text).catch(() => false);
    }
    // Fallback: textarea hack for HTTP contexts
    try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        return Promise.resolve(true);
    } catch {
        return Promise.resolve(false);
    }
}

/**
 * Parse AI output text into sections by detecting markdown-style headers.
 * Supports: ## Header, ### Header, **1. Header**, numbered bold patterns, --- separators
 */
function parseSections(text) {
    if (!text || typeof text !== 'string') return [];

    const lines = text.split('\n');
    const sections = [];
    let currentTitle = '';
    let currentContent = [];

    const isHeader = (line) => {
        const trimmed = line.trim();
        if (/^#{1,3}\s+/.test(trimmed)) return trimmed.replace(/^#{1,3}\s+/, '');
        if (/^\*\*\d+[\.\)]\s*.+\*\*/.test(trimmed)) return trimmed.replace(/\*\*/g, '').replace(/^\d+[\.\)]\s*/, '');
        if (/^---+$/.test(trimmed)) return null; // separator, not a header
        return false;
    };

    for (const line of lines) {
        const headerResult = isHeader(line);

        if (headerResult === null) {
            if (currentTitle || currentContent.length > 0) {
                sections.push({ title: currentTitle, content: currentContent.join('\n').trim() });
                currentTitle = '';
                currentContent = [];
            }
        } else if (headerResult) {
            if (currentTitle || currentContent.length > 0) {
                sections.push({ title: currentTitle, content: currentContent.join('\n').trim() });
            }
            currentTitle = headerResult;
            currentContent = [];
        } else {
            currentContent.push(line);
        }
    }

    if (currentTitle || currentContent.length > 0) {
        sections.push({ title: currentTitle, content: currentContent.join('\n').trim() });
    }

    return sections.filter(s => s.content.length > 0 || s.title.length > 0);
}

function SectionBlock({ title, content, index }) {
    const [copied, setCopied] = useState(false);
    const [expanded, setExpanded] = useState(true);
    const timerRef = useRef(null);

    useEffect(() => () => clearTimeout(timerRef.current), []);

    const copyText = title ? `${title}\n\n${content}` : content;

    const handleCopy = () => {
        safeCopy(copyText).then(() => {
            clearTimeout(timerRef.current);
            setCopied(true);
            timerRef.current = setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="border border-slate-700/50 rounded-lg overflow-hidden">
            <div
                className="flex items-center justify-between px-3 py-2 bg-slate-800/60 cursor-pointer hover:bg-slate-800/80 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-2 min-w-0">
                    {expanded ? <ChevronDown className="w-3 h-3 text-gray-500 shrink-0" /> : <ChevronRight className="w-3 h-3 text-gray-500 shrink-0" />}
                    <span className="text-xs font-medium text-white truncate">
                        {title || `Section ${index + 1}`}
                    </span>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] text-blue-400 hover:text-blue-300 rounded hover:bg-slate-700/50 transition-colors shrink-0"
                >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            {expanded && (
                <div className="px-3 py-2 text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed max-h-60 overflow-y-auto">
                    {content}
                </div>
            )}
        </div>
    );
}

/**
 * AIOutputSections — renders AI output as structured, copyable sections.
 * Falls back to full-text display if no sections can be parsed.
 */
export function AIOutputSections({ text, className = '' }) {
    const [allCopied, setAllCopied] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => () => clearTimeout(timerRef.current), []);

    if (!text) return null;

    const sections = parseSections(text);

    const handleCopyAll = () => {
        safeCopy(text).then(() => {
            clearTimeout(timerRef.current);
            setAllCopied(true);
            timerRef.current = setTimeout(() => setAllCopied(false), 2000);
        });
    };

    // If parsing found only 1 section or failed, show raw text with copy
    if (sections.length <= 1) {
        return (
            <div className={`bg-slate-900/80 rounded-xl border border-slate-700/50 ${className}`}>
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/50">
                    <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">AI Output</span>
                    <button
                        onClick={handleCopyAll}
                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                    >
                        {allCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {allCopied ? 'Copied!' : 'Copy All'}
                    </button>
                </div>
                <div className="p-4 text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
                    {text}
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-slate-900/80 rounded-xl border border-slate-700/50 ${className}`}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/50">
                <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                    {sections.length} Sections
                </span>
                <button
                    onClick={handleCopyAll}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                >
                    {allCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {allCopied ? 'Copied!' : 'Copy All'}
                </button>
            </div>
            <div className="p-3 space-y-2">
                {sections.map((section, i) => (
                    <SectionBlock key={i} title={section.title} content={section.content} index={i} />
                ))}
            </div>
        </div>
    );
}

export default AIOutputSections;
