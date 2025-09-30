// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh
      fastRefresh: true,
      // Optimize production build
      babel: {
        plugins: [
          // Remove console.log in production
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
    // Optimize output
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    
    // Code splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'framer-motion': ['framer-motion'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-toast',
            '@radix-ui/react-slot',
            '@radix-ui/react-label'
          ],
          
          // App chunks
          'wordpress-api': ['./src/services/wordpressApi.js', './src/hooks/useWordPress.js'],
          'utils': ['./src/utils/analytics.js', './src/utils/performance.js', './src/utils/imageOptimizer.js']
        },
        
        // Clean filenames
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    
    // Enable source maps for production debugging (optional)
    sourcemap: false,
    
    // Optimize CSS
    cssCodeSplit: true,
    
    // Compression
    reportCompressedSize: true,
    
    // Asset inlining threshold
    assetsInlineLimit: 4096 // 4kb
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-toast',
      'lucide-react'
    ],
    exclude: []
  },
  
  // Server config for development
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    open: true
  },
  
  // Preview config for production testing
  preview: {
    port: 4173,
    strictPort: true,
    host: true,
    open: true
  },
  
  // Environment variables
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  }
});