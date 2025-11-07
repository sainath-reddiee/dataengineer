// vite.config.js - FINAL PRODUCTION VERSION
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// ✅ 1. Import 'createRequire' to load CJS modules in ESM
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// ✅ 2. Use require() to import the CJS plugin
// This is the key fix for the ESM/CJS conflict.
const { prerender } = require('vite-plugin-prerender'); 

// ✅ 3. Import node-fetch for API calls
// This is in your devDependencies (package.json)
import fetch from 'node-fetch';

// ✅ 4. Helper functions to fetch all your dynamic routes from WordPress
const WORDPRESS_API_URL = 'https://app.dataengineerhub.blog/wp-json/wp/v2';

const fetchAllRoutes = async (endpoint, prefix) => {
  const routes = [];
  let page = 1;
  let hasMore = true;
  console.log(`Prerender: Fetching ${endpoint}...`);

  try {
    while (hasMore) {
      const res = await fetch(`${WORDPRESS_API_URL}${endpoint}?per_page=100&page=${page}&_fields=slug`);
      if (!res.ok) {
        if (res.status === 400) { // Bad request, probably out of pages
          hasMore = false;
          continue;
        }
        throw new Error(`Failed to fetch ${endpoint}: ${res.statusText}`);
      }
      
      const items = await res.json();

      if (!Array.isArray(items) || items.length === 0) {
        hasMore = false;
        continue;
      }

      items.forEach(item => {
        if (item.slug) {
          routes.push(`${prefix}${item.slug}`);
        }
      });
      page++;
      await new Promise(resolve => setTimeout(resolve, 50)); // Be nice to your API
    }
  } catch (e) {
    console.error(`Error fetching routes for ${endpoint}:`, e.message);
  }
  console.log(`Prerender: Found ${routes.length} routes for ${prefix}`);
  return routes;
};

// ✅ 5. Define the full config
export default defineConfig({
  plugins: [
    react({
      // ✅ Fast Refresh configuration
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
    
    // ✅ 6. Add the prerender plugin (loaded via 'require')
    // This will only run during 'npm run build'
    process.env.NODE_ENV === 'production' && prerender({
      // The path to your built app
      staticDir: path.join(__dirname, 'dist'),

      // List of all routes to prerender
      routes: async () => {
        const staticRoutes = [
          '/',
          '/articles',
          '/about',
          '/contact',
          '/newsletter',
          '/privacy-policy',
          '/terms-of-service',
          '/disclaimer',
          '/tag', // The new tags archive page
        ];
        
        const postRoutes = await fetchAllRoutes('/posts', '/articles/');
        const categoryRoutes = await fetchAllRoutes('/categories', '/category/');
        const tagRoutes = await fetchAllRoutes('/tags', '/tag/'); // Fetch tag page routes

        return [
          ...staticRoutes,
          ...postRoutes,
          ...categoryRoutes,
          ...tagRoutes
        ];
      },

      // ✅ 7. Configure the renderer (Puppeteer)
      rendererConfig: {
        // Wait for network to be idle, ensuring API calls finish
        await: 'networkidle0', 
        
        // Inject a variable so your app knows it's being prerendered
        inject: {
          isPrerendering: true
        },
      },
    }),
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
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