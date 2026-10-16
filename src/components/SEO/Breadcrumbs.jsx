// src/components/SEO/Breadcrumbs.jsx
import { Link } from 'react-router-dom';

/**
 * Breadcrumbs Component
 * A quiet text trail ("Home / Articles / Title"), not a boxed widget.
 * Note: BreadcrumbList JSON-LD is injected by MetaTags.jsx to avoid duplicates.
 */
const Breadcrumbs = ({ breadcrumbs, className = '' }) => {
    if (!breadcrumbs || breadcrumbs.length <= 1) return null;

    return (
        <nav aria-label="Breadcrumb" className={`min-w-0 font-mono text-[12px] text-ink-faint ${className}`}>
            <ol className="flex min-w-0 flex-wrap items-center">
                {breadcrumbs.map((crumb, index) => {
                    const isLast = index === breadcrumbs.length - 1;

                    return (
                        <li key={crumb.url} className="flex min-w-0 items-center">
                            {index > 0 && <span className="mx-2 text-paper-600" aria-hidden="true">/</span>}

                            {isLast ? (
                                <span className="line-clamp-1 text-ink-muted" aria-current="page">
                                    {crumb.name}
                                </span>
                            ) : (
                                <Link
                                    to={crumb.url.replace('https://dataengineerhub.blog', '')}
                                    className="shrink-0 text-ink-muted underline-offset-2 transition-colors hover:text-rust-600 hover:underline"
                                >
                                    {crumb.name}
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
