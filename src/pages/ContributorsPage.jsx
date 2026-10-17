// src/pages/ContributorsPage.jsx
// Public contributor directory — shows all guest authors on the blog.
// Great for SEO social-proof ("Meet our expert contributors").

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users, Linkedin, Twitter, Globe, Github, FileText,
  ArrowRight, Search, Sparkles, BadgeCheck, Crown
} from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';
import { safeExternalUrl } from '@/utils/safeUrl';
import {
  isBlogOwner,
  contributorRole,
  OWNER_BADGE_LABEL,
  OWNER_DISPLAY_NAME,
  OWNER_PROFILE_PATH,
} from '@/lib/contributorIdentity';

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

  return withCounts.sort((a, b) => {
    const ownerDelta = Number(isBlogOwner(b)) - Number(isBlogOwner(a));
    if (ownerDelta) return ownerDelta;
    return b.postCount - a.postCount;
  });
}

function OwnerBadge({ size = 'sm' }) {
  const compact = size === 'sm';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 text-amber-950 font-black uppercase tracking-wider shadow-lg shadow-amber-500/25 ${compact ? 'px-2.5 py-0.5 text-[10px]' : 'px-3.5 py-1 text-xs'}`}>
      <Crown className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {OWNER_BADGE_LABEL}
    </span>
  );
}

function ContributorCard({ user, index, featured = false }) {
  const owner = isBlogOwner(user);
  const displayName = owner ? OWNER_DISPLAY_NAME : user.name;
  const avatar = user.meta?.author_avatar_url || user.avatar_urls?.['96'] || '';
  const linkedin = safeExternalUrl(user.meta?.linkedin_url);
  const twitterRaw = (user.meta?.twitter_url || '').trim();
  const twitter = /^@?[A-Za-z0-9_]{1,30}$/.test(twitterRaw)
    ? `https://twitter.com/${twitterRaw.replace('@', '')}`
    : safeExternalUrl(twitterRaw);
  const github = safeExternalUrl(user.meta?.github_url);
  const website = safeExternalUrl(user.url);
  const jobTitle = contributorRole(user);
  const bio = decodeHtml(user.description || (owner ? 'Data Engineer building scalable data pipelines, cloud warehouses, and modern analytics solutions.' : ''));
  const profileTo = owner ? OWNER_PROFILE_PATH : `/contributors/${user.slug}`;
  const profileLabel = owner ? 'About the founder' : 'View Profile';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={owner
        ? `group relative overflow-hidden rounded-2xl p-6 md:p-8 flex flex-col gap-4 border-2 border-amber-400/50 bg-gradient-to-br from-amber-950/50 via-slate-900 to-slate-950 shadow-xl shadow-amber-900/20 hover:border-amber-300/70 hover:shadow-amber-800/30 transition-all duration-300 ${featured ? 'md:flex-row md:flex-wrap md:items-start md:gap-x-8' : ''}`
        : 'group relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/40 hover:border-blue-500/40 rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/20'}
    >
      {owner && (
        <>
          <div className="pointer-events-none absolute -top-16 -right-10 w-48 h-48 bg-amber-400/15 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-8 w-36 h-36 bg-orange-500/10 rounded-full blur-3xl" />
        </>
      )}

      {/* Top row */}
      <div className={`relative flex items-start gap-4 ${featured && owner ? 'md:flex-1' : ''}`}>
        {/* Avatar */}
        <div className="flex-shrink-0">
          {avatar ? (
            <img src={avatar} alt={displayName}
              className={owner
                ? 'w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border-2 border-amber-300/60 shadow-lg shadow-amber-500/20'
                : 'w-16 h-16 rounded-2xl object-cover border-2 border-blue-500/20 shadow-lg'} />
          ) : (
            <div className={owner
              ? 'w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/30'
              : 'w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-lg'}>
              <span className="text-xl font-black text-white">{initials(displayName)}</span>
            </div>
          )}
        </div>

        {/* Name + role */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {owner ? <OwnerBadge size={featured ? 'md' : 'sm'} /> : <BadgeCheck className="h-4 w-4 text-blue-400 flex-shrink-0" />}
            <h3 className={`font-bold text-white truncate ${featured && owner ? 'text-xl md:text-2xl' : 'text-base'}`}>{displayName}</h3>
          </div>
          <p className={`text-xs font-semibold ${owner ? 'text-amber-300' : 'text-blue-400'}`}>{jobTitle}</p>
          {owner && (
            <p className="mt-1 text-xs text-amber-100/70">Runs DataEngineer Hub — not a guest author.</p>
          )}
          {user.postCount > 0 && (
            <span className={`inline-flex items-center gap-1 mt-1 text-xs ${owner ? 'text-amber-100/60' : 'text-gray-400'}`}>
              <FileText className="h-3 w-3" /> {user.postCount} article{user.postCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Bio */}
      {bio && (
        <p className={`relative text-sm leading-relaxed line-clamp-3 ${owner ? 'text-amber-50/70' : 'text-gray-400'} ${featured && owner ? 'md:flex-1 md:pt-1' : ''}`}>{bio}</p>
      )}

      {/* Social + CTA */}
      <div className={`relative flex items-center gap-2 flex-wrap mt-auto pt-2 ${owner ? 'border-t border-amber-400/20' : 'border-t border-slate-700/30'} ${featured && owner ? 'md:w-full' : ''}`}>
        {linkedin && (
          <a href={linkedin} target="_blank" rel="noopener noreferrer"
            aria-label={`${user.name} on LinkedIn`}
            className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 hover:text-blue-300 transition-all">
            <Linkedin className="h-3.5 w-3.5" />
          </a>
        )}
        {twitter && (
          <a href={twitter}
            target="_blank" rel="noopener noreferrer"
            aria-label={`${user.name} on Twitter`}
            className="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-400 hover:text-sky-300 transition-all">
            <Twitter className="h-3.5 w-3.5" />
          </a>
        )}
        {github && (
          <a href={github} target="_blank" rel="noopener noreferrer"
            aria-label={`${user.name} on GitHub`}
            className="p-1.5 rounded-lg bg-slate-600/30 hover:bg-slate-600/50 border border-slate-500/30 text-gray-300 hover:text-white transition-all">
            <Github className="h-3.5 w-3.5" />
          </a>
        )}
        {website && (
          <a href={website} target="_blank" rel="noopener noreferrer"
            aria-label={`${user.name}'s website`}
            className="p-1.5 rounded-lg bg-slate-600/30 hover:bg-slate-600/50 border border-slate-500/30 text-gray-300 hover:text-white transition-all">
            <Globe className="h-3.5 w-3.5" />
          </a>
        )}

        <Link to={profileTo}
          className={owner
            ? 'ml-auto flex items-center gap-1.5 text-xs font-semibold text-amber-950 hover:text-black transition-colors px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-orange-400 border border-amber-200/40'
            : 'ml-auto flex items-center gap-1.5 text-xs font-semibold text-blue-300 hover:text-blue-100 transition-colors px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-400/40'}>
          {profileLabel} <ArrowRight className="h-3 w-3" />
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

  const query = search.toLowerCase().trim();
  const filtered = contributors.filter((u) => {
    if (!query) return true;
    const owner = isBlogOwner(u);
    const hay = [
      u.name,
      u.meta?.job_title,
      owner ? OWNER_DISPLAY_NAME : '',
      owner ? OWNER_BADGE_LABEL : '',
      owner ? contributorRole(u) : '',
      owner ? 'founder owner' : 'guest',
    ].join(' ').toLowerCase();
    return hay.includes(query);
  });
  const owner = filtered.find((u) => isBlogOwner(u));
  const guests = filtered.filter((u) => !isBlogOwner(u));

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
            <p className="text-lg text-gray-300 leading-relaxed max-w-2xl mx-auto mb-6">
              DataEngineer Hub is not a content mill. Tutorials, cheat sheets, and tools are written by people who have run the stacks they describe. The founder and owner is{' '}
              <Link to="/about" className="text-amber-300 hover:text-amber-200 underline">Sainath Reddy</Link>
              {' '}— listed below with a gold Founder & Owner badge, not as a guest.
              Guest authors appear here only after at least one piece has passed editorial review and gone live.
            </p>
            <div className="text-left text-gray-400 text-base leading-relaxed max-w-2xl mx-auto space-y-3">
              <p>
                Review is the same bar as staff content: technical accuracy, working examples where code is shown, a real name and bio, and no unedited AI drafts. Bylines are not sold. If a guest post is wrong after publication, we patch it in public the same way we patch staff posts.
              </p>
              <p>
                Want to be listed? Send a one-paragraph pitch plus two samples via{' '}
                <Link to="/contribute" className="text-blue-400 hover:text-blue-300 underline">Write for Us</Link>.
                We decline pitches that only rephrase vendor docs. A useful guest post usually comes from a production incident, a migration, a cost save, or a design other engineers can copy.
              </p>
            </div>
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
            <div className="max-w-6xl mx-auto">
              {owner && (
                <div className="mb-10">
                  <ContributorCard user={owner} index={0} featured />
                </div>
              )}
              {guests.length > 0 && (
                <>
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Guest contributors</h2>
                    <p className="text-sm text-gray-500">{guests.length} guest{guests.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {guests.map((user, i) => (
                      <ContributorCard key={user.id} user={user} index={i + 1} />
                    ))}
                  </div>
                </>
              )}
            </div>
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
