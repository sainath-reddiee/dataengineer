import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Coffee, X } from 'lucide-react';
import SupportModal from '@/components/Support/SupportModal';
import { trackEvent } from '@/utils/analytics';

const SESSION_KEY = 'support_popup_shown';
// Non-blocking corner card, not a full-screen interstitial: shows once per
// session, well after the reader has committed to the article, and never
// covers the content or the ad slots.
const SCROLL_DEPTH_TRIGGER = 0.45;
const TIME_TRIGGER_MS = 45000;

const SupportPopup = () => {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let alreadyShown = false;
    try {
      alreadyShown = sessionStorage.getItem(SESSION_KEY) === 'true';
    } catch {
      alreadyShown = false;
    }
    if (alreadyShown) return;

    const reveal = () => {
      setVisible((prev) => {
        if (prev) return prev;
        try {
          sessionStorage.setItem(SESSION_KEY, 'true');
        } catch { /* noop */ }
        return true;
      });
    };

    const onScroll = () => {
      const doc = document.documentElement;
      const scrolled = doc.scrollTop / Math.max(1, doc.scrollHeight - doc.clientHeight);
      if (scrolled >= SCROLL_DEPTH_TRIGGER) {
        reveal();
        window.removeEventListener('scroll', onScroll);
      }
    };

    const timer = window.setTimeout(reveal, TIME_TRIGGER_MS);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    trackEvent({ action: 'support_popup_dismiss', category: 'monetization', label: 'article_corner_card' });
  };

  const handleOpen = () => {
    trackEvent({ action: 'support_popup_click', category: 'monetization', label: 'article_corner_card' });
    setModalOpen(true);
  };

  if (dismissed) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 40, x: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.25 }}
            role="complementary"
            aria-label="Support DataEngineer Hub"
            className="fixed bottom-4 right-4 z-[500] w-[min(90vw,19rem)]"
          >
            <div className="relative rounded-2xl border border-amber-500/30 bg-slate-900/95 backdrop-blur-xl shadow-2xl p-4">
              <button
                onClick={handleDismiss}
                aria-label="Dismiss support card"
                className="absolute top-2 right-2 p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="flex items-start gap-3 pr-4">
                <div className="shrink-0 p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                  <Coffee className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">Enjoying this article?</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Buy me a coffee — UPI or PayPal, takes 10 seconds.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleOpen}
                className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white px-3 py-2 text-xs font-semibold transition-colors"
              >
                <Coffee className="h-3.5 w-3.5" />
                Buy me a coffee
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <SupportModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>,
    document.body
  );
};

export default SupportPopup;
