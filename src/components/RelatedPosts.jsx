import { useRelatedPosts } from '@/hooks/useWordPress';
import ArticleLedger from '@/components/editorial/ArticleLedger';

const RelatedPosts = ({ currentPostId, category }) => {
  const { posts: relatedPosts, loading } = useRelatedPosts(currentPostId, category);
  const shown = relatedPosts.slice(0, 3);

  if (loading || shown.length === 0) return null;

  return (
    <section className="mx-auto mt-12 max-w-2xl" aria-labelledby="keep-reading">
      <h2 id="keep-reading" className="mb-6 border-t-2 border-ink pt-3 font-serif text-2xl font-semibold text-ink">
        Keep reading
      </h2>
      <ArticleLedger posts={shown} />
    </section>
  );
};

export default RelatedPosts;
