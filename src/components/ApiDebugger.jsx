// API Debugging Utility
// Add this to your main App component or create a separate debug page

import React, { useState, useEffect } from 'react';
import { wordpressApi } from '@/services/wordpressApi';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle, Loader } from 'lucide-react';

const ApiDebugger = () => {
  const [tests, setTests] = useState({});
  const [isRunning, setIsRunning] = useState(false);

  const runTest = async (testName, testFn) => {
    setTests(prev => ({ ...prev, [testName]: { status: 'running', result: null, error: null, duration: 0 } }));
    
    const startTime = Date.now();
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      setTests(prev => ({ 
        ...prev, 
        [testName]: { 
          status: 'success', 
          result, 
          error: null, 
          duration 
        } 
      }));
    } catch (error) {
      const duration = Date.now() - startTime;
      setTests(prev => ({ 
        ...prev, 
        [testName]: { 
          status: 'error', 
          result: null, 
          error: error.message, 
          duration 
        } 
      }));
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTests({});

    const testSuite = [
      {
        name: 'API Health Check',
        fn: () => wordpressApi.healthCheck()
      },
      {
        name: 'Fetch Categories',
        fn: async () => {
          const categories = await wordpressApi.getCategories();
          return { count: categories.length, categories: categories.slice(0, 3) };
        }
      },
      {
        name: 'Fetch Recent Posts',
        fn: async () => {
          const result = await wordpressApi.getPosts({ per_page: 3 });
          return { 
            count: result.posts.length, 
            totalPosts: result.totalPosts,
            posts: result.posts.map(p => ({ id: p.id, title: p.title, slug: p.slug }))
          };
        }
      },
      {
        name: 'Fetch Single Post',
        fn: async () => {
          // First get a post slug
          const result = await wordpressApi.getPosts({ per_page: 1 });
          if (result.posts.length === 0) {
            throw new Error('No posts available to test with');
          }
          const slug = result.posts[0].slug;
          const post = await wordpressApi.getPostBySlug(slug);
          return { slug, title: post.title, hasContent: !!post.content };
        }
      },
      {
        name: 'Test Category Filter',
        fn: async () => {
          const categories = await wordpressApi.getCategories();
          if (categories.length === 0) {
            throw new Error('No categories available to test with');
          }
          const category = categories[0];
          const result = await wordpressApi.getPostsByCategory(category.id, { per_page: 2 });
          return { 
            categoryName: category.name, 
            postsFound: result.posts.length,
            totalPosts: result.totalPosts 
          };
        }
      }
    ];

    // Run tests sequentially to avoid overwhelming the API
    for (const test of testSuite) {
      await runTest(test.name, test.fn);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <Loader className="h-5 w-5 animate-spin text-blue-400" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-400" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'border-green-400/50 bg-green-500/10';
      case 'error':
        return 'border-red-400/50 bg-red-500/10';
      case 'running':
        return 'border-blue-400/50 bg-blue-500/10';
      default:
        return 'border-gray-400/50 bg-gray-500/10';
    }
  };

  // Auto-run tests on mount in development
  useEffect(() => {
    if (__DEV__) {
      runAllTests();
    }
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">WordPress API Debugger</h2>
        <p className="text-gray-400">Test your WordPress API connection and data retrieval</p>
      </div>

      <div className="mb-6">
        <Button 
          onClick={runAllTests} 
          disabled={isRunning}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isRunning ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            'Run All Tests'
          )}
        </Button>
      </div>

      <div className="space-y-4">
        {Object.entries(tests).map(([testName, test]) => (
          <div 
            key={testName}
            className={`border-2 rounded-lg p-4 ${getStatusColor(test.status)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                {getStatusIcon(test.status)}
                <h3 className="font-semibold text-white">{testName}</h3>
              </div>
              <div className="text-sm text-gray-400">
                {test.duration > 0 && `${test.duration}ms`}
              </div>
            </div>

            {test.error && (
              <div className="mt-3 p-3 bg-red-900/30 border border-red-700/50 rounded">
                <p className="text-red-300 font-medium">Error:</p>
                <p className="text-red-200 text-sm">{test.error}</p>
              </div>
            )}

            {test.result && (
              <div className="mt-3 p-3 bg-green-900/30 border border-green-700/50 rounded">
                <p className="text-green-300 font-medium mb-2">Result:</p>
                <pre className="text-green-200 text-sm overflow-auto">
                  {JSON.stringify(test.result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* API Configuration Info */}
      <div className="mt-8 p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
        <h3 className="font-semibold text-white mb-2">Configuration</h3>
        <div className="text-sm text-gray-300 space-y-1">
          <p><strong>API URL:</strong> https://app.dataengineerhub.blog/wp-json/wp/v2</p>
          <p><strong>Cache Timeout:</strong> 10 seconds</p>
          <p><strong>Environment:</strong> {__DEV__ ? 'Development' : 'Production'}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button 
          variant="outline" 
          onClick={() => wordpressApi.clearCache()}
          className="border-yellow-400/50 text-yellow-300 hover:bg-yellow-500/20"
        >
          Clear API Cache
        </Button>
        <Button 
          variant="outline" 
          onClick={() => console.log('API Instance:', wordpressApi)}
          className="border-purple-400/50 text-purple-300 hover:bg-purple-500/20"
        >
          Log API Instance
        </Button>
        <Button 
          variant="outline" 
          onClick={() => {
            const logs = JSON.stringify({
              tests,
              timestamp: new Date().toISOString(),
              userAgent: navigator.userAgent
            }, null, 2);
            console.log('Debug Report:', logs);
          }}
          className="border-indigo-400/50 text-indigo-300 hover:bg-indigo-500/20"
        >
          Export Debug Report
        </Button>
      </div>
    </div>
  );
};

export default ApiDebugger;

// Hook to use in development
export const useApiDebugger = () => {
  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    // Enable debug mode with URL parameter or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const hasDebugParam = urlParams.has('debug');
    const hasDebugStorage = localStorage.getItem('api-debug') === 'true';
    
    if (hasDebugParam || hasDebugStorage) {
      setDebugMode(true);
      if (hasDebugParam) {
        localStorage.setItem('api-debug', 'true');
      }
    }

    // Global debug functions
    window.debugAPI = {
      clearCache: () => wordpressApi.clearCache(),
      testConnection: () => wordpressApi.healthCheck(),
      getApiInstance: () => wordpressApi,
      toggleDebug: () => {
        const newValue = !debugMode;
        setDebugMode(newValue);
        localStorage.setItem('api-debug', newValue.toString());
        if (!newValue) {
          const url = new URL(window.location);
          url.searchParams.delete('debug');
          window.history.replaceState({}, '', url);
        }
      }
    };
  }, [debugMode]);

  return { debugMode, ApiDebugger };
};