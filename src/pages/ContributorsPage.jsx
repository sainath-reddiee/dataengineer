// src/pages/ContributorsPage.jsx
// Public contributor directory — shows all guest authors on the blog.
// Great for SEO social-proof ("Meet our expert contributors").

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users, Linkedin, Twitter, Globe, Github, FileText,
  ArrowRight, Search, Sparkles, BadgeCheck
} from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';

const WP_BASE = import.meta.env.DEV ? '' : 'https://app.dataengineerhub.blog';
const WP_API = `${WP_BASE}/wp-json/wp/v2`;

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function decodeHtml(html = '') {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

async function loadContributors() {
  // Fetch unified contributors list (WP Users + Guest Authors)
  const res = await fetch(
    `${WP_BASE}/wp-json/dehub/v1/contributors`
  );
  const users = await res.json();
  if (!Array.isArray(users)) return [];

  // For each contributor, calculate post count
  const withCounts = await Promise.all(
    users.map(async (u) => {
      try {
        let count = 0;
        const isGuest = u.is_guest || (typeof u.id === 'string' && u.id.startsWith('guest_'));
        if (isGuest) {
          const pr = await fetch(`${WP_API}/posts?per_page=100&status=publish&_fields=id,guest_author_details`);
          const posts = await pr.json();
          if (Array.isArray(posts)) {
            count = posts.filter(p => p.guest_author_details?.id === u.id || p.guest_author_details?.slug === u.slug).length;
          }
        } else {
          const pr = await fetch(`${WP_API}/posts?author=${u.id}&per_page=1&status=publish&_fields=id`);
          count = parseInt(pr.headers.get('X-WP-Total') || '0');
        }
        return { ...u, postCount: count };
      } catch { return { ...u, postCount: 0 }; }
    })
  );

  return withCounts.sort((a, b) => b.postCount - a.postCount);
}

function ContributorCard({ user, index }) {
  const avatar = user.meta?.author_avatar_url || user.avatar_urls?.['96'] || '';
  const linkedin = user.meta?.linkedin_url || '';
  const twitter = user.meta?.twitter_url || '';
  const github = user.meta?.github_url || '';
  const website = user.url || '';
  const jobTitle = user.meta?.job_title || 'Guest Contributor';
  const bio = decodeHtml(user.description || '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="group relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/40 hover:border-blue-500/40 rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/20"
    >
      {/* Top row */}
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {avatar ? (
            <img src={avatar} alt={user.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500/20 shadow-lg" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <span className="text-xl font-black text-white">{initials(user.name)}</span>
            </div>
          )}
        </div>

        {/* Name + role */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <BadgeCheck className="h-4 w-4 text-blue-400 flex-shrink-0" />
            <h3 className="text-base font-bold text-white truncate">{user.name}</h3>
          </div>
          <p className="text-xs font-semibold text-blue-400">{jobTitle}</p>
          {user.postCount > 0 && (
            <span className="inline-flex items-center gap-1 mt-1 text-xs text-gray-400">
              <FileText className="h-3 w-3" /> {user.postCount} article{user.postCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Bio */}
      {bio && (
        <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">{bio}</p>
      )}

      {/* Social + CTA */}
      <div className="flex items-center gap-2 flex-wrap mt-auto pt-2 border-t border-slate-700/30">
        {linkedin && (
          <a href={linkedin} target="_blank" rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 hover:text-blue-300 transition-all">
            <Linkedin className="h-3.5 w-3.5" />
          </a>
        )}
        {twitter && (
          <a href={twitter.startsWith('http') ? twitter : `https://twitter.com/${twitter.replace('@', '')}`}
            target="_blank" rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-400 hover:text-sky-300 transition-all">
            <Twitter className="h-3.5 w-3.5" />
          </a>
        )}
        {github && (
          <a href={github} target="_blank" rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-slate-600/30 hover:bg-slate-600/50 border border-slate-500/30 text-gray-300 hover:text-white transition-all">
            <Github className="h-3.5 w-3.5" />
          </a>
        )}
        {website && (
          <a href={website} target="_blank" rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-slate-600/30 hover:bg-slate-600/50 border border-slate-500/30 text-gray-300 hover:text-white transition-all">
            <Globe className="h-3.5 w-3.5" />
          </a>
        )}

        <Link to={`/contributors/${user.slug}`}
          className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-blue-300 hover:text-blue-100 transition-colors px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-400/40">
          View Profile <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </motion.div>
  );
}

const ContributorsPage = () => {
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadContributors()
      .then(setContributors)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = contributors.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    (u.meta?.job_title || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <MetaTags
        title="Meet Our Contributors — DataEngineer Hub"
        description="Discover the expert data engineers and practitioners who write for DataEngineer Hub. Real-world professionals sharing practical tutorials, architecture guides, and career insights."
        type="website"
      />
      <div className="pt-4 pb-16 overflow-hidden">
        <div className="container mx-auto px-6">

          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
            className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-5 py-2 rounded-full mb-5 border border-blue-500/30">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-300">Community Authors</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">
              Meet Our <span className="gradient-text">Contributors</span>
            </h1>
            <p className="text-lg text-gray-300 leading-relaxed max-w-2xl mx-auto">
              DataEngineer Hub is powered by a community of real practitioners — data engineers, architects, and cloud professionals who write from hands-on experience.
            </p>
          </motion.div>

          {/* Search */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
            className="max-w-md mx-auto mb-10">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search contributors…"
                className="w-full bg-slate-800/60 border border-slate-700/40 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </motion.div>

          {/* Grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-slate-800/40 rounded-2xl p-6 animate-pulse space-y-4">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-700 rounded w-3/4" />
                      <div className="h-3 bg-slate-700 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-700 rounded" />
                    <div className="h-3 bg-slate-700 rounded w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-400 mb-2">Failed to load contributors</p>
              <p className="text-gray-500 text-sm">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-10 w-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No contributors found.</p>
            </div>
          ) : (
            <>
              <p className="text-center text-sm text-gray-500 mb-6">{filtered.length} contributor{filtered.length !== 1 ? 's' : ''}</p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {filtered.map((user, i) => (
                  <ContributorCard key={user.id} user={user} index={i} />
                ))}
              </div>
            </>
          )}

          {/* CTA banner */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="mt-16 max-w-3xl mx-auto text-center bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-pink-900/40 border border-blue-500/20 rounded-2xl p-10">
            <Users className="h-10 w-10 text-blue-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-3">Want to Join the List?</h2>
            <p className="text-gray-300 max-w-lg mx-auto mb-6">
              We're always looking for experienced data engineers to share their knowledge. Submit a guest post proposal and get your byline in front of thousands of readers.
            </p>
            <Link to="/contribute"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition-all duration-300">
              Become a Contributor <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>

        </div>
      </div>
    </>
  );
};

export default ContributorsPage;
