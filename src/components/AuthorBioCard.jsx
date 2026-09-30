// src/components/AuthorBioCard.jsx
// Rich author bio card displayed at the bottom of every article.
// Works for both the blog owner (Sainath Reddy) and guest contributors.
// Avatar, bio, role, and social links are all pulled from WordPress user profiles.

import React from 'react';
import { Link } from 'react-router-dom';
import { Linkedin, Twitter, Globe, Github, ArrowRight, BadgeCheck, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  isBlogOwner,
  OWNER_BADGE_LABEL,
  OWNER_DISPLAY_NAME,
  OWNER_ROLE,
  OWNER_PROFILE_PATH,
} from '@/lib/contributorIdentity';

const AuthorBioCard = ({ author }) => {
  if (!author || !author.name) return null;

  const isOwner = isBlogOwner(author);
  const displayName = isOwner ? OWNER_DISPLAY_NAME : author.name;
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // For the owner, use a fixed role + a default bio if WP profile bio is empty
  const role = isOwner ? OWNER_ROLE : (author.role || 'Guest Author');
  const YOE = Math.max(5, new Date().getFullYear() - 2021);
  const bio = isOwner
    ? author.bio ||
      `Data Engineer with ${YOE}+ years of experience building scalable data pipelines, cloud data warehouses, and end-to-end analytics solutions. Passionate about making complex data engineering concepts accessible to everyone.`
    : author.bio;

  // For the owner always show the main domain, not the WP admin subdomain
  const websiteUrl = isOwner ? 'https://dataengineerhub.blog' : author.website;

  const hasLinkedin  = Boolean(author.linkedin);
  const hasTwitter   = Boolean(author.twitter);
  const hasGithub    = !isOwner && Boolean(author.github);
  const hasWebsite   = !isOwner && Boolean(author.website);
  // Link to public contributor profile for guest authors
  const contributorSlug = !isOwner && author.slug ? author.slug : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="border-t-2 border-gray-700/50 pt-8 mt-12"
      suppressHydrationWarning
    >
      {/* Card */}
      <div className={isOwner
        ? 'relative overflow-hidden rounded-3xl border-2 border-amber-400/45 bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-slate-950 p-6 md:p-8 backdrop-blur-sm shadow-2xl shadow-amber-900/20'
        : 'relative overflow-hidden rounded-3xl border border-slate-700/40 bg-gradient-to-br from-slate-900/90 via-slate-800/60 to-slate-900/90 p-6 md:p-8 backdrop-blur-sm shadow-2xl shadow-blue-900/10'}>
        {/* Decorative blobs */}
        <div className={`pointer-events-none absolute inset-0 rounded-3xl ${isOwner ? 'bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-yellow-500/10' : 'bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-cyan-600/5'}`} />
        <div className={`pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl ${isOwner ? 'bg-amber-400/15' : 'bg-blue-500/8'}`} />
        <div className={`pointer-events-none absolute -bottom-10 -left-10 w-56 h-56 rounded-full blur-3xl ${isOwner ? 'bg-orange-500/10' : 'bg-purple-500/6'}`} />

        {/* Badge row */}
        <div className="relative mb-5">
          {isOwner ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 text-amber-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/25">
              <Crown className="h-3.5 w-3.5" />
              {OWNER_BADGE_LABEL}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/25 text-xs font-semibold text-blue-300 uppercase tracking-wider">
              <BadgeCheck className="h-3.5 w-3.5" />
              Guest Author
            </span>
          )}
        </div>

        {/* Main row */}
        <div className="relative flex flex-col sm:flex-row gap-5 md:gap-7">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {author.avatarUrl ? (
              <img
                src={author.avatarUrl}
                alt={displayName}
                width={96}
                height={96}
                loading="lazy"
                className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border-2 border-blue-500/30 shadow-xl shadow-blue-500/10"
              />
            ) : (
              <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20 border border-white/10">
                <span className="text-2xl md:text-3xl font-black text-white select-none">
                  {initials}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-3 min-w-0">
            {/* Name */}
            <div>
              {isOwner ? (
                <Link to={OWNER_PROFILE_PATH} className="group inline-flex items-center gap-2">
                  <h3 className="text-xl md:text-2xl font-black text-white group-hover:text-blue-300 transition-colors duration-200">
                    {displayName}
                  </h3>
                  <ArrowRight className="h-4 w-4 text-blue-400 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                </Link>
              ) : (
                <h3 className="text-xl md:text-2xl font-black text-white">{displayName}</h3>
              )}
              <p className="text-sm font-semibold text-blue-400 mt-0.5">{role}</p>
            </div>

            {/* Bio */}
            {bio && (
              <p className="text-sm md:text-base text-gray-400 leading-relaxed max-w-2xl">
                {bio}
              </p>
            )}

            {/* Social links + CTA */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {isOwner && (
                <Link
                  to={OWNER_PROFILE_PATH}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-300 hover:text-blue-100 transition-colors px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-400/40"
                >
                  View Profile <ArrowRight className="h-3 w-3" />
                </Link>
              )}

              {hasLinkedin && (
                <a
                  href={author.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${displayName} on LinkedIn`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-300 hover:text-blue-100 transition-colors px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-400/40"
                >
                  <Linkedin className="h-3.5 w-3.5" />
                  LinkedIn
                </a>
              )}

              {hasTwitter && (
                <a
                  href={
                    author.twitter.startsWith('http')
                      ? author.twitter
                      : `https://twitter.com/${author.twitter.replace('@', '')}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${displayName} on Twitter / X`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-300 hover:text-sky-100 transition-colors px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 hover:border-sky-400/40"
                >
                  <Twitter className="h-3.5 w-3.5" />
                  Twitter / X
                </a>
              )}

              {hasGithub && (
                <a
                  href={author.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${displayName} on GitHub`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 border border-slate-600/40 hover:border-slate-500/60"
                >
                  <Github className="h-3.5 w-3.5" />
                  GitHub
                </a>
              )}

              {hasWebsite && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${displayName}'s website`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 border border-slate-600/40 hover:border-slate-500/60"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Website
                </a>
              )}

              {contributorSlug && (
                <Link
                  to={`/contributors/${contributorSlug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-300 hover:text-blue-100 transition-colors px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-400/40"
                >
                  All articles <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>

          {/* Right CTA buttons (desktop) */}
          <div className="hidden md:flex flex-col gap-3 flex-shrink-0">
            <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold shadow-lg">
              <Link to="/articles">
                <ArrowRight className="mr-2 h-4 w-4" />
                More Articles
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-2 border-blue-400/40 text-blue-300 hover:bg-blue-500/15 font-semibold">
              <Link to="/contact">Get in Touch</Link>
            </Button>
          </div>
        </div>

        {/* Mobile CTA buttons */}
        <div className="relative flex gap-3 mt-5 md:hidden">
          <Button asChild className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold shadow-lg">
            <Link to="/articles">
              <ArrowRight className="mr-2 h-4 w-4" />
              More Articles
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1 border-2 border-blue-400/40 text-blue-300 hover:bg-blue-500/15 font-semibold">
            <Link to="/contact">Get in Touch</Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default AuthorBioCard;
