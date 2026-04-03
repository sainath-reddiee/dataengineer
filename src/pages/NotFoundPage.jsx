import { Link } from 'react-router-dom';
import MetaTags from '@/components/SEO/MetaTags';

const NotFoundPage = () => {
  return (
    <>
      <MetaTags
        title="Page Not Found | DataEngineer Hub"
        description="The page you are looking for does not exist or has been moved."
      />
      <div className="container mx-auto px-6 py-24 text-center">
        <h1 className="text-6xl md:text-8xl font-black mb-4 gradient-text">404</h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-full transition-all"
          >
            Go Home
          </Link>
          <Link
            to="/articles"
            className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full transition-all"
          >
            Browse Articles
          </Link>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;
