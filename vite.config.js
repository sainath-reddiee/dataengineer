import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import vitePrerender from './plugins/vite-plugin-prerender.mjs';
import { upsertSeoOverrideSource } from './src/utils/seoOverrideFile.js';
import { copyDuckdbAssets } from './scripts/copyDuckdbAssets.js';
import { cleanHomepagePaintHtml, deferRenderBlockingStylesheets } from './scripts/deferRenderBlockingCss.js';

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

    // Homepage first paint is inline CSS + the static hero. The Tailwind
    // bundle (~24 KB) was render-blocking for 1.2s on slow 4G / PSI mobile.
    {
      name: 'defer-render-blocking-css',
      transformIndexHtml: {
        order: 'post',
        handler(html) {
          return cleanHomepagePaintHtml(html);
        },
      },
    },

    // Dev API to save sponsors to local JSON file
    {
      name: 'local-sponsors-api',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/api/save-sponsors' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                const filePath = path.resolve(__dirname, 'src/data/activeSponsors.json');
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
              } catch (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            });
          } else if (req.url === '/api/save-seo-override' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const { slug, title, description } = JSON.parse(body);
                if (!slug || !title) {
                  throw new Error('slug and title are required');
                }
                const filePath = path.resolve(__dirname, 'src/data/seoOverrides.js');
                const current = fs.readFileSync(filePath, 'utf-8');
                const next = upsertSeoOverrideSource(current, slug, title, description || '');
                fs.writeFileSync(filePath, next, 'utf-8');
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
              } catch (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            });
          } else {
            next();
          }
        });
      }
    },

    {
      name: 'copy-duckdb-assets',
      // Dev can hit /duckdb/* directly. Production uses the Vite ?url
      // copies in src/lib/duckdb.js so we do not ship a second 70 MB
      // pair through Hostinger FTPS (that timeout is what left the
      // playground spinner running forever).
      configureServer() {
        copyDuckdbAssets();
      },
    },

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

    // Pre-render public hub/static pages so crawlers see real content without
    // needing to execute JavaScript.
    vitePrerender({
      staticDir: path.join(__dirname, 'dist'),
      routes: [
        '/',
        '/about',
        '/contact',
        '/privacy-policy',
        '/terms-of-service',
        '/disclaimer',
        '/editorial-standards',
        '/contribute',
        '/advertise',
        '/newsletter',
        '/news',
        '/articles',
        '/glossary',
        '/compare',
        '/cheatsheets',
        '/tools',
        '/interview-prep',
        '/practice',
        '/certification',
      ],
      renderer: new PuppeteerRenderer({
        headless: true,
        // Wait for React lazy-loaded components to finish rendering
        renderAfterTime: 3000,
        // Block third-party requests (ads, analytics) to speed up rendering
        skipThirdPartyRequests: true,
      }),
      postProcess(renderedRoute) {
        if (renderedRoute.route === '/') {
          renderedRoute.html = cleanHomepagePaintHtml(renderedRoute.html);
        } else {
          renderedRoute.html = deferRenderBlockingStylesheets(renderedRoute.html);
        }
        return renderedRoute;
      },
    }),

    // Prerender snapshots the DOM after onload flips media="print" → "all".
    // Put the homepage CSS back off the critical path before the file ships.
    {
      name: 'restore-deferred-css',
      apply: 'build',
      enforce: 'post',
      closeBundle() {
        const indexPath = path.resolve(__dirname, 'dist/index.html');
        if (!fs.existsSync(indexPath)) return;
        const next = cleanHomepagePaintHtml(fs.readFileSync(indexPath, 'utf8'));
        fs.writeFileSync(indexPath, next);
      },
    },
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
    // Suppress modulepreload for chunks that are lazy-loaded or heavy
    // (duckdb, pdf-vendor, linking-engine, etc.). They should not execute eagerly on critical path.
    modulePreload: {
      resolveDependencies: (filename, deps) => {
        return deps.filter(dep =>
          !dep.includes('duckdb') &&
          !dep.includes('pdf-vendor') &&
          !dep.includes('linking-engine') &&
          !dep.includes('ai-vendor') &&
          !dep.includes('markdown') &&
          !dep.includes('framer-motion') &&
          !dep.includes('/ads-') &&
          !dep.includes('article-extras') &&
          !dep.includes('article-data')
        );
      },
    },
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace'],
        passes: 2
      }
    },

    rollupOptions: {
      external: [
        'canvg',
        'html2canvas'
      ],
      output: {
        manualChunks: (id) => {
          if (id.includes('src/lib/pseo') || id.includes('linkingEngine')) {
            return 'linking-engine';
          }

          if (id.includes('node_modules')) {
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
            if (id.includes('AudioReader') || id.includes('GiscusComments') || id.includes('SupportPopup') || id.includes('CiteThisArticle') || id.includes('ArticleFaq')) {
              return 'article-extras';
            }
          }

          if (id.includes('src/data/articleContextualLinks') || id.includes('src/data/courseRecommendations')) {
            return 'article-data';
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
    },
    proxy: {
      '/wp-json': {
        target: 'https://app.dataengineerhub.blog',
        changeOrigin: true,
        secure: false,
      }
    }
  },

  preview: {
    port: 4173,
    strictPort: true,
    host: true,
    open: true
  }
});