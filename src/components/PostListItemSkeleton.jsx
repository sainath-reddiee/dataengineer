import React from 'react';

const PostListItemSkeleton = () => {
  return (
    <div className="w-full p-4 rounded-xl animate-pulse">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="w-full sm:w-48 flex-shrink-0">
          <div className="aspect-video sm:aspect-square rounded-lg bg-gray-700"></div>
        </div>
        <div className="flex-1 w-full">
          <div className="w-24 h-5 bg-gray-600 rounded-full mb-4"></div>
          <div className="h-6 bg-gray-700 rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-gray-700 rounded w-full mb-1"></div>
          <div className="h-4 bg-gray-700 rounded w-5/6 mb-4"></div>
          <div className="flex items-center space-x-4">
            <div className="h-4 bg-gray-600 rounded w-20"></div>
            <div className="h-4 bg-gray-600 rounded w-16"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostListItemSkeleton;