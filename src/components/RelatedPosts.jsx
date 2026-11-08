import { useRelatedPosts } from '@/hooks/useWordPress';
import PostCard from '@/components/PostCard';
import PostCardSkeleton from '@/components/PostCardSkeleton';

const RelatedPosts = ({ currentPostId, category }) => {
  const { posts: relatedPosts, loading } = useRelatedPosts(currentPostId, category);

  if (loading) {
    return (
      <div className="mx-auto mt-16 max-w-6xl">
        <h2 className="mb-8 border-t-2 border-ink pt-3 font-serif text-2xl font-semibold text-ink">
          Keep reading
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {[1, 2, 3].map((i) => <PostCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (relatedPosts.length === 0) return null;

  return (
    <div className="mx-auto mt-16 max-w-6xl">
      <h2 className="mb-8 border-t-2 border-ink pt-3 font-serif text-2xl font-semibold text-ink">
        Keep reading
      </h2>
      <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
        {relatedPosts.map((post) => <PostCard key={post.id} post={post} />)}
      </div>
    </div>
  );
};

export default RelatedPosts;
