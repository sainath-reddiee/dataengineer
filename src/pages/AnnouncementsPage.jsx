// Sponsored announcements (paid press releases). Noindexed by path, kept out
// of article feeds, and labeled on every page.
import { Link } from 'react-router-dom';
import MetaTags from '@/components/SEO/MetaTags';
import ArticleLedger from '@/components/editorial/ArticleLedger';
import { usePosts } from '@/hooks/useWordPress';

const AnnouncementsPage = () => {
  const { posts, loading, error } = usePosts({ categorySlug: 'announcements', per_page: 30 });

  return (
    <>
      <MetaTags
        title="Sponsored announcements"
        description="Paid product announcements and press releases from data-engineering companies, published on DataEngineer Hub and labeled as sponsored."
        noindex={true}
      />
      <div className="px-4 pb-16 pt-10 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <header className="border-b-2 border-ink pb-6">
            <p className="kicker mb-3">Sponsored</p>
            <h1 className="font-serif text-[34px] font-semibold leading-tight text-ink sm:text-[42px]">Announcements</h1>
            <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-ink-body">
              Product news and press releases from companies building data, API and AI tools. These are paid
              announcements, published as supplied with light editing. They are not reviews and I have not
              necessarily tested the products. For hands-on tutorials, read the{' '}
              <Link to="/articles" className="text-rust-600 underline decoration-rust-200 underline-offset-2">articles</Link>.
            </p>
            <p className="mt-3 text-sm text-ink-faint">
              Want to publish one? See <Link to="/advertise" className="text-rust-600 underline decoration-rust-200 underline-offset-2">advertising options</Link>.
            </p>
          </header>

          <div className="mt-2">
            {loading && posts.length === 0 && <p className="py-8 text-ink-muted">Loading announcements…</p>}
            {!loading && posts.length === 0 && (
              <p className="py-8 text-[17px] text-ink-muted">
                {/* A missing category just means nothing is published yet. */}
                {error && !/not found/i.test(String(error)) ? 'Announcements could not be loaded right now.' : 'No announcements yet.'}
              </p>
            )}
            {posts.length > 0 && <ArticleLedger posts={posts} basePath="/announcements" />}
          </div>
        </div>
      </div>
    </>
  );
};

export default AnnouncementsPage;
