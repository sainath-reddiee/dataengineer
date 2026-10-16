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
      className={`group flex items-center gap-2.5 w-auto px-4 py-2.5 rounded-2xl border backdrop-blur-md transition-all duration-300 cursor-pointer shadow-lg ${
        saved
          ? 'bg-amber-500/15 border-amber-400/50 text-amber-200 shadow-amber-500/10'
          : 'bg-gradient-to-r from-slate-800/80 to-slate-700/60 hover:from-slate-800 hover:to-slate-700 border-slate-700/50 hover:border-amber-400/40 text-slate-200 hover:text-white shadow-black/20'
      }`}
    >
      <span className={`relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300 ${
        saved
          ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-md shadow-amber-500/20 text-white'
          : 'bg-slate-700/80 group-hover:bg-amber-500/20 text-amber-400 border border-slate-600/40'
      }`}>
        {saved ? <BookmarkCheck className="w-4 h-4 text-white" /> : <Bookmark className="w-4 h-4 text-amber-400" />}
      </span>
      <span className="flex flex-col items-start leading-tight">
        <span className="text-xs sm:text-sm font-semibold group-hover:text-amber-300 transition-colors">
          {saved ? 'Saved' : 'Save'}<span className="hidden sm:inline"> for later</span>
        </span>
        <span className="hidden sm:block text-[10px] text-gray-400 group-hover:text-gray-300 transition-colors">
          {saved ? 'Saved in reading list' : 'Read offline or later'}
        </span>
      </span>
    </button>
  );
};

export default SaveArticleButton;
