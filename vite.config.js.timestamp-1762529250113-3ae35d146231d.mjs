// vite.config.js
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
import { Prerenderer } from "file:///home/project/node_modules/vite-plugin-prerender/dist/index.mjs";
import fetch from "file:///home/project/node_modules/node-fetch/src/index.js";
var __vite_injected_original_dirname = "/home/project";
var WORDPRESS_API_URL = "https://app.dataengineerhub.blog/wp-json/wp/v2";
var fetchAllPaginated = async (endpoint) => {
  let results = [];
  let page = 1;
  let hasMore = true;
  const fields = "slug";
  console.log(`PRERENDER: Starting fetch for ${endpoint}...`);
  while (hasMore) {
    try {
      const url = `${WORDPRESS_API_URL}${endpoint}?_fields=${fields}&per_page=100&page=${page}`;
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 400) {
          hasMore = false;
          continue;
        }
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
var vite_config_default = defineConfig({
  plugins: [
    react({
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
    // --- PRERENDERING PLUGIN CONFIG ---
    // This plugin runs *after* your 'npm run build' is complete
    Prerenderer({
      // The directory Vite builds to
      staticDir: path.resolve(__vite_injected_original_dirname, "dist"),
      // The routes to prerender
      routes: async () => {
        console.log("PRERENDER: Fetching all dynamic routes from WordPress...");
        const [posts, categories, tags] = await Promise.all([
          fetchAllPaginated("/posts"),
          fetchAllPaginated("/categories"),
          fetchAllPaginated("/tags")
        ]);
        const postRoutes = posts.map((post) => `/articles/${post.slug}`);
        const categoryRoutes = categories.filter((cat) => cat.slug !== "uncategorized").map((cat) => `/category/${cat.slug}`);
        const tagRoutes = tags.map((tag) => `/tag/${tag.slug}`);
        const staticRoutes = [
          "/",
          "/articles",
          "/tag",
          // The main tags archive page
          "/about",
          "/contact",
          "/privacy-policy",
          "/terms-of-service",
          "/disclaimer",
          "/newsletter"
          // We intentionally do NOT render '/debug'
        ];
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
        renderAfterTime: 2500
        // Optional: If your build fails in GitHub Actions, uncomment this
        // args: ['--no-sandbox', '--disable-setuid-sandbox'],
      }
    })
    // --- END PLUGIN CONFIG ---
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  // (The rest of your build config remains the same)
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
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom"
    ],
    exclude: [
      "framer-motion"
    ]
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcuanNcIjsvLyB2aXRlLmNvbmZpZy5qcyAtIEZJTkFMIFBSRVJFTkRFUklORyBWRVJTSU9OXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuLy8gLS0tIE5FVyBQUkVSRU5ERVJJTkcgREVQRU5ERU5DSUVTIC0tLVxuaW1wb3J0IHsgUHJlcmVuZGVyZXIgfSBmcm9tICd2aXRlLXBsdWdpbi1wcmVyZW5kZXInO1xuaW1wb3J0IGZldGNoIGZyb20gJ25vZGUtZmV0Y2gnOyBcblxuLy8gLS0tIFBSRVJFTkRFUklORyBDT05GSUcgLS0tXG5jb25zdCBXT1JEUFJFU1NfQVBJX1VSTCA9ICdodHRwczovL2FwcC5kYXRhZW5naW5lZXJodWIuYmxvZy93cC1qc29uL3dwL3YyJztcblxuLy8gSGVscGVyIHRvIGZldGNoIGFsbCBwYWdpbmF0ZWQgZGF0YSAocG9zdHMsIGNhdGVnb3JpZXMsIHRhZ3MpXG5jb25zdCBmZXRjaEFsbFBhZ2luYXRlZCA9IGFzeW5jIChlbmRwb2ludCkgPT4ge1xuICBsZXQgcmVzdWx0cyA9IFtdO1xuICBsZXQgcGFnZSA9IDE7XG4gIGxldCBoYXNNb3JlID0gdHJ1ZTtcbiAgLy8gV2Ugb25seSBuZWVkIHRoZSAnc2x1ZycgZmllbGQgdG8gYnVpbGQgdGhlIHJvdXRlc1xuICBjb25zdCBmaWVsZHMgPSAnc2x1Zyc7IFxuXG4gIGNvbnNvbGUubG9nKGBQUkVSRU5ERVI6IFN0YXJ0aW5nIGZldGNoIGZvciAke2VuZHBvaW50fS4uLmApO1xuXG4gIHdoaWxlIChoYXNNb3JlKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHVybCA9IGAke1dPUkRQUkVTU19BUElfVVJMfSR7ZW5kcG9pbnR9P19maWVsZHM9JHtmaWVsZHN9JnBlcl9wYWdlPTEwMCZwYWdlPSR7cGFnZX1gO1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwpO1xuXG4gICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgIC8vIEEgNDAwIGVycm9yIG9mdGVuIGp1c3QgbWVhbnMgd2UndmUgaGl0IHRoZSBsYXN0IHBhZ2VcbiAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gNDAwKSB7XG4gICAgICAgICAgaGFzTW9yZSA9IGZhbHNlO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIC8vIExvZyBvdGhlciBlcnJvcnMgYnV0IGRvbid0IHN0b3AgdGhlIHdob2xlIGJ1aWxkXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFdvcmRQcmVzcyBBUEkgRXJyb3I6ICR7cmVzcG9uc2Uuc3RhdHVzfSBmb3IgJHt1cmx9YCk7XG4gICAgICAgIGhhc01vcmUgPSBmYWxzZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgICBpZiAoIUFycmF5LmlzQXJyYXkoZGF0YSkgfHwgZGF0YS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgaGFzTW9yZSA9IGZhbHNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHMuY29uY2F0KGRhdGEpO1xuICAgICAgICBwYWdlKys7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihgRmV0Y2ggRXJyb3IgZm9yICR7ZW5kcG9pbnR9OiAke2UubWVzc2FnZX1gKTtcbiAgICAgIGhhc01vcmUgPSBmYWxzZTtcbiAgICB9XG4gIH1cbiAgXG4gIGNvbnNvbGUubG9nKGBQUkVSRU5ERVI6IEZldGNoZWQgJHtyZXN1bHRzLmxlbmd0aH0gaXRlbXMgZm9yICR7ZW5kcG9pbnR9LmApO1xuICByZXR1cm4gcmVzdWx0cztcbn07XG4vLyAtLS0gRU5EIFBSRVJFTkRFUklORyBDT05GSUcgLS0tXG5cblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KHtcbiAgICAgIGZhc3RSZWZyZXNoOiB0cnVlLFxuICAgICAganN4UnVudGltZTogJ2F1dG9tYXRpYycsXG4gICAgICBiYWJlbDoge1xuICAgICAgICBwbHVnaW5zOiBbXG4gICAgICAgICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdwcm9kdWN0aW9uJyAmJiBbXG4gICAgICAgICAgICAndHJhbnNmb3JtLXJlbW92ZS1jb25zb2xlJyxcbiAgICAgICAgICAgIHsgZXhjbHVkZTogWydlcnJvcicsICd3YXJuJ10gfVxuICAgICAgICAgIF1cbiAgICAgICAgXS5maWx0ZXIoQm9vbGVhbilcbiAgICAgIH1cbiAgICB9KSxcbiAgICBcbiAgICAvLyAtLS0gUFJFUkVOREVSSU5HIFBMVUdJTiBDT05GSUcgLS0tXG4gICAgLy8gVGhpcyBwbHVnaW4gcnVucyAqYWZ0ZXIqIHlvdXIgJ25wbSBydW4gYnVpbGQnIGlzIGNvbXBsZXRlXG4gICAgUHJlcmVuZGVyZXIoe1xuICAgICAgLy8gVGhlIGRpcmVjdG9yeSBWaXRlIGJ1aWxkcyB0b1xuICAgICAgc3RhdGljRGlyOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnZGlzdCcpLFxuXG4gICAgICAvLyBUaGUgcm91dGVzIHRvIHByZXJlbmRlclxuICAgICAgcm91dGVzOiBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdQUkVSRU5ERVI6IEZldGNoaW5nIGFsbCBkeW5hbWljIHJvdXRlcyBmcm9tIFdvcmRQcmVzcy4uLicpO1xuICAgICAgICBcbiAgICAgICAgLy8gMS4gRmV0Y2ggYWxsIGR5bmFtaWMgcm91dGVzIGluIHBhcmFsbGVsXG4gICAgICAgIGNvbnN0IFtwb3N0cywgY2F0ZWdvcmllcywgdGFnc10gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgICAgZmV0Y2hBbGxQYWdpbmF0ZWQoJy9wb3N0cycpLFxuICAgICAgICAgIGZldGNoQWxsUGFnaW5hdGVkKCcvY2F0ZWdvcmllcycpLFxuICAgICAgICAgIGZldGNoQWxsUGFnaW5hdGVkKCcvdGFncycpXG4gICAgICAgIF0pO1xuXG4gICAgICAgIC8vIDIuIE1hcCBBUEkgZGF0YSB0byByb3V0ZSBzdHJpbmdzXG4gICAgICAgIGNvbnN0IHBvc3RSb3V0ZXMgPSBwb3N0cy5tYXAocG9zdCA9PiBgL2FydGljbGVzLyR7cG9zdC5zbHVnfWApO1xuICAgICAgICBjb25zdCBjYXRlZ29yeVJvdXRlcyA9IGNhdGVnb3JpZXNcbiAgICAgICAgICAuZmlsdGVyKGNhdCA9PiBjYXQuc2x1ZyAhPT0gJ3VuY2F0ZWdvcml6ZWQnKSAvLyBFeGNsdWRlICd1bmNhdGVnb3JpemVkJ1xuICAgICAgICAgIC5tYXAoY2F0ID0+IGAvY2F0ZWdvcnkvJHtjYXQuc2x1Z31gKTtcbiAgICAgICAgY29uc3QgdGFnUm91dGVzID0gdGFncy5tYXAodGFnID0+IGAvdGFnLyR7dGFnLnNsdWd9YCk7XG5cbiAgICAgICAgLy8gMy4gRGVmaW5lIGFsbCB5b3VyIGFwcCdzIHN0YXRpYyByb3V0ZXMgKGNyb3NzLWNoZWNrZWQgd2l0aCBBcHAuanN4KVxuICAgICAgICBjb25zdCBzdGF0aWNSb3V0ZXMgPSBbXG4gICAgICAgICAgJy8nLFxuICAgICAgICAgICcvYXJ0aWNsZXMnLFxuICAgICAgICAgICcvdGFnJywgLy8gVGhlIG1haW4gdGFncyBhcmNoaXZlIHBhZ2VcbiAgICAgICAgICAnL2Fib3V0JyxcbiAgICAgICAgICAnL2NvbnRhY3QnLFxuICAgICAgICAgICcvcHJpdmFjeS1wb2xpY3knLFxuICAgICAgICAgICcvdGVybXMtb2Ytc2VydmljZScsXG4gICAgICAgICAgJy9kaXNjbGFpbWVyJyxcbiAgICAgICAgICAnL25ld3NsZXR0ZXInLFxuICAgICAgICAgIC8vIFdlIGludGVudGlvbmFsbHkgZG8gTk9UIHJlbmRlciAnL2RlYnVnJ1xuICAgICAgICBdO1xuXG4gICAgICAgIC8vIDQuIENvbWJpbmUgYW5kIHJldHVybiBhbGwgcm91dGVzXG4gICAgICAgIGNvbnN0IGFsbFJvdXRlcyA9IFtcbiAgICAgICAgICAuLi5zdGF0aWNSb3V0ZXMsXG4gICAgICAgICAgLi4ucG9zdFJvdXRlcyxcbiAgICAgICAgICAuLi5jYXRlZ29yeVJvdXRlcyxcbiAgICAgICAgICAuLi50YWdSb3V0ZXNcbiAgICAgICAgXTtcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKGBQUkVSRU5ERVI6IFRvdGFsIHJvdXRlcyB0byByZW5kZXI6ICR7YWxsUm91dGVzLmxlbmd0aH1gKTtcbiAgICAgICAgcmV0dXJuIGFsbFJvdXRlcztcbiAgICAgIH0sXG5cbiAgICAgIC8vIFB1cHBldGVlciBvcHRpb25zXG4gICAgICByZW5kZXJlck9wdGlvbnM6IHtcbiAgICAgICAgLy8gV2FpdCAyLjUgc2Vjb25kcyBmb3IgeW91ciBTUEEgdG8gZmV0Y2ggZGF0YSBhbmQgcmVuZGVyXG4gICAgICAgIC8vIFRoaXMgaXMgYSBzaW1wbGUgYW5kIHJlbGlhYmxlIHdheSB0byBlbnN1cmUgY29udGVudCBpcyBwcmVzZW50XG4gICAgICAgIHJlbmRlckFmdGVyVGltZTogMjUwMCwgXG4gICAgICAgIFxuICAgICAgICAvLyBPcHRpb25hbDogSWYgeW91ciBidWlsZCBmYWlscyBpbiBHaXRIdWIgQWN0aW9ucywgdW5jb21tZW50IHRoaXNcbiAgICAgICAgLy8gYXJnczogWyctLW5vLXNhbmRib3gnLCAnLS1kaXNhYmxlLXNldHVpZC1zYW5kYm94J10sXG4gICAgICB9LFxuICAgIH0pXG4gICAgLy8gLS0tIEVORCBQTFVHSU4gQ09ORklHIC0tLVxuICBdLFxuICBcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxuICAgIH0sXG4gIH0sXG4gIFxuICAvLyAoVGhlIHJlc3Qgb2YgeW91ciBidWlsZCBjb25maWcgcmVtYWlucyB0aGUgc2FtZSlcbiAgYnVpbGQ6IHtcbiAgICB0YXJnZXQ6ICdlczIwMTUnLFxuICAgIG1pbmlmeTogJ3RlcnNlcicsXG4gICAgdGVyc2VyT3B0aW9uczoge1xuICAgICAgY29tcHJlc3M6IHtcbiAgICAgICAgZHJvcF9jb25zb2xlOiB0cnVlLFxuICAgICAgICBkcm9wX2RlYnVnZ2VyOiB0cnVlLFxuICAgICAgICBwdXJlX2Z1bmNzOiBbJ2NvbnNvbGUubG9nJywgJ2NvbnNvbGUuaW5mbycsICdjb25zb2xlLmRlYnVnJ10sXG4gICAgICAgIHBhc3NlczogMlxuICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rczogKGlkKSA9PiB7XG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMnKSkge1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdyZWFjdCcpIHx8IGlkLmluY2x1ZGVzKCdyZWFjdC1kb20nKSB8fCBpZC5pbmNsdWRlcygncmVhY3Qtcm91dGVyJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdyZWFjdC12ZW5kb3InO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdmcmFtZXItbW90aW9uJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdmcmFtZXItbW90aW9uJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQHJhZGl4LXVpJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICd1aS12ZW5kb3InO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdsdWNpZGUtcmVhY3QnKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ2ljb25zJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAndmVuZG9yJztcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdzcmMvY29tcG9uZW50cy8nKSkge1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdQb3N0Q2FyZCcpIHx8IGlkLmluY2x1ZGVzKCdQb3N0TGlzdEl0ZW0nKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ3Bvc3QtY29tcG9uZW50cyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0FkJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdhZHMnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXG4gICAgICAgIGNodW5rRmlsZU5hbWVzOiAnYXNzZXRzL2pzL1tuYW1lXS1baGFzaF0uanMnLFxuICAgICAgICBlbnRyeUZpbGVOYW1lczogJ2Fzc2V0cy9qcy9bbmFtZV0tW2hhc2hdLmpzJyxcbiAgICAgICAgYXNzZXRGaWxlTmFtZXM6ICdhc3NldHMvW25hbWVdLVtoYXNoXS5bZXh0XSdcbiAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogNTAwLFxuICAgIHNvdXJjZW1hcDogZmFsc2UsXG4gICAgY3NzQ29kZVNwbGl0OiB0cnVlLFxuICAgIHJlcG9ydENvbXByZXNzZWRTaXplOiB0cnVlLFxuICAgIGFzc2V0c0lubGluZUxpbWl0OiAyMDQ4XG4gIH0sXG4gIFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBpbmNsdWRlOiBbXG4gICAgICAncmVhY3QnLFxuICAgICAgJ3JlYWN0LWRvbScsXG4gICAgICAncmVhY3Qtcm91dGVyLWRvbSdcbiAgICBdLFxuICAgIGV4Y2x1ZGU6IFtcbiAgICAgICdmcmFtZXItbW90aW9uJ1xuICAgIF1cbiAgfSxcbiAgXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDMwMDAsXG4gICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgICBob3N0OiB0cnVlLFxuICAgIG9wZW46IHRydWUsXG4gICAgaG1yOiB7XG4gICAgICBvdmVybGF5OiB0cnVlXG4gICAgfVxuICB9LFxuICBcbiAgcHJldmlldzoge1xuICAgIHBvcnQ6IDQxNzMsXG4gICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgICBob3N0OiB0cnVlLFxuICAgIG9wZW46IHRydWVcbiAgfVxufSk7Il0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFHakIsU0FBUyxtQkFBbUI7QUFDNUIsT0FBTyxXQUFXO0FBUGxCLElBQU0sbUNBQW1DO0FBVXpDLElBQU0sb0JBQW9CO0FBRzFCLElBQU0sb0JBQW9CLE9BQU8sYUFBYTtBQUM1QyxNQUFJLFVBQVUsQ0FBQztBQUNmLE1BQUksT0FBTztBQUNYLE1BQUksVUFBVTtBQUVkLFFBQU0sU0FBUztBQUVmLFVBQVEsSUFBSSxpQ0FBaUMsUUFBUSxLQUFLO0FBRTFELFNBQU8sU0FBUztBQUNkLFFBQUk7QUFDRixZQUFNLE1BQU0sR0FBRyxpQkFBaUIsR0FBRyxRQUFRLFlBQVksTUFBTSxzQkFBc0IsSUFBSTtBQUN2RixZQUFNLFdBQVcsTUFBTSxNQUFNLEdBQUc7QUFFaEMsVUFBSSxDQUFDLFNBQVMsSUFBSTtBQUVoQixZQUFJLFNBQVMsV0FBVyxLQUFLO0FBQzNCLG9CQUFVO0FBQ1Y7QUFBQSxRQUNGO0FBRUEsZ0JBQVEsTUFBTSx3QkFBd0IsU0FBUyxNQUFNLFFBQVEsR0FBRyxFQUFFO0FBQ2xFLGtCQUFVO0FBQ1Y7QUFBQSxNQUNGO0FBRUEsWUFBTSxPQUFPLE1BQU0sU0FBUyxLQUFLO0FBQ2pDLFVBQUksQ0FBQyxNQUFNLFFBQVEsSUFBSSxLQUFLLEtBQUssV0FBVyxHQUFHO0FBQzdDLGtCQUFVO0FBQUEsTUFDWixPQUFPO0FBQ0wsa0JBQVUsUUFBUSxPQUFPLElBQUk7QUFDN0I7QUFBQSxNQUNGO0FBQUEsSUFDRixTQUFTLEdBQUc7QUFDVixjQUFRLE1BQU0sbUJBQW1CLFFBQVEsS0FBSyxFQUFFLE9BQU8sRUFBRTtBQUN6RCxnQkFBVTtBQUFBLElBQ1o7QUFBQSxFQUNGO0FBRUEsVUFBUSxJQUFJLHNCQUFzQixRQUFRLE1BQU0sY0FBYyxRQUFRLEdBQUc7QUFDekUsU0FBTztBQUNUO0FBSUEsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLE1BQ0osYUFBYTtBQUFBLE1BQ2IsWUFBWTtBQUFBLE1BQ1osT0FBTztBQUFBLFFBQ0wsU0FBUztBQUFBLFVBQ1AsUUFBUSxJQUFJLGFBQWEsZ0JBQWdCO0FBQUEsWUFDdkM7QUFBQSxZQUNBLEVBQUUsU0FBUyxDQUFDLFNBQVMsTUFBTSxFQUFFO0FBQUEsVUFDL0I7QUFBQSxRQUNGLEVBQUUsT0FBTyxPQUFPO0FBQUEsTUFDbEI7QUFBQSxJQUNGLENBQUM7QUFBQTtBQUFBO0FBQUEsSUFJRCxZQUFZO0FBQUE7QUFBQSxNQUVWLFdBQVcsS0FBSyxRQUFRLGtDQUFXLE1BQU07QUFBQTtBQUFBLE1BR3pDLFFBQVEsWUFBWTtBQUNsQixnQkFBUSxJQUFJLDBEQUEwRDtBQUd0RSxjQUFNLENBQUMsT0FBTyxZQUFZLElBQUksSUFBSSxNQUFNLFFBQVEsSUFBSTtBQUFBLFVBQ2xELGtCQUFrQixRQUFRO0FBQUEsVUFDMUIsa0JBQWtCLGFBQWE7QUFBQSxVQUMvQixrQkFBa0IsT0FBTztBQUFBLFFBQzNCLENBQUM7QUFHRCxjQUFNLGFBQWEsTUFBTSxJQUFJLFVBQVEsYUFBYSxLQUFLLElBQUksRUFBRTtBQUM3RCxjQUFNLGlCQUFpQixXQUNwQixPQUFPLFNBQU8sSUFBSSxTQUFTLGVBQWUsRUFDMUMsSUFBSSxTQUFPLGFBQWEsSUFBSSxJQUFJLEVBQUU7QUFDckMsY0FBTSxZQUFZLEtBQUssSUFBSSxTQUFPLFFBQVEsSUFBSSxJQUFJLEVBQUU7QUFHcEQsY0FBTSxlQUFlO0FBQUEsVUFDbkI7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUE7QUFBQSxRQUVGO0FBR0EsY0FBTSxZQUFZO0FBQUEsVUFDaEIsR0FBRztBQUFBLFVBQ0gsR0FBRztBQUFBLFVBQ0gsR0FBRztBQUFBLFVBQ0gsR0FBRztBQUFBLFFBQ0w7QUFFQSxnQkFBUSxJQUFJLHNDQUFzQyxVQUFVLE1BQU0sRUFBRTtBQUNwRSxlQUFPO0FBQUEsTUFDVDtBQUFBO0FBQUEsTUFHQSxpQkFBaUI7QUFBQTtBQUFBO0FBQUEsUUFHZixpQkFBaUI7QUFBQTtBQUFBO0FBQUEsTUFJbkI7QUFBQSxJQUNGLENBQUM7QUFBQTtBQUFBLEVBRUg7QUFBQSxFQUVBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQTtBQUFBLEVBR0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsUUFBUTtBQUFBLElBQ1IsZUFBZTtBQUFBLE1BQ2IsVUFBVTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsZUFBZTtBQUFBLFFBQ2YsWUFBWSxDQUFDLGVBQWUsZ0JBQWdCLGVBQWU7QUFBQSxRQUMzRCxRQUFRO0FBQUEsTUFDVjtBQUFBLElBQ0Y7QUFBQSxJQUVBLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGNBQWMsQ0FBQyxPQUFPO0FBQ3BCLGNBQUksR0FBRyxTQUFTLGNBQWMsR0FBRztBQUMvQixnQkFBSSxHQUFHLFNBQVMsT0FBTyxLQUFLLEdBQUcsU0FBUyxXQUFXLEtBQUssR0FBRyxTQUFTLGNBQWMsR0FBRztBQUNuRixxQkFBTztBQUFBLFlBQ1Q7QUFDQSxnQkFBSSxHQUFHLFNBQVMsZUFBZSxHQUFHO0FBQ2hDLHFCQUFPO0FBQUEsWUFDVDtBQUNBLGdCQUFJLEdBQUcsU0FBUyxXQUFXLEdBQUc7QUFDNUIscUJBQU87QUFBQSxZQUNUO0FBQ0EsZ0JBQUksR0FBRyxTQUFTLGNBQWMsR0FBRztBQUMvQixxQkFBTztBQUFBLFlBQ1Q7QUFDQSxtQkFBTztBQUFBLFVBQ1Q7QUFFQSxjQUFJLEdBQUcsU0FBUyxpQkFBaUIsR0FBRztBQUNsQyxnQkFBSSxHQUFHLFNBQVMsVUFBVSxLQUFLLEdBQUcsU0FBUyxjQUFjLEdBQUc7QUFDMUQscUJBQU87QUFBQSxZQUNUO0FBQ0EsZ0JBQUksR0FBRyxTQUFTLElBQUksR0FBRztBQUNyQixxQkFBTztBQUFBLFlBQ1Q7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLFFBRUEsZ0JBQWdCO0FBQUEsUUFDaEIsZ0JBQWdCO0FBQUEsUUFDaEIsZ0JBQWdCO0FBQUEsTUFDbEI7QUFBQSxJQUNGO0FBQUEsSUFFQSx1QkFBdUI7QUFBQSxJQUN2QixXQUFXO0FBQUEsSUFDWCxjQUFjO0FBQUEsSUFDZCxzQkFBc0I7QUFBQSxJQUN0QixtQkFBbUI7QUFBQSxFQUNyQjtBQUFBLEVBRUEsY0FBYztBQUFBLElBQ1osU0FBUztBQUFBLE1BQ1A7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUVBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQSxJQUNaLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQSxNQUNILFNBQVM7QUFBQSxJQUNYO0FBQUEsRUFDRjtBQUFBLEVBRUEsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sWUFBWTtBQUFBLElBQ1osTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1I7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
