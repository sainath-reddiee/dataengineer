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
    // ✅ 6. Add the prerender plugin (loaded via the fixed 'prerender' const)
    // This will only run during 'npm run build'
    process.env.NODE_ENV === "production" && prerender({
      // The path to your built app
      staticDir: path.join(__vite_injected_original_dirname, "dist"),
      // List of all routes to prerender
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
          // The new tags archive page
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
      // ✅ 7. Configure the renderer (Puppeteer)
      rendererConfig: {
        // Wait for network to be idle, ensuring API calls finish
        await: "networkidle0",
        // Inject a variable so your app knows it's being prerendered
        inject: {
          isPrerendering: true
        }
      }
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcuanNcIjsvLyB2aXRlLmNvbmZpZy5qcyAtIEZJTkFMIFBST0RVQ1RJT04gVkVSU0lPTiAoRklYRUQgSU1QT1JUKVxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbi8vIFx1MjcwNSAxLiBJbXBvcnQgJ2NyZWF0ZVJlcXVpcmUnIHRvIGxvYWQgQ0pTIG1vZHVsZXMgaW4gRVNNXG5pbXBvcnQgeyBjcmVhdGVSZXF1aXJlIH0gZnJvbSAnbW9kdWxlJztcbmNvbnN0IHJlcXVpcmUgPSBjcmVhdGVSZXF1aXJlKGltcG9ydC5tZXRhLnVybCk7XG5cbi8vIFx1MjcwNSAyLiBUSElTIElTIFRIRSBGSVg6XG4vLyBJbXBvcnQgdGhlIHBsdWdpbiB1c2luZyByZXF1aXJlLCB0aGVuIGdldCB0aGUgJ2RlZmF1bHQnIGV4cG9ydFxuLy8gaWYgaXQncyBhbiBFU00gbW9kdWxlLCBvciB1c2UgdGhlIG1vZHVsZSBkaXJlY3RseSBpZiBpdCdzIENKUy5cbmNvbnN0IHByZXJlbmRlclBsdWdpbiA9IHJlcXVpcmUoJ3ZpdGUtcGx1Z2luLXByZXJlbmRlcicpO1xuY29uc3QgcHJlcmVuZGVyID0gcHJlcmVuZGVyUGx1Z2luLmRlZmF1bHQgfHwgcHJlcmVuZGVyUGx1Z2luO1xuXG4vLyBcdTI3MDUgMy4gSW1wb3J0IG5vZGUtZmV0Y2ggZm9yIEFQSSBjYWxsc1xuaW1wb3J0IGZldGNoIGZyb20gJ25vZGUtZmV0Y2gnO1xuXG4vLyBcdTI3MDUgNC4gSGVscGVyIGZ1bmN0aW9ucyB0byBmZXRjaCBhbGwgeW91ciBkeW5hbWljIHJvdXRlcyBmcm9tIFdvcmRQcmVzc1xuY29uc3QgV09SRFBSRVNTX0FQSV9VUkwgPSAnaHR0cHM6Ly9hcHAuZGF0YWVuZ2luZWVyaHViLmJsb2cvd3AtanNvbi93cC92Mic7XG5cbmNvbnN0IGZldGNoQWxsUm91dGVzID0gYXN5bmMgKGVuZHBvaW50LCBwcmVmaXgpID0+IHtcbiAgY29uc3Qgcm91dGVzID0gW107XG4gIGxldCBwYWdlID0gMTtcbiAgbGV0IGhhc01vcmUgPSB0cnVlO1xuICBjb25zb2xlLmxvZyhgUHJlcmVuZGVyOiBGZXRjaGluZyAke2VuZHBvaW50fS4uLmApO1xuXG4gIHRyeSB7XG4gICAgd2hpbGUgKGhhc01vcmUpIHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAke1dPUkRQUkVTU19BUElfVVJMfSR7ZW5kcG9pbnR9P3Blcl9wYWdlPTEwMCZwYWdlPSR7cGFnZX0mX2ZpZWxkcz1zbHVnYCk7XG4gICAgICBpZiAoIXJlcy5vaykge1xuICAgICAgICBpZiAocmVzLnN0YXR1cyA9PT0gNDAwKSB7IC8vIEJhZCByZXF1ZXN0LCBwcm9iYWJseSBvdXQgb2YgcGFnZXNcbiAgICAgICAgICBoYXNNb3JlID0gZmFsc2U7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gZmV0Y2ggJHtlbmRwb2ludH06ICR7cmVzLnN0YXR1c1RleHR9YCk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGNvbnN0IGl0ZW1zID0gYXdhaXQgcmVzLmpzb24oKTtcblxuICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGl0ZW1zKSB8fCBpdGVtcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgaGFzTW9yZSA9IGZhbHNlO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaXRlbXMuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgICAgaWYgKGl0ZW0uc2x1Zykge1xuICAgICAgICAgIHJvdXRlcy5wdXNoKGAke3ByZWZpeH0ke2l0ZW0uc2x1Z31gKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBwYWdlKys7XG4gICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgNTApKTsgLy8gQmUgbmljZSB0byB5b3VyIEFQSVxuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIGZldGNoaW5nIHJvdXRlcyBmb3IgJHtlbmRwb2ludH06YCwgZS5tZXNzYWdlKTtcbiAgfVxuICBjb25zb2xlLmxvZyhgUHJlcmVuZGVyOiBGb3VuZCAke3JvdXRlcy5sZW5ndGh9IHJvdXRlcyBmb3IgJHtwcmVmaXh9YCk7XG4gIHJldHVybiByb3V0ZXM7XG59O1xuXG4vLyBcdTI3MDUgNS4gRGVmaW5lIHRoZSBmdWxsIGNvbmZpZ1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KHtcbiAgICAgIC8vIFx1MjcwNSBGYXN0IFJlZnJlc2ggY29uZmlndXJhdGlvblxuICAgICAgZmFzdFJlZnJlc2g6IHRydWUsXG4gICAgICBqc3hSdW50aW1lOiAnYXV0b21hdGljJyxcbiAgICAgIGJhYmVsOiB7XG4gICAgICAgIHBsdWdpbnM6IFtcbiAgICAgICAgICBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ3Byb2R1Y3Rpb24nICYmIFtcbiAgICAgICAgICAgICd0cmFuc2Zvcm0tcmVtb3ZlLWNvbnNvbGUnLFxuICAgICAgICAgICAgeyBleGNsdWRlOiBbJ2Vycm9yJywgJ3dhcm4nXSB9XG4gICAgICAgICAgXVxuICAgICAgICBdLmZpbHRlcihCb29sZWFuKVxuICAgICAgfVxuICAgIH0pLFxuICAgIFxuICAgIC8vIFx1MjcwNSA2LiBBZGQgdGhlIHByZXJlbmRlciBwbHVnaW4gKGxvYWRlZCB2aWEgdGhlIGZpeGVkICdwcmVyZW5kZXInIGNvbnN0KVxuICAgIC8vIFRoaXMgd2lsbCBvbmx5IHJ1biBkdXJpbmcgJ25wbSBydW4gYnVpbGQnXG4gICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdwcm9kdWN0aW9uJyAmJiBwcmVyZW5kZXIoe1xuICAgICAgLy8gVGhlIHBhdGggdG8geW91ciBidWlsdCBhcHBcbiAgICAgIHN0YXRpY0RpcjogcGF0aC5qb2luKF9fZGlybmFtZSwgJ2Rpc3QnKSxcblxuICAgICAgLy8gTGlzdCBvZiBhbGwgcm91dGVzIHRvIHByZXJlbmRlclxuICAgICAgcm91dGVzOiBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHN0YXRpY1JvdXRlcyA9IFtcbiAgICAgICAgICAnLycsXG4gICAgICAgICAgJy9hcnRpY2xlcycsXG4gICAgICAgICAgJy9hYm91dCcsXG4gICAgICAgICAgJy9jb250YWN0JyxcbiAgICAgICAgICAnL25ld3NsZXR0ZXInLFxuICAgICAgICAgICcvcHJpdmFjeS1wb2xpY3knLFxuICAgICAgICAgICcvdGVybXMtb2Ytc2VydmljZScsXG4gICAgICAgICAgJy9kaXNjbGFpbWVyJyxcbiAgICAgICAgICAnL3RhZycsIC8vIFRoZSBuZXcgdGFncyBhcmNoaXZlIHBhZ2VcbiAgICAgICAgXTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IHBvc3RSb3V0ZXMgPSBhd2FpdCBmZXRjaEFsbFJvdXRlcygnL3Bvc3RzJywgJy9hcnRpY2xlcy8nKTtcbiAgICAgICAgY29uc3QgY2F0ZWdvcnlSb3V0ZXMgPSBhd2FpdCBmZXRjaEFsbFJvdXRlcygnL2NhdGVnb3JpZXMnLCAnL2NhdGVnb3J5LycpO1xuICAgICAgICBjb25zdCB0YWdSb3V0ZXMgPSBhd2FpdCBmZXRjaEFsbFJvdXRlcygnL3RhZ3MnLCAnL3RhZy8nKTsgLy8gRmV0Y2ggdGFnIHBhZ2Ugcm91dGVzXG5cbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAuLi5zdGF0aWNSb3V0ZXMsXG4gICAgICAgICAgLi4ucG9zdFJvdXRlcyxcbiAgICAgICAgICAuLi5jYXRlZ29yeVJvdXRlcyxcbiAgICAgICAgICAuLi50YWdSb3V0ZXNcbiAgICAgICAgXTtcbiAgICAgIH0sXG5cbiAgICAgIC8vIFx1MjcwNSA3LiBDb25maWd1cmUgdGhlIHJlbmRlcmVyIChQdXBwZXRlZXIpXG4gICAgICByZW5kZXJlckNvbmZpZzoge1xuICAgICAgICAvLyBXYWl0IGZvciBuZXR3b3JrIHRvIGJlIGlkbGUsIGVuc3VyaW5nIEFQSSBjYWxscyBmaW5pc2hcbiAgICAgICAgYXdhaXQ6ICduZXR3b3JraWRsZTAnLCBcbiAgICAgICAgXG4gICAgICAgIC8vIEluamVjdCBhIHZhcmlhYmxlIHNvIHlvdXIgYXBwIGtub3dzIGl0J3MgYmVpbmcgcHJlcmVuZGVyZWRcbiAgICAgICAgaW5qZWN0OiB7XG4gICAgICAgICAgaXNQcmVyZW5kZXJpbmc6IHRydWVcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSksXG4gIF0sXG4gIFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXG4gICAgfSxcbiAgfSxcbiAgXG4gIGJ1aWxkOiB7XG4gICAgdGFyZ2V0OiAnZXMyMDE1JyxcbiAgICBtaW5pZnk6ICd0ZXJzZXInLFxuICAgIHRlcnNlck9wdGlvbnM6IHtcbiAgICAgIGNvbXByZXNzOiB7XG4gICAgICAgIGRyb3BfY29uc29sZTogdHJ1ZSxcbiAgICAgICAgZHJvcF9kZWJ1Z2dlcjogdHJ1ZSxcbiAgICAgICAgcHVyZV9mdW5jczogWydjb25zb2xlLmxvZycsICdjb25zb2xlLmluZm8nLCAnY29uc29sZS5kZWJ1ZyddLFxuICAgICAgICBwYXNzZXM6IDJcbiAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IChpZCkgPT4ge1xuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbm9kZV9tb2R1bGVzJykpIHtcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygncmVhY3QnKSB8fCBpZC5pbmNsdWRlcygncmVhY3QtZG9tJykgfHwgaWQuaW5jbHVkZXMoJ3JlYWN0LXJvdXRlcicpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAncmVhY3QtdmVuZG9yJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnZnJhbWVyLW1vdGlvbicpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAnZnJhbWVyLW1vdGlvbic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0ByYWRpeC11aScpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAndWktdmVuZG9yJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbHVjaWRlLXJlYWN0JykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdpY29ucyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gJ3ZlbmRvcic7XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnc3JjL2NvbXBvbmVudHMvJykpIHtcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnUG9zdENhcmQnKSB8fCBpZC5pbmNsdWRlcygnUG9zdExpc3RJdGVtJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdwb3N0LWNvbXBvbmVudHMnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdBZCcpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAnYWRzJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFxuICAgICAgICBjaHVua0ZpbGVOYW1lczogJ2Fzc2V0cy9qcy9bbmFtZV0tW2hhc2hdLmpzJyxcbiAgICAgICAgZW50cnlGaWxlTmFtZXM6ICdhc3NldHMvanMvW25hbWVdLVtoYXNoXS5qcycsXG4gICAgICAgIGFzc2V0RmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF0uW2V4dF0nXG4gICAgICB9XG4gICAgfSxcbiAgICBcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDUwMCxcbiAgICBzb3VyY2VtYXA6IGZhbHNlLFxuICAgIGNzc0NvZGVTcGxpdDogdHJ1ZSxcbiAgICByZXBvcnRDb21wcmVzc2VkU2l6ZTogdHJ1ZSxcbiAgICBhc3NldHNJbmxpbmVMaW1pdDogMjA0OFxuICB9LFxuICBcbiAgc2VydmVyOiB7XG4gICAgcG9ydDogMzAwMCxcbiAgICBzdHJpY3RQb3J0OiB0cnVlLFxuICAgIGhvc3Q6IHRydWUsXG4gICAgb3BlbjogdHJ1ZSxcbiAgICBobXI6IHtcbiAgICAgIG92ZXJsYXk6IHRydWVcbiAgICB9XG4gIH0sXG4gIFxuICBwcmV2aWV3OiB7XG4gICAgcG9ydDogNDE3MyxcbiAgICBzdHJpY3RQb3J0OiB0cnVlLFxuICAgIGhvc3Q6IHRydWUsXG4gICAgb3BlbjogdHJ1ZVxuICB9XG59KTsiXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUdqQixTQUFTLHFCQUFxQjtBQVU5QixPQUFPLFdBQVc7QUFoQmxCLElBQU0sbUNBQW1DO0FBQXlGLElBQU0sMkNBQTJDO0FBT25MLElBQU1BLFdBQVUsY0FBYyx3Q0FBZTtBQUs3QyxJQUFNLGtCQUFrQkEsU0FBUSx1QkFBdUI7QUFDdkQsSUFBTSxZQUFZLGdCQUFnQixXQUFXO0FBTTdDLElBQU0sb0JBQW9CO0FBRTFCLElBQU0saUJBQWlCLE9BQU8sVUFBVSxXQUFXO0FBQ2pELFFBQU0sU0FBUyxDQUFDO0FBQ2hCLE1BQUksT0FBTztBQUNY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
