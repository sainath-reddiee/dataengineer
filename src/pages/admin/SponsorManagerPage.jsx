import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, Key, Copy, Check, Globe, ArrowLeft, 
  Trash2, RefreshCw, Code, CheckCircle, AlertTriangle, ShieldCheck, Settings, Pause, Play
} from 'lucide-react';
import activeSponsorsData from '@/data/activeSponsors.json';
import { ALLOWED_PLACEMENTS, getCampaignStatus, placementLabel, partnerDashboardPath } from '@/lib/sponsorCampaign';
import { formatCtr, getSponsorStats } from '@/utils/sponsorTracking';

function generateTokenValue() {
  const bytes = new Uint8Array(8);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    bytes.forEach((_, i) => { bytes[i] = Math.floor(Math.random() * 256); });
  }
  return `sp_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').slice(0, 12)}`;
}

export default function SponsorManagerPage() {
  const initialSponsors = Array.isArray(activeSponsorsData) ? activeSponsorsData : (activeSponsorsData?.default || []);
  const [sponsors, setSponsors] = useState(initialSponsors);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [jsonCopied, setJsonCopied] = useState(false);
  const [serverSource, setServerSource] = useState('bundled JSON');
  const [showSettings, setShowSettings] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [syncErrorMessage, setSyncErrorMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [statsTick, setStatsTick] = useState(0);
  const [lastSaved, setLastSaved] = useState(null);

  // GitHub PAT config — kept in sessionStorage only (cleared when the tab/browser
  // closes), never localStorage. This site has no server backend (static FTP
  // host), so production writes commit directly to GitHub's Contents API from
  // the browser using this token. Use a fine-grained PAT scoped to this repo only.
  const [githubConfig, setGithubConfig] = useState(() => {
    try {
      const saved = sessionStorage.getItem('sponsors_github_config');
      return saved ? JSON.parse(saved) : { token: '', owner: 'sainath-reddiee', repo: 'dataengineer', branch: 'main' };
    } catch {
      return { token: '', owner: 'sainath-reddiee', repo: 'dataengineer', branch: 'main' };
    }
  });
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

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
  const [token, setToken] = useState(() => generateTokenValue());
  const [notes, setNotes] = useState('');
  
  // Targeting states
  const [targetCategories, setTargetCategories] = useState('');
  const [targetTags, setTargetTags] = useState('');
  const [targetSlugs, setTargetSlugs] = useState('');

  // Helper to strip stray "Bearer "/"token " prefixes if a user pastes them accidentally
  const getCleanToken = (rawToken) => (rawToken || '').trim().replace(/^(Bearer|token)\s+/i, '');

  const fetchWithGithubAuth = async (url, ghToken, options = {}) => {
    const cleanToken = getCleanToken(ghToken);
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Try Bearer token first
    let res = await fetch(url, {
      ...options,
      headers: { ...headers, 'Authorization': `Bearer ${cleanToken}` }
    });

    // If 401, fallback to token format (for classic PATs)
    if (res.status === 401) {
      const resFallback = await fetch(url, {
        ...options,
        headers: { ...headers, 'Authorization': `token ${cleanToken}` }
      });
      if (resFallback.ok || resFallback.status !== 401) {
        return resFallback;
      }
    }
    return res;
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const cleanToken = getCleanToken(githubConfig.token);
    const { owner, repo, branch } = githubConfig;

    if (!cleanToken || !owner || !repo) {
      setTestResult({ success: false, message: 'Please fill in Token, Repo Owner, and Repo Name.' });
      setTesting(false);
      return;
    }

    try {
      const filePath = 'src/data/activeSponsors.json';
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch || 'main'}`;
      const res = await fetchWithGithubAuth(apiUrl, cleanToken);

      if (res.ok) {
        setTestResult({ success: true, message: `✅ Connection verified! Repo '${owner}/${repo}' and branch '${branch || 'main'}' accessible.` });
      } else {
        const data = await res.json().catch(() => ({}));
        let msg = `GitHub Error ${res.status}: ${data.message || res.statusText}`;
        if (res.status === 401) msg = '❌ 401 Bad Credentials: The PAT token is invalid or expired.';
        if (res.status === 403) msg = '❌ 403 Forbidden: Token lacks write permissions. Set "Contents: Read & write" or "repo" scope.';
        if (res.status === 404) msg = `❌ 404 Not Found: Repo '${owner}/${repo}' or branch '${branch}' not found / inaccessible with this token.`;
        setTestResult({ success: false, message: msg });
      }
    } catch (err) {
      setTestResult({ success: false, message: `Network Error: ${err.message}` });
    } finally {
      setTesting(false);
    }
  };

  const saveGithubConfig = (e) => {
    e.preventDefault();
    const cleanedConfig = {
      ...githubConfig,
      token: getCleanToken(githubConfig.token),
      owner: (githubConfig.owner || 'sainath-reddiee').trim(),
      repo: (githubConfig.repo || 'dataengineer').trim(),
      branch: (githubConfig.branch || 'main').trim()
    };
    setGithubConfig(cleanedConfig);
    sessionStorage.setItem('sponsors_github_config', JSON.stringify(cleanedConfig));
    setShowSettings(false);
    setSyncStatus('');
    setSyncErrorMessage('');
    alert('GitHub PAT saved for this browser session only (cleared when you close the tab).');
  };

  const saveViaLocalDevApi = async (updatedSponsors) => {
    const response = await fetch('/api/save-sponsors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedSponsors),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Local API save failed. Check dev server.');
    }
  };

  const saveSponsorsToServer = async (updatedSponsors) => {
    setSyncStatus('syncing');
    setSyncErrorMessage('');

    if (import.meta.env.DEV) {
      // Local dev: use the Vite plugin that writes directly to the JSON file on disk.
      try {
        await saveViaLocalDevApi(updatedSponsors);
        setSponsors(updatedSponsors);
        setServerSource('local Vite JSON');
        setSyncStatus('success');
        setTimeout(() => setSyncStatus(''), 4000);
        return true;
      } catch (err) {
        setSyncStatus('error');
        setSyncErrorMessage(err.message || 'Local API save failed. Check dev server.');
        setTimeout(() => setSyncStatus(''), 7000);
        return false;
      }
    }

    // Production: this site is static (FTP-deployed, no server backend), so
    // sponsor writes commit directly to GitHub's Contents API using the
    // session-scoped PAT configured above.
    const cleanToken = getCleanToken(githubConfig.token);
    const owner = (githubConfig.owner || 'sainath-reddiee').trim();
    const repo = (githubConfig.repo || 'dataengineer').trim();
    const branch = (githubConfig.branch || 'main').trim();

    if (!cleanToken || !owner || !repo) {
      setSyncStatus('error');
      setSyncErrorMessage('GitHub PAT Token missing. Click "Setup PAT Token" to configure.');
      setShowSettings(true);
      setTimeout(() => setSyncStatus(''), 10000);
      return false;
    }

    try {
      const filePath = 'src/data/activeSponsors.json';
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

      // 1. Get current SHA (required for GitHub PUT to update an existing file)
      const getRes = await fetchWithGithubAuth(`${apiUrl}?ref=${branch}`, cleanToken);

      let sha = '';
      if (getRes.ok) {
        const getData = await getRes.json();
        sha = getData.sha;
      } else {
        const errData = await getRes.json().catch(() => ({}));
        let detail = errData.message || getRes.statusText;
        if (getRes.status === 401) detail = '401 Bad Credentials (PAT invalid or expired)';
        if (getRes.status === 403) detail = '403 Forbidden (missing repo/contents scope)';
        if (getRes.status === 404) detail = `404 Not Found (repo '${owner}/${repo}' or path inaccessible with this token)`;
        throw new Error(`GitHub API Error: ${detail}`);
      }

      // 2. Put updated content (UTF-8 safe base64 encoding)
      const contentStr = JSON.stringify(updatedSponsors, null, 2);
      let encodedContent;
      try {
        encodedContent = btoa(encodeURIComponent(contentStr).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))));
      } catch {
        encodedContent = btoa(contentStr);
      }

      const putRes = await fetchWithGithubAuth(apiUrl, cleanToken, {
        method: 'PUT',
        body: JSON.stringify({
          message: 'Sponsor sync update from Dashboard',
          content: encodedContent,
          sha: sha || undefined,
          branch
        })
      });

      if (!putRes.ok) {
        const errData = await putRes.json().catch(() => ({}));
        let detail = errData.message || putRes.statusText;
        if (putRes.status === 404) {
          detail = `404 Not Found: Your PAT has read access but lacks WRITE permission for repo '${owner}/${repo}' on branch '${branch}'. Check token scopes on GitHub.`;
        } else if (putRes.status === 403) {
          detail = '403 Forbidden: Token lacks write permissions. Enable "Contents: Read & write" on GitHub.';
        }
        throw new Error(`GitHub Update Failed: ${detail}`);
      }

      setSponsors(updatedSponsors);
      setServerSource('GitHub API');
      setSyncStatus('github_success');
      setTimeout(() => setSyncStatus(''), 6000);
      return true;
    } catch (err) {
      setSyncStatus('error');
      setSyncErrorMessage(err.message || 'GitHub sync failed.');
      setShowSettings(true);
      setTimeout(() => setSyncStatus(''), 12000);
      return false;
    }
  };

  const generateToken = () => {
    setToken(generateTokenValue());
  };

  const campaignRows = useMemo(() => {
    const list = Array.isArray(sponsors) ? sponsors : [];
    return list.map((s, idx) => {
      const status = getCampaignStatus(s);
      const stats = s.token ? getSponsorStats(s.token) : { impressions: 0, clicks: 0 };
      return { sponsor: s, idx, status, stats };
    });
  }, [sponsors, statsTick]);

  const visibleRows = campaignRows.filter(({ status }) => {
    if (statusFilter === 'all') return true;
    return status.key === statusFilter;
  });

  const handleAddSponsor = async (e) => {
    e.preventDefault();
    if (!company || !url) return;

    const trimmedCompany = company.trim();
    const trimmedUrl = url.trim();
    const trimmedToken = (token.trim() || generateTokenValue());

    if (!trimmedCompany || !trimmedUrl) {
      alert('Company and destination URL are required.');
      return;
    }

    if (!ALLOWED_PLACEMENTS.has(placement)) {
      alert('Unsupported sponsor placement selected.');
      return;
    }

    try {
      const parsedUrl = new URL(trimmedUrl);
      if (!/^https?:$/.test(parsedUrl.protocol)) {
        throw new Error('Unsupported protocol');
      }
    } catch {
      alert('Please enter a valid sponsor URL starting with http:// or https://.');
      return;
    }

    if (sponsors.some((s) => s.token === trimmedToken)) {
      alert('This sponsor token already exists. Generate a new token before saving.');
      return;
    }
    
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
      company: trimmedCompany,
      logo: `/assets/sponsors/${trimmedCompany.toLowerCase().replace(/[^a-z0-9]/g, '')}.svg`,
      url: trimmedUrl,
      placement,
      startDate,
      endDate,
      active: true,
      token: trimmedToken,
      notes: notes || `${placement.replace('_', ' ')} sponsorship`
    };

    if (cats.length > 0 || tgs.length > 0 || slgs.length > 0) {
      newSponsor.targeting = {};
      if (cats.length > 0) newSponsor.targeting.categories = cats;
      if (tgs.length > 0) newSponsor.targeting.tags = tgs;
      if (slgs.length > 0) newSponsor.targeting.slugs = slgs;
    }

    const updated = [...sponsors, newSponsor];
    const saved = await saveSponsorsToServer(updated);
    if (!saved) return;

    const dashboardPath = partnerDashboardPath(trimmedToken);
    setLastSaved({
      company: trimmedCompany,
      token: trimmedToken,
      dashboardPath,
    });
    const dashboardUrl = `${window.location.origin}${dashboardPath}`;
    try {
      await navigator.clipboard.writeText(dashboardUrl);
    } catch {
      // Clipboard may be blocked; the banner still shows the link.
    }

    setCompany('');
    setUrl('');
    setToken(generateTokenValue());
    setNotes('');
    setTargetCategories('');
    setTargetTags('');
    setTargetSlugs('');
  };

  const handleDeleteSponsor = async (indexToDelete) => {
    const target = sponsors[indexToDelete];
    if (!window.confirm(`Remove ${target?.company || 'this campaign'}? This stops the on-site placement after the next deploy.`)) {
      return;
    }
    const updated = sponsors.filter((_, idx) => idx !== indexToDelete);
    await saveSponsorsToServer(updated);
  };

  const handleToggleActive = async (indexToToggle) => {
    const updated = sponsors.map((item, idx) => (
      idx === indexToToggle ? { ...item, active: !item.active } : item
    ));
    await saveSponsorsToServer(updated);
  };

  const copyClientDashboardLink = (sponsorToken, idx) => {
    const link = `${window.location.origin}${partnerDashboardPath(sponsorToken)}`;
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
          <div className="flex gap-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-gray-300 text-xs font-semibold hover:bg-slate-700 transition"
            >
              <Settings className="h-3.5 w-3.5" /> Setup PAT Token
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" /> Source: {serverSource}
            </div>
          </div>
        </div>

        {/* Header Block */}
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2.5">
            <Key className="h-8 w-8 text-blue-400" /> Sponsor Campaign Manager
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            Create campaigns, pause them, copy the partner dashboard link, and sync JSON. First-party viewable impressions and clicks show per token on this browser; GA4 gets the same events after consent.
          </p>
        </div>

        {lastSaved && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-emerald-200">{lastSaved.company} saved</div>
              <p className="text-xs text-emerald-100/80 mt-1 font-mono break-all">
                Token {lastSaved.token} · partner link copied when the clipboard is available
              </p>
            </div>
            <a
              href={lastSaved.dashboardPath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0"
            >
              Open partner dashboard
            </a>
          </div>
        )}

        {/* GitHub Automation Settings Panel */}
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 backdrop-blur-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Globe className="h-5 w-5 text-purple-400" /> Production GitHub Sync Configuration
              </h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">&times;</button>
            </div>
            <p className="text-sm text-gray-300 mb-4">
              This site is static (deployed via FTP) and has no server backend. Sponsor writes commit directly to GitHub's Contents API from your browser. The token below is kept in <span className="font-mono text-purple-200">sessionStorage</span> only — it is cleared when you close this tab and is <span className="font-semibold text-white">never</span> saved to disk. Use a fine-grained PAT scoped only to this repository with &quot;Contents: Read and write&quot; permission.
            </p>
            <form onSubmit={saveGithubConfig} className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">GitHub PAT Token</label>
                <input 
                  type="password" 
                  value={githubConfig.token}
                  onChange={(e) => setGithubConfig({...githubConfig, token: e.target.value})}
                  placeholder="github_pat_..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                  autoComplete="off"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Repo Owner (User/Org)</label>
                <input 
                  type="text" 
                  value={githubConfig.owner}
                  onChange={(e) => setGithubConfig({...githubConfig, owner: e.target.value})}
                  placeholder="sainath-reddiee"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Repo Name</label>
                <input 
                  type="text" 
                  value={githubConfig.repo}
                  onChange={(e) => setGithubConfig({...githubConfig, repo: e.target.value})}
                  placeholder="dataengineer"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Branch</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={githubConfig.branch}
                    onChange={(e) => setGithubConfig({...githubConfig, branch: e.target.value})}
                    placeholder="main"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                    required
                  />
                  <button type="button" onClick={handleTestConnection} disabled={testing} className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-xl text-xs font-bold transition shrink-0">
                    {testing ? 'Testing...' : 'Test Connection'}
                  </button>
                  <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-4 rounded-xl text-xs font-bold transition shrink-0">
                    Save
                  </button>
                </div>
              </div>
            </form>
            {testResult && (
              <div className={`mt-4 p-3 rounded-xl text-xs font-semibold border ${testResult.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'}`}>
                {testResult.message}
              </div>
            )}
          </motion.div>
        )}

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
                    placeholder="sp_xxxxxxxxxx (auto-generated if empty)"
                    className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono"
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h2 className="text-lg font-bold text-white">Placement instances</h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setStatsTick((n) => n + 1)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border bg-white/5 border-white/10 text-gray-400 hover:text-white"
                  >
                    Refresh stats
                  </button>
                  {['all', 'live', 'scheduled', 'paused', 'expired'].map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setStatusFilter(key)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                        statusFilter === key
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>

              {visibleRows.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">No campaigns in this filter. Add one on the left, or switch to All.</p>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 text-xs font-bold uppercase tracking-wider">
                      <th className="pb-3">Sponsor</th>
                      <th className="pb-3">Status / dates</th>
                      <th className="pb-3">This-browser stats</th>
                      <th className="pb-3">Token</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map(({ sponsor: s, idx, status, stats }) => {
                      const statusClass = {
                        live: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
                        scheduled: 'bg-blue-500/15 text-blue-300 border-blue-500/20',
                        paused: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
                        expired: 'bg-slate-500/15 text-slate-300 border-slate-500/20',
                      }[status.key] || 'bg-white/5 text-gray-400 border-white/10';
                      return (
                      <tr key={s?.token || s?.company || idx} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                        <td className="py-3.5 pr-2">
                          <div className="font-bold text-white">{s.company}</div>
                          <span className="inline-block text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/5 mt-1 font-semibold">
                            {placementLabel(s.placement)}
                          </span>
                        </td>
                        <td className="py-3.5 text-xs text-gray-300 pr-2">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border mb-1 ${statusClass}`}>
                            {status.label}
                          </span>
                          <div>Start: {s.startDate}</div>
                          <div className="text-gray-500">End: {s.endDate}</div>
                        </td>
                        <td className="py-3.5 text-xs text-gray-300 pr-2 font-mono">
                          <div>{stats.impressions} imp</div>
                          <div>{stats.clicks} clk · {formatCtr(stats.impressions, stats.clicks)}</div>
                        </td>
                        <td className="py-3.5 font-mono text-xs text-blue-400 pr-2">
                          {s.token}
                        </td>
                        <td className="py-3.5 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleActive(idx)}
                            className="inline-flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition"
                            title={s.active ? 'Pause campaign' : 'Resume campaign'}
                          >
                            {s.active ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                            {s.active ? 'Pause' : 'Resume'}
                          </button>
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
                            Share
                          </button>
                          <a
                            href={partnerDashboardPath(s.token)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition"
                            title="Open partner dashboard"
                          >
                            <Globe className="h-3 w-3" />
                            View
                          </a>
                          <button
                            onClick={() => handleDeleteSponsor(idx)}
                            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 p-1.5 rounded-lg text-red-400 transition"
                            title="Delete Campaign"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              )}
            </div>

            {/* Config file overwrite block */}
            <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-md space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Code className="h-5 w-5 text-purple-400" /> JSON Configuration Sync
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Manual fallback: copy this block and overwrite `src/data/activeSponsors.json` if server sync is unavailable.
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
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl border shadow-2xl flex items-center gap-3 backdrop-blur-xl transition-all ${
          syncStatus === 'syncing' ? 'bg-blue-950/90 border-blue-500/30 text-blue-300' :
          syncStatus === 'success' || syncStatus === 'github_success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' :
          'bg-rose-950/90 border-rose-500/30 text-rose-300'
        }`}>
          {syncStatus === 'syncing' && <RefreshCw className="h-4 w-4 animate-spin shrink-0" />}
          {(syncStatus === 'success' || syncStatus === 'github_success') && <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />}
          {syncStatus === 'error' && <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs font-bold tracking-wide">
              {syncStatus === 'syncing' && 'Syncing sponsor JSON...'}
              {syncStatus === 'success' && 'Sponsor JSON synced successfully.'}
              {syncStatus === 'github_success' && 'Committed to GitHub. Deploy will pick this up on the next build.'}
              {syncStatus === 'error' && (syncErrorMessage || 'Sync failed. Check server JSON sync settings or copy JSON manually.')}
            </span>
            {syncStatus === 'error' && (
              <button
                onClick={() => setShowSettings(true)}
                className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-[11px] font-bold px-2.5 py-1 rounded-lg transition"
              >
                View Settings
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
