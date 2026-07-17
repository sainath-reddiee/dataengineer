import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, Key, Copy, Check, Calendar, Globe, ArrowLeft, 
  Trash2, RefreshCw, Code, CheckCircle, AlertTriangle, ShieldCheck
} from 'lucide-react';
import activeSponsorsData from '@/data/activeSponsors.json';

export default function SponsorManagerPage() {
  const [sponsors, setSponsors] = useState(activeSponsorsData);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [jsonCopied, setJsonCopied] = useState(false);

  // New Sponsor Form State
  const [company, setCompany] = useState('');
  const [url, setUrl] = useState('');
  const [placement, setPlacement] = useState('directory');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth.toISOString().split('T')[0];
  });
  const [token, setToken] = useState('');
  const [notes, setNotes] = useState('');
  
  // Targeting states
  const [targetCategories, setTargetCategories] = useState('');
  const [targetTags, setTargetTags] = useState('');
  const [targetSlugs, setTargetSlugs] = useState('');

  // Sync state
  const [syncStatus, setSyncStatus] = useState(''); // 'syncing' | 'success' | 'error'

  const saveSponsorsToServer = async (updatedSponsors) => {
    setSyncStatus('syncing');
    
    // In production static builds, file writing is not available.
    // Instruct the user to manually copy the updated JSON instead.
    if (!import.meta.env.DEV) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus(''), 7000);
      return;
    }

    try {
      const res = await fetch('/api/save-sponsors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSponsors),
      });
      const data = await res.json();
      if (data && data.success) {
        setSyncStatus('success');
        setTimeout(() => setSyncStatus(''), 3000);
      } else {
        setSyncStatus('error');
        setTimeout(() => setSyncStatus(''), 5000);
      }
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus(''), 5000);
    }
  };

  // Generate a cryptographically secure-looking random token
  const generateToken = () => {
    const randomHex = Array.from({ length: 10 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    setToken(`sp_${randomHex}`);
  };

  const handleAddSponsor = (e) => {
    e.preventDefault();
    if (!company || !url || !token) return;
    
    // Ensure start date is not after end date
    if (new Date(startDate) > new Date(endDate)) {
      alert("Error: Start date cannot be after end date.");
      return;
    }

    const parseCommaList = (str) => str ? str.split(',').map(s => s.trim()).filter(Boolean) : [];
    const cats = parseCommaList(targetCategories);
    const tgs = parseCommaList(targetTags);
    const slgs = parseCommaList(targetSlugs);

    const newSponsor = {
      company,
      logo: `/assets/sponsors/${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.svg`,
      url,
      placement,
      startDate,
      endDate,
      active: true,
      token,
      notes: notes || `${placement.replace('_', ' ')} sponsorship`
    };

    if (cats.length > 0 || tgs.length > 0 || slgs.length > 0) {
      newSponsor.targeting = {};
      if (cats.length > 0) newSponsor.targeting.categories = cats;
      if (tgs.length > 0) newSponsor.targeting.tags = tgs;
      if (slgs.length > 0) newSponsor.targeting.slugs = slgs;
    }

    const updated = [...sponsors, newSponsor];
    setSponsors(updated);
    saveSponsorsToServer(updated);

    // Reset Form
    setCompany('');
    setUrl('');
    setToken('');
    setNotes('');
    setTargetCategories('');
    setTargetTags('');
    setTargetSlugs('');
  };

  const handleDeleteSponsor = (indexToDelete) => {
    const updated = sponsors.filter((_, idx) => idx !== indexToDelete);
    setSponsors(updated);
    saveSponsorsToServer(updated);
  };

  const copyClientDashboardLink = (sponsorToken, idx) => {
    const link = `${window.location.origin}/sponsors/dashboard?token=${sponsorToken}`;
    navigator.clipboard.writeText(link);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyUpdatedJson = () => {
    navigator.clipboard.writeText(JSON.stringify(sponsors, null, 2));
    setJsonCopied(true);
    setTimeout(() => setJsonCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link 
            to="/admin" 
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to SEO Admin
          </Link>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <ShieldCheck className="h-3.5 w-3.5" /> Authorization Verified
          </div>
        </div>

        {/* Header Block */}
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2.5">
            <Key className="h-8 w-8 text-blue-400" /> Sponsor Campaign Manager
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            Create new sponsor instances, generate secure access tokens, and export local configuration files.
          </p>
        </div>

        {/* Manager Layout Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Create Sponsor Form Panel */}
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-md h-fit">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-400" /> Create Sponsor Campaign
            </h2>

            <form onSubmit={handleAddSponsor} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Company Name</label>
                <input 
                  type="text" 
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Snowflake Inc"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Destination URL</label>
                <input 
                  type="url" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://snowflake.com/partner"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Placement Type</label>
                <select 
                  value={placement}
                  onChange={(e) => setPlacement(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="directory">Ecosystem Showcase</option>
                  <option value="resource_reference">Developer Resource Reference</option>
                  <option value="content">Technical Integration Guide</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Start Date</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">End Date</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Access Token</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="sp_xxxxxxxxxx"
                    className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono"
                    required
                    readOnly
                  />
                  <button
                    type="button"
                    onClick={generateToken}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl transition"
                    title="Generate Random Token"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Target Categories (comma-separated)</label>
                <input 
                  type="text" 
                  value={targetCategories}
                  onChange={(e) => setTargetCategories(e.target.value)}
                  placeholder="e.g. snowflake, dbt"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Target Tags (comma-separated)</label>
                <input 
                  type="text" 
                  value={targetTags}
                  onChange={(e) => setTargetTags(e.target.value)}
                  placeholder="e.g. sql, python"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Target Slugs (comma-separated)</label>
                <input 
                  type="text" 
                  value={targetSlugs}
                  onChange={(e) => setTargetSlugs(e.target.value)}
                  placeholder="e.g. sql-formatter"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Internal Notes</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional, invoice number, or contract details..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  rows={2}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition mt-2 shadow-lg shadow-blue-500/10"
              >
                Add Sponsor to List
              </button>
            </form>
          </div>

          {/* Active Campaigns Panel & JSON Sync */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Table of active campaigns */}
            <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
              <h2 className="text-lg font-bold text-white mb-6">Active Placement Instances</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 text-xs font-bold uppercase tracking-wider">
                      <th className="pb-3">Sponsor / placement</th>
                      <th className="pb-3">Dates</th>
                      <th className="pb-3">Secure Token</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sponsors.map((s, idx) => (
                      <tr key={s.token} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                        <td className="py-3.5 pr-2">
                          <div className="font-bold text-white">{s.company}</div>
                          <span className="inline-block text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/5 mt-1 font-semibold uppercase">
                            {s.placement}
                          </span>
                        </td>
                        <td className="py-3.5 text-xs text-gray-300 pr-2">
                          <div>Start: {s.startDate}</div>
                          <div className="text-gray-500">End: {s.endDate}</div>
                        </td>
                        <td className="py-3.5 font-mono text-xs text-blue-400 pr-2">
                          {s.token}
                        </td>
                        <td className="py-3.5 text-right space-x-2">
                          <button
                            onClick={() => copyClientDashboardLink(s.token, idx)}
                            className="inline-flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition"
                            title="Copy Client Dashboard URL"
                          >
                            {copiedIndex === idx ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            Share Link
                          </button>
                          <button
                            onClick={() => handleDeleteSponsor(idx)}
                            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 p-1.5 rounded-lg text-red-400 transition"
                            title="Delete Campaign"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Config file overwrite block */}
            <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-md space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Code className="h-5 w-5 text-purple-400" /> JSON Configuration Sync
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Copy this block and overwrite `src/data/activeSponsors.json` to persist your active sponsorships.
                  </p>
                </div>
                <button
                  onClick={copyUpdatedJson}
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition"
                >
                  {jsonCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Copied config!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copy Code Content
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <pre className="w-full bg-slate-950 p-4 rounded-2xl border border-white/5 overflow-x-auto text-[11px] text-purple-300 font-mono max-h-56 leading-relaxed">
                  {JSON.stringify(sponsors, null, 2)}
                </pre>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Sync Status Toast/Badge */}
      {syncStatus && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl border shadow-2xl flex items-center gap-2.5 backdrop-blur-xl transition-all animate-bounce ${
          syncStatus === 'syncing' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
          syncStatus === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
          'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {syncStatus === 'syncing' && <RefreshCw className="h-4 w-4 animate-spin" />}
          {syncStatus === 'success' && <CheckCircle className="h-4 w-4" />}
          {syncStatus === 'error' && <AlertTriangle className="h-4 w-4" />}
          <span className="text-xs font-bold tracking-wide">
            {syncStatus === 'syncing' && 'Syncing database...'}
            {syncStatus === 'success' && 'Database synced successfully!'}
            {syncStatus === 'error' && 'Sync failed. Copy JSON manually.'}
          </span>
        </div>
      )}
    </div>
  );
}
