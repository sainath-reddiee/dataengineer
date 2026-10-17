// src/components/AuthorBioCard.jsx
// "About the author" note at the bottom of every article, for the blog owner
// and guest contributors. Avatar, bio, role and social links come from the
// WordPress user profile.

import { Link } from 'react-router-dom';
import { Linkedin, Twitter, Globe, Github } from 'lucide-react';
import {
  isBlogOwner,
  OWNER_DISPLAY_NAME,
  OWNER_ROLE,
  OWNER_PROFILE_PATH,
} from '@/lib/contributorIdentity';
import { safeExternalUrl } from '@/utils/safeUrl';

const linkClass =
  'inline-flex items-center gap-1.5 text-sm text-rust-600 underline decoration-rust-200 underline-offset-2 hover:decoration-rust-500';

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
  const role = isOwner ? OWNER_ROLE : (author.role || 'Guest author');
  const YOE = Math.max(5, new Date().getFullYear() - 2021);
  const bio = isOwner
    ? author.bio ||
      `${YOE}+ years building pipelines and warehouses on Snowflake, Databricks, AWS and Azure. These articles are written up from that work: the incidents, the cost surprises and the design decisions.`
    : author.bio;

  const twitterRaw = (author.twitter || '').trim();
  const twitterUrl = /^@?[A-Za-z0-9_]{1,30}$/.test(twitterRaw)
    ? `https://twitter.com/${twitterRaw.replace('@', '')}`
    : safeExternalUrl(twitterRaw);
  const linkedinUrl = safeExternalUrl(author.linkedin);
  const githubUrl = safeExternalUrl(author.github);
  const websiteUrl = safeExternalUrl(author.website);
  const contributorSlug = !isOwner && author.slug ? author.slug : null;

  return (
    <section aria-label="About the author" className="rounded-sm border border-paper-500 bg-paper-50 p-5 sm:p-6">
      <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">
        {isOwner ? 'About the author' : 'Guest author'}
      </p>
      <div className="flex gap-4 sm:gap-5">
        {author.avatarUrl ? (
          <img
            src={author.avatarUrl}
            alt=""
            width={72}
            height={72}
            loading="lazy"
            className="h-16 w-16 shrink-0 rounded-full object-cover sm:h-[72px] sm:w-[72px]"
          />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-paper-400 font-serif text-xl text-ink-soft">
            {initials}
          </span>
        )}
        <div className="min-w-0">
          {isOwner ? (
            <Link to={OWNER_PROFILE_PATH} className="font-serif text-xl font-semibold text-ink hover:text-rust-600">
              {displayName}
            </Link>
          ) : (
            <p className="font-serif text-xl font-semibold text-ink">{displayName}</p>
          )}
          <p className="text-sm text-ink-faint">{role}</p>
          {bio && <p className="mt-3 font-serif text-[17px] leading-relaxed text-ink-body">{bio}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            {isOwner && (
              <Link to={OWNER_PROFILE_PATH} className={linkClass}>About Sainath</Link>
            )}
            {linkedinUrl && (
              <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className={linkClass} aria-label={`${displayName} on LinkedIn`}>
                <Linkedin className="h-3.5 w-3.5" /> LinkedIn
              </a>
            )}
            {twitterUrl && (
              <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className={linkClass} aria-label={`${displayName} on Twitter / X`}>
                <Twitter className="h-3.5 w-3.5" /> X
              </a>
            )}
            {!isOwner && githubUrl && (
              <a href={githubUrl} target="_blank" rel="noopener noreferrer" className={linkClass} aria-label={`${displayName} on GitHub`}>
                <Github className="h-3.5 w-3.5" /> GitHub
              </a>
            )}
            {!isOwner && websiteUrl && (
              <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className={linkClass} aria-label={`${displayName}'s website`}>
                <Globe className="h-3.5 w-3.5" /> Website
              </a>
            )}
            {contributorSlug && (
              <Link to={`/contributors/${contributorSlug}`} className={linkClass}>All articles</Link>
            )}
            <Link to="/contact" className={linkClass}>Get in touch</Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuthorBioCard;
