import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  User,
  Shield,
  CreditCard,
  Zap,
  CheckCircle2,
  Lock,
  ArrowRight,
  LogOut,
  Bookmark,
  Activity,
  Check,
} from 'lucide-react';

const AccountSettingsPage = () => {
  const [user, setUser] = useState({
    name: 'Data Engineer',
    email: 'engineer@example.com',
    tier: 'Free Practitioner',
  });
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('de_hub_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('de_hub_user', JSON.stringify(user));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem('de_hub_user');
    setUser({ name: 'Guest User', email: 'guest@dataengineerhub.blog', tier: 'Free Practitioner' });
  };

  return (
    <div className="account-settings-page min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Account Settings — DataEngineer Hub</title>
        <meta name="description" content="Manage your DataEngineer Hub profile and Pro membership subscription." />
        <link rel="canonical" href="https://dataengineerhub.blog/account-settings" />
      </Helmet>

      <div className="max-w-4xl mx-auto pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">Account & Settings</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">Manage your profile, learning history, and DodoPayments billing.</p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 shrink-0"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 mb-8 overflow-x-auto gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Profile & Credentials
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'billing'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Subscription & Billing
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Practice History
          </button>
        </div>

        {/* Tab 1: Profile */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 space-y-4">
              <h2 className="text-lg font-bold text-white mb-4">User Profile</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={user.name}
                    onChange={(e) => setUser({ ...user, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={user.email}
                    onChange={(e) => setUser({ ...user, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 text-xs uppercase tracking-wider shadow-lg"
                >
                  {saved ? <Check className="h-4 w-4" /> : null}
                  <span>{saved ? 'Saved Changes' : 'Save Profile'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Billing */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 to-slate-900 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Plan Tier: {user.tier || 'Free Practitioner'}</h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    DodoPayments Integration: Active (Test Mode)
                  </p>
                </div>
              </div>

              <Link
                to="/pro-membership"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-extrabold px-5 py-2.5 shadow-md shrink-0"
              >
                Manage Membership <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 space-y-3">
              <h3 className="text-sm font-bold text-white">Payment Method</h3>
              <p className="text-xs text-slate-400">Processed securely via DodoPayments Test Checkout. No live charges will occur in sandbox mode.</p>
            </div>
          </div>
        )}

        {/* Tab 3: History */}
        {activeTab === 'history' && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 text-center space-y-3">
            <Activity className="h-8 w-8 text-blue-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">Practice History Active</h3>
            <p className="text-xs text-slate-400">Your solved SQL practice pads, flashcard drill sessions, and mock exams are recorded here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountSettingsPage;
