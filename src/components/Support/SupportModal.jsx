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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="support-modal-heading"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[8%] left-1/2 -translate-x-1/2 w-full max-w-lg z-[10001] px-4"
          >
            <div className="bg-slate-900 border border-slate-700/70 rounded-2xl shadow-2xl overflow-hidden max-h-[84vh] flex flex-col">
              {/* Header */}
              <div className="relative p-5 sm:p-6 pb-4 border-b border-slate-700/50 bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-purple-500/10 shrink-0">
                <button
                  onClick={onClose}
                  aria-label="Close support dialog"
                  className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="shrink-0 p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
                    <Coffee className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 id="support-modal-heading" className="text-lg font-bold text-white">
                      Buy me a coffee ☕
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Support DataEngineer Hub directly — every bit helps.
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 overflow-y-auto">
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
