// src/components/SEO/Breadcrumbs.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Breadcrumbs Component
 * Provides visual navigation breadcrumbs.
 * Note: BreadcrumbList JSON-LD is injected by MetaTags.jsx to avoid duplicates.
 */
const Breadcrumbs = ({ breadcrumbs, className = '' }) => {
    if (!breadcrumbs || breadcrumbs.length <= 1) return null;

    return (
        <nav
            aria-label="Breadcrumb"
            className={`inline-flex items-center text-sm bg-slate-800/40 px-4 py-2 rounded-lg border border-slate-700/50 ${className}`}
        >
                <ol className="flex items-center flex-wrap">
                    {breadcrumbs.map((crumb, index) => {
                        const isLast = index === breadcrumbs.length - 1;
                        const isFirst = index === 0;

                        return (
                            <li key={crumb.url} className="flex items-center">
                                {index > 0 && (
                                    <ChevronRight className="h-3.5 w-3.5 text-gray-500 mx-2 shrink-0" aria-hidden="true" />
                                )}

                                {isLast ? (
                                    <span
                                        className="text-gray-300 font-medium line-clamp-1"
                                        aria-current="page"
                                    >
                                        {crumb.name}
                                    </span>
                                ) : (
                                    <Link
                                        to={crumb.url.replace('https://dataengineerhub.blog', '')}
                                        className="text-blue-300 hover:text-blue-200 transition-colors flex items-center gap-1 shrink-0"
                                    >
                                        {isFirst && <Home className="h-3.5 w-3.5" aria-hidden="true" />}
                                        <span className="hover:underline">{crumb.name}</span>
                                    </Link>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </nav>
    );
};

export default Breadcrumbs;
