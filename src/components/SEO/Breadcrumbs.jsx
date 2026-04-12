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
            className={`flex items-center space-x-2 text-sm ${className}`}
        >
                <ol className="flex items-center space-x-2 flex-wrap">
                    {breadcrumbs.map((crumb, index) => {
                        const isLast = index === breadcrumbs.length - 1;
                        const isFirst = index === 0;

                        return (
                            <li key={crumb.url} className="flex items-center">
                                {index > 0 && (
                                    <ChevronRight className="h-4 w-4 text-gray-400 mx-2" aria-hidden="true" />
                                )}

                                {isLast ? (
                                    <span
                                        className="text-gray-400 font-medium truncate max-w-xs"
                                        aria-current="page"
                                    >
                                        {crumb.name}
                                    </span>
                                ) : (
                                    <Link
                                        to={crumb.url.replace('https://dataengineerhub.blog', '')}
                                        className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                                    >
                                        {isFirst && <Home className="h-4 w-4" aria-hidden="true" />}
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
