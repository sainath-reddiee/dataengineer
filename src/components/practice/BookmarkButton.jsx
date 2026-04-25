// src/components/practice/BookmarkButton.jsx
import React from 'react';
import { Bookmark } from 'lucide-react';
import { useQuizStore } from '@/hooks/useQuizStore';

const BookmarkButton = ({ quizSlug, questionId, className = '' }) => {
  const { isBookmarked, toggleBookmark } = useQuizStore();
  const active = isBookmarked(quizSlug, questionId);
  return (
    <button
      type="button"
      onClick={() => toggleBookmark(quizSlug, questionId)}
      aria-label={active ? 'Remove bookmark' : 'Bookmark this question'}
      className={`p-1.5 rounded-md border transition-colors ${
        active
          ? 'border-amber-500 bg-amber-500/10 text-amber-300'
          : 'border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500'
      } ${className}`}
    >
      <Bookmark className="w-4 h-4" fill={active ? 'currentColor' : 'none'} />
    </button>
  );
};

export default BookmarkButton;
