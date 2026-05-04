import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import vitePrerender from './plugins/vite-plugin-prerender.mjs';

const PuppeteerRenderer = vitePrerender.PuppeteerRenderer;

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

    // Custom plugin to handle jsPDF optional dependencies
    {
      name: 'suppress-jspdf-warnings',
      resolveId(id) {
        // Suppress resolution of jsPDF optional peer dependencies
        if (id === 'canvg' || id === 'html2canvas') {
          return { id, external: true };
        }
      }
    },

    // Pre-render essential static pages so AdSense/Mediapartners-Google crawler
    // sees real content without needing to execute JavaScript.
    vitePrerender({
      staticDir: path.join(__dirname, 'dist'),
      routes: [
        '/',
        '/about',
        '/contact',
        '/privacy-policy',
        '/terms-of-service',
        '/disclaimer',
        '/contribute',
        '/newsletter',
        // pSEO routes TEMPORARILY excluded for AdSense approval:
        // '/news',
        '/articles',
        // '/glossary',
        // '/compare',
        // '/cheatsheets',
        // '/tools',
        // '/interview-prep',
        // '/practice',
        '/certification',
      ],
      renderer: new PuppeteerRenderer({
        headless: true,
        // Wait for React lazy-loaded components to finish rendering
        renderAfterTime: 3000,
        // Block third-party requests (ads, analytics) to speed up rendering
        skipThirdPartyRequests: true,
      }),
    }),

  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  optimizeDeps: {
    exclude: [
      // Exclude jsPDF optional peer dependencies from optimization
      'canvg',
      'html2canvas'
    ]
  },

  build: {
    // Suppress modulepreload for chunks that depend on Node built-ins
    // (duckdb, pdf-vendor). They are lazy-loaded and should not execute eagerly.
    modulePreload: {
      resolveDependencies: (filename, deps) => {
        return deps.filter(dep =>
          !dep.includes('duckdb') &&
          !dep.includes('pdf-vendor')
        );
      },
    },
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2
      }
    },

    rollupOptions: {
      external: [
        // jsPDF optional peer dependencies - externalize to avoid build errors
        'canvg',
        'html2canvas'
      ],
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // avsc depends on Node.js built-ins (stream, buffer, zlib) that
            // crash the browser when executed eagerly. Return undefined so
            // Rollup bundles it with the lazy-loaded FormatConverterPage.
            if (id.includes('avsc')) {
              return undefined;
            }
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
            if (id.includes('jspdf')) {
              return 'pdf-vendor';
            }
            // Heavy libraries used only on specific pages
            if (id.includes('@google/generative-ai')) {
              return 'ai-vendor';
            }
            if (id.includes('react-helmet-async')) {
              return 'helmet';
            }
            if (id.includes('marked') || id.includes('dompurify')) {
              return 'markdown';
            }
            if (id.includes('@duckdb/duckdb-wasm')) {
              return 'duckdb';
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