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
    // 
    // FIX #3: Only run Prerenderer during 'build', not 'dev' (serve)
    // This stops the 'require is not defined' error!
    //
    command === "build" && Prerenderer({
      staticDir: path.resolve(__vite_injected_original_dirname, "dist"),
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcuanNcIjsvLyB2aXRlLmNvbmZpZy5qcyAtIEZJTkFMIENPUlJFQ1RFRCBWRVJTSU9OXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuLy8gLS0tIFBSRVJFTkRFUklORyBERVBFTkRFTkNJRVMgLS0tXG4vLyBcbi8vIEZJWCAjMTogVXNlIGEgZGVmYXVsdCBpbXBvcnQgKGZpeGVzIFwiZG9lcyBub3QgcHJvdmlkZSBhbiBleHBvcnRcIilcbmltcG9ydCBQcmVyZW5kZXJlciBmcm9tICd2aXRlLXBsdWdpbi1wcmVyZW5kZXInOyBcbi8vXG5pbXBvcnQgZmV0Y2ggZnJvbSAnbm9kZS1mZXRjaCc7IC8vIFRoaXMgbm93IHdvcmtzIGJlY2F1c2Ugb2YgU3RlcCAxXG5cbi8vIC0tLSBQUkVSRU5ERVJJTkcgQ09ORklHIC0tLVxuY29uc3QgV09SRFBSRVNTX0FQSV9VUkwgPSAnaHR0cHM6Ly9hcHAuZGF0YWVuZ2luZWVyaHViLmJsb2cvd3AtanNvbi93cC92Mic7XG5cbmNvbnN0IGZldGNoQWxsUGFnaW5hdGVkID0gYXN5bmMgKGVuZHBvaW50KSA9PiB7XG4gIGxldCByZXN1bHRzID0gW107XG4gIGxldCBwYWdlID0gMTtcbiAgbGV0IGhhc01vcmUgPSB0cnVlO1xuICBjb25zdCBmaWVsZHMgPSAnc2x1Zyc7IFxuXG4gIGNvbnNvbGUubG9nKGBQUkVSRU5ERVI6IFN0YXJ0aW5nIGZldGNoIGZvciAke2VuZHBvaW50fS4uLmApO1xuXG4gIHdoaWxlIChoYXNNb3JlKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHVybCA9IGAke1dPUkRQUkVTU19BUElfVVJMfSR7ZW5kcG9pbnR9P19maWVsZHM9JHtmaWVsZHN9JnBlcl9wYWdlPTEwMCZwYWdlPSR7cGFnZX1gO1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwpO1xuXG4gICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQwMCkgeyAvLyA0MDAgbWVhbnMgbm8gbW9yZSBwYWdlc1xuICAgICAgICAgIGhhc01vcmUgPSBmYWxzZTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmVycm9yKGBXb3JkUHJlc3MgQVBJIEVycm9yOiAke3Jlc3BvbnNlLnN0YXR1c30gZm9yICR7dXJsfWApO1xuICAgICAgICBoYXNNb3JlID0gZmFsc2U7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgXG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGRhdGEpIHx8IGRhdGEubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGhhc01vcmUgPSBmYWxzZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmNvbmNhdChkYXRhKTtcbiAgICAgICAgcGFnZSsrO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYEZldGNoIEVycm9yIGZvciAke2VuZHBvaW50fTogJHtlLm1lc3NhZ2V9YCk7XG4gICAgICBoYXNNb3JlID0gZmFsc2U7XG4gICAgfVxuICB9XG4gIFxuICBjb25zb2xlLmxvZyhgUFJFUkVOREVSOiBGZXRjaGVkICR7cmVzdWx0cy5sZW5ndGh9IGl0ZW1zIGZvciAke2VuZHBvaW50fS5gKTtcbiAgcmV0dXJuIHJlc3VsdHM7XG59O1xuLy8gLS0tIEVORCBQUkVSRU5ERVJJTkcgQ09ORklHIC0tLVxuXG5cbi8vIFxuLy8gRklYICMyOiBXcmFwIGV4cG9ydCBpbiBhIGZ1bmN0aW9uIHRvIGdldCB0aGUgJ2NvbW1hbmQnXG4vL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IGNvbW1hbmQgfSkgPT4gKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KHtcbiAgICAgIGZhc3RSZWZyZXNoOiB0cnVlLFxuICAgICAganN4UnVudGltZTogJ2F1dG9tYXRpYycsXG4gICAgICBiYWJlbDoge1xuICAgICAgICBwbHVnaW5zOiBbXG4gICAgICAgICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdwcm9kdWN0aW9uJyAmJiBbXG4gICAgICAgICAgICAndHJhbnNmb3JtLXJlbW92ZS1jb25zb2xlJyxcbiAgICAgICAgICAgIHsgZXhjbHVkZTogWydlcnJvcicsICd3YXJuJ10gfVxuICAgICAgICAgIF1cbiAgICAgICAgXS5maWx0ZXIoQm9vbGVhbilcbiAgICAgIH1cbiAgICB9KSxcbiAgICBcbiAgICAvLyBcbiAgICAvLyBGSVggIzM6IE9ubHkgcnVuIFByZXJlbmRlcmVyIGR1cmluZyAnYnVpbGQnLCBub3QgJ2RldicgKHNlcnZlKVxuICAgIC8vIFRoaXMgc3RvcHMgdGhlICdyZXF1aXJlIGlzIG5vdCBkZWZpbmVkJyBlcnJvciFcbiAgICAvL1xuICAgIGNvbW1hbmQgPT09ICdidWlsZCcgJiYgUHJlcmVuZGVyZXIoe1xuICAgICAgc3RhdGljRGlyOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnZGlzdCcpLFxuICAgICAgcm91dGVzOiBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdQUkVSRU5ERVI6IEZldGNoaW5nIGFsbCBkeW5hbWljIHJvdXRlcyBmcm9tIFdvcmRQcmVzcy4uLicpO1xuICAgICAgICBcbiAgICAgICAgLy8gRmV0Y2ggb25seSB0aGUgcm91dGVzIGluIHlvdXIgbGl2ZSBhcHBcbiAgICAgICAgY29uc3QgW3Bvc3RzLCBjYXRlZ29yaWVzLCB0YWdzXSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgICBmZXRjaEFsbFBhZ2luYXRlZCgnL3Bvc3RzJyksXG4gICAgICAgICAgZmV0Y2hBbGxQYWdpbmF0ZWQoJy9jYXRlZ29yaWVzJyksXG4gICAgICAgICAgZmV0Y2hBbGxQYWdpbmF0ZWQoJy90YWdzJyksXG4gICAgICAgIF0pO1xuXG4gICAgICAgIGNvbnN0IHBvc3RSb3V0ZXMgPSBwb3N0cy5tYXAocG9zdCA9PiBgL2FydGljbGVzLyR7cG9zdC5zbHVnfWApO1xuICAgICAgICBjb25zdCBjYXRlZ29yeVJvdXRlcyA9IGNhdGVnb3JpZXNcbiAgICAgICAgICAuZmlsdGVyKGNhdCA9PiBjYXQuc2x1ZyAhPT0gJ3VuY2F0ZWdvcml6ZWQnKVxuICAgICAgICAgIC5tYXAoY2F0ID0+IGAvY2F0ZWdvcnkvJHtjYXQuc2x1Z31gKTtcbiAgICAgICAgY29uc3QgdGFnUm91dGVzID0gdGFncy5tYXAodGFnID0+IGAvdGFnLyR7dGFnLnNsdWd9YCk7XG5cbiAgICAgICAgLy8gU3RhdGljIHJvdXRlcyBmcm9tIHlvdXIgQXBwLmpzeCAobm8gY2VydGlmaWNhdGlvbnMpXG4gICAgICAgIGNvbnN0IHN0YXRpY1JvdXRlcyA9IFtcbiAgICAgICAgICAnLycsXG4gICAgICAgICAgJy9hcnRpY2xlcycsXG4gICAgICAgICAgJy90YWcnLCBcbiAgICAgICAgICAnL2Fib3V0JyxcbiAgICAgICAgICAnL2NvbnRhY3QnLFxuICAgICAgICAgICcvcHJpdmFjeS1wb2xpY3knLFxuICAgICAgICAgICcvdGVybXMtb2Ytc2VydmljZScsXG4gICAgICAgICAgJy9kaXNjbGFpbWVyJyxcbiAgICAgICAgICAnL25ld3NsZXR0ZXInLFxuICAgICAgICBdO1xuXG4gICAgICAgIGNvbnN0IGFsbFJvdXRlcyA9IFtcbiAgICAgICAgICAuLi5zdGF0aWNSb3V0ZXMsXG4gICAgICAgICAgLi4ucG9zdFJvdXRlcyxcbiAgICAgICAgICAuLi5jYXRlZ29yeVJvdXRlcyxcbiAgICAgICAgICAuLi50YWdSb3V0ZXMsXG4gICAgICAgIF07XG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZyhgUFJFUkVOREVSOiBUb3RhbCByb3V0ZXMgdG8gcmVuZGVyOiAke2FsbFJvdXRlcy5sZW5ndGh9YCk7XG4gICAgICAgIHJldHVybiBhbGxSb3V0ZXM7XG4gICAgICB9LFxuXG4gICAgICByZW5kZXJlck9wdGlvbnM6IHtcbiAgICAgICAgcmVuZGVyQWZ0ZXJUaW1lOiAyNTAwLCAvLyBXYWl0IDIuNXMgZm9yIFNQQSB0byBmZXRjaCBkYXRhXG4gICAgICB9LFxuICAgIH0pXG4gICAgLy8gLS0tIEVORCBQTFVHSU4gQ09ORklHIC0tLVxuICBdLFxuICBcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxuICAgIH0sXG4gIH0sXG4gIFxuICAvLyAoVGhlIHJlc3Qgb2YgeW91ciBidWlsZCBjb25maWcgcmVtYWlucyB0aGUgc2FtZSlcbiAgYnVpbGQ6IHtcbiAgICB0YXJnZXQ6ICdlczIwMTUnLFxuICAgIG1pbmlmeTogJ3RlcnNlcicsXG4gICAgdGVyc2VyT3B0aW9uczoge1xuICAgICAgY29tcHJlc3M6IHtcbiAgICAgICAgZHJvcF9jb25zb2xlOiB0cnVlLFxuICAgICAgICBkcm9wX2RlYnVnZ2VyOiB0cnVlLFxuICAgICAgICBwdXJlX2Z1bmNzOiBbJ2NvbnNvbGUubG9nJywgJ2NvbnNvbGUuaW5mbycsICdjb25zb2xlLmRlYnVnJ10sXG4gICAgICAgIHBhc3NlczogMlxuICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rczogKGlkKSA9PiB7XG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMnKSkge1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdyZWFjdCcpIHx8IGlkLmluY2x1ZGVzKCdyZWFjdC1kb20nKSB8fCBpZC5pbmNsdWRlcygncmVhY3Qtcm91dGVyJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdyZWFjdC12ZW5kb3InO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdmcmFtZXItbW90aW9uJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdmcmFtZXItbW90aW9uJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQHJhZGl4LXVpJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICd1aS12ZW5kb3InO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdsdWNpZGUtcmVhY3QnKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ2ljb25zJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAndmVuZG9yJztcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdzcmMvY29tcG9uZW50cy8nKSkge1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdQb3N0Q2FyZCcpIHx8IGlkLmluY2x1ZGVzKCdQb3N0TGlzdEl0ZW0nKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ3Bvc3QtY29tcG9uZW50cyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0FkJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdhZHMnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXG4gICAgICAgIGNodW5rRmlsZU5hbWVzOiAnYXNzZXRzL2pzL1tuYW1lXS1baGFzaF0uanMnLFxuICAgICAgICBlbnRyeUZpbGVOYW1lczogJ2Fzc2V0cy9qcy9bbmFtZV0tW2hhc2hdLmpzJyxcbiAgICAgICAgYXNzZXRGaWxlTmFtZXM6ICdhc3NldHMvW25hbWVdLVtoYXNoXS5bZXh0XSdcbiAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogNTAwLFxuICAgIHNvdXJjZW1hcDogZmFsc2UsXG4gICAgY3NzQ29kZVNwbGl0OiB0cnVlLFxuICAgIHJlcG9ydENvbXByZXNzZWRTaXplOiB0cnVlLFxuICAgIGFzc2V0c0lubGluZUxpbWl0OiAyMDQ4XG4gIH0sXG4gIFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBpbmNsdWRlOiBbXG4gICAgICAncmVhY3QnLFxuICAgICAgJ3JlYWN0LWRvbScsXG4gICAgICAncmVhY3Qtcm91dGVyLWRvbSdcbiAgICBdLFxuICAgIGV4Y2x1ZGU6IFtcbiAgICAgICdmcmFtZXItbW90aW9uJ1xuICAgIF1cbiAgfSxcbiAgXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDMwMDAsXG4gICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgICBob3N0OiB0cnVlLFxuICAgIG9wZW46IHRydWUsXG4gICAgaG1yOiB7XG4gICAgICBvdmVybGF5OiB0cnVlXG4gICAgfVxuICB9LFxuICBcbiAgcHJldmlldzoge1xuICAgIHBvcnQ6IDQxNzMsXG4gICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgICBob3N0OiB0cnVlLFxuICAgIG9wZW46IHRydWVcbiAgfVxufSkpOyJdLAogICJtYXBwaW5ncyI6ICI7QUFDQSxTQUFTLG9CQUFvQjtBQUM3QixPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBS2pCLE9BQU8saUJBQWlCO0FBRXhCLE9BQU8sV0FBVztBQVZsQixJQUFNLG1DQUFtQztBQWF6QyxJQUFNLG9CQUFvQjtBQUUxQixJQUFNLG9CQUFvQixPQUFPLGFBQWE7QUFDNUMsTUFBSSxVQUFVLENBQUM7QUFDZixNQUFJLE9BQU87QUFDWCxNQUFJLFVBQVU7QUFDZCxRQUFNLFNBQVM7QUFFZixVQUFRLElBQUksaUNBQWlDLFFBQVEsS0FBSztBQUUxRCxTQUFPLFNBQVM7QUFDZCxRQUFJO0FBQ0YsWUFBTSxNQUFNLEdBQUcsaUJBQWlCLEdBQUcsUUFBUSxZQUFZLE1BQU0sc0JBQXNCLElBQUk7QUFDdkYsWUFBTSxXQUFXLE1BQU0sTUFBTSxHQUFHO0FBRWhDLFVBQUksQ0FBQyxTQUFTLElBQUk7QUFDaEIsWUFBSSxTQUFTLFdBQVcsS0FBSztBQUMzQixvQkFBVTtBQUNWO0FBQUEsUUFDRjtBQUNBLGdCQUFRLE1BQU0sd0JBQXdCLFNBQVMsTUFBTSxRQUFRLEdBQUcsRUFBRTtBQUNsRSxrQkFBVTtBQUNWO0FBQUEsTUFDRjtBQUVBLFlBQU0sT0FBTyxNQUFNLFNBQVMsS0FBSztBQUNqQyxVQUFJLENBQUMsTUFBTSxRQUFRLElBQUksS0FBSyxLQUFLLFdBQVcsR0FBRztBQUM3QyxrQkFBVTtBQUFBLE1BQ1osT0FBTztBQUNMLGtCQUFVLFFBQVEsT0FBTyxJQUFJO0FBQzdCO0FBQUEsTUFDRjtBQUFBLElBQ0YsU0FBUyxHQUFHO0FBQ1YsY0FBUSxNQUFNLG1CQUFtQixRQUFRLEtBQUssRUFBRSxPQUFPLEVBQUU7QUFDekQsZ0JBQVU7QUFBQSxJQUNaO0FBQUEsRUFDRjtBQUVBLFVBQVEsSUFBSSxzQkFBc0IsUUFBUSxNQUFNLGNBQWMsUUFBUSxHQUFHO0FBQ3pFLFNBQU87QUFDVDtBQU9BLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsUUFBUSxPQUFPO0FBQUEsRUFDNUMsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLE1BQ0osYUFBYTtBQUFBLE1BQ2IsWUFBWTtBQUFBLE1BQ1osT0FBTztBQUFBLFFBQ0wsU0FBUztBQUFBLFVBQ1AsUUFBUSxJQUFJLGFBQWEsZ0JBQWdCO0FBQUEsWUFDdkM7QUFBQSxZQUNBLEVBQUUsU0FBUyxDQUFDLFNBQVMsTUFBTSxFQUFFO0FBQUEsVUFDL0I7QUFBQSxRQUNGLEVBQUUsT0FBTyxPQUFPO0FBQUEsTUFDbEI7QUFBQSxJQUNGLENBQUM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBTUQsWUFBWSxXQUFXLFlBQVk7QUFBQSxNQUNqQyxXQUFXLEtBQUssUUFBUSxrQ0FBVyxNQUFNO0FBQUEsTUFDekMsUUFBUSxZQUFZO0FBQ2xCLGdCQUFRLElBQUksMERBQTBEO0FBR3RFLGNBQU0sQ0FBQyxPQUFPLFlBQVksSUFBSSxJQUFJLE1BQU0sUUFBUSxJQUFJO0FBQUEsVUFDbEQsa0JBQWtCLFFBQVE7QUFBQSxVQUMxQixrQkFBa0IsYUFBYTtBQUFBLFVBQy9CLGtCQUFrQixPQUFPO0FBQUEsUUFDM0IsQ0FBQztBQUVELGNBQU0sYUFBYSxNQUFNLElBQUksVUFBUSxhQUFhLEtBQUssSUFBSSxFQUFFO0FBQzdELGNBQU0saUJBQWlCLFdBQ3BCLE9BQU8sU0FBTyxJQUFJLFNBQVMsZUFBZSxFQUMxQyxJQUFJLFNBQU8sYUFBYSxJQUFJLElBQUksRUFBRTtBQUNyQyxjQUFNLFlBQVksS0FBSyxJQUFJLFNBQU8sUUFBUSxJQUFJLElBQUksRUFBRTtBQUdwRCxjQUFNLGVBQWU7QUFBQSxVQUNuQjtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsUUFDRjtBQUVBLGNBQU0sWUFBWTtBQUFBLFVBQ2hCLEdBQUc7QUFBQSxVQUNILEdBQUc7QUFBQSxVQUNILEdBQUc7QUFBQSxVQUNILEdBQUc7QUFBQSxRQUNMO0FBRUEsZ0JBQVEsSUFBSSxzQ0FBc0MsVUFBVSxNQUFNLEVBQUU7QUFDcEUsZUFBTztBQUFBLE1BQ1Q7QUFBQSxNQUVBLGlCQUFpQjtBQUFBLFFBQ2YsaUJBQWlCO0FBQUE7QUFBQSxNQUNuQjtBQUFBLElBQ0YsQ0FBQztBQUFBO0FBQUEsRUFFSDtBQUFBLEVBRUEsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBO0FBQUEsRUFHQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixRQUFRO0FBQUEsSUFDUixlQUFlO0FBQUEsTUFDYixVQUFVO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxlQUFlO0FBQUEsUUFDZixZQUFZLENBQUMsZUFBZSxnQkFBZ0IsZUFBZTtBQUFBLFFBQzNELFFBQVE7QUFBQSxNQUNWO0FBQUEsSUFDRjtBQUFBLElBRUEsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYyxDQUFDLE9BQU87QUFDcEIsY0FBSSxHQUFHLFNBQVMsY0FBYyxHQUFHO0FBQy9CLGdCQUFJLEdBQUcsU0FBUyxPQUFPLEtBQUssR0FBRyxTQUFTLFdBQVcsS0FBSyxHQUFHLFNBQVMsY0FBYyxHQUFHO0FBQ25GLHFCQUFPO0FBQUEsWUFDVDtBQUNBLGdCQUFJLEdBQUcsU0FBUyxlQUFlLEdBQUc7QUFDaEMscUJBQU87QUFBQSxZQUNUO0FBQ0EsZ0JBQUksR0FBRyxTQUFTLFdBQVcsR0FBRztBQUM1QixxQkFBTztBQUFBLFlBQ1Q7QUFDQSxnQkFBSSxHQUFHLFNBQVMsY0FBYyxHQUFHO0FBQy9CLHFCQUFPO0FBQUEsWUFDVDtBQUNBLG1CQUFPO0FBQUEsVUFDVDtBQUVBLGNBQUksR0FBRyxTQUFTLGlCQUFpQixHQUFHO0FBQ2xDLGdCQUFJLEdBQUcsU0FBUyxVQUFVLEtBQUssR0FBRyxTQUFTLGNBQWMsR0FBRztBQUMxRCxxQkFBTztBQUFBLFlBQ1Q7QUFDQSxnQkFBSSxHQUFHLFNBQVMsSUFBSSxHQUFHO0FBQ3JCLHFCQUFPO0FBQUEsWUFDVDtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsUUFFQSxnQkFBZ0I7QUFBQSxRQUNoQixnQkFBZ0I7QUFBQSxRQUNoQixnQkFBZ0I7QUFBQSxNQUNsQjtBQUFBLElBQ0Y7QUFBQSxJQUVBLHVCQUF1QjtBQUFBLElBQ3ZCLFdBQVc7QUFBQSxJQUNYLGNBQWM7QUFBQSxJQUNkLHNCQUFzQjtBQUFBLElBQ3RCLG1CQUFtQjtBQUFBLEVBQ3JCO0FBQUEsRUFFQSxjQUFjO0FBQUEsSUFDWixTQUFTO0FBQUEsTUFDUDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1A7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBRUEsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sWUFBWTtBQUFBLElBQ1osTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sS0FBSztBQUFBLE1BQ0gsU0FBUztBQUFBLElBQ1g7QUFBQSxFQUNGO0FBQUEsRUFFQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUEsSUFDWixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUNGLEVBQUU7IiwKICAibmFtZXMiOiBbXQp9Cg==
