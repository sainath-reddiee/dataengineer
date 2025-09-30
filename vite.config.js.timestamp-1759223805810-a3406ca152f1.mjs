// vite.config.js
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
import viteImagemin from "file:///home/project/node_modules/vite-plugin-imagemin/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [
    react({
      fastRefresh: true
    }),
    viteImagemin({
      gifsicle: { optimizationLevel: 7 },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      webp: { quality: 80 }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve("./src")
    }
  },
  // Build optimizations for production
  build: {
    // Target modern browsers for better performance
    target: ["es2015", "chrome64", "firefox67", "safari12"],
    // Optimize chunks
    rollupOptions: {
      output: {
        // Manual chunking for better caching
        manualChunks: {
          // Vendor chunk for libraries
          vendor: [
            "react",
            "react-dom",
            "react-router-dom"
          ],
          // UI components chunk
          ui: [
            "framer-motion",
            "lucide-react"
          ]
        },
        // Optimize chunk names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split("/").pop().replace(".jsx", "") : "chunk";
          return `js/${facadeModuleId}-[hash].js`;
        },
        // Optimize asset names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split(".");
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash].${ext}`;
          }
          if (/css/i.test(ext)) {
            return `css/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        }
      }
    },
    // Minification and optimization
    minify: "esbuild",
    // Faster than terser
    sourcemap: false,
    // Disable sourcemaps for production
    // Reduce bundle size
    chunkSizeWarningLimit: 1e3,
    // Warn for chunks > 1MB
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Optimize assets
    assetsInlineLimit: 4096,
    // Inline assets smaller than 4kb
    // Remove console logs and debugger statements in production
    esbuild: {
      drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : []
    }
  },
  // Development server optimizations
  server: {
    // Enable HTTP/2 for development
    https: false,
    // Hot Module Replacement optimizations
    hmr: {
      overlay: false
      // Disable error overlay for better performance
    },
    // Faster development builds
    fs: {
      // Allow serving files from one level up from package root
      allow: [".."]
    }
  },
  // Optimizations for dependencies
  optimizeDeps: {
    // Pre-bundle these dependencies
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "framer-motion",
      "lucide-react",
      "react-helmet-async"
    ],
    // ESBuild options for dependency optimization
    esbuildOptions: {
      target: "es2015",
      supported: {
        "top-level-await": true
      }
    }
  },
  // CSS optimizations (simplified - no PostCSS plugins that cause issues)
  css: {
    // Enable CSS modules for better performance
    modules: {
      localsConvention: "camelCase"
    }
  },
  // Preview server optimizations
  preview: {
    port: 4173,
    strictPort: true
  },
  // Environment variables
  define: {
    // Define global constants
    __DEV__: JSON.stringify(process.env.NODE_ENV === "development"),
    __PROD__: JSON.stringify(process.env.NODE_ENV === "production")
  },
  // ESBuild optimizations
  esbuild: {
    // JSX optimizations
    target: "es2015",
    // Optimize for size in production
    ...process.env.NODE_ENV === "production" && {
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: true,
      drop: ["console", "debugger"]
    }
  },
  // Worker optimizations
  worker: {
    format: "es"
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB2aXRlSW1hZ2VtaW4gZnJvbSAndml0ZS1wbHVnaW4taW1hZ2VtaW4nO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KHtcbiAgICAgIGZhc3RSZWZyZXNoOiB0cnVlLFxuICAgIH0pLFxuICAgIHZpdGVJbWFnZW1pbih7XG4gICAgICBnaWZzaWNsZTogeyBvcHRpbWl6YXRpb25MZXZlbDogNyB9LFxuICAgICAgb3B0aXBuZzogeyBvcHRpbWl6YXRpb25MZXZlbDogNyB9LFxuICAgICAgbW96anBlZzogeyBxdWFsaXR5OiA4MCB9LFxuICAgICAgd2VicDogeyBxdWFsaXR5OiA4MCB9LFxuICAgIH0pLFxuICBdLFxuICBcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IHBhdGgucmVzb2x2ZSgnLi9zcmMnKSxcbiAgICB9LFxuICB9LFxuXG4gIC8vIEJ1aWxkIG9wdGltaXphdGlvbnMgZm9yIHByb2R1Y3Rpb25cbiAgYnVpbGQ6IHtcbiAgICAvLyBUYXJnZXQgbW9kZXJuIGJyb3dzZXJzIGZvciBiZXR0ZXIgcGVyZm9ybWFuY2VcbiAgICB0YXJnZXQ6IFsnZXMyMDE1JywgJ2Nocm9tZTY0JywgJ2ZpcmVmb3g2NycsICdzYWZhcmkxMiddLFxuICAgIFxuICAgIC8vIE9wdGltaXplIGNodW5rc1xuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICAvLyBNYW51YWwgY2h1bmtpbmcgZm9yIGJldHRlciBjYWNoaW5nXG4gICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgIC8vIFZlbmRvciBjaHVuayBmb3IgbGlicmFyaWVzXG4gICAgICAgICAgdmVuZG9yOiBbXG4gICAgICAgICAgICAncmVhY3QnLFxuICAgICAgICAgICAgJ3JlYWN0LWRvbScsXG4gICAgICAgICAgICAncmVhY3Qtcm91dGVyLWRvbSdcbiAgICAgICAgICBdLFxuICAgICAgICAgIC8vIFVJIGNvbXBvbmVudHMgY2h1bmtcbiAgICAgICAgICB1aTogW1xuICAgICAgICAgICAgJ2ZyYW1lci1tb3Rpb24nLFxuICAgICAgICAgICAgJ2x1Y2lkZS1yZWFjdCdcbiAgICAgICAgICBdXG4gICAgICAgIH0sXG4gICAgICAgIC8vIE9wdGltaXplIGNodW5rIG5hbWVzXG4gICAgICAgIGNodW5rRmlsZU5hbWVzOiAoY2h1bmtJbmZvKSA9PiB7XG4gICAgICAgICAgY29uc3QgZmFjYWRlTW9kdWxlSWQgPSBjaHVua0luZm8uZmFjYWRlTW9kdWxlSWQgXG4gICAgICAgICAgICA/IGNodW5rSW5mby5mYWNhZGVNb2R1bGVJZC5zcGxpdCgnLycpLnBvcCgpLnJlcGxhY2UoJy5qc3gnLCAnJykgXG4gICAgICAgICAgICA6ICdjaHVuayc7XG4gICAgICAgICAgcmV0dXJuIGBqcy8ke2ZhY2FkZU1vZHVsZUlkfS1baGFzaF0uanNgO1xuICAgICAgICB9LFxuICAgICAgICAvLyBPcHRpbWl6ZSBhc3NldCBuYW1lc1xuICAgICAgICBhc3NldEZpbGVOYW1lczogKGFzc2V0SW5mbykgPT4ge1xuICAgICAgICAgIGNvbnN0IGluZm8gPSBhc3NldEluZm8ubmFtZS5zcGxpdCgnLicpO1xuICAgICAgICAgIGNvbnN0IGV4dCA9IGluZm9baW5mby5sZW5ndGggLSAxXTtcbiAgICAgICAgICBpZiAoL3BuZ3xqcGU/Z3xzdmd8Z2lmfHRpZmZ8Ym1wfGljby9pLnRlc3QoZXh0KSkge1xuICAgICAgICAgICAgcmV0dXJuIGBpbWFnZXMvW25hbWVdLVtoYXNoXS4ke2V4dH1gO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoL2Nzcy9pLnRlc3QoZXh0KSkge1xuICAgICAgICAgICAgcmV0dXJuIGBjc3MvW25hbWVdLVtoYXNoXS4ke2V4dH1gO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gYGFzc2V0cy9bbmFtZV0tW2hhc2hdLiR7ZXh0fWA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIC8vIE1pbmlmaWNhdGlvbiBhbmQgb3B0aW1pemF0aW9uXG4gICAgbWluaWZ5OiAnZXNidWlsZCcsIC8vIEZhc3RlciB0aGFuIHRlcnNlclxuICAgIHNvdXJjZW1hcDogZmFsc2UsIC8vIERpc2FibGUgc291cmNlbWFwcyBmb3IgcHJvZHVjdGlvblxuICAgIFxuICAgIC8vIFJlZHVjZSBidW5kbGUgc2l6ZVxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAwMCwgLy8gV2FybiBmb3IgY2h1bmtzID4gMU1CXG4gICAgXG4gICAgLy8gRW5hYmxlIENTUyBjb2RlIHNwbGl0dGluZ1xuICAgIGNzc0NvZGVTcGxpdDogdHJ1ZSxcbiAgICBcbiAgICAvLyBPcHRpbWl6ZSBhc3NldHNcbiAgICBhc3NldHNJbmxpbmVMaW1pdDogNDA5NiwgLy8gSW5saW5lIGFzc2V0cyBzbWFsbGVyIHRoYW4gNGtiXG4gICAgXG4gICAgLy8gUmVtb3ZlIGNvbnNvbGUgbG9ncyBhbmQgZGVidWdnZXIgc3RhdGVtZW50cyBpbiBwcm9kdWN0aW9uXG4gICAgZXNidWlsZDoge1xuICAgICAgZHJvcDogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdwcm9kdWN0aW9uJyA/IFsnY29uc29sZScsICdkZWJ1Z2dlciddIDogW10sXG4gICAgfSxcbiAgfSxcblxuICAvLyBEZXZlbG9wbWVudCBzZXJ2ZXIgb3B0aW1pemF0aW9uc1xuICBzZXJ2ZXI6IHtcbiAgICAvLyBFbmFibGUgSFRUUC8yIGZvciBkZXZlbG9wbWVudFxuICAgIGh0dHBzOiBmYWxzZSxcbiAgICBcbiAgICAvLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50IG9wdGltaXphdGlvbnNcbiAgICBobXI6IHtcbiAgICAgIG92ZXJsYXk6IGZhbHNlLCAvLyBEaXNhYmxlIGVycm9yIG92ZXJsYXkgZm9yIGJldHRlciBwZXJmb3JtYW5jZVxuICAgIH0sXG4gICAgXG4gICAgLy8gRmFzdGVyIGRldmVsb3BtZW50IGJ1aWxkc1xuICAgIGZzOiB7XG4gICAgICAvLyBBbGxvdyBzZXJ2aW5nIGZpbGVzIGZyb20gb25lIGxldmVsIHVwIGZyb20gcGFja2FnZSByb290XG4gICAgICBhbGxvdzogWycuLiddXG4gICAgfVxuICB9LFxuXG4gIC8vIE9wdGltaXphdGlvbnMgZm9yIGRlcGVuZGVuY2llc1xuICBvcHRpbWl6ZURlcHM6IHtcbiAgICAvLyBQcmUtYnVuZGxlIHRoZXNlIGRlcGVuZGVuY2llc1xuICAgIGluY2x1ZGU6IFtcbiAgICAgICdyZWFjdCcsXG4gICAgICAncmVhY3QtZG9tJyxcbiAgICAgICdyZWFjdC1yb3V0ZXItZG9tJyxcbiAgICAgICdmcmFtZXItbW90aW9uJyxcbiAgICAgICdsdWNpZGUtcmVhY3QnLFxuICAgICAgJ3JlYWN0LWhlbG1ldC1hc3luYydcbiAgICBdLFxuICAgIFxuICAgIC8vIEVTQnVpbGQgb3B0aW9ucyBmb3IgZGVwZW5kZW5jeSBvcHRpbWl6YXRpb25cbiAgICBlc2J1aWxkT3B0aW9uczoge1xuICAgICAgdGFyZ2V0OiAnZXMyMDE1JyxcbiAgICAgIHN1cHBvcnRlZDoge1xuICAgICAgICAndG9wLWxldmVsLWF3YWl0JzogdHJ1ZVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICAvLyBDU1Mgb3B0aW1pemF0aW9ucyAoc2ltcGxpZmllZCAtIG5vIFBvc3RDU1MgcGx1Z2lucyB0aGF0IGNhdXNlIGlzc3VlcylcbiAgY3NzOiB7XG4gICAgLy8gRW5hYmxlIENTUyBtb2R1bGVzIGZvciBiZXR0ZXIgcGVyZm9ybWFuY2VcbiAgICBtb2R1bGVzOiB7XG4gICAgICBsb2NhbHNDb252ZW50aW9uOiAnY2FtZWxDYXNlJ1xuICAgIH1cbiAgfSxcblxuICAvLyBQcmV2aWV3IHNlcnZlciBvcHRpbWl6YXRpb25zXG4gIHByZXZpZXc6IHtcbiAgICBwb3J0OiA0MTczLFxuICAgIHN0cmljdFBvcnQ6IHRydWVcbiAgfSxcblxuICAvLyBFbnZpcm9ubWVudCB2YXJpYWJsZXNcbiAgZGVmaW5lOiB7XG4gICAgLy8gRGVmaW5lIGdsb2JhbCBjb25zdGFudHNcbiAgICBfX0RFVl9fOiBKU09OLnN0cmluZ2lmeShwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50JyksXG4gICAgX19QUk9EX186IEpTT04uc3RyaW5naWZ5KHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAncHJvZHVjdGlvbicpLFxuICB9LFxuXG4gIC8vIEVTQnVpbGQgb3B0aW1pemF0aW9uc1xuICBlc2J1aWxkOiB7XG4gICAgLy8gSlNYIG9wdGltaXphdGlvbnNcbiAgICB0YXJnZXQ6ICdlczIwMTUnLFxuICAgIFxuICAgIC8vIE9wdGltaXplIGZvciBzaXplIGluIHByb2R1Y3Rpb25cbiAgICAuLi4ocHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdwcm9kdWN0aW9uJyAmJiB7XG4gICAgICBtaW5pZnlJZGVudGlmaWVyczogdHJ1ZSxcbiAgICAgIG1pbmlmeVN5bnRheDogdHJ1ZSxcbiAgICAgIG1pbmlmeVdoaXRlc3BhY2U6IHRydWUsXG4gICAgICBkcm9wOiBbJ2NvbnNvbGUnLCAnZGVidWdnZXInXSxcbiAgICB9KVxuICB9LFxuXG4gIC8vIFdvcmtlciBvcHRpbWl6YXRpb25zXG4gIHdvcmtlcjoge1xuICAgIGZvcm1hdDogJ2VzJ1xuICB9XG59KTsiXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBQ3RQLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsT0FBTyxrQkFBa0I7QUFHekIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLE1BQ0osYUFBYTtBQUFBLElBQ2YsQ0FBQztBQUFBLElBQ0QsYUFBYTtBQUFBLE1BQ1gsVUFBVSxFQUFFLG1CQUFtQixFQUFFO0FBQUEsTUFDakMsU0FBUyxFQUFFLG1CQUFtQixFQUFFO0FBQUEsTUFDaEMsU0FBUyxFQUFFLFNBQVMsR0FBRztBQUFBLE1BQ3ZCLE1BQU0sRUFBRSxTQUFTLEdBQUc7QUFBQSxJQUN0QixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBRUEsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsT0FBTztBQUFBLElBQzNCO0FBQUEsRUFDRjtBQUFBO0FBQUEsRUFHQSxPQUFPO0FBQUE7QUFBQSxJQUVMLFFBQVEsQ0FBQyxVQUFVLFlBQVksYUFBYSxVQUFVO0FBQUE7QUFBQSxJQUd0RCxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUE7QUFBQSxRQUVOLGNBQWM7QUFBQTtBQUFBLFVBRVosUUFBUTtBQUFBLFlBQ047QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQTtBQUFBLFVBRUEsSUFBSTtBQUFBLFlBQ0Y7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQTtBQUFBLFFBRUEsZ0JBQWdCLENBQUMsY0FBYztBQUM3QixnQkFBTSxpQkFBaUIsVUFBVSxpQkFDN0IsVUFBVSxlQUFlLE1BQU0sR0FBRyxFQUFFLElBQUksRUFBRSxRQUFRLFFBQVEsRUFBRSxJQUM1RDtBQUNKLGlCQUFPLE1BQU0sY0FBYztBQUFBLFFBQzdCO0FBQUE7QUFBQSxRQUVBLGdCQUFnQixDQUFDLGNBQWM7QUFDN0IsZ0JBQU0sT0FBTyxVQUFVLEtBQUssTUFBTSxHQUFHO0FBQ3JDLGdCQUFNLE1BQU0sS0FBSyxLQUFLLFNBQVMsQ0FBQztBQUNoQyxjQUFJLGtDQUFrQyxLQUFLLEdBQUcsR0FBRztBQUMvQyxtQkFBTyx3QkFBd0IsR0FBRztBQUFBLFVBQ3BDO0FBQ0EsY0FBSSxPQUFPLEtBQUssR0FBRyxHQUFHO0FBQ3BCLG1CQUFPLHFCQUFxQixHQUFHO0FBQUEsVUFDakM7QUFDQSxpQkFBTyx3QkFBd0IsR0FBRztBQUFBLFFBQ3BDO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQTtBQUFBLElBR0EsUUFBUTtBQUFBO0FBQUEsSUFDUixXQUFXO0FBQUE7QUFBQTtBQUFBLElBR1gsdUJBQXVCO0FBQUE7QUFBQTtBQUFBLElBR3ZCLGNBQWM7QUFBQTtBQUFBLElBR2QsbUJBQW1CO0FBQUE7QUFBQTtBQUFBLElBR25CLFNBQVM7QUFBQSxNQUNQLE1BQU0sUUFBUSxJQUFJLGFBQWEsZUFBZSxDQUFDLFdBQVcsVUFBVSxJQUFJLENBQUM7QUFBQSxJQUMzRTtBQUFBLEVBQ0Y7QUFBQTtBQUFBLEVBR0EsUUFBUTtBQUFBO0FBQUEsSUFFTixPQUFPO0FBQUE7QUFBQSxJQUdQLEtBQUs7QUFBQSxNQUNILFNBQVM7QUFBQTtBQUFBLElBQ1g7QUFBQTtBQUFBLElBR0EsSUFBSTtBQUFBO0FBQUEsTUFFRixPQUFPLENBQUMsSUFBSTtBQUFBLElBQ2Q7QUFBQSxFQUNGO0FBQUE7QUFBQSxFQUdBLGNBQWM7QUFBQTtBQUFBLElBRVosU0FBUztBQUFBLE1BQ1A7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQTtBQUFBLElBR0EsZ0JBQWdCO0FBQUEsTUFDZCxRQUFRO0FBQUEsTUFDUixXQUFXO0FBQUEsUUFDVCxtQkFBbUI7QUFBQSxNQUNyQjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUE7QUFBQSxFQUdBLEtBQUs7QUFBQTtBQUFBLElBRUgsU0FBUztBQUFBLE1BQ1Asa0JBQWtCO0FBQUEsSUFDcEI7QUFBQSxFQUNGO0FBQUE7QUFBQSxFQUdBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQSxFQUNkO0FBQUE7QUFBQSxFQUdBLFFBQVE7QUFBQTtBQUFBLElBRU4sU0FBUyxLQUFLLFVBQVUsUUFBUSxJQUFJLGFBQWEsYUFBYTtBQUFBLElBQzlELFVBQVUsS0FBSyxVQUFVLFFBQVEsSUFBSSxhQUFhLFlBQVk7QUFBQSxFQUNoRTtBQUFBO0FBQUEsRUFHQSxTQUFTO0FBQUE7QUFBQSxJQUVQLFFBQVE7QUFBQTtBQUFBLElBR1IsR0FBSSxRQUFRLElBQUksYUFBYSxnQkFBZ0I7QUFBQSxNQUMzQyxtQkFBbUI7QUFBQSxNQUNuQixjQUFjO0FBQUEsTUFDZCxrQkFBa0I7QUFBQSxNQUNsQixNQUFNLENBQUMsV0FBVyxVQUFVO0FBQUEsSUFDOUI7QUFBQSxFQUNGO0FBQUE7QUFBQSxFQUdBLFFBQVE7QUFBQSxJQUNOLFFBQVE7QUFBQSxFQUNWO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
