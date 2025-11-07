// vite.config.js - FINAL CORRECTED VERSION
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// --- PRERENDERING DEPENDENCIES ---
// 
// FIX #1: Use a default import (fixes "does not provide an export")
import Prerenderer from 'vite-plugin-prerender'; 
//
import fetch from 'node-fetch'; // This now works because of Step 1

// --- PRERENDERING CONFIG ---
const WORDPRESS_API_URL = 'https://app.dataengineerhub.blog/wp-json/wp/v2';

const fetchAllPaginated = async (endpoint) => {
  let results = [];
  let page = 1;
  let hasMore = true;
  const fields = 'slug'; 

  console.log(`PRERENDER: Starting fetch for ${endpoint}...`);

  while (hasMore) {
    try {
      const url = `${WORDPRESS_API_URL}${endpoint}?_fields=${fields}&per_page=100&page=${page}`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 400) { // 400 means no more pages
          hasMore = false;
          continue;
        }
        console.error(`WordPress API Error: ${response.status} for ${url}`);
        hasMore = false;
        continue;
      }
      
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        hasMore = false;
      } else {
        results = results.concat(data);
        page++;
      }
    } catch (e) {
      console.error(`Fetch Error for ${endpoint}: ${e.message}`);
      hasMore = false;
    }
  }
  
  console.log(`PRERENDER: Fetched ${results.length} items for ${endpoint}.`);
  return results;
};
// --- END PRERENDERING CONFIG ---


// 
// FIX #2: Wrap export in a function to get the 'command'
//
export default defineConfig(({ command }) => ({
  plugins: [
    react({
      fastRefresh: true,
      jsxRuntime: 'automatic',
      babel: {
        plugins: [
          process.env.NODE_ENV === 'production' && [
            'transform-remove-console',
            { exclude: ['error', 'warn'] }
          ]
        ].filter(Boolean)
      }
    }),
    
    // 
    // FIX #3: Only run Prerenderer during 'build', not 'dev' (serve)
    // This stops the 'require is not defined' error!
    //
    command === 'build' && Prerenderer({
      staticDir: path.resolve(__dirname, 'dist'),
      routes: async () => {
        console.log('PRERENDER: Fetching all dynamic routes from WordPress...');
        
        // Fetch only the routes in your live app
        const [posts, categories, tags] = await Promise.all([
          fetchAllPaginated('/posts'),
          fetchAllPaginated('/categories'),
          fetchAllPaginated('/tags'),
        ]);

        const postRoutes = posts.map(post => `/articles/${post.slug}`);
        const categoryRoutes = categories
          .filter(cat => cat.slug !== 'uncategorized')
          .map(cat => `/category/${cat.slug}`);
        const tagRoutes = tags.map(tag => `/tag/${tag.slug}`);

        // Static routes from your App.jsx (no certifications)
        const staticRoutes = [
          '/',
          '/articles',
          '/tag', 
          '/about',
          '/contact',
          '/privacy-policy',
          '/terms-of-service',
          '/disclaimer',
          '/newsletter',
        ];

        const allRoutes = [
          ...staticRoutes,
          ...postRoutes,
          ...categoryRoutes,
          ...tagRoutes,
        ];
        
        console.log(`PRERENDER: Total routes to render: ${allRoutes.length}`);
        return allRoutes;
      },

      rendererOptions: {
        renderAfterTime: 2500, // Wait 2.5s for SPA to fetch data
      },
    })
    // --- END PLUGIN CONFIG ---
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  // (The rest of your build config remains the same)
  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2
      }
    },
    
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('framer-motion')) {
              return 'framer-motion';
            }
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            return 'vendor';
          }
          
          if (id.includes('src/components/')) {
            if (id.includes('PostCard') || id.includes('PostListItem')) {
              return 'post-components';
            }
            if (id.includes('Ad')) {
              return 'ads';
            }
          }
        },
        
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    
    chunkSizeWarningLimit: 500,
    sourcemap: false,
    cssCodeSplit: true,
    reportCompressedSize: true,
    assetsInlineLimit: 2048
  },
  
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom'
    ],
    exclude: [
      'framer-motion'
    ]
  },
  
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    open: true,
    hmr: {
      overlay: true
    }
  },
  
  preview: {
    port: 4173,
    strictPort: true,
    host: true,
    open: true
  }
}));