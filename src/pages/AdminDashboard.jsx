import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, CreditCard, ShieldAlert, Activity, RefreshCw, 
  Search, CheckCircle, XCircle, AlertCircle, ShieldCheck
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3002/api/admin/users');
      if (!res.ok) throw new Error('Failed to fetch data');
      const data = await res.json();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.subscription_id && u.subscription_id.includes(searchTerm))
  );

  const handleAction = async (email, action) => {
    try {
      const res = await fetch('http://localhost:3002/api/admin/users/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // Refresh list to show new statuses
      fetchUsers();
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30"><CheckCircle className="w-3 h-3"/> Active</span>;
      case 'canceled':
        return <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/20 px-2.5 py-0.5 text-xs font-semibold text-slate-400 border border-slate-500/30"><XCircle className="w-3 h-3"/> Canceled</span>;
      case 'past_due':
      case 'failed':
        return <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-semibold text-red-400 border border-red-500/30"><AlertCircle className="w-3 h-3"/> Past Due</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-400">Inactive</span>;
    }
  };

  const getPlanBadge = (plan) => {
    if (plan === 'pro') return <span className="font-bold text-amber-400">PRO</span>;
    return <span className="font-semibold text-slate-400">FREE</span>;
  };

  return (
    <div className="min-h-screen bg-[#020817] text-white p-6 md:p-12 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-600/10 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-blue-500" />
              Admin Portal
            </h1>
            <p className="text-slate-400 mt-1">Manage users, subscriptions, and webhooks in real-time.</p>
          </div>
          <button 
            onClick={fetchUsers}
            className="inline-flex items-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-colors border border-white/10"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Active PRO', value: users.filter(u => u.subscription_status === 'active').length, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Canceled', value: users.filter(u => u.subscription_status === 'canceled').length, icon: ShieldAlert, color: 'text-slate-400', bg: 'bg-slate-500/10' },
            { label: 'Revenue', value: 'Live Mode', icon: CreditCard, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-400">{stat.label}</span>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Table Section */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-white">Subscribers</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search email or Sub ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 rounded-lg bg-black/40 border border-white/10 py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {error ? (
              <div className="p-10 text-center text-red-400">
                <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>Error connecting to backend: {error}</p>
                <p className="text-sm opacity-70 mt-1">Make sure the Express server is running on port 3002.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950/50 text-xs uppercase tracking-wider text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Email</th>
                    <th className="px-6 py-4 font-semibold">Plan</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Subscription ID</th>
                    <th className="px-6 py-4 font-semibold text-right">Updated</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <motion.tbody 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="divide-y divide-white/5"
                >
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                        {searchTerm ? 'No matching users found.' : 'No subscriptions yet.'}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <motion.tr variants={rowVariants} key={user.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-white">{user.email}</div>
                          <div className="text-xs text-slate-500">{user.name}</div>
                        </td>
                        <td className="px-6 py-4">{getPlanBadge(user.plan)}</td>
                        <td className="px-6 py-4">{getStatusBadge(user.subscription_status)}</td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">
                          {user.subscription_id || '-'}
                        </td>
                        <td className="px-6 py-4 text-right text-slate-400 text-xs">
                          {new Date(user.updated_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {user.subscription_status !== 'active' ? (
                            <button 
                              onClick={() => handleAction(user.email, 'grant_pro')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded transition-colors"
                            >
                              Grant PRO
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleAction(user.email, 'revoke')}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded transition-colors"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </motion.tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
