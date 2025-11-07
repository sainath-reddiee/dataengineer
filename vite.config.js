// vite.config.js - Simplified without prerendering (SEO handled by sitemap)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

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
    })
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
  };
});