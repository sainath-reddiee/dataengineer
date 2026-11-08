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
          // These dev-only endpoints write files. Refuse cross-site requests:
          // any page open while `npm run dev` runs could otherwise POST here.
          if (req.method === 'POST' && req.url?.startsWith('/api/save-')) {
            const origin = req.headers.origin || '';
            const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
            const isJson = (req.headers['content-type'] || '').startsWith('application/json');
            if (!isLocal || !isJson) {
              res.statusCode = 403;
              res.end('Forbidden');
              return;
            }
          }
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

    // avsc's Type API still `require()`s Node builtins. Map them to browser
    // shims before vite:resolve externalizes them as empty stubs.
    {
      name: 'avsc-browser-builtins',
      enforce: 'pre',
      resolveId(source, importer) {
        if (!importer) return null;
        const from = importer.replace(/\\/g, '/');
        if (!from.includes('/node_modules/avsc/')) return null;
        const id = source.replace(/^node:/, '');
        if (id === 'buffer') {
          return path.resolve(__dirname, 'src/lib/node-shims/buffer.js');
        }
        if (id === 'util') {
          return path.resolve(__dirname, 'src/lib/node-shims/util.js');
        }
        if (id === 'crypto') {
          return path.resolve(__dirname, 'node_modules/avsc/etc/browser/lib/crypto.js');
        }
        if (
          id === 'stream' ||
          id === 'zlib' ||
          id === 'events' ||
          id === 'path' ||
          id === 'fs'
        ) {
          return path.resolve(__dirname, 'src/lib/node-shims/empty.js');
        }
        return null;
      },
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
      'html2canvas',
      // avsc is loaded through src/lib/avro.js + browser builtin shims
      'avsc',
    ]
  },

  build: {
    // Suppress modulepreload for chunks that are lazy-loaded or heavy.
    // They should not execute eagerly on the article/home critical path.
    modulePreload: {
      resolveDependencies: (filename, deps) => {
        return deps.filter(dep =>
          !dep.includes('duckdb') &&
          !dep.includes('pdf-vendor') &&
          !dep.includes('ai-vendor') &&
          !dep.includes('markdown') &&
          !dep.includes('framer-motion') &&
          !dep.includes('cheatsheetData') &&
          !dep.includes('practiceSeo') &&
          !dep.includes('seoOverrides') &&
          !dep.includes('articlesCatalog') &&
          !dep.includes('dompurify') &&
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
          if (id.includes('preload-helper') || id.includes('commonjsHelpers')) {
            return 'react-vendor';
          }

          // Do not force glossary/comparison JSON into one named chunk.
          // glossaryLoader / comparisonLoader already dynamic-import per
          // category so each spoke page downloads only its own file.

          if (id.includes('node_modules')) {
            if (id.includes('avsc')) {
              return undefined;
            }
            if (
              id.includes('@duckdb/duckdb-wasm') ||
              id.includes('apache-arrow') ||
              id.includes('flatbuffers')
            ) {
              return 'duckdb';
            }
            if (id.includes('@google/generative-ai')) {
              return 'ai-vendor';
            }
            if (id.includes('framer-motion')) {
              return 'framer-motion';
            }
            if (/[\\/]node_modules[\\/]marked[\\/]/.test(id)) {
              return 'markdown';
            }
            if (id.includes('dompurify')) {
              return 'dompurify';
            }
            if (id.includes('jspdf')) {
              return 'pdf-vendor';
            }
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-router') ||
              id.includes('/@remix-run/router/') ||
              id.includes('/scheduler/') ||
              id.includes('react-helmet-async') ||
              id.includes('invariant') ||
              id.includes('shallowequal') ||
              id.includes('react-fast-compare') ||
              id.includes('\\react\\') ||
              id.includes('\\react-dom\\') ||
              id.includes('\\react-router') ||
              id.includes('\\@remix-run\\router\\') ||
              id.includes('\\scheduler\\')
            ) {
              return 'react-vendor';
            }
            return undefined;
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