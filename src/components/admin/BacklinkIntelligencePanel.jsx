// src/components/admin/BacklinkIntelligencePanel.jsx
// Backlink Intelligence — discovers external mentions/backlinks via TinyFish search.
// Shows linked mentions (existing backlinks), unlinked mentions (outreach opportunities), and referring domains.

import { useState } from 'react';

export function BacklinkIntelligencePanel({ slug, title, backlinkData, loading, onDiscover }) {
    const [expanded, setExpanded] = useState(true);

    if (!backlinkData && !loading) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                            Backlink Intelligence
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Discover external pages linking to or mentioning this article (via TinyFish search).
                        </p>
                    </div>
                </div>
                <button
                    onClick={onDiscover}
                    className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                    Run Backlink Discovery
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 text-center">
                <div className="inline-block w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Searching external mentions of "{title}"...</p>
            </div>
        );
    }

    if (backlinkData?.error) {
        return (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-300 dark:border-amber-700 p-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">{backlinkData.error}</p>
            </div>
        );
    }

    const linked = backlinkData?.linkedMentions || [];
    const unlinked = backlinkData?.unlinkedMentions || [];
    const domains = backlinkData?.referringDomains || [];

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        Backlink Intelligence
                        {backlinkData?.fromCache && (
                            <span className="text-[10px] uppercase font-bold tracking-wide px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">cached</span>
                        )}
                    </h3>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                        <Stat label="Linked" value={linked.length} color="green" />
                        <Stat label="Unlinked" value={unlinked.length} color="amber" />
                        <Stat label="Domains" value={domains.length} color="purple" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onDiscover(true)}
                        className="px-3 py-1.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg transition-colors"
                    >
                        Refresh
                    </button>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors"
                    >
                        {expanded ? 'Collapse' : 'Expand'}
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="p-5 space-y-5">
                    {linked.length > 0 && (
                        <Section title="Existing Backlinks" subtitle="External pages linking to your article" count={linked.length}>
                            {linked.map((m, i) => <MentionRow key={i} mention={m} type="linked" />)}
                        </Section>
                    )}

                    {unlinked.length > 0 && (
                        <Section
                            title="Outreach Opportunities"
                            subtitle="Pages that mention your topic but don't link — perfect for outreach"
                            count={unlinked.length}
                        >
                            {unlinked.map((m, i) => <MentionRow key={i} mention={m} type="unlinked" articleTitle={title} articleSlug={slug} />)}
                        </Section>
                    )}

                    {linked.length === 0 && unlinked.length === 0 && (
                        <div className="text-center py-8 px-4">
                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                                No external mentions found. This is a major ranking blocker — every page-1 article has at least 3-5 backlinks.
                            </p>
                            <div className="mt-4 inline-block text-left bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                                <p className="font-semibold text-purple-900 dark:text-purple-200 text-sm mb-2">Backlink starter strategy:</p>
                                <ul className="text-xs text-purple-800 dark:text-purple-300 space-y-1 list-disc list-inside">
                                    <li>Submit to data engineering newsletters (DEW, Data Eng Weekly)</li>
                                    <li>Cross-post on Medium/Dev.to with canonical link back</li>
                                    <li>Answer related questions on Stack Overflow / Reddit r/dataengineering</li>
                                    <li>Comment thoughtfully on related blog posts in your niche</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {domains.length > 0 && (
                        <Section title="Referring Domains" subtitle="Unique domains mentioning this content" count={domains.length}>
                            <div className="flex flex-wrap gap-2">
                                {domains.map((d, i) => (
                                    <span key={i} className="px-2 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded">
                                        {d}
                                    </span>
                                ))}
                            </div>
                        </Section>
                    )}
                </div>
            )}
        </div>
    );
}

function Stat({ label, value, color }) {
    const cls = {
        green: 'text-green-600 dark:text-green-400',
        amber: 'text-amber-600 dark:text-amber-400',
        purple: 'text-purple-600 dark:text-purple-400',
    }[color];
    return (
        <span className="text-slate-500 dark:text-slate-400">
            <strong className={cls}>{value}</strong> {label}
        </span>
    );
}

function Section({ title, subtitle, count, children }) {
    return (
        <div>
            <div className="mb-2">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {title} <span className="text-slate-500 dark:text-slate-400 font-normal">({count})</span>
                </h4>
                {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
            </div>
            <div className="space-y-2">{children}</div>
        </div>
    );
}

function MentionRow({ mention, type, articleTitle, articleSlug }) {
    const isUnlinked = type === 'unlinked';
    return (
        <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                    <a
                        href={mention.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline line-clamp-1"
                    >
                        {mention.title || mention.url}
                    </a>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{mention.domain}</p>
                    {mention.snippet && <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{mention.snippet}</p>}
                </div>
                {isUnlinked && (
                    <button
                        onClick={() => copyOutreach(mention, articleTitle, articleSlug)}
                        className="px-2.5 py-1 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded transition-colors flex-shrink-0"
                        title="Copy outreach email template"
                    >
                        Copy outreach
                    </button>
                )}
            </div>
        </div>
    );
}

function copyOutreach(mention, articleTitle, articleSlug) {
    const articleUrl = articleSlug
        ? `https://dataengineerhub.blog/articles/${articleSlug}`
        : 'https://dataengineerhub.blog/articles';
    const template = `Subject: Quick suggestion for "${mention.title || 'your article'}"

Hi,

I came across your article "${mention.title}" on ${mention.domain} and noticed you discuss ${articleTitle}.

I recently published a deep-dive on this exact topic that might be a useful resource for your readers: ${articleUrl}

It covers ${articleTitle} with practical examples and code samples.

Feel free to reference it if it adds value to your post.

Best,
[Your name]`;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(template).catch(() => fallbackCopy(template));
    } else {
        fallbackCopy(template);
    }
}

function fallbackCopy(text) {
    try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
    } catch { /* ignore */ }
}

export default BacklinkIntelligencePanel;
