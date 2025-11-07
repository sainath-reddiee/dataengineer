// vite.config.js
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
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
var vite_config_default = defineConfig(async ({ command }) => {
  const plugins = [
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
    })
  ];
  if (command === "build") {
    const { default: Prerenderer } = await import("file:///home/project/node_modules/vite-plugin-prerender/dist/index.mjs");
    plugins.push(
      Prerenderer({
        staticDir: path.resolve(process.cwd(), "dist"),
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
    );
  }
  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(process.cwd(), "./src")
      }
    },
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
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcuanNcIjsvLyB2aXRlLmNvbmZpZy5qcyAtIEZJWEVEOiBDb25kaXRpb25hbCBwbHVnaW4gbG9hZGluZ1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbi8vIC0tLSBQUkVSRU5ERVJJTkcgQ09ORklHIC0tLVxuY29uc3QgV09SRFBSRVNTX0FQSV9VUkwgPSAnaHR0cHM6Ly9hcHAuZGF0YWVuZ2luZWVyaHViLmJsb2cvd3AtanNvbi93cC92Mic7XG5cbmNvbnN0IGZldGNoQWxsUGFnaW5hdGVkID0gYXN5bmMgKGVuZHBvaW50KSA9PiB7XG4gIGxldCByZXN1bHRzID0gW107XG4gIGxldCBwYWdlID0gMTtcbiAgbGV0IGhhc01vcmUgPSB0cnVlO1xuICBjb25zdCBmaWVsZHMgPSAnc2x1Zyc7IFxuXG4gIGNvbnNvbGUubG9nKGBQUkVSRU5ERVI6IFN0YXJ0aW5nIGZldGNoIGZvciAke2VuZHBvaW50fS4uLmApO1xuXG4gIHdoaWxlIChoYXNNb3JlKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHVybCA9IGAke1dPUkRQUkVTU19BUElfVVJMfSR7ZW5kcG9pbnR9P19maWVsZHM9JHtmaWVsZHN9JnBlcl9wYWdlPTEwMCZwYWdlPSR7cGFnZX1gO1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwpO1xuXG4gICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQwMCkgeyAvLyA0MDAgbWVhbnMgbm8gbW9yZSBwYWdlc1xuICAgICAgICAgIGhhc01vcmUgPSBmYWxzZTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmVycm9yKGBXb3JkUHJlc3MgQVBJIEVycm9yOiAke3Jlc3BvbnNlLnN0YXR1c30gZm9yICR7dXJsfWApO1xuICAgICAgICBoYXNNb3JlID0gZmFsc2U7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgXG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGRhdGEpIHx8IGRhdGEubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGhhc01vcmUgPSBmYWxzZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmNvbmNhdChkYXRhKTtcbiAgICAgICAgcGFnZSsrO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYEZldGNoIEVycm9yIGZvciAke2VuZHBvaW50fTogJHtlLm1lc3NhZ2V9YCk7XG4gICAgICBoYXNNb3JlID0gZmFsc2U7XG4gICAgfVxuICB9XG4gIFxuICBjb25zb2xlLmxvZyhgUFJFUkVOREVSOiBGZXRjaGVkICR7cmVzdWx0cy5sZW5ndGh9IGl0ZW1zIGZvciAke2VuZHBvaW50fS5gKTtcbiAgcmV0dXJuIHJlc3VsdHM7XG59O1xuLy8gLS0tIEVORCBQUkVSRU5ERVJJTkcgQ09ORklHIC0tLVxuXG4vLyBGSVg6IFVzZSBhc3luYyBmdW5jdGlvbiB0byBjb25kaXRpb25hbGx5IGxvYWQgdGhlIHByZXJlbmRlciBwbHVnaW5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyhhc3luYyAoeyBjb21tYW5kIH0pID0+IHtcbiAgY29uc3QgcGx1Z2lucyA9IFtcbiAgICByZWFjdCh7XG4gICAgICBmYXN0UmVmcmVzaDogdHJ1ZSxcbiAgICAgIGpzeFJ1bnRpbWU6ICdhdXRvbWF0aWMnLFxuICAgICAgYmFiZWw6IHtcbiAgICAgICAgcGx1Z2luczogW1xuICAgICAgICAgIHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAncHJvZHVjdGlvbicgJiYgW1xuICAgICAgICAgICAgJ3RyYW5zZm9ybS1yZW1vdmUtY29uc29sZScsXG4gICAgICAgICAgICB7IGV4Y2x1ZGU6IFsnZXJyb3InLCAnd2FybiddIH1cbiAgICAgICAgICBdXG4gICAgICAgIF0uZmlsdGVyKEJvb2xlYW4pXG4gICAgICB9XG4gICAgfSlcbiAgXTtcblxuICAvLyBPbmx5IGltcG9ydCBhbmQgdXNlIFByZXJlbmRlcmVyIGR1cmluZyBidWlsZFxuICBpZiAoY29tbWFuZCA9PT0gJ2J1aWxkJykge1xuICAgIGNvbnN0IHsgZGVmYXVsdDogUHJlcmVuZGVyZXIgfSA9IGF3YWl0IGltcG9ydCgndml0ZS1wbHVnaW4tcHJlcmVuZGVyJyk7XG4gICAgXG4gICAgcGx1Z2lucy5wdXNoKFxuICAgICAgUHJlcmVuZGVyZXIoe1xuICAgICAgICBzdGF0aWNEaXI6IHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCAnZGlzdCcpLFxuICAgICAgICByb3V0ZXM6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnUFJFUkVOREVSOiBGZXRjaGluZyBhbGwgZHluYW1pYyByb3V0ZXMgZnJvbSBXb3JkUHJlc3MuLi4nKTtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBGZXRjaCBvbmx5IHRoZSByb3V0ZXMgaW4geW91ciBsaXZlIGFwcFxuICAgICAgICAgIGNvbnN0IFtwb3N0cywgY2F0ZWdvcmllcywgdGFnc10gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICBmZXRjaEFsbFBhZ2luYXRlZCgnL3Bvc3RzJyksXG4gICAgICAgICAgICBmZXRjaEFsbFBhZ2luYXRlZCgnL2NhdGVnb3JpZXMnKSxcbiAgICAgICAgICAgIGZldGNoQWxsUGFnaW5hdGVkKCcvdGFncycpLFxuICAgICAgICAgIF0pO1xuXG4gICAgICAgICAgY29uc3QgcG9zdFJvdXRlcyA9IHBvc3RzLm1hcChwb3N0ID0+IGAvYXJ0aWNsZXMvJHtwb3N0LnNsdWd9YCk7XG4gICAgICAgICAgY29uc3QgY2F0ZWdvcnlSb3V0ZXMgPSBjYXRlZ29yaWVzXG4gICAgICAgICAgICAuZmlsdGVyKGNhdCA9PiBjYXQuc2x1ZyAhPT0gJ3VuY2F0ZWdvcml6ZWQnKVxuICAgICAgICAgICAgLm1hcChjYXQgPT4gYC9jYXRlZ29yeS8ke2NhdC5zbHVnfWApO1xuICAgICAgICAgIGNvbnN0IHRhZ1JvdXRlcyA9IHRhZ3MubWFwKHRhZyA9PiBgL3RhZy8ke3RhZy5zbHVnfWApO1xuXG4gICAgICAgICAgLy8gU3RhdGljIHJvdXRlcyBmcm9tIHlvdXIgQXBwLmpzeFxuICAgICAgICAgIGNvbnN0IHN0YXRpY1JvdXRlcyA9IFtcbiAgICAgICAgICAgICcvJyxcbiAgICAgICAgICAgICcvYXJ0aWNsZXMnLFxuICAgICAgICAgICAgJy90YWcnLCBcbiAgICAgICAgICAgICcvYWJvdXQnLFxuICAgICAgICAgICAgJy9jb250YWN0JyxcbiAgICAgICAgICAgICcvcHJpdmFjeS1wb2xpY3knLFxuICAgICAgICAgICAgJy90ZXJtcy1vZi1zZXJ2aWNlJyxcbiAgICAgICAgICAgICcvZGlzY2xhaW1lcicsXG4gICAgICAgICAgICAnL25ld3NsZXR0ZXInLFxuICAgICAgICAgIF07XG5cbiAgICAgICAgICBjb25zdCBhbGxSb3V0ZXMgPSBbXG4gICAgICAgICAgICAuLi5zdGF0aWNSb3V0ZXMsXG4gICAgICAgICAgICAuLi5wb3N0Um91dGVzLFxuICAgICAgICAgICAgLi4uY2F0ZWdvcnlSb3V0ZXMsXG4gICAgICAgICAgICAuLi50YWdSb3V0ZXMsXG4gICAgICAgICAgXTtcbiAgICAgICAgICBcbiAgICAgICAgICBjb25zb2xlLmxvZyhgUFJFUkVOREVSOiBUb3RhbCByb3V0ZXMgdG8gcmVuZGVyOiAke2FsbFJvdXRlcy5sZW5ndGh9YCk7XG4gICAgICAgICAgcmV0dXJuIGFsbFJvdXRlcztcbiAgICAgICAgfSxcblxuICAgICAgICByZW5kZXJlck9wdGlvbnM6IHtcbiAgICAgICAgICByZW5kZXJBZnRlclRpbWU6IDI1MDAsIC8vIFdhaXQgMi41cyBmb3IgU1BBIHRvIGZldGNoIGRhdGFcbiAgICAgICAgfSxcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgcGx1Z2lucyxcbiAgICBcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICAnQCc6IHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCAnLi9zcmMnKSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBcbiAgICBidWlsZDoge1xuICAgICAgdGFyZ2V0OiAnZXMyMDE1JyxcbiAgICAgIG1pbmlmeTogJ3RlcnNlcicsXG4gICAgICB0ZXJzZXJPcHRpb25zOiB7XG4gICAgICAgIGNvbXByZXNzOiB7XG4gICAgICAgICAgZHJvcF9jb25zb2xlOiB0cnVlLFxuICAgICAgICAgIGRyb3BfZGVidWdnZXI6IHRydWUsXG4gICAgICAgICAgcHVyZV9mdW5jczogWydjb25zb2xlLmxvZycsICdjb25zb2xlLmluZm8nLCAnY29uc29sZS5kZWJ1ZyddLFxuICAgICAgICAgIHBhc3NlczogMlxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXG4gICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgIG91dHB1dDoge1xuICAgICAgICAgIG1hbnVhbENodW5rczogKGlkKSA9PiB7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcycpKSB7XG4gICAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygncmVhY3QnKSB8fCBpZC5pbmNsdWRlcygncmVhY3QtZG9tJykgfHwgaWQuaW5jbHVkZXMoJ3JlYWN0LXJvdXRlcicpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICdyZWFjdC12ZW5kb3InO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnZnJhbWVyLW1vdGlvbicpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICdmcmFtZXItbW90aW9uJztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0ByYWRpeC11aScpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICd1aS12ZW5kb3InO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbHVjaWRlLXJlYWN0JykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ2ljb25zJztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gJ3ZlbmRvcic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnc3JjL2NvbXBvbmVudHMvJykpIHtcbiAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdQb3N0Q2FyZCcpIHx8IGlkLmluY2x1ZGVzKCdQb3N0TGlzdEl0ZW0nKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAncG9zdC1jb21wb25lbnRzJztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0FkJykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ2Fkcyc7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIFxuICAgICAgICAgIGNodW5rRmlsZU5hbWVzOiAnYXNzZXRzL2pzL1tuYW1lXS1baGFzaF0uanMnLFxuICAgICAgICAgIGVudHJ5RmlsZU5hbWVzOiAnYXNzZXRzL2pzL1tuYW1lXS1baGFzaF0uanMnLFxuICAgICAgICAgIGFzc2V0RmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF0uW2V4dF0nXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBcbiAgICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogNTAwLFxuICAgICAgc291cmNlbWFwOiBmYWxzZSxcbiAgICAgIGNzc0NvZGVTcGxpdDogdHJ1ZSxcbiAgICAgIHJlcG9ydENvbXByZXNzZWRTaXplOiB0cnVlLFxuICAgICAgYXNzZXRzSW5saW5lTGltaXQ6IDIwNDhcbiAgICB9LFxuICAgIFxuICAgIG9wdGltaXplRGVwczoge1xuICAgICAgaW5jbHVkZTogW1xuICAgICAgICAncmVhY3QnLFxuICAgICAgICAncmVhY3QtZG9tJyxcbiAgICAgICAgJ3JlYWN0LXJvdXRlci1kb20nXG4gICAgICBdLFxuICAgICAgZXhjbHVkZTogW1xuICAgICAgICAnZnJhbWVyLW1vdGlvbidcbiAgICAgIF1cbiAgICB9LFxuICAgIFxuICAgIHNlcnZlcjoge1xuICAgICAgcG9ydDogMzAwMCxcbiAgICAgIHN0cmljdFBvcnQ6IHRydWUsXG4gICAgICBob3N0OiB0cnVlLFxuICAgICAgb3BlbjogdHJ1ZSxcbiAgICAgIGhtcjoge1xuICAgICAgICBvdmVybGF5OiB0cnVlXG4gICAgICB9XG4gICAgfSxcbiAgICBcbiAgICBwcmV2aWV3OiB7XG4gICAgICBwb3J0OiA0MTczLFxuICAgICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgICAgIGhvc3Q6IHRydWUsXG4gICAgICBvcGVuOiB0cnVlXG4gICAgfVxuICB9O1xufSk7Il0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFHakIsSUFBTSxvQkFBb0I7QUFFMUIsSUFBTSxvQkFBb0IsT0FBTyxhQUFhO0FBQzVDLE1BQUksVUFBVSxDQUFDO0FBQ2YsTUFBSSxPQUFPO0FBQ1gsTUFBSSxVQUFVO0FBQ2QsUUFBTSxTQUFTO0FB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
