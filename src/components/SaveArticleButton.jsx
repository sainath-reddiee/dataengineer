import React from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useReadingList } from '@/hooks/useReadingList';
import { trackEvent } from '@/utils/analytics';

const SaveArticleButton = ({ slug, title }) => {
  const { saved, toggle } = useReadingList(slug);

  if (!slug || !title) return null;

  const handleClick = () => {
    toggle({ slug, title });
    trackEvent({
      action: saved ? 'unsave_article' : 'save_article',
      category: 'engagement',
      label: slug,
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from reading list' : 'Save article for later'}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        saved
          ? 'border-amber-400/50 bg-amber-500/15 text-amber-100'
          : 'border-slate-600 text-slate-200 hover:border-amber-400/40 hover:text-white'
      }`}
    >
      {saved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
      {saved ? 'Saved' : 'Save for later'}
    </button>
  );
};

export default SaveArticleButton;
