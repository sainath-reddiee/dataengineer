// src/components/NewsletterPopup.jsx
// Premium SaaS-style newsletter popup with exit-intent, time-delay, and scroll-depth triggers
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import {
  X, Mail, Sparkles, CheckCircle, AlertCircle, Loader2,
  Zap, TrendingUp, BookOpen, Users
} from 'lucide-react';
import { useNewsletter } from '@/hooks/useWordPress';
import { trackNewsletterSignup } from '@/utils/analytics';

// ─── Constants ───────────────────────────────────────────────────────────────
const STORAGE_KEY = 'newsletter_popup';
const DISMISS_COOLDOWN_DAYS = 15;
const TIME_DELAY_MS = 8000;      // 8 seconds
const SCROLL_THRESHOLD = 0.40;  // 40% of page

// Pages where the popup should NOT appear
const EXCLUDED_PATHS = ['/newsletter', '/articles/'];

// Common bot user-agent pattern
const BOT_UA =
  /bot|crawl|spider|slurp|facebookexternalhit|linkedinbot|twitterbot|googlebot|bingbot|semrushbot|ahrefsbot|gptbot|claudebot/i;

// ─── Storage helpers ──────────────────────────────────────────────────────────
function getState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

function setState(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function shouldShowPopup() {
  if (typeof navigator !== 'undefined' && BOT_UA.test(navigator.userAgent)) return false;
  const state = getState();
  if (!state) return true;
  if (state.subscribed) return false;
  if (state.dismissedAt) {
    const daysSince = (Date.now() - state.dismissedAt) / (1000 * 60 * 60 * 24);
    if (daysSince < DISMISS_COOLDOWN_DAYS) return false;
  }
  return true;
}

// ─── Benefits list ────────────────────────────────────────────────────────────
const BENEFITS = [
  { icon: Zap,         text: 'Weekly deep-dives on Snowflake, dbt & Spark' },
  { icon: TrendingUp,  text: 'Real-world pipeline patterns & best practices' },
  { icon: BookOpen,    text: 'Curated tools, tutorials & career tips' },
];

// ─── Component ────────────────────────────────────────────────────────────────
const NewsletterPopup = () => {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const triggered = useRef(false);

  const { subscribe, loading, error, success, reset } = useNewsletter();

  // Check if current path is excluded
  const isExcluded = EXCLUDED_PATHS.some(p => location.pathname.startsWith(p));

  const trigger = useCallback(() => {
    if (triggered.current || isExcluded || !shouldShowPopup()) return;
    triggered.current = true;
    setVisible(true);
  }, [isExcluded]);

  // ── Trigger 1: Time delay
  useEffect(() => {
    if (isExcluded) return;
    const id = setTimeout(trigger, TIME_DELAY_MS);
    return () => clearTimeout(id);
  }, [trigger, isExcluded]);

  // ── Trigger 2: Exit-intent (mouse leaves top of viewport)
  useEffect(() => {
    if (isExcluded) return;
    const handleMouseLeave = (e) => {
      if (e.clientY <= 5) trigger();
    };
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [trigger, isExcluded]);

  // ── Trigger 3: Scroll depth (40%)
  useEffect(() => {
    if (isExcluded) return;
    const handleScroll = () => {
      const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (scrolled >= SCROLL_THRESHOLD) trigger();
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [trigger, isExcluded]);

  // ── Reset trigger when route changes
  useEffect(() => {
    triggered.current = false;
    setVisible(false);
    reset();
    setEmail('');
  }, [location.pathname, reset]);

  const handleDismiss = useCallback(() => {
    setState({ dismissedAt: Date.now() });
    setVisible(false);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || loading) return;
    const result = await subscribe(email);
    if (result.success) {
      setState({ subscribed: true });
      trackNewsletterSignup('newsletter_popup');
      setEmail('');
      setTimeout(() => setVisible(false), 3500);
    }
  };

  // ── Framer-motion variants
  const backdrop = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit:   { opacity: 0, transition: { duration: 0.25, delay: 0.1 } },
  };

  const card = {
    hidden:  { opacity: 0, y: 60, scale: 0.95 },
    visible: { opacity: 1, y: 0,  scale: 1,   transition: { type: 'spring', damping: 22, stiffness: 260 } },
    exit:    { opacity: 0, y: 40, scale: 0.96, transition: { duration: 0.2 } },
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* ── Backdrop */}
          <motion.div
            key="popup-backdrop"
            variants={backdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
            onClick={handleDismiss}
            aria-hidden="true"
          />

          {/* ── Card */}
          <motion.div
            key="popup-card"
            variants={card}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label="Subscribe to the Data Digest newsletter"
            className="fixed inset-x-4 bottom-6 sm:inset-auto sm:bottom-8 sm:right-8 sm:w-[480px] z-[201]"
          >
            {/* Glow ring */}
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-blue-500/40 via-purple-500/30 to-indigo-500/40 blur-sm" />

            <div className="relative rounded-2xl overflow-hidden bg-slate-900/95 border border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.6)]">

              {/* Top gradient stripe */}
              <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500" />

              <div className="p-6 sm:p-7">

                {/* Close button */}
                <button
                  onClick={handleDismiss}
                  aria-label="Close newsletter popup"
                  className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>

                {success ? (
                  /* ── Success state */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-4 text-center"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 mb-4">
                      <CheckCircle className="h-8 w-8 text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">You're in! 🎉</h3>
                    <p className="text-gray-400 text-sm">
                      Welcome to the Data Digest. Next issue lands in your inbox soon.
                    </p>
                  </motion.div>
                ) : (
                  /* ── Main state */
                  <>
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-5">
                      <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                        <Mail className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
                          <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">Free Newsletter</span>
                        </div>
                        <h2 className="text-xl font-bold text-white leading-tight">
                          Stay ahead in<br />
                          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Data Engineering
                          </span>
                        </h2>
                      </div>
                    </div>

                    {/* Benefits */}
                    <ul className="space-y-2.5 mb-5">
                      {BENEFITS.map(({ icon: Icon, text }, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.15 + i * 0.08 }}
                          className="flex items-center gap-3 text-sm text-gray-300"
                        >
                          <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                            <Icon className="h-3.5 w-3.5 text-blue-400" />
                          </div>
                          {text}
                        </motion.li>
                      ))}
                    </ul>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-3">
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                        <input
                          id="popup-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          disabled={loading}
                          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40 transition disabled:opacity-50"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="relative w-full py-3 rounded-xl font-semibold text-sm text-white overflow-hidden group disabled:opacity-60 transition"
                        style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
                      >
                        {/* Shimmer overlay */}
                        <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        <span className="relative flex items-center justify-center gap-2">
                          {loading ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Subscribing…</>
                          ) : (
                            <>Get the Data Digest — Free</>
                          )}
                        </span>
                      </button>

                      {error && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-1.5 text-red-400 text-xs"
                        >
                          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                          {typeof error === 'string' ? error : 'Subscription failed. Please try again.'}
                        </motion.p>
                      )}
                    </form>

                    {/* Social proof footer */}
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Users className="h-3.5 w-3.5 text-gray-600" />
                        Join 2,000+ data engineers
                      </div>
                      <button
                        onClick={handleDismiss}
                        className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                      >
                        Maybe later
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NewsletterPopup;
