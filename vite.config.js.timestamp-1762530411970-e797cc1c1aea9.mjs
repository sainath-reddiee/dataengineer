// vite.config.js
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
import Prerenderer from "file:///home/project/node_modules/vite-plugin-prerender/dist/index.mjs";
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
var vite_config_default = defineConfig(({ command }) => ({
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
    // --- CONDITIONAL PRERENDERING (Fixes 'npm run dev') ---
    // Only run prerendering during the 'build' command
    command === "build" && Prerenderer({
      staticDir: path.resolve(__vite_injected_original_dirname, "dist"),
      routes: async () => {
        console.log("PRERENDER: Fetching all dynamic routes from WordPress...");
        const [posts, categories, tags] = await Promise.all([
          fetchAllPaginated("/posts"),
          // For /articles/:slug
          fetchAllPaginated("/categories"),
          // For /category/:slug
          fetchAllPaginated("/tags")
          // For /tag/:slug
        ]);
        const postRoutes = posts.map((post) => `/articles/${post.slug}`);
        const categoryRoutes = categories.filter((cat) => cat.slug !== "uncategorized").map((cat) => `/category/${cat.slug}`);
        const tagRoutes = tags.map((tag) => `/tag/${tag.slug}`);
        const staticRoutes = [
          "/",
          "/articles",
          "/tag",
          "/about",
          "/contact",
          "/privacy-policy",
          "/terms-of-service",
          "/disclaimer",
          "/newsletter"
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
        renderAfterTime: 2500
        // Wait 2.5s for SPA to fetch data
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
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcuanNcIjsvLyB2aXRlLmNvbmZpZy5qcyAtIEZJTkFMIENPUlJFQ1RFRCBWRVJTSU9OXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuLy8gLS0tIFBSRVJFTkRFUklORyBERVBFTkRFTkNJRVMgLS0tXG4vLyBVc2UgYSBkZWZhdWx0IGltcG9ydCAoRml4ZXMgU3ludGF4RXJyb3IpXG5pbXBvcnQgUHJlcmVuZGVyZXIgZnJvbSAndml0ZS1wbHVnaW4tcHJlcmVuZGVyJzsgXG5pbXBvcnQgZmV0Y2ggZnJvbSAnbm9kZS1mZXRjaCc7IC8vIFRoaXMgd2lsbCBub3cgYmUgZm91bmRcblxuLy8gLS0tIFBSRVJFTkRFUklORyBDT05GSUcgLS0tXG5jb25zdCBXT1JEUFJFU1NfQVBJX1VSTCA9ICdodHRwczovL2FwcC5kYXRhZW5naW5lZXJodWIuYmxvZy93cC1qc29uL3dwL3YyJztcblxuY29uc3QgZmV0Y2hBbGxQYWdpbmF0ZWQgPSBhc3luYyAoZW5kcG9pbnQpID0+IHtcbiAgbGV0IHJlc3VsdHMgPSBbXTtcbiAgbGV0IHBhZ2UgPSAxO1xuICBsZXQgaGFzTW9yZSA9IHRydWU7XG4gIGNvbnN0IGZpZWxkcyA9ICdzbHVnJzsgXG5cbiAgY29uc29sZS5sb2coYFBSRVJFTkRFUjogU3RhcnRpbmcgZmV0Y2ggZm9yICR7ZW5kcG9pbnR9Li4uYCk7XG5cbiAgd2hpbGUgKGhhc01vcmUpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgdXJsID0gYCR7V09SRFBSRVNTX0FQSV9VUkx9JHtlbmRwb2ludH0/X2ZpZWxkcz0ke2ZpZWxkc30mcGVyX3BhZ2U9MTAwJnBhZ2U9JHtwYWdlfWA7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCk7XG5cbiAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gNDAwKSB7IC8vIDQwMCBtZWFucyBubyBtb3JlIHBhZ2VzXG4gICAgICAgICAgaGFzTW9yZSA9IGZhbHNlO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFdvcmRQcmVzcyBBUEkgRXJyb3I6ICR7cmVzcG9uc2Uuc3RhdHVzfSBmb3IgJHt1cmx9YCk7XG4gICAgICAgIGhhc01vcmUgPSBmYWxzZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgICBpZiAoIUFycmF5LmlzQXJyYXkoZGF0YSkgfHwgZGF0YS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgaGFzTW9yZSA9IGZhbHNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHMuY29uY2F0KGRhdGEpO1xuICAgICAgICBwYWdlKys7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihgRmV0Y2ggRXJyb3IgZm9yICR7ZW5kcG9pbnR9OiAke2UubWVzc2FnZX1gKTtcbiAgICAgIGhhc01vcmUgPSBmYWxzZTtcbiAgICB9XG4gIH1cbiAgXG4gIGNvbnNvbGUubG9nKGBQUkVSRU5ERVI6IEZldGNoZWQgJHtyZXN1bHRzLmxlbmd0aH0gaXRlbXMgZm9yICR7ZW5kcG9pbnR9LmApO1xuICByZXR1cm4gcmVzdWx0cztcbn07XG4vLyAtLS0gRU5EIFBSRVJFTkRFUklORyBDT05GSUcgLS0tXG5cblxuLy8gV3JhcCBleHBvcnQgaW4gYSBmdW5jdGlvbiB0byBhY2Nlc3MgdGhlICdjb21tYW5kJ1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IGNvbW1hbmQgfSkgPT4gKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KHtcbiAgICAgIGZhc3RSZWZyZXNoOiB0cnVlLFxuICAgICAganN4UnVudGltZTogJ2F1dG9tYXRpYycsXG4gICAgICBiYWJlbDoge1xuICAgICAgICBwbHVnaW5zOiBbXG4gICAgICAgICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdwcm9kdWN0aW9uJyAmJiBbXG4gICAgICAgICAgICAndHJhbnNmb3JtLXJlbW92ZS1jb25zb2xlJyxcbiAgICAgICAgICAgIHsgZXhjbHVkZTogWydlcnJvcicsICd3YXJuJ10gfVxuICAgICAgICAgIF1cbiAgICAgICAgXS5maWx0ZXIoQm9vbGVhbilcbiAgICAgIH1cbiAgICB9KSxcbiAgICBcbiAgICAvLyAtLS0gQ09ORElUSU9OQUwgUFJFUkVOREVSSU5HIChGaXhlcyAnbnBtIHJ1biBkZXYnKSAtLS1cbiAgICAvLyBPbmx5IHJ1biBwcmVyZW5kZXJpbmcgZHVyaW5nIHRoZSAnYnVpbGQnIGNvbW1hbmRcbiAgICBjb21tYW5kID09PSAnYnVpbGQnICYmIFByZXJlbmRlcmVyKHtcbiAgICAgIHN0YXRpY0RpcjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ2Rpc3QnKSxcbiAgICAgIHJvdXRlczogYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZygnUFJFUkVOREVSOiBGZXRjaGluZyBhbGwgZHluYW1pYyByb3V0ZXMgZnJvbSBXb3JkUHJlc3MuLi4nKTtcbiAgICAgICAgXG4gICAgICAgIC8vIDEuIEZldGNoIGFsbCBkeW5hbWljIHJvdXRlcyAoTk8gY2VydGlmaWNhdGlvbiByb3V0ZXMpXG4gICAgICAgIGNvbnN0IFtwb3N0cywgY2F0ZWdvcmllcywgdGFnc10gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgICAgZmV0Y2hBbGxQYWdpbmF0ZWQoJy9wb3N0cycpLCAgICAgICAgICAgLy8gRm9yIC9hcnRpY2xlcy86c2x1Z1xuICAgICAgICAgIGZldGNoQWxsUGFnaW5hdGVkKCcvY2F0ZWdvcmllcycpLCAgICAgIC8vIEZvciAvY2F0ZWdvcnkvOnNsdWdcbiAgICAgICAgICBmZXRjaEFsbFBhZ2luYXRlZCgnL3RhZ3MnKSwgICAgICAgICAgICAvLyBGb3IgL3RhZy86c2x1Z1xuICAgICAgICBdKTtcblxuICAgICAgICAvLyAyLiBNYXAgQVBJIGRhdGEgdG8gcm91dGUgc3RyaW5nc1xuICAgICAgICBjb25zdCBwb3N0Um91dGVzID0gcG9zdHMubWFwKHBvc3QgPT4gYC9hcnRpY2xlcy8ke3Bvc3Quc2x1Z31gKTtcbiAgICAgICAgY29uc3QgY2F0ZWdvcnlSb3V0ZXMgPSBjYXRlZ29yaWVzXG4gICAgICAgICAgLmZpbHRlcihjYXQgPT4gY2F0LnNsdWcgIT09ICd1bmNhdGVnb3JpemVkJylcbiAgICAgICAgICAubWFwKGNhdCA9PiBgL2NhdGVnb3J5LyR7Y2F0LnNsdWd9YCk7XG4gICAgICAgIGNvbnN0IHRhZ1JvdXRlcyA9IHRhZ3MubWFwKHRhZyA9PiBgL3RhZy8ke3RhZy5zbHVnfWApO1xuXG4gICAgICAgIC8vIDMuIERlZmluZSBhbGwgeW91ciBhcHAncyBzdGF0aWMgcm91dGVzIChOTyBjZXJ0aWZpY2F0aW9uIHJvdXRlcylcbiAgICAgICAgY29uc3Qgc3RhdGljUm91dGVzID0gW1xuICAgICAgICAgICcvJyxcbiAgICAgICAgICAnL2FydGljbGVzJyxcbiAgICAgICAgICAnL3RhZycsIFxuICAgICAgICAgICcvYWJvdXQnLFxuICAgICAgICAgICcvY29udGFjdCcsXG4gICAgICAgICAgJy9wcml2YWN5LXBvbGljeScsXG4gICAgICAgICAgJy90ZXJtcy1vZi1zZXJ2aWNlJyxcbiAgICAgICAgICAnL2Rpc2NsYWltZXInLFxuICAgICAgICAgICcvbmV3c2xldHRlcicsXG4gICAgICAgIF07XG5cbiAgICAgICAgLy8gNC4gQ29tYmluZSBhbmQgcmV0dXJuIGFsbCByb3V0ZXNcbiAgICAgICAgY29uc3QgYWxsUm91dGVzID0gW1xuICAgICAgICAgIC4uLnN0YXRpY1JvdXRlcyxcbiAgICAgICAgICAuLi5wb3N0Um91dGVzLFxuICAgICAgICAgIC4uLmNhdGVnb3J5Um91dGVzLFxuICAgICAgICAgIC4uLnRhZ1JvdXRlcyxcbiAgICAgICAgXTtcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKGBQUkVSRU5ERVI6IFRvdGFsIHJvdXRlcyB0byByZW5kZXI6ICR7YWxsUm91dGVzLmxlbmd0aH1gKTtcbiAgICAgICAgcmV0dXJuIGFsbFJvdXRlcztcbiAgICAgIH0sXG5cbiAgICAgIC8vIFB1cHBldGVlciBvcHRpb25zXG4gICAgICByZW5kZXJlck9wdGlvbnM6IHtcbiAgICAgICAgcmVuZGVyQWZ0ZXJUaW1lOiAyNTAwLCAvLyBXYWl0IDIuNXMgZm9yIFNQQSB0byBmZXRjaCBkYXRhXG4gICAgICB9LFxuICAgIH0pXG4gICAgLy8gLS0tIEVORCBQTFVHSU4gQ09ORklHIC0tLVxuICBdLFxuICBcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxuICAgIH0sXG4gIH0sXG4gIFxuICAvLyAoVGhlIHJlc3Qgb2YgeW91ciBidWlsZCBjb25maWcgcmVtYWlucyB0aGUgc2FtZSlcbiAgYnVpbGQ6IHtcbiAgICB0YXJnZXQ6ICdlczIwMTUnLFxuICAgIG1pbmlmeTogJ3RlcnNlcicsXG4gICAgdGVyc2VyT3B0aW9uczoge1xuICAgICAgY29tcHJlc3M6IHtcbiAgICAgICAgZHJvcF9jb25zb2xlOiB0cnVlLFxuICAgICAgICBkcm9wX2RlYnVnZ2VyOiB0cnVlLFxuICAgICAgICBwdXJlX2Z1bmNzOiBbJ2NvbnNvbGUubG9nJywgJ2NvbnNvbGUuaW5mbycsICdjb25zb2xlLmRlYnVnJ10sXG4gICAgICAgIHBhc3NlczogMlxuICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rczogKGlkKSA9PiB7XG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMnKSkge1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdyZWFjdCcpIHx8IGlkLmluY2x1ZGVzKCdyZWFjdC1kb20nKSB8fCBpZC5pbmNsdWRlcygncmVhY3Qtcm91dGVyJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdyZWFjdC12ZW5kb3InO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdmcmFtZXItbW90aW9uJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdmcmFtZXItbW90aW9uJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQHJhZGl4LXVpJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICd1aS12ZW5kb3InO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdsdWNpZGUtcmVhY3QnKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ2ljb25zJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAndmVuZG9yJztcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdzcmMvY29tcG9uZW50cy8nKSkge1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdQb3N0Q2FyZCcpIHx8IGlkLmluY2x1ZGVzKCdQb3N0TGlzdEl0ZW0nKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ3Bvc3QtY29tcG9uZW50cyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0FkJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdhZHMnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXG4gICAgICAgIGNodW5rRmlsZU5hbWVzOiAnYXNzZXRzL2pzL1tuYW1lXS1baGFzaF0uanMnLFxuICAgICAgICBlbnRyeUZpbGVOYW1lczogJ2Fzc2V0cy9qcy9bbmFtZV0tW2hhc2hdLmpzJyxcbiAgICAgICAgYXNzZXRGaWxlTmFtZXM6ICdhc3NldHMvW25hbWVdLVtoYXNoXS5bZXh0XSdcbiAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogNTAwLFxuICAgIHNvdXJjZW1hcDogZmFsc2UsXG4gICAgY3NzQ29kZVNwbGl0OiB0cnVlLFxuICAgIHJlcG9ydENvbXByZXNzZWRTaXplOiB0cnVlLFxuICAgIGFzc2V0c0lubGluZUxpbWl0OiAyMDQ4XG4gIH0sXG4gIFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBpbmNsdWRlOiBbXG4gICAgICAncmVhY3QnLFxuICAgICAgJ3JlYWN0LWRvbScsXG4gICAgICAncmVhY3Qtcm91dGVyLWRvbSdcbiAgICBdLFxuICAgIGV4Y2x1ZGU6IFtcbiAgICAgICdmcmFtZXItbW90aW9uJ1xuICAgIF1cbiAgfSxcbiAgXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDMwMDAsXG4gICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgICBob3N0OiB0cnVlLFxuICAgIG9wZW46IHRydWUsXG4gICAgaG1yOiB7XG4gICAgICBvdmVybGF5OiB0cnVlXG4gICAgfVxuICB9LFxuICBcbiAgcHJldmlldzoge1xuICAgIHBvcnQ6IDQxNzMsXG4gICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgICBob3N0OiB0cnVlLFxuICAgIG9wZW46IHRydWVcbiAgfVxufSkpOyJdLAogICJtYXBwaW5ncyI6ICI7QUFDQSxTQUFT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
