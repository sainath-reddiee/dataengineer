import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import { ADSENSE_REVIEW_MODE } from '@/data/adsenseQualityGate';
import { getNextSeriesArticle } from '@/utils/articleSeries';

const UpNextBar = ({ slug, category }) => {
  const next = getNextSeriesArticle(slug, category);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);
    setVisible(false);
  }, [slug]);

  useEffect(() => {
    if (!next || dismissed) return undefined;

    const onScroll = () => {
      const doc = document.documentElement;
      const scrolled = window.scrollY / Math.max(1, doc.scrollHeight - window.innerHeight);
      setVisible(scrolled >= 0.55);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [next, dismissed]);

  if (!next || dismissed || !visible) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 inset-x-4 z-40 mx-auto max-w-3xl rounded-xl border border-blue-400/30 bg-slate-950/95 p-4 shadow-2xl backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-blue-300 mb-1">Up next</p>
          <Link
            to={`/articles/${next.slug}`}
            reloadDocument={ADSENSE_REVIEW_MODE}
            className="text-sm font-semibold text-white hover:text-blue-300"
          >
            {next.title}
          </Link>
        </div>
        <Link
          to={`/articles/${next.slug}`}
          reloadDocument={ADSENSE_REVIEW_MODE}
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
        >
          Read
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <button
          type="button"
          aria-label="Dismiss next article"
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-full p-1 text-gray-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default UpNextBar;
