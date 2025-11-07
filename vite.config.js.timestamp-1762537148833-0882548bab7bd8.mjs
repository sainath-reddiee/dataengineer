// vite.config.js
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
import { createRequire } from "module";
import fetch from "file:///home/project/node_modules/node-fetch/src/index.js";
var __vite_injected_original_dirname = "/home/project";
var __vite_injected_original_import_meta_url = "file:///home/project/vite.config.js";
var require2 = createRequire(__vite_injected_original_import_meta_url);
var prerenderPlugin = require2("vite-plugin-prerender");
var prerender = prerenderPlugin.default || prerenderPlugin;
var PuppeteerRenderer = require2("@prerenderer/renderer-puppeteer");
var WORDPRESS_API_URL = "https://app.dataengineerhub.blog/wp-json/wp/v2";
var fetchAllRoutes = async (endpoint, prefix) => {
  const routes = [];
  let page = 1;
  let hasMore = true;
  console.log(`Prerender: Fetching ${endpoint}...`);
  try {
    while (hasMore) {
      const res = await fetch(`${WORDPRESS_API_URL}${endpoint}?per_page=100&page=${page}&_fields=slug`);
      if (!res.ok) {
        if (res.status === 400) {
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
      items.forEach((item) => {
        if (item.slug) {
          routes.push(`${prefix}${item.slug}`);
        }
      });
      page++;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  } catch (e) {
    console.error(`Error fetching routes for ${endpoint}:`, e.message);
  }
  console.log(`Prerender: Found ${routes.length} routes for ${prefix}`);
  return routes;
};
var vite_config_default = defineConfig({
  plugins: [
    react({
      // ✅ Fast Refresh configuration
      fastRefresh: true,
      jsxRuntime: "automatic",
      babel: {
        plugins: [
          process.env.NODE_ENV === "production" && [
            "transform-remove-console",
            { exclude: ["error", "warn"] }
          ]
        ].filter(Boolean)
      }
    }),
    // ✅ 6. Add the prerender plugin
    // This will only run during 'npm run build'
    process.env.NODE_ENV === "production" && prerender({
      staticDir: path.join(__vite_injected_original_dirname, "dist"),
      routes: async () => {
        const staticRoutes = [
          "/",
          "/articles",
          "/about",
          "/contact",
          "/newsletter",
          "/privacy-policy",
          "/terms-of-service",
          "/disclaimer",
          "/tag"
        ];
        const postRoutes = await fetchAllRoutes("/posts", "/articles/");
        const categoryRoutes = await fetchAllRoutes("/categories", "/category/");
        const tagRoutes = await fetchAllRoutes("/tags", "/tag/");
        return [
          ...staticRoutes,
          ...postRoutes,
          ...categoryRoutes,
          ...tagRoutes
        ];
      },
      // ✅ 7. THIS IS THE FIX:
      // Tell the Prerenderer to use Puppeteer, but point it
      // to the system's installed Chrome browser.
      renderer: new PuppeteerRenderer({
        // Wait for network to be idle, ensuring API calls finish
        await: "networkidle0",
        // --- THIS IS THE KEY LINE ---
        // Use the system's installed Chrome, not a downloaded one.
        executablePath: "/usr/bin/google-chrome",
        // Add args required for containerized environments
        launchOptions: {
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage"
          ]
        },
        // Inject a variable so your app knows it's being prerendered
        inject: {
          isPrerendering: true
        }
      })
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  // ... (rest of your build config, including 'terser') ...
  build: {
    target: "es2015",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info", "console.debug"],
        passes: 2
      }
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
              return "react-vendor";
            }
            if (id.includes("framer-motion")) {
              return "framer-motion";
            }
            if (id.includes("@radix-ui")) {
              return "ui-vendor";
            }
            if (id.includes("lucide-react")) {
              return "icons";
            }
            return "vendor";
          }
          if (id.includes("src/components/")) {
            if (id.includes("PostCard") || id.includes("PostListItem")) {
              return "post-components";
            }
            if (id.includes("Ad")) {
              return "ads";
            }
          }
        },
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]"
      }
    },
    chunkSizeWarningLimit: 500,
    sourcemap: false,
    cssCodeSplit: true,
    reportCompressedSize: true,
    assetsInlineLimit: 2048
  },
  server: {
    port: 3e3,
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
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcuanNcIjsvLyB2aXRlLmNvbmZpZy5qcyAtIEZJTkFMIFBST0RVQ1RJT04gVkVSU0lPTiAodXNpbmcgUHVwcGV0ZWVyIHJlbmRlcmVyKVxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbi8vIFx1MjcwNSAxLiBJbXBvcnQgJ2NyZWF0ZVJlcXVpcmUnIHRvIGxvYWQgQ0pTIG1vZHVsZXMgaW4gRVNNXG5pbXBvcnQgeyBjcmVhdGVSZXF1aXJlIH0gZnJvbSAnbW9kdWxlJztcbmNvbnN0IHJlcXVpcmUgPSBjcmVhdGVSZXF1aXJlKGltcG9ydC5tZXRhLnVybCk7XG5cbi8vIFx1MjcwNSAyLiBJbXBvcnQgdGhlIENKUyBwbHVnaW4gQU5EIHRoZSBQVVBQRVRFRVIgcmVuZGVyZXJcbmNvbnN0IHByZXJlbmRlclBsdWdpbiA9IHJlcXVpcmUoJ3ZpdGUtcGx1Z2luLXByZXJlbmRlcicpO1xuY29uc3QgcHJlcmVuZGVyID0gcHJlcmVuZGVyUGx1Z2luLmRlZmF1bHQgfHwgcHJlcmVuZGVyUGx1Z2luO1xuY29uc3QgUHVwcGV0ZWVyUmVuZGVyZXIgPSByZXF1aXJlKCdAcHJlcmVuZGVyZXIvcmVuZGVyZXItcHVwcGV0ZWVyJyk7XG5cbi8vIFx1MjcwNSAzLiBJbXBvcnQgbm9kZS1mZXRjaCBmb3IgQVBJIGNhbGxzXG5pbXBvcnQgZmV0Y2ggZnJvbSAnbm9kZS1mZXRjaCc7XG5cbi8vIFx1MjcwNSA0LiBIZWxwZXIgZnVuY3Rpb25zIHRvIGZldGNoIGFsbCB5b3VyIGR5bmFtaWMgcm91dGVzIGZyb20gV29yZFByZXNzXG5jb25zdCBXT1JEUFJFU1NfQVBJX1VSTCA9ICdodHRwczovL2FwcC5kYXRhZW5naW5lZXJodWIuYmxvZy93cC1qc29uL3dwL3YyJztcblxuY29uc3QgZmV0Y2hBbGxSb3V0ZXMgPSBhc3luYyAoZW5kcG9pbnQsIHByZWZpeCkgPT4ge1xuICBjb25zdCByb3V0ZXMgPSBbXTtcbiAgbGV0IHBhZ2UgPSAxO1xuICBsZXQgaGFzTW9yZSA9IHRydWU7XG4gIGNvbnNvbGUubG9nKGBQcmVyZW5kZXI6IEZldGNoaW5nICR7ZW5kcG9pbnR9Li4uYCk7XG5cbiAgdHJ5IHtcbiAgICB3aGlsZSAoaGFzTW9yZSkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYCR7V09SRFBSRVNTX0FQSV9VUkx9JHtlbmRwb2ludH0/cGVyX3BhZ2U9MTAwJnBhZ2U9JHtwYWdlfSZfZmllbGRzPXNsdWdgKTtcbiAgICAgIGlmICghcmVzLm9rKSB7XG4gICAgICAgIGlmIChyZXMuc3RhdHVzID09PSA0MDApIHsgLy8gQmFkIHJlcXVlc3QsIHByb2JhYmx5IG91dCBvZiBwYWdlc1xuICAgICAgICAgIGhhc01vcmUgPSBmYWxzZTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBmZXRjaCAke2VuZHBvaW50fTogJHtyZXMuc3RhdHVzVGV4dH1gKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgY29uc3QgaXRlbXMgPSBhd2FpdCByZXMuanNvbigpO1xuXG4gICAgICBpZiAoIUFycmF5LmlzQXJyYXkoaXRlbXMpIHx8IGl0ZW1zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBoYXNNb3JlID0gZmFsc2U7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpdGVtcy5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgICAgICBpZiAoaXRlbS5zbHVnKSB7XG4gICAgICAgICAgcm91dGVzLnB1c2goYCR7cHJlZml4fSR7aXRlbS5zbHVnfWApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHBhZ2UrKztcbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCA1MCkpOyAvLyBCZSBuaWNlIHRvIHlvdXIgQVBJXG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgY29uc29sZS5lcnJvcihgRXJyb3IgZmV0Y2hpbmcgcm91dGVzIGZvciAke2VuZHBvaW50fTpgLCBlLm1lc3NhZ2UpO1xuICB9XG4gIGNvbnNvbGUubG9nKGBQcmVyZW5kZXI6IEZvdW5kICR7cm91dGVzLmxlbmd0aH0gcm91dGVzIGZvciAke3ByZWZpeH1gKTtcbiAgcmV0dXJuIHJvdXRlcztcbn07XG5cbi8vIFx1MjcwNSA1LiBEZWZpbmUgdGhlIGZ1bGwgY29uZmlnXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgcmVhY3Qoe1xuICAgICAgLy8gXHUyNzA1IEZhc3QgUmVmcmVzaCBjb25maWd1cmF0aW9uXG4gICAgICBmYXN0UmVmcmVzaDogdHJ1ZSxcbiAgICAgIGpzeFJ1bnRpbWU6ICdhdXRvbWF0aWMnLFxuICAgICAgYmFiZWw6IHtcbiAgICAgICAgcGx1Z2luczogW1xuICAgICAgICAgIHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAncHJvZHVjdGlvbicgJiYgW1xuICAgICAgICAgICAgJ3RyYW5zZm9ybS1yZW1vdmUtY29uc29sZScsXG4gICAgICAgICAgICB7IGV4Y2x1ZGU6IFsnZXJyb3InLCAnd2FybiddIH1cbiAgICAgICAgICBdXG4gICAgICAgIF0uZmlsdGVyKEJvb2xlYW4pXG4gICAgICB9XG4gICAgfSksXG4gICAgXG4gICAgLy8gXHUyNzA1IDYuIEFkZCB0aGUgcHJlcmVuZGVyIHBsdWdpblxuICAgIC8vIFRoaXMgd2lsbCBvbmx5IHJ1biBkdXJpbmcgJ25wbSBydW4gYnVpbGQnXG4gICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdwcm9kdWN0aW9uJyAmJiBwcmVyZW5kZXIoe1xuICAgICAgc3RhdGljRGlyOiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnZGlzdCcpLFxuXG4gICAgICByb3V0ZXM6IGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3Qgc3RhdGljUm91dGVzID0gW1xuICAgICAgICAgICcvJyxcbiAgICAgICAgICAnL2FydGljbGVzJyxcbiAgICAgICAgICAnL2Fib3V0JyxcbiAgICAgICAgICAnL2NvbnRhY3QnLFxuICAgICAgICAgICcvbmV3c2xldHRlcicsXG4gICAgICAgICAgJy9wcml2YWN5LXBvbGljeScsXG4gICAgICAgICAgJy90ZXJtcy1vZi1zZXJ2aWNlJyxcbiAgICAgICAgICAnL2Rpc2NsYWltZXInLFxuICAgICAgICAgICcvdGFnJyxcbiAgICAgICAgXTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IHBvc3RSb3V0ZXMgPSBhd2FpdCBmZXRjaEFsbFJvdXRlcygnL3Bvc3RzJywgJy9hcnRpY2xlcy8nKTtcbiAgICAgICAgY29uc3QgY2F0ZWdvcnlSb3V0ZXMgPSBhd2FpdCBmZXRjaEFsbFJvdXRlcygnL2NhdGVnb3JpZXMnLCAnL2NhdGVnb3J5LycpO1xuICAgICAgICBjb25zdCB0YWdSb3V0ZXMgPSBhd2FpdCBmZXRjaEFsbFJvdXRlcygnL3RhZ3MnLCAnL3RhZy8nKTtcblxuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgIC4uLnN0YXRpY1JvdXRlcyxcbiAgICAgICAgICAuLi5wb3N0Um91dGVzLFxuICAgICAgICAgIC4uLmNhdGVnb3J5Um91dGVzLFxuICAgICAgICAgIC4uLnRhZ1JvdXRlc1xuICAgICAgICBdO1xuICAgICAgfSxcblxuICAgICAgLy8gXHUyNzA1IDcuIFRISVMgSVMgVEhFIEZJWDpcbiAgICAgIC8vIFRlbGwgdGhlIFByZXJlbmRlcmVyIHRvIHVzZSBQdXBwZXRlZXIsIGJ1dCBwb2ludCBpdFxuICAgICAgLy8gdG8gdGhlIHN5c3RlbSdzIGluc3RhbGxlZCBDaHJvbWUgYnJvd3Nlci5cbiAgICAgIHJlbmRlcmVyOiBuZXcgUHVwcGV0ZWVyUmVuZGVyZXIoe1xuICAgICAgICAvLyBXYWl0IGZvciBuZXR3b3JrIHRvIGJlIGlkbGUsIGVuc3VyaW5nIEFQSSBjYWxscyBmaW5pc2hcbiAgICAgICAgYXdhaXQ6ICduZXR3b3JraWRsZTAnLCBcbiAgICAgICAgXG4gICAgICAgIC8vIC0tLSBUSElTIElTIFRIRSBLRVkgTElORSAtLS1cbiAgICAgICAgLy8gVXNlIHRoZSBzeXN0ZW0ncyBpbnN0YWxsZWQgQ2hyb21lLCBub3QgYSBkb3dubG9hZGVkIG9uZS5cbiAgICAgICAgZXhlY3V0YWJsZVBhdGg6ICcvdXNyL2Jpbi9nb29nbGUtY2hyb21lJywgXG4gICAgICAgIFxuICAgICAgICAvLyBBZGQgYXJncyByZXF1aXJlZCBmb3IgY29udGFpbmVyaXplZCBlbnZpcm9ubWVudHNcbiAgICAgICAgbGF1bmNoT3B0aW9uczoge1xuICAgICAgICAgIGFyZ3M6IFtcbiAgICAgICAgICAgICctLW5vLXNhbmRib3gnLFxuICAgICAgICAgICAgJy0tZGlzYWJsZS1zZXR1aWQtc2FuZGJveCcsXG4gICAgICAgICAgICAnLS1kaXNhYmxlLWRldi1zaG0tdXNhZ2UnLFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIFxuICAgICAgICAvLyBJbmplY3QgYSB2YXJpYWJsZSBzbyB5b3VyIGFwcCBrbm93cyBpdCdzIGJlaW5nIHByZXJlbmRlcmVkXG4gICAgICAgIGluamVjdDoge1xuICAgICAgICAgIGlzUHJlcmVuZGVyaW5nOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICB9KVxuICAgIH0pLFxuICBdLFxuICBcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxuICAgIH0sXG4gIH0sXG4gIFxuICAvLyAuLi4gKHJlc3Qgb2YgeW91ciBidWlsZCBjb25maWcsIGluY2x1ZGluZyAndGVyc2VyJykgLi4uXG4gIGJ1aWxkOiB7XG4gICAgdGFyZ2V0OiAnZXMyMDE1JyxcbiAgICBtaW5pZnk6ICd0ZXJzZXInLFxuICAgIHRlcnNlck9wdGlvbnM6IHtcbiAgICAgIGNvbXByZXNzOiB7XG4gICAgICAgIGRyb3BfY29uc29sZTogdHJ1ZSxcbiAgICAgICAgZHJvcF9kZWJ1Z2dlcjogdHJ1ZSxcbiAgICAgICAgcHVyZV9mdW5jczogWydjb25zb2xlLmxvZycsICdjb25zb2xlLmluZm8nLCAnY29uc29sZS5kZWJ1ZyddLFxuICAgICAgICBwYXNzZXM6IDJcbiAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IChpZCkgPT4ge1xuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbm9kZV9tb2R1bGVzJykpIHtcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygncmVhY3QnKSB8fCBpZC5pbmNsdWRlcygncmVhY3QtZG9tJykgfHwgaWQuaW5jbHVkZXMoJ3JlYWN0LXJvdXRlcicpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAncmVhY3QtdmVuZG9yJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnZnJhbWVyLW1vdGlvbicpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAnZnJhbWVyLW1vdGlvbic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0ByYWRpeC11aScpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAndWktdmVuZG9yJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbHVjaWRlLXJlYWN0JykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdpY29ucyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gJ3ZlbmRvcic7XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnc3JjL2NvbXBvbmVudHMvJykpIHtcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnUG9zdENhcmQnKSB8fCBpZC5pbmNsdWRlcygnUG9zdExpc3RJdGVtJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdwb3N0LWNvbXBvbmVudHMnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdBZCcpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAnYWRzJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFxuICAgICAgICBjaHVua0ZpbGVOYW1lczogJ2Fzc2V0cy9qcy9bbmFtZV0tW2hhc2hdLmpzJyxcbiAgICAgICAgZW50cnlGaWxlTmFtZXM6ICdhc3NldHMvanMvW25hbWVdLVtoYXNoXS5qcycsXG4gICAgICAgIGFzc2V0RmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF0uW2V4dF0nXG4gICAgICB9XG4gICAgfSxcbiAgICBcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDUwMCxcbiAgICBzb3VyY2VtYXA6IGZhbHNlLFxuICAgIGNzc0NvZGVTcGxpdDogdHJ1ZSxcbiAgICByZXBvcnRDb21wcmVzc2VkU2l6ZTogdHJ1ZSxcbiAgICBhc3NldHNJbmxpbmVMaW1pdDogMjA0OFxuICB9LFxuICBcbiAgc2VydmVyOiB7XG4gICAgcG9ydDogMzAwMCxcbiAgICBzdHJpY3RQb3J0OiB0cnVlLFxuICAgIGhvc3Q6IHRydWUsXG4gICAgb3BlbjogdHJ1ZSxcbiAgICBobXI6IHtcbiAgICAgIG92ZXJsYXk6IHRydWVcbiAgICB9XG4gIH0sXG4gIFxuICBwcmV2aWV3OiB7XG4gICAgcG9ydDogNDE3MyxcbiAgICBzdHJpY3RQb3J0OiB0cnVlLFxuICAgIGhvc3Q6IHRydWUsXG4gICAgb3BlbjogdHJ1ZVxuICB9XG59KTsiXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUdqQixTQUFTLHFCQUFxQjtBQVM5QixPQUFPLFdBQVc7QUFmbEIsSUFBTSxtQ0FBbUM7QUFBeUYsSUFBTSwyQ0FBMkM7QUFPbkwsSUFBTUEsV0FBVSxjQUFjLHdDQUFlO0FBRzdDLElBQU0sa0JBQWtCQSxTQUFRLHVCQUF1QjtBQUN2RCxJQUFNLFlBQVksZ0JBQWdCLFdBQVc7QUFDN0MsSUFBTSxvQkFBb0JBLFNBQVEsaUNBQWlDO0FBTW5FLElBQU0sb0JBQW9CO0FBRTFCLElBQU0saUJBQWlCLE9BQU8sVUFBVSxXQUFXO0FBQ2pELFFBQU0sU0FBUyxDQUFDO0FBQ2hCLE1BQUksT0FBTztBQUNYLE1BQUksVUFBVTtBQUNkLFVBQVEsSUFBSSx1QkFBdUIsUUFBUSxLQUFLO0FBRWhELE1BQUk7QUFDRixXQUFPLFNBQVM7QUFDZCxZQUFNLE1BQU0sTUFBTSxNQUFNLEdBQUcsaUJBQWlCLEdBQUcsUUFBUSxzQkFBc0IsSUFBSSxlQUFlO0FBQ2hHLFVBQUksQ0FBQyxJQUFJLElBQUk7QUFDWCxZQUFJLElBQUksV0FBVyxLQUFLO0FBQ3RCLG9CQUFVO0FBQ1Y7QUFBQSxRQUNGO0FBQ0EsY0FBTSxJQUFJLE1BQU0sbUJBQW1CLFFBQVEsS0FBSyxJQUFJLFVBQVUsRUFBRTtBQUFBLE1BQ2xFO0FBRUEsWUFBTSxRQUFRLE1BQU0sSUFBSSxLQUFLO0FBRTdCLFVBQUksQ0FBQyxNQUFNLFFBQVEsS0FBSyxLQUFLLE1BQU0sV0FBVyxHQUFHO0FBQy9DLGtCQUFVO0FBQ1Y7QUFBQSxNQUNGO0FBRUEsWUFBTSxRQUFRLFVBQVE7QUFDcEIsWUFBSSxLQUFLLE1BQU07QUFDYixpQkFBTyxLQUFLLEdBQUcsTUFBTSxHQUFHLEtBQUssSUFBSSxF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
