import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Coffee, X } from 'lucide-react';
import SupportPanel from '@/components/Support/SupportPanel';

const SupportModal = ({ isOpen, onClose }) => {
  // Portal to <body> so this fixed-position dialog is never trapped inside
  // an animated ancestor (framer-motion leaves a residual `transform` on
  // settled whileInView elements, which turns position:fixed descendants
  // into relative-to-that-ancestor instead of relative-to-viewport).
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[10000]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="support-modal-heading"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-0 left-0 z-[10001] flex w-[100dvw] max-h-[100dvh] items-end justify-center sm:inset-0 sm:w-auto sm:items-center sm:p-4"
          >
            <div className="w-full max-w-lg max-h-[92dvh] sm:max-h-[88vh] bg-slate-900 border border-slate-700/70 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              {/* Drag handle — mobile bottom sheet affordance */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
                <div className="h-1 w-10 rounded-full bg-slate-600" />
              </div>

              {/* Header */}
              <div className="relative px-5 pt-2 pb-4 sm:px-6 sm:pt-6 sm:pb-4 border-b border-slate-700/50 bg-gradient-to-br from-amber-500/12 via-slate-900 to-blue-500/8 shrink-0">
                <button
                  onClick={onClose}
                  aria-label="Close support dialog"
                  className="absolute top-3 right-3 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-3 pr-8">
                  <div className="shrink-0 p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-amber-900/30">
                    <Coffee className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 id="support-modal-heading" className="text-lg font-bold text-white">
                      Buy me a coffee ☕
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Dodo Payments · UPI · PayPal
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 overflow-y-auto overscroll-contain">
                <SupportPanel layout="tabs" source="modal" />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default SupportModal;
