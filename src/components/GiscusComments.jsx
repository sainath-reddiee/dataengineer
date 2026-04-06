// src/components/GiscusComments.jsx
import { useEffect, useRef } from 'react';

/**
 * Giscus comment widget — loads only when visible.
 * Configure via environment variables:
 *   VITE_GISCUS_REPO          e.g. "username/repo"
 *   VITE_GISCUS_REPO_ID       from giscus.app
 *   VITE_GISCUS_CATEGORY      e.g. "Blog Comments"
 *   VITE_GISCUS_CATEGORY_ID   from giscus.app
 *
 * If the env vars are missing the component renders nothing.
 */
const GiscusComments = () => {
  const containerRef = useRef(null);
  const loaded = useRef(false);

  const repo = import.meta.env.VITE_GISCUS_REPO;
  const repoId = import.meta.env.VITE_GISCUS_REPO_ID;
  const category = import.meta.env.VITE_GISCUS_CATEGORY || 'General';
  const categoryId = import.meta.env.VITE_GISCUS_CATEGORY_ID;

  useEffect(() => {
    if (!repo || !repoId || !categoryId) return;
    if (loaded.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loaded.current) {
          loaded.current = true;
          observer.disconnect();

          const script = document.createElement('script');
          script.src = 'https://giscus.app/client.js';
          script.setAttribute('data-repo', repo);
          script.setAttribute('data-repo-id', repoId);
          script.setAttribute('data-category', category);
          script.setAttribute('data-category-id', categoryId);
          script.setAttribute('data-mapping', 'pathname');
          script.setAttribute('data-strict', '0');
          script.setAttribute('data-reactions-enabled', '1');
          script.setAttribute('data-emit-metadata', '0');
          script.setAttribute('data-input-position', 'top');
          script.setAttribute('data-theme', 'dark_dimmed');
          script.setAttribute('data-lang', 'en');
          script.crossOrigin = 'anonymous';
          script.async = true;

          containerRef.current?.appendChild(script);
        }
      },
      { rootMargin: '200px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [repo, repoId, category, categoryId]);

  // Don't render anything if Giscus is not configured
  if (!repo || !repoId || !categoryId) return null;

  return (
    <section
      aria-label="Comments"
      className="mt-12 pt-8 border-t border-slate-700/50"
    >
      <h2 className="text-2xl font-bold text-white mb-6">Comments</h2>
      <div ref={containerRef} className="giscus min-h-[260px]" />
    </section>
  );
};

export default GiscusComments;
