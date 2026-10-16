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
      className={`group inline-flex h-10 items-center gap-2 rounded border px-3 text-sm transition-colors ${
        saved
          ? 'border-rust-300 bg-rust-50 text-rust-700'
          : 'border-paper-500 text-ink-soft hover:border-paper-600 hover:text-ink'
      }`}
    >
      {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      <span>{saved ? 'Saved' : 'Save'}</span>
    </button>
  );
};

export default SaveArticleButton;
