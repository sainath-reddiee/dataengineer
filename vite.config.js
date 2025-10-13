// vite.config.js - MOBILE PERFORMANCE OPTIMIZED

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      fastRefresh: true,
      babel: {
        plugins: [
          process.env.NODE_ENV === 'production' && [
            'transform-remove-console',
            { exclude: ['error', 'warn'] }
          ]
        ].filter(Boolean)
      }
    })
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  build: {
    target: 'es2015',
    minify: 'esbuild',
    
    rollupOptions: {
      output: {
        manualChunks: {
          // Critical chunks - loaded first
          'react-core': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          
          // Deferred chunks - loaded on interaction
          'animations': ['framer-motion'],
          'ui-components': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-toast',
            '@radix-ui/react-slot',
            '@radix-ui/react-label'
          ],
          
          // API and utilities - loaded as needed
          'api': ['./src/services/wordpressApi.js'],
          'hooks': ['./src/hooks/useWordPress.js'],
          'utils': ['./src/utils/analytics.js', './src/utils/performance.js']
        },
        
        // Optimize chunk naming
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId;
          if (facadeModuleId && facadeModuleId.includes('node_modules')) {
            return 'assets/vendor/[name]-[hash].js';
          }
          return 'assets/js/[name]-[hash].js';
        },
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    
    chunkSizeWarningLimit: 500, // REDUCED - force better chunking
    sourcemap: false,
    cssCodeSplit: true,
    reportCompressedSize: false, // Faster builds
    assetsInlineLimit: 2048, // REDUCED - inline only tiny assets
    
    // MOBILE OPTIMIZATION
    cssMinify: 'esbuild', // Faster CSS minification
  },
  
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom'
    ],
    exclude: [
      'framer-motion', // Load on demand
      '@radix-ui/react-dialog',
      '@radix-ui/react-toast'
    ]
  },
  
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    open: true
  },
  
  preview: {
    port: 4173,
    strictPort: true,
    host: true,
    open: true
  },
  
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    // MOBILE: Aggressive minification
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
  }
});