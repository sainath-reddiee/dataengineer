// src/components/ReadingProgressBar.jsx - Lightweight CSS-driven progress bar (no framer-motion)
import { useState, useEffect } from 'react';

const ReadingProgressBar = ({ readTime }) => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let rafId = null;

    const updateProgress = () => {
      rafId = null;
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      const ratio = total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0;
      setProgress(ratio);
      setIsVisible(ratio > 0.02 && ratio < 0.98);
    };

    const onScroll = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(updateProgress);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    updateProgress();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, []);

  const totalMinutes = readTime ? parseInt(readTime, 10) || 0 : 0;
  const minutesLeft = Math.max(1, Math.ceil(totalMinutes * (1 - progress)));

  return (
    <>
      <div
        className="fixed left-0 right-0 top-0 z-[9998] h-0.5 bg-paper-400"
        aria-hidden="true"
      >
        <div
          className="h-full origin-left bg-rust-600 transition-transform duration-75 ease-out"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>

      {totalMinutes > 0 && isVisible && (
        <div
          className="fixed right-4 top-3 z-[9997] rounded border border-paper-500 bg-paper-50 px-2.5 py-1 font-mono text-[11px] text-ink-muted"
          aria-live="off"
        >
          {progress >= 0.95 ? 'Done reading' : `${minutesLeft} min left`}
        </div>
      )}
    </>
  );
};

export default ReadingProgressBar;
