import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import viteImagemin from 'vite-plugin-imagemin';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      fastRefresh: true,
    }),
    viteImagemin({
      gifsicle: { optimizationLevel: 7 },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      webp: { quality: 80 },
    }),
  ],
  
  resolve: {
    alias: {
      '@': path.resolve('./src'),
    },
  },

  // Build optimizations for production
  build: {
    // Target modern browsers for better performance
    target: ['es2015', 'chrome64', 'firefox67', 'safari12'],
    
    // Optimize chunks
    rollupOptions: {
      output: {
        // Manual chunking for better caching
        manualChunks: {
          // Vendor chunk for libraries
          vendor: [
            'react',
            'react-dom',
            'react-router-dom'
          ],
          // UI components chunk
          ui: [
            'framer-motion',
            'lucide-react'
          ]
        },
        // Optimize chunk names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId 
            ? chunkInfo.facadeModuleId.split('/').pop().replace('.jsx', '') 
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        // Optimize asset names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash].${ext}`;
          }
          if (/css/i.test(ext)) {
            return `css/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        }
      }
    },
    
    // Minification and optimization
    minify: 'esbuild', // Faster than terser
    sourcemap: false, // Disable sourcemaps for production
    
    // Reduce bundle size
    chunkSizeWarningLimit: 1000, // Warn for chunks > 1MB
    
    // Enable CSS code splitting
    cssCodeSplit: true,
    
    // Optimize assets
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
    
    // Remove console logs and debugger statements in production
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    },
  },

  // Development server optimizations
  server: {
    // Enable HTTP/2 for development
    https: false,
    
    // Hot Module Replacement optimizations
    hmr: {
      overlay: false, // Disable error overlay for better performance
    },
    
    // Faster development builds
    fs: {
      // Allow serving files from one level up from package root
      allow: ['..']
    }
  },

  // Optimizations for dependencies
  optimizeDeps: {
    // Pre-bundle these dependencies
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'lucide-react',
      'react-helmet-async'
    ],
    
    // ESBuild options for dependency optimization
    esbuildOptions: {
      target: 'es2015',
      supported: {
        'top-level-await': true
      }
    }
  },

  // CSS optimizations (simplified - no PostCSS plugins that cause issues)
  css: {
    // Enable CSS modules for better performance
    modules: {
      localsConvention: 'camelCase'
    }
  },

  // Preview server optimizations
  preview: {
    port: 4173,
    strictPort: true
  },

  // Environment variables
  define: {
    // Define global constants
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __PROD__: JSON.stringify(process.env.NODE_ENV === 'production'),
  },

  // ESBuild optimizations
  esbuild: {
    // JSX optimizations
    target: 'es2015',
    
    // Optimize for size in production
    ...(process.env.NODE_ENV === 'production' && {
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: true,
      drop: ['console', 'debugger'],
    })
  },

  // Worker optimizations
  worker: {
    format: 'es'
  }
});