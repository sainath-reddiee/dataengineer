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
    })
    // ❌ DISABLED: Prerendering was failing - using static SEO content in index.html instead
    // Re-enable after fixing Chrome/Puppeteer issues
  ].filter(Boolean),
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGNyZWF0ZVJlcXVpcmUgfSBmcm9tICdtb2R1bGUnO1xuaW1wb3J0IGZldGNoIGZyb20gJ25vZGUtZmV0Y2gnO1xuaW1wb3J0IHsgZXhlY1N5bmMgfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcblxuY29uc3QgcmVxdWlyZSA9IGNyZWF0ZVJlcXVpcmUoaW1wb3J0Lm1ldGEudXJsKTtcbmNvbnN0IHByZXJlbmRlclBsdWdpbiA9IHJlcXVpcmUoJ3ZpdGUtcGx1Z2luLXByZXJlbmRlcicpO1xuY29uc3QgcHJlcmVuZGVyID0gcHJlcmVuZGVyUGx1Z2luLmRlZmF1bHQgfHwgcHJlcmVuZGVyUGx1Z2luO1xuY29uc3QgUHVwcGV0ZWVyUmVuZGVyZXIgPSByZXF1aXJlKCdAcHJlcmVuZGVyZXIvcmVuZGVyZXItcHVwcGV0ZWVyJyk7XG5cbmNvbnN0IFdPUkRQUkVTU19BUElfVVJMID0gJ2h0dHBzOi8vYXBwLmRhdGFlbmdpbmVlcmh1Yi5ibG9nL3dwLWpzb24vd3AvdjInO1xuXG4vLyBGaW5kIENocm9tZSBleGVjdXRhYmxlIGR5bmFtaWNhbGx5XG5mdW5jdGlvbiBmaW5kQ2hyb21lKCkge1xuICBjb25zdCBwb3NzaWJsZVBhdGhzID0gW1xuICAgICcvdXNyL2Jpbi9nb29nbGUtY2hyb21lJyxcbiAgICAnL3Vzci9iaW4vY2hyb21pdW0tYnJvd3NlcicsXG4gICAgJy91c3IvYmluL2Nocm9taXVtJyxcbiAgICAnL0FwcGxpY2F0aW9ucy9Hb29nbGUgQ2hyb21lLmFwcC9Db250ZW50cy9NYWNPUy9Hb29nbGUgQ2hyb21lJyxcbiAgICAnQzpcXFxcUHJvZ3JhbSBGaWxlc1xcXFxHb29nbGVcXFxcQ2hyb21lXFxcXEFwcGxpY2F0aW9uXFxcXGNocm9tZS5leGUnLFxuICAgICdDOlxcXFxQcm9ncmFtIEZpbGVzICh4ODYpXFxcXEdvb2dsZVxcXFxDaHJvbWVcXFxcQXBwbGljYXRpb25cXFxcY2hyb21lLmV4ZSdcbiAgXTtcbiAgXG4gIC8vIFRyeSB0byBmaW5kIHVzaW5nICd3aGljaCcgY29tbWFuZFxuICB0cnkge1xuICAgIGNvbnN0IGNocm9tZVBhdGggPSBleGVjU3luYygnd2hpY2ggZ29vZ2xlLWNocm9tZSB8fCB3aGljaCBjaHJvbWl1bSB8fCB3aGljaCBjaHJvbWl1bS1icm93c2VyJywgXG4gICAgICB7IGVuY29kaW5nOiAndXRmOCcgfSkudHJpbSgpO1xuICAgIGlmIChjaHJvbWVQYXRoKSByZXR1cm4gY2hyb21lUGF0aDtcbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIENvbnRpbnVlIHRvIGNoZWNrIHByZWRlZmluZWQgcGF0aHNcbiAgfVxuICBcbiAgLy8gQ2hlY2sgcHJlZGVmaW5lZCBwYXRoc1xuICBjb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG4gIGZvciAoY29uc3QgY2hyb21lUGF0aCBvZiBwb3NzaWJsZVBhdGhzKSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChmcy5leGlzdHNTeW5jKGNocm9tZVBhdGgpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBcdTI3MDUgRm91bmQgQ2hyb21lIGF0OiAke2Nocm9tZVBhdGh9YCk7XG4gICAgICAgIHJldHVybiBjaHJvbWVQYXRoO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgfVxuICBcbiAgY29uc29sZS53YXJuKCdcdTI2QTBcdUZFMEYgIENocm9tZSBub3QgZm91bmQsIHByZXJlbmRlcmluZyBtYXkgZmFpbCcpO1xuICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG5jb25zdCBmZXRjaEFsbFJvdXRlcyA9IGFzeW5jIChlbmRwb2ludCwgcHJlZml4KSA9PiB7XG4gIGNvbnN0IHJvdXRlcyA9IFtdO1xuICBsZXQgcGFnZSA9IDE7XG4gIGxldCBoYXNNb3JlID0gdHJ1ZTtcbiAgY29uc29sZS5sb2coYFByZXJlbmRlcjogRmV0Y2hpbmcgJHtlbmRwb2ludH0uLi5gKTtcblxuICB0cnkge1xuICAgIHdoaWxlIChoYXNNb3JlKSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgJHtXT1JEUFJFU1NfQVBJX1VSTH0ke2VuZHBvaW50fT9wZXJfcGFnZT0xMDAmcGFnZT0ke3BhZ2V9Jl9maWVsZHM9c2x1Z2ApO1xuICAgICAgaWYgKCFyZXMub2spIHtcbiAgICAgICAgaWYgKHJlcy5zdGF0dXMgPT09IDQwMCkge1xuICAgICAgICAgIGhhc01vcmUgPSBmYWxzZTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBmZXRjaCAke2VuZHBvaW50fTogJHtyZXMuc3RhdHVzVGV4dH1gKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgY29uc3QgaXRlbXMgPSBhd2FpdCByZXMuanNvbigpO1xuXG4gICAgICBpZiAoIUFycmF5LmlzQXJyYXkoaXRlbXMpIHx8IGl0ZW1zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBoYXNNb3JlID0gZmFsc2U7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpdGVtcy5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgICAgICBpZiAoaXRlbS5zbHVnKSB7XG4gICAgICAgICAgcm91dGVzLnB1c2goYCR7cHJlZml4fSR7aXRlbS5zbHVnfWApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHBhZ2UrKztcbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCAxMDApKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBjb25zb2xlLmVycm9yKGBFcnJvciBmZXRjaGluZyByb3V0ZXMgZm9yICR7ZW5kcG9pbnR9OmAsIGUubWVzc2FnZSk7XG4gIH1cbiAgY29uc29sZS5sb2coYFByZXJlbmRlcjogRm91bmQgJHtyb3V0ZXMubGVuZ3RofSByb3V0ZXMgZm9yICR7cHJlZml4fWApO1xuICByZXR1cm4gcm91dGVzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KHtcbiAgICAgIGZhc3RSZWZyZXNoOiB0cnVlLFxuICAgICAganN4UnVudGltZTogJ2F1dG9tYXRpYycsXG4gICAgICBiYWJlbDoge1xuICAgICAgICBwbHVnaW5zOiBbXG4gICAgICAgICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdwcm9kdWN0aW9uJyAmJiBbXG4gICAgICAgICAgICAndHJhbnNmb3JtLXJlbW92ZS1jb25zb2xlJyxcbiAgICAgICAgICAgIHsgZXhjbHVkZTogWydlcnJvcicsICd3YXJuJ10gfVxuICAgICAgICAgIF1cbiAgICAgICAgXS5maWx0ZXIoQm9vbGVhbilcbiAgICAgIH1cbiAgICB9KSxcbiAgICBcbiAgICAvLyBcdTI3NEMgRElTQUJMRUQ6IFByZXJlbmRlcmluZyB3YXMgZmFpbGluZyAtIHVzaW5nIHN0YXRpYyBTRU8gY29udGVudCBpbiBpbmRleC5odG1sIGluc3RlYWRcbiAgICAvLyBSZS1lbmFibGUgYWZ0ZXIgZml4aW5nIENocm9tZS9QdXBwZXRlZXIgaXNzdWVzXG4gIF0uZmlsdGVyKEJvb2xlYW4pLFxuICBcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxuICAgIH0sXG4gIH0sXG4gIFxuICBidWlsZDoge1xuICAgIHRhcmdldDogJ2VzMjAxNScsXG4gICAgbWluaWZ5OiAndGVyc2VyJyxcbiAgICB0ZXJzZXJPcHRpb25zOiB7XG4gICAgICBjb21wcmVzczoge1xuICAgICAgICBkcm9wX2NvbnNvbGU6IHRydWUsXG4gICAgICAgIGRyb3BfZGVidWdnZXI6IHRydWUsXG4gICAgICAgIHB1cmVfZnVuY3M6IFsnY29uc29sZS5sb2cnLCAnY29uc29sZS5pbmZvJywgJ2NvbnNvbGUuZGVidWcnXSxcbiAgICAgICAgcGFzc2VzOiAyXG4gICAgICB9XG4gICAgfSxcbiAgICBcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiAoaWQpID0+IHtcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcycpKSB7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3JlYWN0JykgfHwgaWQuaW5jbHVkZXMoJ3JlYWN0LWRvbScpIHx8IGlkLmluY2x1ZGVzKCdyZWFjdC1yb3V0ZXInKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ3JlYWN0LXZlbmRvcic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ2ZyYW1lci1tb3Rpb24nKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ2ZyYW1lci1tb3Rpb24nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdAcmFkaXgtdWknKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ3VpLXZlbmRvcic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ2x1Y2lkZS1yZWFjdCcpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAnaWNvbnMnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3InO1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3NyYy9jb21wb25lbnRzLycpKSB7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ1Bvc3RDYXJkJykgfHwgaWQuaW5jbHVkZXMoJ1Bvc3RMaXN0SXRlbScpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAncG9zdC1jb21wb25lbnRzJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQWQnKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ2Fkcyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcbiAgICAgICAgY2h1bmtGaWxlTmFtZXM6ICdhc3NldHMvanMvW25hbWVdLVtoYXNoXS5qcycsXG4gICAgICAgIGVudHJ5RmlsZU5hbWVzOiAnYXNzZXRzL2pzL1tuYW1lXS1baGFzaF0uanMnLFxuICAgICAgICBhc3NldEZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLltleHRdJ1xuICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiA1MDAsXG4gICAgc291cmNlbWFwOiBmYWxzZSxcbiAgICBjc3NDb2RlU3BsaXQ6IHRydWUsXG4gICAgcmVwb3J0Q29tcHJlc3NlZFNpemU6IHRydWUsXG4gICAgYXNzZXRzSW5saW5lTGltaXQ6IDIwNDhcbiAgfSxcbiAgXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDMwMDAsXG4gICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgICBob3N0OiB0cnVlLFxuICAgIG9wZW46IHRydWUsXG4gICAgaG1yOiB7XG4gICAgICBvdmVybGF5OiB0cnVlXG4gICAgfVxuICB9LFxuICBcbiAgcHJldmlldzoge1xuICAgIHBvcnQ6IDQxNzMsXG4gICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgICBob3N0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
