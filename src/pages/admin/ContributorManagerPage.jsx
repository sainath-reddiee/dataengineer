// src/pages/admin/ContributorManagerPage.jsx
// Full-featured contributor manager — lets you select any WordPress user,
// edit ALL their bio fields inline, preview the AuthorBioCard live,
// and reassign post authorship without touching WP Admin.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, User, Edit3, Save, RefreshCw, Search, BookOpen,
  Linkedin, Twitter, Globe, Github, Camera, Briefcase,
  FileText, CheckCircle, XCircle, AlertCircle, ChevronRight,
  Loader2, Eye, Link2, Plus, ArrowRight, Tag, ExternalLink,
  Trash2, RotateCcw, Star, BadgeCheck, Mail, Info, X
} from 'lucide-react';
import AuthorBioCard from '@/components/AuthorBioCard';
import { useToast } from '@/components/ui/use-toast';

// ─── WordPress REST helpers ──────────────────────────────────────────────────
const WP_BASE = import.meta.env.DEV
  ? ''
  : 'https://app.dataengineerhub.blog';

const WP_API = `${WP_BASE}/wp-json/wp/v2`;

/** Build Basic-auth header from env (username:app_password base64) */
function authHeader() {
  const raw = import.meta.env.VITE_WP_APP_PASSWORD || '';
  if (!raw) return {};
  return { Authorization: `Basic ${raw}` };
}

async function wpFetch(path, opts = {}) {
  const res = await fetch(`${WP_API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeader(), ...opts.headers },
    ...opts,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`WP API error ${res.status}: ${txt}`);
  }
  return res.json();
}

/** Fetch all users with author / contributor / editor role */
async function fetchUsers() {
  // Public endpoint — do not send Authorization. That header forces a CORS
  // preflight; LiteSpeed on app.dataengineerhub.blog often returns OPTIONS
  // without Access-Control-Allow-Origin, which blocks the admin panel.
  const res = await fetch(
    `${WP_BASE}/wp-json/dehub/v1/contributors?roles=administrator,editor,author,contributor`
  );
  if (!res.ok) {
    throw new Error(`Failed to list users (${res.status})`);
  }
  return res.json();
}

/** Fetch posts by author id or guest author id */
async function fetchPostsByAuthor(authorId, page = 1) {
  const isGuest = typeof authorId === 'string' && authorId.startsWith('guest_');
  if (isGuest) {
    const res = await fetch(
      `${WP_API}/posts?per_page=50&status=publish&_fields=id,title,slug,date,categories,meta,guest_author_details&_embed=wp:term`,
      { headers: authHeader() }
    );
    const data = await res.json();
    if (Array.isArray(data)) {
      const filtered = data.filter(p => p.guest_author_details?.id === authorId || p.meta?.guest_author_id === authorId);
      return { posts: filtered, total: filtered.length };
    }
    return { posts: [], total: 0 };
  }

  const res = await fetch(
    `${WP_API}/posts?author=${authorId}&per_page=20&page=${page}&status=publish&_fields=id,title,slug,date,categories&_embed=wp:term`,
    { headers: authHeader() }
  );
  const total = parseInt(res.headers.get('X-WP-Total') || '0');
  const data = await res.json();
  return { posts: Array.isArray(data) ? data : [], total };
}

/** Fetch all published posts for the post-assignment search */
async function searchPosts(query) {
  const url = query.trim()
    ? `${WP_API}/posts?search=${encodeURIComponent(query.trim())}&per_page=20&status=publish&_fields=id,title,slug,author,meta,guest_author_details`
    : `${WP_API}/posts?per_page=20&status=publish&_fields=id,title,slug,author,meta,guest_author_details`;
  const data = await wpFetch(url.replace(WP_API, ''));
  return Array.isArray(data) ? data : [];
}

/** Save or update guest author (stored in WP options, no WP user created) */
async function saveGuestAuthor(fields) {
  const res = await fetch(`${WP_BASE}/wp-json/dehub/v1/guest-authors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({
      id: fields.id,
      name: fields.name,
      slug: fields.slug || fields.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      job_title: fields.jobTitle,
      description: fields.bio,
      avatar_url: fields.avatarUrl,
      website: fields.website,
      linkedin_url: fields.linkedin,
      twitter_url: fields.twitter,
      github_url: fields.github,
      email: fields.email,
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`Failed to save guest author: ${txt}`);
  }
  return res.json();
}

/** Delete guest author */
async function deleteGuestAuthorApi(id) {
  const url = `${WP_BASE}/wp-json/dehub/v1/guest-authors/${encodeURIComponent(id)}`;
  // POST with no custom headers is a "simple" request (no OPTIONS preflight).
  // DELETE + Authorization is what triggered the live CORS failure.
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) {
    throw new Error(`Failed to delete guest author`);
  }
  return res.json();
}

