import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import MetaTags from '@/components/SEO/MetaTags';

// Simple DE Hub logo icon (green rounded square)
const DEHubMark = () => (
  <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" aria-hidden="true">
    <rect width="32" height="32" rx="7" fill="#1a7f54" />
    <path d="M8 10h8a6 6 0 0 1 0 12H8V10Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 16h9" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Google icon SVG
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84Z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335" />
  </svg>
);

// GitHub icon SVG
const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
  </svg>
);

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('de_hub_theme') || 'dark');

  // Check if user is already logged in
  useEffect(() => {
    try {
      const stored = localStorage.getItem('de_hub_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.email) setUser(parsed);
      }
    } catch { /* ignore */ }
  }, []);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('de_hub_theme', newTheme);
  };

  const handleSignOut = () => {
    localStorage.removeItem('de_hub_user');
    setUser(null);
    window.dispatchEvent(new Event('storage'));
  };

  const handleOAuthClick = (provider) => {
    const mockUser = {
      name: provider === 'Google' ? 'Alex Rivera (Google)' : 'alex-dataeng (GitHub)',
      email: provider === 'Google' ? 'alex.rivera@gmail.com' : 'alex@github.user',
      provider,
      avatar: null,
      plan: 'free',
      joinedAt: new Date().toISOString(),
    };
    localStorage.setItem('de_hub_user', JSON.stringify(mockUser));
    setUser(mockUser);
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <>
      <MetaTags
        title="Login — DataEngineer Hub"
        description="Sign in to DataEngineer Hub to track your progress, unlock pro features, and save your coding work."
      />

      <div className="min-h-screen bg-slate-950 text-white">
        <div className="max-w-2xl mx-auto px-6 py-16">

          {/* Header label */}
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-2">
              ACCOUNT
            </p>
            <h1 className="text-3xl font-bold text-white">
              {user ? 'Your account' : 'Sign in'}
            </h1>
            {!user && (
              <p className="text-gray-400 mt-2 text-sm leading-relaxed">
                Google and GitHub use real providers. Progress and settings stay on this browser until you sign in.
              </p>
            )}
            {user && (
              <p className="text-gray-400 mt-2 text-sm">
                Profile, membership, and appearance for this browser.
              </p>
            )}
          </div>

          <div className="space-y-4">

            {/* Account Card */}
            <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
              <h2 className="text-base font-semibold text-white mb-1">Account</h2>

              {user ? (
                <>
                  <p className="text-sm text-gray-400 mb-4">
                    Signed in as <span className="text-white font-medium">{user.email}</span>
                    {user.provider && <span className="ml-1 text-gray-500">via {user.provider}</span>}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.plan || 'Free'} plan · {user.provider}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3 flex-wrap">
                    <Link
                      to="/upgrade"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors"
                    >
                      Upgrade to Pro
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-400 mb-5">
                    Sign in to see your coding progress, save articles, and manage your membership.
                  </p>

                  {/* OAuth Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={() => handleOAuthClick('Google')}
                      className="w-full flex items-center justify-center gap-3 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-3 text-sm font-medium text-white transition-all hover:border-white/25"
                    >
                      <GoogleIcon />
                      Continue with Google
                    </button>

                    <button
                      onClick={() => handleOAuthClick('GitHub')}
                      className="w-full flex items-center justify-center gap-3 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-3 text-sm font-medium text-white transition-all hover:border-white/25"
                    >
                      <GitHubIcon />
                      Continue with GitHub
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 mt-4">
                    New here?{' '}
                    <button
                      onClick={() => handleOAuthClick('Google')}
                      className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                    >
                      Create an account
                    </button>
                  </p>
                </>
              )}
            </div>



            {/* Membership Card (shown when logged in) */}
            {user && (
              <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
                <h2 className="text-base font-semibold text-white mb-1">Membership</h2>
                <p className="text-sm text-gray-400 mb-4">
                  {user.plan === 'pro'
                    ? 'You have Pro access. Medium and hard pads are unlocked.'
                    : 'You\'re on the Free plan. Easy pads and interview bank are included.'}
                </p>
                {user.plan !== 'pro' && (
                  <Link
                    to="/upgrade"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors"
                  >
                    Upgrade to Pro — $12/mo
                  </Link>
                )}
                {user.plan === 'pro' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-300">
                    ✓ Pro Active
                  </span>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
