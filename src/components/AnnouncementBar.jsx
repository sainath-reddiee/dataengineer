import { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';

// ─── Configuration ───────────────────────────────────────────────
// Change `id` to force a new announcement for all users (even those
// who dismissed a previous one). Update message/link as needed.
const ANNOUNCEMENT = {
  id: 'snowpro-gen-ai-2026',
  emoji: '\uD83C\uDF93',
  message: 'New Course: Snowflake SnowPro Specialty: Gen AI Practice Tests 2026',
  linkText: 'Enroll Now',
  linkUrl:
    'https://www.udemy.com/course/snowpro-specialty-generative-ai-practice-exams-ges-c01/?referralCode=54600677AA1322EA8749',
};

const STORAGE_KEY = `announcement_dismissed_${ANNOUNCEMENT.id}`;

const AnnouncementBar = ({ onVisibilityChange }) => {
  // Read dismissal state synchronously on the very first render so the parent
  // layout can reserve padding without a visible layout shift when the bar
  // actually needs to be shown. During SSG/prerender there is no localStorage;
  // default to not-visible to match the static HTML output.
  const initialVisible = (() => {
    if (typeof window === 'undefined') return false;
    try {
      return !localStorage.getItem(STORAGE_KEY);
    } catch {
      return false;
    }
  })();

  const [visible, setVisible] = useState(initialVisible);

  useEffect(() => {
    if (visible) {
      onVisibilityChange?.(true);
    }
    // We only want this to run once per mount; visibility changes from the
    // dismiss button call onVisibilityChange directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, 'true'); } catch { /* quota / incognito */ }
    setVisible(false);
    onVisibilityChange?.(false);
  };

  if (!visible) return null;

  return (
    <div
      role="banner"
      className="fixed top-0 left-0 right-0 z-[10000] bg-gradient-to-r from-violet-600 via-blue-600 to-indigo-600"
    >
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3 text-sm text-white">
        <div className="flex items-center gap-2 min-w-0 flex-1 justify-center">
          <span className="hidden sm:inline">{ANNOUNCEMENT.emoji}</span>
          <span className="truncate font-medium">{ANNOUNCEMENT.message}</span>
          <a
            href={ANNOUNCEMENT.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1 rounded-full bg-white/20 hover:bg-white/30 px-3 py-0.5 text-xs font-semibold transition-colors"
          >
            {ANNOUNCEMENT.linkText}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss announcement"
          className="shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBar;
