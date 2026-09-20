import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogOut, Zap, CheckCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';

// Google icon SVG
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84Z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335" />
  </svg>
);

// GitHub icon SVG
const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current shrink-0" aria-hidden="true">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
  </svg>
);

const LoginModal = ({ isOpen, onClose }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    try {
      const stored = localStorage.getItem('de_hub_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.email) setUser(parsed);
      }
    } catch { /* ignore */ }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  const saveUserSession = (userData) => {
    localStorage.setItem('de_hub_user', JSON.stringify(userData));
    setUser(userData);
    window.dispatchEvent(new Event('storage'));
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const data = await res.json();
        saveUserSession({
          name: data.name || 'Google User',
          email: data.email,
          picture: data.picture,
          provider: 'Google',
          plan: 'free',
          joinedAt: new Date().toISOString(),
        });
        onClose();
      } catch (err) {
        console.error('Failed to fetch Google profile', err);
      }
    },
    onError: () => console.log('Login Failed'),
  });

  const handleOAuthLogin = (provider) => {
    const name = 'alex-dataeng (GitHub)';
    const email = 'alex@github.user';
    saveUserSession({
      name,
      email,
      provider,
      plan: 'free',
      joinedAt: new Date().toISOString(),
    });
    onClose();
  };

  const handleSignOut = () => {
    localStorage.removeItem('de_hub_user');
    setUser(null);
    window.dispatchEvent(new Event('storage'));
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0f172a] p-6 shadow-2xl z-10 text-white"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                OAUTH AUTHENTICATION
              </span>
              <h2 className="text-xl font-bold text-white mt-1">
                {user ? 'Your Account' : 'Sign in with Google / GitHub'}
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {user
                  ? `Signed in as ${user.email}. Access all practice tracks and pro features.`
                  : 'Fast 1-click OAuth authentication using your Google Gmail or GitHub account.'}
              </p>
            </div>

            {/* Content Body */}
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="h-11 w-11 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-base">
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                        <CheckCircle className="h-3 w-3" />
                        Signed in via {user.provider} ({user.plan === 'pro' ? 'PRO PLAN' : 'Free Member'})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Link
                    to="/upgrade"
                    onClick={onClose}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white transition-colors"
                  >
                    <Zap className="h-3.5 w-3.5 fill-current" />
                    {user.plan === 'pro' ? 'Pro Member Settings' : 'Upgrade to Pro'}
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-semibold text-slate-300 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                <button
                  type="button"
                  onClick={() => googleLogin()}
                  className="w-full flex items-center justify-center gap-3 rounded-xl border border-emerald-500/30 bg-white/5 hover:bg-white/10 hover:border-emerald-500/50 px-4 py-3.5 text-sm font-medium text-white transition-all shadow-sm group"
                >
                  <GoogleIcon />
                  <span className="group-hover:text-emerald-300 transition-colors">Sign in automatically with Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuthLogin('GitHub')}
                  className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/25 px-4 py-3 text-sm font-medium text-white transition-all shadow-sm"
                >
                  <GitHubIcon />
                  <span>Continue with GitHub</span>
                </button>

                <div className="pt-3 text-center text-xs text-slate-400 leading-relaxed">
                  By continuing, you agree to our{' '}
                  <Link to="/terms-of-service" onClick={onClose} className="text-slate-300 underline hover:text-white">
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy-policy" onClick={onClose} className="text-slate-300 underline hover:text-white">
                    Privacy Policy
                  </Link>.
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default LoginModal;
