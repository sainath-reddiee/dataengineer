// src/pages/ContributorProfilePage.jsx
// Individual contributor profile page at /contributors/:slug
// Shows full bio card + all published articles by that contributor.

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, FileText, ArrowRight, Loader2, XCircle, Calendar, Clock
} from 'lucide-react';
import AuthorBioCard from '@/components/AuthorBioCard';
import MetaTags from '@/components/SEO/MetaTags';
import PostCard from '@/components/PostCard';
import wordpressApi from '@/services/wordpressApi';
import { isBlogOwner, contributorRole, OWNER_DISPLAY_NAME } from '@/lib/contributorIdentity';

const WP_BASE = import.meta.env.DEV ? '' : 'https://app.dataengineerhub.blog';
const WP_API = `${WP_BASE}/wp-json/wp/v2`;

function decodeHtml(html = '') {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

async function fetchUserBySlug(slug) {
  const res = await fetch(
    `${WP_BASE}/wp-json/dehub/v1/contributors?slug=${encodeURIComponent(slug)}`
  );
  const users = await res.json();
  if (!users || users.length === 0) throw new Error(`Contributor "${slug}" not found`);
  return users[0];
}

const ContributorProfilePage = () => {
  const { slug } = useParams();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    fetchUserBySlug(slug)
      .then(async (u) => {
        setUser(u);
        setLoading(false);
        setPostsLoading(true);

        const isGuest = u.is_guest || (typeof u.id === 'string' && u.id.startsWith('guest_'));
        let data = [];
        let count = 0;
        let totalPgs = 1;

        if (isGuest) {
          const res = await fetch(
            `${WP_API}/posts?per_page=50&status=publish&_embed=wp:featuredmedia,wp:term,author`
          );
          const rawPosts = await res.json();
          const filtered = Array.isArray(rawPosts)
            ? rawPosts.filter(p => p.guest_author_details?.id === u.id || p.guest_author_details?.slug === u.slug || p.meta?.guest_author_id === u.id)
            : [];
          count = filtered.length;
          totalPgs = 1;
          data = filtered;
        } else {
          const res = await fetch(
            `${WP_API}/posts?author=${u.id}&per_page=12&page=1&status=publish&_embed=wp:featuredmedia,wp:term,author`
          );
          totalPgs = parseInt(res.headers.get('X-WP-TotalPages') || '1');
          count = parseInt(res.headers.get('X-WP-Total') || '0');
          data = await res.json();
        }

        setTotalPosts(count);
        setTotalPages(totalPgs);
        const transformed = wordpressApi.transformPosts(data);
        setPosts(transformed);
        setPostsLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [slug]);

  const loadMorePosts = async () => {
    if (!user || page >= totalPages) return;
    const nextPage = page + 1;
    setPostsLoading(true);
    try {
      const res = await fetch(
        `${WP_API}/posts?author=${user.id}&per_page=12&page=${nextPage}&status=publish&_embed=wp:featuredmedia,wp:term,author`
      );
      const data = await res.json();
      const transformed = wordpressApi.transformPosts(data);
      setPosts(prev => [...prev, ...transformed]);
      setPage(nextPage);
    } catch (e) {
      console.error('Error loading more posts:', e);
    } finally {
      setPostsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-blue-400 animate-spin" />
          <p className="text-gray-400">Loading contributor profile…</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-center px-6">
        <div>
          <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Contributor Not Found</h1>
          <p className="text-gray-400 mb-6">{error || 'This contributor profile does not exist.'}</p>
          <Link to="/contributors"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Contributors
          </Link>
        </div>
      </div>
    );
  }

  // Build authorData shape for AuthorBioCard
  const owner = isBlogOwner(user);
  const authorData = {
    id: user.id,
    name: user.name || '',
    bio: decodeHtml(user.description || ''),
    avatarUrl: user.meta?.author_avatar_url || user.avatar_urls?.['96'] || '',
    website: user.url || '',
    linkedin: user.meta?.linkedin_url || '',
    twitter: user.meta?.twitter_url || '',
    github: user.meta?.github_url || '',
    role: contributorRole(user),
    slug: user.slug,
  };

  const metaTitle = owner
    ? `${OWNER_DISPLAY_NAME} — Founder & Owner of DataEngineer Hub`
    : `${user.name} — Contributor at DataEngineer Hub`;
  const metaDesc = authorData.bio
    ? `${authorData.bio.slice(0, 155)}…`
    : `Read articles by ${user.name} on DataEngineer Hub — practical data engineering tutorials and insights.`;

  return (
    <>
      <MetaTags
        title={metaTitle}
        description={metaDesc}
        type="profile"
      />
      <div className="pt-4 pb-16 overflow-hidden">
        <div className="container mx-auto px-6 max-w-5xl">

          {/* Back nav */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <Link to="/contributors"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-blue-300 transition-colors">
              <ArrowLeft className="h-4 w-4" /> All Contributors
            </Link>
          </motion.div>

          {/* Author Bio Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <AuthorBioCard author={authorData} />
          </motion.div>

          {/* Articles section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/10 rounded-xl">
                <FileText className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Articles by {user.name}
                </h2>
                <p className="text-sm text-gray-400">{totalPosts} published article{totalPosts !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {posts.length === 0 && !postsLoading ? (
              <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700/30">
                <FileText className="h-8 w-8 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No published articles yet.</p>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post, i) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                    >
                      <PostCard post={post} />
                    </motion.div>
                  ))}
                </div>

                {/* Load more */}
                {page < totalPages && (
                  <div className="text-center mt-10">
                    <button
                      onClick={loadMorePosts}
                      disabled={postsLoading}
                      className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                    >
                      {postsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                      {postsLoading ? 'Loading…' : 'Load More Articles'}
                    </button>
                  </div>
                )}

                {postsLoading && posts.length === 0 && (
                  <div className="flex items-center justify-center py-12 gap-3">
                    <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
                    <span className="text-gray-400">Loading articles…</span>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ContributorProfilePage;
