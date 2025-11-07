// vite.config.js - FINAL PRERENDERING VERSION
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// --- NEW PRERENDERING DEPENDENCIES ---
import { Prerenderer } from 'vite-plugin-prerender';
import fetch from 'node-fetch'; 

// --- PRERENDERING CONFIG ---
const WORDPRESS_API_URL = 'https://app.dataengineerhub.blog/wp-json/wp/v2';

// Helper to fetch all paginated data (posts, categories, tags)
const fetchAllPaginated = async (endpoint) => {
  let results = [];
  let page = 1;
  let hasMore = true;
  // We only need the 'slug' field to build the routes
  const fields = 'slug'; 

  console.log(`PRERENDER: Starting fetch for ${endpoint}...`);

  while (hasMore) {
    try {
      const url = `${WORDPRESS_API_URL}${endpoint}?_fields=${fields}&per_page=100&page=${page}`;
      const response = await fetch(url);

      if (!response.ok) {
        // A 400 error often just means we've hit the last page
        if (response.status === 400) {
          hasMore = false;
          continue;
        }
        // Log other errors but don't stop the whole build
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


export default defineConfig({
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
    
    // --- PRERENDERING PLUGIN CONFIG ---
    // This plugin runs *after* your 'npm run build' is complete
    Prerenderer({
      // The directory Vite builds to
      staticDir: path.resolve(__dirname, 'dist'),

      // The routes to prerender
      routes: async () => {
        console.log('PRERENDER: Fetching all dynamic routes from WordPress...');
        
        // 1. Fetch all dynamic routes in parallel
        const [posts, categories, tags] = await Promise.all([
          fetchAllPaginated('/posts'),
          fetchAllPaginated('/categories'),
          fetchAllPaginated('/tags')
        ]);

        // 2. Map API data to route strings
        const postRoutes = posts.map(post => `/articles/${post.slug}`);
        const categoryRoutes = categories
          .filter(cat => cat.slug !== 'uncategorized') // Exclude 'uncategorized'
          .map(cat => `/category/${cat.slug}`);
        const tagRoutes = tags.map(tag => `/tag/${tag.slug}`);

        // 3. Define all your app's static routes (cross-checked with App.jsx)
        const staticRoutes = [
          '/',
          '/articles',
          '/tag', // The main tags archive page
          '/about',
          '/contact',
          '/privacy-policy',
          '/terms-of-service',
          '/disclaimer',
          '/newsletter',
          // We intentionally do NOT render '/debug'
        ];

        // 4. Combine and return all routes
        const allRoutes = [
          ...staticRoutes,
          ...postRoutes,
          ...categoryRoutes,
          ...tagRoutes
        ];
        
        console.log(`PRERENDER: Total routes to render: ${allRoutes.length}`);
        return allRoutes;
      },

      // Puppeteer options
      rendererOptions: {
        // Wait 2.5 seconds for your SPA to fetch data and render
        // This is a simple and reliable way to ensure content is present
        renderAfterTime: 2500, 
        
        // Optional: If your build fails in GitHub Actions, uncomment this
        // args: ['--no-sandbox', '--disable-setuid-sandbox'],
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
});