/** Update user meta via REST (requires Application Password for WP users) */
async function saveUserMeta(userId, fields) {
  if (fields.is_guest || (typeof userId === 'string' && userId.startsWith('guest_'))) {
    return saveGuestAuthor({ ...fields, id: userId });
  }
  return wpFetch(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({
      description: fields.bio,
      url: fields.website,
      name: fields.name,
      meta: {
        linkedin_url: fields.linkedin,
        twitter_url: fields.twitter,
        github_url: fields.github,
        job_title: fields.jobTitle,
        author_avatar_url: fields.avatarUrl,
      },
    }),
  });
}

/** Reassign a post's author or guest author meta */
async function reassignPostAuthor(postId, user) {
  const isGuest = user.is_guest || (typeof user.id === 'string' && user.id.startsWith('guest_'));
  if (isGuest) {
    return wpFetch(`/posts/${postId}`, {
      method: 'POST',
      body: JSON.stringify({
        meta: { guest_author_id: String(user.id) }
      }),
    });
  } else {
    return wpFetch(`/posts/${postId}`, {
      method: 'POST',
      body: JSON.stringify({
        author: user.id,
        meta: { guest_author_id: '' }
      }),
    });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function decodeHtml(html = '') {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Small user card for the left list */
function UserCard({ user, selected, onClick }) {
  const avatar = user.meta?.author_avatar_url || user.avatar_urls?.['48'] || '';
  return (
    <motion.button
      whileHover={{ x: 3 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left
        ${selected
          ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/20 border border-blue-500/50'
          : 'hover:bg-slate-700/40 border border-transparent'}`}
    >
      {avatar ? (
        <img src={avatar} alt={user.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-slate-600" />
      ) : (
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-black text-white">{initials(user.name)}</span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-white truncate">{user.name}</div>
        <div className="text-xs text-gray-400 truncate">{user.meta?.job_title || user.slug}</div>
      </div>
      {selected && <ChevronRight className="h-4 w-4 text-blue-400 flex-shrink-0" />}
    </motion.button>
  );
}

/** Labeled input field */
function Field({ label, id, type = 'text', value, onChange, placeholder, icon: Icon, hint, rows }) {
  const baseClass =
    'w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all';
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </label>
      {rows ? (
        <textarea id={id} rows={rows} value={value} onChange={onChange}
          placeholder={placeholder} className={baseClass + ' resize-none'} />
      ) : (
        <input id={id} type={type} value={value} onChange={onChange}
          placeholder={placeholder} className={baseClass} />
      )}
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ContributorManagerPage() {
  const { toast } = useToast();

  // ── User list state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  // ── Bio editor state
  const [editFields, setEditFields] = useState(null);   // null = not editing
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  // ── Posts by author
  const [authorPosts, setAuthorPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);

  // ── Post assignment
  const [postSearch, setPostSearch] = useState('');
  const [postResults, setPostResults] = useState([]);
  const [postSearchLoading, setPostSearchLoading] = useState(false);
  const [assigning, setAssigning] = useState(null); // postId being reassigned
  const postSearchTimer = useRef(null);

  // ── Modal state for adding guest contributor (no WP user)
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGuestFields, setNewGuestFields] = useState({
    name: '', jobTitle: '', bio: '', avatarUrl: '', linkedin: '', twitter: '', github: '', website: '', email: ''
  });
  const [addingGuest, setAddingGuest] = useState(false);

  // ── Active tab in right panel
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'edit' | 'posts' | 'assign'

  const hasAppPwd = Boolean(import.meta.env.VITE_WP_APP_PASSWORD);

  // ── Add Guest Contributor (No WP user account created!)
  const handleAddGuest = async (e) => {
    e.preventDefault();
    if (!newGuestFields.name.trim()) {
      toast({ title: 'Name required', description: 'Please enter a name for the guest contributor.', variant: 'destructive' });
      return;
    }
    setAddingGuest(true);
    try {
      const created = await saveGuestAuthor({
        id: 'guest_' + Date.now(),
        name: newGuestFields.name,
        jobTitle: newGuestFields.jobTitle,
        bio: newGuestFields.bio,
        avatarUrl: newGuestFields.avatarUrl,
        linkedin: newGuestFields.linkedin,
        twitter: newGuestFields.twitter,
        github: newGuestFields.github,
        website: newGuestFields.website,
        email: newGuestFields.email,
      });
      toast({ title: '✅ Guest Contributor Added', description: `${created.name} added as guest contributor (No WP User created).` });
      setShowAddModal(false);
      setNewGuestFields({ name: '', jobTitle: '', bio: '', avatarUrl: '', linkedin: '', twitter: '', github: '', website: '', email: '' });
      await loadUsers();
      selectUser(created);
    } catch (err) {
      toast({ title: 'Failed to add guest contributor', description: err.message, variant: 'destructive' });
    } finally {
      setAddingGuest(false);
    }
  };

  // ── Delete Guest Contributor
  const handleDeleteGuest = async () => {
    if (!selectedUser) return;
    const isGuest = selectedUser.is_guest || (typeof selectedUser.id === 'string' && selectedUser.id.startsWith('guest_'));
    if (!isGuest) {
      toast({ title: 'Cannot delete WP User', description: 'WP Users must be managed in WP Admin.', variant: 'destructive' });
      return;
    }
    if (!window.confirm(`Are you sure you want to delete guest contributor "${selectedUser.name}"? This action cannot be undone.`)) return;
    try {
      await deleteGuestAuthorApi(selectedUser.id);
      toast({ title: '✅ Contributor Deleted', description: `${selectedUser.name} has been removed.` });
      setSelectedUser(null);
      await loadUsers();
    } catch (err) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    }
  };

  // ── Load users
  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      setUsersError(err.message);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // ── Select a user → populate editor
  const selectUser = useCallback(async (user) => {
    setSelectedUser(user);
    setEditing(false);
    setActiveTab('preview');
    setEditFields({
      is_guest: user.is_guest || (typeof user.id === 'string' && user.id.startsWith('guest_')),
      name: user.name || '',
      bio: user.description || '',
      website: user.url || '',
      jobTitle: user.meta?.job_title || '',
      linkedin: user.meta?.linkedin_url || '',
      twitter: user.meta?.twitter_url || '',
      github: user.meta?.github_url || '',
      avatarUrl: user.meta?.author_avatar_url || '',
      email: user.email || '',
    });

    // Load their posts
    setPostsLoading(true);
    try {
      const { posts } = await fetchPostsByAuthor(user.id);
      setAuthorPosts(posts);
    } catch { setAuthorPosts([]); }
    finally { setPostsLoading(false); }
  }, []);

  // ── Save bio fields
  const handleSave = async () => {
    if (!selectedUser || !editFields) return;
    const isGuest = selectedUser.is_guest || (typeof selectedUser.id === 'string' && selectedUser.id.startsWith('guest_'));
    if (!hasAppPwd && !isGuest) {
      toast({ title: 'App Password required', description: 'Set VITE_WP_APP_PASSWORD in .env to enable saving.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const updated = await saveUserMeta(selectedUser.id, editFields);
      // Merge saved data back into user list
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, ...updated } : u));
      setSelectedUser(prev => ({ ...prev, ...updated }));
      toast({ title: '✅ Saved', description: `${editFields.name}'s profile has been updated.` });
      setEditing(false);
      setActiveTab('preview');
    } catch (err) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ── Post search (debounced)
  const handlePostSearch = (val) => {
    setPostSearch(val);
    clearTimeout(postSearchTimer.current);
    postSearchTimer.current = setTimeout(async () => {
      setPostSearchLoading(true);
      try {
        const results = await searchPosts(val);
        setPostResults(results);
      } catch { setPostResults([]); }
      finally { setPostSearchLoading(false); }
    }, 400);
  };

  // ── Assign post author
  const handleAssign = async (post) => {
    if (!selectedUser || !hasAppPwd) {
      toast({ title: 'App Password required', description: 'Set VITE_WP_APP_PASSWORD in .env to enable post assignment.', variant: 'destructive' });
      return;
    }
    setAssigning(post.id);
    try {
      await reassignPostAuthor(post.id, selectedUser);
      toast({ title: '✅ Author updated', description: `"${decodeHtml(post.title?.rendered || post.title)}" is now assigned to ${selectedUser.name}.` });
      // Remove from results to avoid confusion
      setPostResults(prev => prev.filter(p => p.id !== post.id));
      // Reload author's posts
      const { posts } = await fetchPostsByAuthor(selectedUser.id);
      setAuthorPosts(posts);
    } catch (err) {
      toast({ title: 'Assignment failed', description: err.message, variant: 'destructive' });
    } finally { setAssigning(null); }
  };

  // ── Build AuthorBioCard-compatible object from edit fields
  const previewAuthor = selectedUser ? {
    name: editFields?.name || selectedUser.name || '',
    bio: editFields?.bio || selectedUser.description || '',
    avatarUrl: editFields?.avatarUrl || selectedUser.meta?.author_avatar_url || selectedUser.avatar_urls?.['96'] || '',
    website: editFields?.website || selectedUser.url || '',
    linkedin: editFields?.linkedin || selectedUser.meta?.linkedin_url || '',
    twitter: editFields?.twitter || selectedUser.meta?.twitter_url || '',
    github: editFields?.github || selectedUser.meta?.github_url || '',
    role: editFields?.jobTitle || selectedUser.meta?.job_title || '',
    slug: selectedUser.slug || '',
  } : null;

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.slug || '').includes(userSearch.toLowerCase())
  );

  const tabs = [
    { id: 'preview', label: 'Preview', icon: Eye },
    { id: 'edit', label: 'Edit Bio', icon: Edit3 },
    { id: 'posts', label: `Posts (${authorPosts.length})`, icon: BookOpen },
    { id: 'assign', label: 'Assign Post', icon: Link2 },
  ];

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full mb-2">
            <Users className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Contributor Management</span>
          </div>
          <h1 className="text-2xl font-black text-white">Guest Contributors</h1>
          <p className="text-gray-400 text-sm mt-1">Manage contributor bios, preview author cards, and assign posts — all from one place.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/20 transition-all text-sm"
          >
            <Plus className="h-4 w-4" />
            Add Guest Contributor
          </button>
          <button
            onClick={loadUsers}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700/50 border border-slate-600/40 text-gray-300 hover:text-white hover:bg-slate-700 transition-all text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* ── App password warning ── */}
      {!hasAppPwd && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-300">Read-only mode — set <code className="bg-amber-900/40 px-1 rounded">VITE_WP_APP_PASSWORD</code> in <code className="bg-amber-900/40 px-1 rounded">.env</code> to enable saving & post assignment.</p>
            <p className="text-amber-400/70 mt-1">WP Admin → Users → (your user) → Application Passwords → Create, then base64-encode <code>username:password</code>.</p>
          </div>
        </motion.div>
      )}

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left panel: user list ── */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
          className="lg:col-span-1 bg-slate-900/60 border border-slate-700/40 rounded-2xl overflow-hidden flex flex-col" style={{ maxHeight: '85vh' }}>

          {/* Search */}
          <div className="p-4 border-b border-slate-700/40">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Search contributors..."
                className="w-full bg-slate-800/60 border border-slate-700/40 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {usersLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
                <p className="text-sm text-gray-500">Loading contributors...</p>
              </div>
            ) : usersError ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-4">
                <XCircle className="h-8 w-8 text-red-400" />
                <p className="text-sm text-red-400">{usersError}</p>
                <p className="text-xs text-gray-500">Make sure your WordPress REST API is accessible and CORS is configured.</p>
                <button onClick={loadUsers} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-2">
                  <RotateCcw className="h-3.5 w-3.5" /> Retry
                </button>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-12 text-center">
                <User className="h-8 w-8 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No contributors found</p>
              </div>
            ) : (
              filteredUsers.map(user => (
                <UserCard
                  key={user.id}
                  user={user}
                  selected={selectedUser?.id === user.id}
                  onClick={() => selectUser(user)}
                />
              ))
            )}
          </div>

          {/* Footer count */}
          {!usersLoading && !usersError && (
            <div className="p-3 border-t border-slate-700/40 text-center text-xs text-gray-500">
              {filteredUsers.length} contributor{filteredUsers.length !== 1 ? 's' : ''}
            </div>
          )}
        </motion.div>

        {/* ── Right panel ── */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-slate-900/60 border border-slate-700/40 rounded-2xl overflow-hidden flex flex-col" style={{ maxHeight: '85vh' }}>

          {!selectedUser ? (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-12">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/20 flex items-center justify-center">
                <Users className="h-10 w-10 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Select a Contributor</h3>
                <p className="text-sm text-gray-400 max-w-sm">Choose a contributor from the left panel to view their bio, edit their profile, and manage their posts.</p>
              </div>
            </div>
          ) : (
            <>
              {/* User header strip */}
              <div className="p-5 border-b border-slate-700/40 flex items-center gap-4">
                {previewAuthor?.avatarUrl ? (
                  <img src={previewAuthor.avatarUrl} alt={selectedUser.name} className="w-14 h-14 rounded-2xl object-cover border border-slate-600" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-black text-white">{initials(selectedUser.name)}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-white truncate">{selectedUser.name}</h2>
                  <p className="text-sm text-gray-400 truncate">{selectedUser.meta?.job_title || 'Guest Contributor'}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">@{selectedUser.slug}</span>
                    {selectedUser.email && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail className="h-3 w-3" />{selectedUser.email}
                      </span>
                    )}
                  </div>
                </div>
                {/* Quick actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {selectedUser.is_guest || (typeof selectedUser.id === 'string' && selectedUser.id.startsWith('guest_')) ? (
                    <>
                      <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                        Guest Author (No WP Account)
                      </span>
                      <button
                        onClick={handleDeleteGuest}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                        title="Delete Guest Author"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </>
                  ) : (
                    <a href={`${WP_BASE}/wp-admin/user-edit.php?user_id=${selectedUser.id}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-700/50 border border-slate-600/40 text-gray-300 hover:text-white hover:bg-slate-700 transition-all">
                      <ExternalLink className="h-3.5 w-3.5" /> WP Admin
                    </a>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 px-5 pt-4 pb-0 border-b border-slate-700/40">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); if (tab.id === 'assign' && postResults.length === 0) handlePostSearch(''); }}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all duration-200 border-b-2
                      ${activeTab === tab.id
                        ? 'text-blue-300 border-blue-400 bg-blue-500/10'
                        : 'text-gray-400 border-transparent hover:text-gray-200 hover:bg-slate-700/30'}`}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto p-6">
                <AnimatePresence mode="wait">

                  {/* ── PREVIEW TAB ── */}
                  {activeTab === 'preview' && (
                    <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div className="mb-4 flex items-center justify-between">
                        <p className="text-sm text-gray-400">Live preview of how the author bio card appears on articles.</p>
                        <button onClick={() => setActiveTab('edit')}
                          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600/30 transition-all">
                          <Edit3 className="h-3.5 w-3.5" /> Edit Bio
                        </button>
                      </div>
                      <div className="bg-slate-800/30 rounded-2xl p-6">
                        <AuthorBioCard author={previewAuthor} />
                      </div>

                      {/* Quick stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                        {[
                          { label: 'Published Posts', value: authorPosts.length, icon: FileText },
                          { label: 'LinkedIn', value: previewAuthor?.linkedin ? '✓' : '—', icon: Linkedin },
                          { label: 'Twitter / X', value: previewAuthor?.twitter ? '✓' : '—', icon: Twitter },
                          { label: 'GitHub', value: previewAuthor?.github ? '✓' : '—', icon: Github },
                        ].map(s => (
                          <div key={s.label} className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-3 text-center">
                            <s.icon className="h-4 w-4 text-blue-400 mx-auto mb-1" />
                            <div className="text-lg font-black text-white">{s.value}</div>
                            <div className="text-xs text-gray-400">{s.label}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* ── EDIT TAB ── */}
                  {activeTab === 'edit' && (
                    <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-bold text-white">Edit Bio Profile</h3>
                          <p className="text-xs text-gray-500 mt-0.5">Changes are saved back to WordPress via REST API.</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setActiveTab('preview'); setEditing(false); }}
                            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-slate-700/50 border border-slate-600/40 text-gray-300 hover:text-white transition-all">
                            <X className="h-3.5 w-3.5" /> Cancel
                          </button>
                          <button onClick={handleSave} disabled={saving}
                            className="flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold transition-all disabled:opacity-50">
                            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                            {saving ? 'Saving…' : 'Save Changes'}
                          </button>
                        </div>
                      </div>

                      {/* Form fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Display Name" id="name" icon={User}
                          value={editFields?.name || ''} placeholder="Jane Smith"
                          onChange={e => setEditFields(f => ({ ...f, name: e.target.value }))} />
                        <Field label="Job Title / Role" id="jobTitle" icon={Briefcase}
                          value={editFields?.jobTitle || ''} placeholder="Senior Data Engineer at Acme"
                          onChange={e => setEditFields(f => ({ ...f, jobTitle: e.target.value }))} />
                      </div>

                      <Field label="Bio / Description" id="bio" icon={FileText} rows={4}
                        value={editFields?.bio || ''} placeholder="Write a short bio that will appear below every article…"
                        onChange={e => setEditFields(f => ({ ...f, bio: e.target.value }))} />

                      <Field label="Avatar Photo URL" id="avatarUrl" icon={Camera}
                        value={editFields?.avatarUrl || ''}
                        placeholder="https://yourdomain.com/photo.jpg (overrides Gravatar)"
                        hint="Paste a direct link to the contributor's headshot. 256×256 px or larger recommended."
                        onChange={e => setEditFields(f => ({ ...f, avatarUrl: e.target.value }))} />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="LinkedIn URL" id="linkedin" icon={Linkedin}
                          value={editFields?.linkedin || ''} placeholder="https://linkedin.com/in/username"
                          onChange={e => setEditFields(f => ({ ...f, linkedin: e.target.value }))} />
                        <Field label="Twitter / X URL" id="twitter" icon={Twitter}
                          value={editFields?.twitter || ''} placeholder="https://twitter.com/username"
                          onChange={e => setEditFields(f => ({ ...f, twitter: e.target.value }))} />
                        <Field label="GitHub URL" id="github" icon={Github}
                          value={editFields?.github || ''} placeholder="https://github.com/username"
                          onChange={e => setEditFields(f => ({ ...f, github: e.target.value }))} />
                        <Field label="Personal Website" id="website" icon={Globe}
                          value={editFields?.website || ''} placeholder="https://yourblog.com"
                          onChange={e => setEditFields(f => ({ ...f, website: e.target.value }))} />
                      </div>

                      {!hasAppPwd && (
                        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-sm">
                          <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                          <span className="text-amber-300">Set <code className="bg-amber-900/40 px-1 rounded text-xs">VITE_WP_APP_PASSWORD</code> to enable saving. Until then, use <strong>WP Admin → Users</strong> to save changes.</span>
                        </div>
                      )}

                      {/* Live mini-preview */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> Live Preview</p>
                        <div className="bg-slate-800/30 rounded-2xl p-4 scale-95 origin-top">
                          <AuthorBioCard author={{
                            ...previewAuthor,
                            name: editFields?.name || previewAuthor?.name || '',
                            bio: editFields?.bio || previewAuthor?.bio || '',
                            role: editFields?.jobTitle || previewAuthor?.role || '',
                            linkedin: editFields?.linkedin || previewAuthor?.linkedin || '',
                            twitter: editFields?.twitter || previewAuthor?.twitter || '',
                            github: editFields?.github || previewAuthor?.github || '',
                            website: editFields?.website || previewAuthor?.website || '',
                            avatarUrl: editFields?.avatarUrl || previewAuthor?.avatarUrl || '',
                          }} />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ── POSTS TAB ── */}
                  {activeTab === 'posts' && (
                    <motion.div key="posts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-white">
                          Published Articles by {selectedUser.name}
                        </h3>
                        <button onClick={() => { setActiveTab('assign'); handlePostSearch(''); }}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600/30 transition-all">
                          <Plus className="h-3.5 w-3.5" /> Assign more posts
                        </button>
                      </div>

                      {postsLoading ? (
                        <div className="flex items-center gap-3 py-8 justify-center">
                          <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
                          <span className="text-sm text-gray-400">Loading posts…</span>
                        </div>
                      ) : authorPosts.length === 0 ? (
                        <div className="text-center py-12">
                          <BookOpen className="h-8 w-8 text-gray-600 mx-auto mb-3" />
                          <p className="text-sm text-gray-400">No published posts found for this contributor.</p>
                          <button onClick={() => { setActiveTab('assign'); handlePostSearch(''); }}
                            className="mt-4 text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mx-auto">
                            <Plus className="h-3.5 w-3.5" /> Assign a post
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {authorPosts.map(post => (
                            <div key={post.id} className="flex items-center gap-3 p-3 bg-slate-800/40 border border-slate-700/30 rounded-xl hover:border-slate-600/50 transition-all">
                              <FileText className="h-4 w-4 text-blue-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                  {decodeHtml(post.title?.rendered || post.title || 'Untitled')}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                              </div>
                              <a href={`${WP_BASE}/articles/${post.slug}`} target="_blank" rel="noopener noreferrer"
                                className="flex-shrink-0 text-gray-500 hover:text-blue-400 transition-colors">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* ── ASSIGN TAB ── */}
                  {activeTab === 'assign' && (
                    <motion.div key="assign" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                      <div>
                        <h3 className="text-base font-bold text-white mb-1">Assign Post to {selectedUser.name}</h3>
                        <p className="text-sm text-gray-400">Search for a post and reassign its author to this contributor.</p>
                      </div>

                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <input
                          value={postSearch}
                          onChange={e => handlePostSearch(e.target.value)}
                          placeholder="Search posts by title…"
                          className="w-full bg-slate-800/60 border border-slate-700/40 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        />
                        {postSearchLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />}
                      </div>

                      {!hasAppPwd && (
                        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-sm">
                          <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                          <span className="text-amber-300">Set <code className="bg-amber-900/40 px-1 rounded text-xs">VITE_WP_APP_PASSWORD</code> to enable post assignment.</span>
                        </div>
                      )}

                      <div className="space-y-2">
                        {postResults.map(post => (
                          <div key={post.id} className="flex items-center gap-3 p-3 bg-slate-800/40 border border-slate-700/30 rounded-xl hover:border-blue-500/30 transition-all">
                            <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {decodeHtml(post.title?.rendered || post.title || 'Untitled')}
                              </p>
                              <p className="text-xs text-gray-500">
                                ID: {post.id} · Current author: {post.guest_author_details?.name ? `${post.guest_author_details.name} (Guest)` : `WP User #${post.author}`}
                              </p>
                            </div>
                            <button
                              onClick={() => handleAssign(post)}
                              disabled={assigning === post.id || !hasAppPwd}
                              className="flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold transition-all disabled:opacity-40"
                            >
                              {assigning === post.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                              {assigning === post.id ? 'Assigning…' : 'Assign'}
                            </button>
                          </div>
                        ))}
                        {!postSearchLoading && postResults.length === 0 && postSearch && (
                          <div className="text-center py-8 text-sm text-gray-500">No posts found for "{postSearch}"</div>
                        )}
                        {!postSearchLoading && postResults.length === 0 && !postSearch && (
                          <div className="text-center py-8 text-sm text-gray-500">Type above to search posts</div>
                        )}
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* ── Add Guest Contributor Modal (No WP User Account Created) ── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700/60 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-700/40 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-400" />
                    Add Guest Contributor
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Creates a guest author profile without creating a WordPress user account.
                  </p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white p-1 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddGuest} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Display Name *" id="new_name" icon={User}
                    value={newGuestFields.name} placeholder="Jane Doe"
                    onChange={e => setNewGuestFields(f => ({ ...f, name: e.target.value }))} />
                  <Field label="Job Title / Role" id="new_jobTitle" icon={Briefcase}
                    value={newGuestFields.jobTitle} placeholder="Senior Data Engineer"
                    onChange={e => setNewGuestFields(f => ({ ...f, jobTitle: e.target.value }))} />
                </div>

                <Field label="Bio / Profile Description" id="new_bio" icon={FileText} rows={3}
                  value={newGuestFields.bio} placeholder="Short bio displayed on author card..."
                  onChange={e => setNewGuestFields(f => ({ ...f, bio: e.target.value }))} />

                <Field label="Avatar Photo URL" id="new_avatarUrl" icon={Camera}
                  value={newGuestFields.avatarUrl} placeholder="https://example.com/photo.jpg"
                  hint="Direct headshot image URL."
                  onChange={e => setNewGuestFields(f => ({ ...f, avatarUrl: e.target.value }))} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="LinkedIn URL" id="new_linkedin" icon={Linkedin}
                    value={newGuestFields.linkedin} placeholder="https://linkedin.com/in/..."
                    onChange={e => setNewGuestFields(f => ({ ...f, linkedin: e.target.value }))} />
                  <Field label="Twitter / X URL" id="new_twitter" icon={Twitter}
                    value={newGuestFields.twitter} placeholder="https://twitter.com/..."
                    onChange={e => setNewGuestFields(f => ({ ...f, twitter: e.target.value }))} />
                  <Field label="GitHub URL" id="new_github" icon={Github}
                    value={newGuestFields.github} placeholder="https://github.com/..."
                    onChange={e => setNewGuestFields(f => ({ ...f, github: e.target.value }))} />
                  <Field label="Personal Website" id="new_website" icon={Globe}
                    value={newGuestFields.website} placeholder="https://..."
                    onChange={e => setNewGuestFields(f => ({ ...f, website: e.target.value }))} />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/40">
                  <button type="button" onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm font-semibold rounded-xl bg-slate-800 border border-slate-700 text-gray-300 hover:text-white transition-all">
                    Cancel
                  </button>
                  <button type="submit" disabled={addingGuest}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all disabled:opacity-50">
                    {addingGuest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {addingGuest ? 'Adding...' : 'Add Contributor'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
