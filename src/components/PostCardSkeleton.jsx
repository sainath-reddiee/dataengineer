import React from 'react';

const PostCardSkeleton = () => {
  return (
    <div className="blog-card rounded-2xl overflow-hidden animate-pulse">
      <div className="relative">
        <div className="w-full h-48 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700"></div>
        <div className="absolute top-4 left-4">
          <div className="w-20 h-6 bg-gray-600 rounded-full"></div>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-3">
          <div className="h-6 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded"></div>
            <div className="h-4 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded w-2/3"></div>
          </div>
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center space-x-4">
              <div className="h-4 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded w-20"></div>
              <div className="h-4 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded w-16"></div>
            </div>
            <div className="w-5 h-5 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCardSkeleton;