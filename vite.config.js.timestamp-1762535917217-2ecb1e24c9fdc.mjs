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
var JSDOMRenderer = require2("@prerenderer/renderer-jsdom");
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
      // Tell the Prerenderer to use the JSDOM renderer, NOT Puppeteer.
      // This avoids the Chromium download error.
      renderer: new JSDOMRenderer({
        // Wait for 2000ms (2 seconds) for API calls to resolve.
        // Adjust this if your pages load slower.
        renderAfterTime: 2e3
      })
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcuanNcIjsvLyB2aXRlLmNvbmZpZy5qcyAtIEZJTkFMIFBST0RVQ1RJT04gVkVSU0lPTiAodXNpbmcgSlNET00gcmVuZGVyZXIpXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuLy8gXHUyNzA1IDEuIEltcG9ydCAnY3JlYXRlUmVxdWlyZScgdG8gbG9hZCBDSlMgbW9kdWxlcyBpbiBFU01cbmltcG9ydCB7IGNyZWF0ZVJlcXVpcmUgfSBmcm9tICdtb2R1bGUnO1xuY29uc3QgcmVxdWlyZSA9IGNyZWF0ZVJlcXVpcmUoaW1wb3J0Lm1ldGEudXJsKTtcblxuLy8gXHUyNzA1IDIuIEltcG9ydCB0aGUgQ0pTIHBsdWdpbiBBTkQgdGhlIEpTRE9NIHJlbmRlcmVyXG5jb25zdCBwcmVyZW5kZXJQbHVnaW4gPSByZXF1aXJlKCd2aXRlLXBsdWdpbi1wcmVyZW5kZXInKTtcbmNvbnN0IHByZXJlbmRlciA9IHByZXJlbmRlclBsdWdpbi5kZWZhdWx0IHx8IHByZXJlbmRlclBsdWdpbjtcbmNvbnN0IEpTRE9NUmVuZGVyZXIgPSByZXF1aXJlKCdAcHJlcmVuZGVyZXIvcmVuZGVyZXItanNkb20nKTtcblxuLy8gXHUyNzA1IDMuIEltcG9ydCBub2RlLWZldGNoIGZvciBBUEkgY2FsbHNcbmltcG9ydCBmZXRjaCBmcm9tICdub2RlLWZldGNoJztcblxuLy8gXHUyNzA1IDQuIEhlbHBlciBmdW5jdGlvbnMgdG8gZmV0Y2ggYWxsIHlvdXIgZHluYW1pYyByb3V0ZXMgZnJvbSBXb3JkUHJlc3NcbmNvbnN0IFdPUkRQUkVTU19BUElfVVJMID0gJ2h0dHBzOi8vYXBwLmRhdGFlbmdpbmVlcmh1Yi5ibG9nL3dwLWpzb24vd3AvdjInO1xuXG5jb25zdCBmZXRjaEFsbFJvdXRlcyA9IGFzeW5jIChlbmRwb2ludCwgcHJlZml4KSA9PiB7XG4gIGNvbnN0IHJvdXRlcyA9IFtdO1xuICBsZXQgcGFnZSA9IDE7XG4gIGxldCBoYXNNb3JlID0gdHJ1ZTtcbiAgY29uc29sZS5sb2coYFByZXJlbmRlcjogRmV0Y2hpbmcgJHtlbmRwb2ludH0uLi5gKTtcblxuICB0cnkge1xuICAgIHdoaWxlIChoYXNNb3JlKSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgJHtXT1JEUFJFU1NfQVBJX1VSTH0ke2VuZHBvaW50fT9wZXJfcGFnZT0xMDAmcGFnZT0ke3BhZ2V9Jl9maWVsZHM9c2x1Z2ApO1xuICAgICAgaWYgKCFyZXMub2spIHtcbiAgICAgICAgaWYgKHJlcy5zdGF0dXMgPT09IDQwMCkgeyAvLyBCYWQgcmVxdWVzdCwgcHJvYmFibHkgb3V0IG9mIHBhZ2VzXG4gICAgICAgICAgaGFzTW9yZSA9IGZhbHNlO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIGZldGNoICR7ZW5kcG9pbnR9OiAke3Jlcy5zdGF0dXNUZXh0fWApO1xuICAgICAgfVxuICAgICAgXG4gICAgICBjb25zdCBpdGVtcyA9IGF3YWl0IHJlcy5qc29uKCk7XG5cbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShpdGVtcykgfHwgaXRlbXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGhhc01vcmUgPSBmYWxzZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGl0ZW1zLmZvckVhY2goaXRlbSA9PiB7XG4gICAgICAgIGlmIChpdGVtLnNsdWcpIHtcbiAgICAgICAgICByb3V0ZXMucHVzaChgJHtwcmVmaXh9JHtpdGVtLnNsdWd9YCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcGFnZSsrO1xuICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDUwKSk7IC8vIEJlIG5pY2UgdG8geW91ciBBUElcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBjb25zb2xlLmVycm9yKGBFcnJvciBmZXRjaGluZyByb3V0ZXMgZm9yICR7ZW5kcG9pbnR9OmAsIGUubWVzc2FnZSk7XG4gIH1cbiAgY29uc29sZS5sb2coYFByZXJlbmRlcjogRm91bmQgJHtyb3V0ZXMubGVuZ3RofSByb3V0ZXMgZm9yICR7cHJlZml4fWApO1xuICByZXR1cm4gcm91dGVzO1xufTtcblxuLy8gXHUyNzA1IDUuIERlZmluZSB0aGUgZnVsbCBjb25maWdcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCh7XG4gICAgICAvLyBcdTI3MDUgRmFzdCBSZWZyZXNoIGNvbmZpZ3VyYXRpb25cbiAgICAgIGZhc3RSZWZyZXNoOiB0cnVlLFxuICAgICAganN4UnVudGltZTogJ2F1dG9tYXRpYycsXG4gICAgICBiYWJlbDoge1xuICAgICAgICBwbHVnaW5zOiBbXG4gICAgICAgICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdwcm9kdWN0aW9uJyAmJiBbXG4gICAgICAgICAgICAndHJhbnNmb3JtLXJlbW92ZS1jb25zb2xlJyxcbiAgICAgICAgICAgIHsgZXhjbHVkZTogWydlcnJvcicsICd3YXJuJ10gfVxuICAgICAgICAgIF1cbiAgICAgICAgXS5maWx0ZXIoQm9vbGVhbilcbiAgICAgIH1cbiAgICB9KSxcbiAgICBcbiAgICAvLyBcdTI3MDUgNi4gQWRkIHRoZSBwcmVyZW5kZXIgcGx1Z2luXG4gICAgLy8gVGhpcyB3aWxsIG9ubHkgcnVuIGR1cmluZyAnbnBtIHJ1biBidWlsZCdcbiAgICBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ3Byb2R1Y3Rpb24nICYmIHByZXJlbmRlcih7XG4gICAgICBzdGF0aWNEaXI6IHBhdGguam9pbihfX2Rpcm5hbWUsICdkaXN0JyksXG5cbiAgICAgIHJvdXRlczogYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBzdGF0aWNSb3V0ZXMgPSBbXG4gICAgICAgICAgJy8nLFxuICAgICAgICAgICcvYXJ0aWNsZXMnLFxuICAgICAgICAgICcvYWJvdXQnLFxuICAgICAgICAgICcvY29udGFjdCcsXG4gICAgICAgICAgJy9uZXdzbGV0dGVyJyxcbiAgICAgICAgICAnL3ByaXZhY3ktcG9saWN5JyxcbiAgICAgICAgICAnL3Rlcm1zLW9mLXNlcnZpY2UnLFxuICAgICAgICAgICcvZGlzY2xhaW1lcicsXG4gICAgICAgICAgJy90YWcnLFxuICAgICAgICBdO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgcG9zdFJvdXRlcyA9IGF3YWl0IGZldGNoQWxsUm91dGVzKCcvcG9zdHMnLCAnL2FydGljbGVzLycpO1xuICAgICAgICBjb25zdCBjYXRlZ29yeVJvdXRlcyA9IGF3YWl0IGZldGNoQWxsUm91dGVzKCcvY2F0ZWdvcmllcycsICcvY2F0ZWdvcnkvJyk7XG4gICAgICAgIGNvbnN0IHRhZ1JvdXRlcyA9IGF3YWl0IGZldGNoQWxsUm91dGVzKCcvdGFncycsICcvdGFnLycpO1xuXG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgLi4uc3RhdGljUm91dGVzLFxuICAgICAgICAgIC4uLnBvc3RSb3V0ZXMsXG4gICAgICAgICAgLi4uY2F0ZWdvcnlSb3V0ZXMsXG4gICAgICAgICAgLi4udGFnUm91dGVzXG4gICAgICAgIF07XG4gICAgICB9LFxuXG4gICAgICAvLyBcdTI3MDUgNy4gVEhJUyBJUyBUSEUgRklYOlxuICAgICAgLy8gVGVsbCB0aGUgUHJlcmVuZGVyZXIgdG8gdXNlIHRoZSBKU0RPTSByZW5kZXJlciwgTk9UIFB1cHBldGVlci5cbiAgICAgIC8vIFRoaXMgYXZvaWRzIHRoZSBDaHJvbWl1bSBkb3dubG9hZCBlcnJvci5cbiAgICAgIHJlbmRlcmVyOiBuZXcgSlNET01SZW5kZXJlcih7XG4gICAgICAgIC8vIFdhaXQgZm9yIDIwMDBtcyAoMiBzZWNvbmRzKSBmb3IgQVBJIGNhbGxzIHRvIHJlc29sdmUuXG4gICAgICAgIC8vIEFkanVzdCB0aGlzIGlmIHlvdXIgcGFnZXMgbG9hZCBzbG93ZXIuXG4gICAgICAgIHJlbmRlckFmdGVyVGltZTogMjAwMCxcbiAgICAgIH0pXG4gICAgfSksXG4gIF0sXG4gIFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXG4gICAgfSxcbiAgfSxcbiAgXG4gIGJ1aWxkOiB7XG4gICAgdGFyZ2V0OiAnZXMyMDE1JyxcbiAgICBtaW5pZnk6ICd0ZXJzZXInLFxuICAgIHRlcnNlck9wdGlvbnM6IHtcbiAgICAgIGNvbXByZXNzOiB7XG4gICAgICAgIGRyb3BfY29uc29sZTogdHJ1ZSxcbiAgICAgICAgZHJvcF9kZWJ1Z2dlcjogdHJ1ZSxcbiAgICAgICAgcHVyZV9mdW5jczogWydjb25zb2xlLmxvZycsICdjb25zb2xlLmluZm8nLCAnY29uc29sZS5kZWJ1ZyddLFxuICAgICAgICBwYXNzZXM6IDJcbiAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IChpZCkgPT4ge1xuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbm9kZV9tb2R1bGVzJykpIHtcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygncmVhY3QnKSB8fCBpZC5pbmNsdWRlcygncmVhY3QtZG9tJykgfHwgaWQuaW5jbHVkZXMoJ3JlYWN0LXJvdXRlcicpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAncmVhY3QtdmVuZG9yJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnZnJhbWVyLW1vdGlvbicpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAnZnJhbWVyLW1vdGlvbic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0ByYWRpeC11aScpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAndWktdmVuZG9yJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbHVjaWRlLXJlYWN0JykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdpY29ucyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gJ3ZlbmRvcic7XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnc3JjL2NvbXBvbmVudHMvJykpIHtcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnUG9zdENhcmQnKSB8fCBpZC5pbmNsdWRlcygnUG9zdExpc3RJdGVtJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdwb3N0LWNvbXBvbmVudHMnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdBZCcpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAnYWRzJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFxuICAgICAgICBjaHVua0ZpbGVOYW1lczogJ2Fzc2V0cy9qcy9bbmFtZV0tW2hhc2hdLmpzJyxcbiAgICAgICAgZW50cnlGaWxlTmFtZXM6ICdhc3NldHMvanMvW25hbWVdLVtoYXNoXS5qcycsXG4gICAgICAgIGFzc2V0RmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF0uW2V4dF0nXG4gICAgICB9XG4gICAgfSxcbiAgICBcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDUwMCxcbiAgICBzb3VyY2VtYXA6IGZhbHNlLFxuICAgIGNzc0NvZGVTcGxpdDogdHJ1ZSxcbiAgICByZXBvcnRDb21wcmVzc2VkU2l6ZTogdHJ1ZSxcbiAgICBhc3NldHNJbmxpbmVMaW1pdDogMjA0OFxuICB9LFxuICBcbiAgc2VydmVyOiB7XG4gICAgcG9ydDogMzAwMCxcbiAgICBzdHJpY3RQb3J0OiB0cnVlLFxuICAgIGhvc3Q6IHRydWUsXG4gICAgb3BlbjogdHJ1ZSxcbiAgICBobXI6IHtcbiAgICAgIG92ZXJsYXk6IHRydWVcbiAgICB9XG4gIH0sXG4gIFxuICBwcmV2aWV3OiB7XG4gICAgcG9ydDogNDE3MyxcbiAgICBzdHJpY3RQb3J0OiB0cnVlLFxuICAgIGhvc3Q6IHRydWUsXG4gICAgb3BlbjogdHJ1ZVxuICB9XG59KTsiXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUdqQixTQUFTLHFCQUFxQjtBQVM5QixPQUFPLFdBQVc7QUFmbEIsSUFBTSxtQ0FBbUM7QUFBeUYsSUFBTSwyQ0FBMkM7QUFPbkwsSUFBTUEsV0FBVSxjQUFjLHdDQUFlO0FBRzdDLElBQU0sa0JBQWtCQSxTQUFRLHVCQUF1QjtBQUN2RCxJQUFNLFlBQVksZ0JBQWdCLFdBQVc7QUFDN0MsSUFBTSxnQkFBZ0JBLFNBQVEsNkJBQTZCO0FBTTNELElBQU0sb0JBQW9CO0FBRTFCLElBQU0saUJBQWlCLE9BQU8sVUFBVSxXQUFXO0FBQ2pELFFBQU0sU0FBUyxDQUFDO0FBQ2hCLE1BQUksT0FBTztBQUNYLE1BQUksVUFBVTtBQUNkLFVBQVEsSUFBSSx1QkFBdUIsUUFBUSxLQUFLO0FBRWhELE1BQUk7QUFDRixXQUFPLFNBQVM7QUFDZCxZQUFNLE1BQU0sTUFBTSxNQUFNLEdBQUcsaUJBQWlCLEdBQUcsUUFBUSxzQkFBc0IsSUFBSSxlQUFlO0FBQ2hHLFVBQUksQ0FBQyxJQUFJLElB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
