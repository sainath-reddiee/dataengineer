// vite.config.js
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "/home/project";
var vite_config_default = defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh
      fastRefresh: true,
      // Optimize production build
      babel: {
        plugins: [
          // Remove console.log in production
          process.env.NODE_ENV === "production" && [
            "transform-remove-console",
            { exclude: ["error", "warn"] }
          ]
        ].filter(Boolean)
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    // Optimize output
    target: "es2015",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info", "console.debug"]
      }
    },
    // Code splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "framer-motion": ["framer-motion"],
          "ui-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-toast",
            "@radix-ui/react-slot",
            "@radix-ui/react-label"
          ],
          // App chunks
          "wordpress-api": ["./src/services/wordpressApi.js", "./src/hooks/useWordPress.js"],
          "utils": ["./src/utils/analytics.js", "./src/utils/performance.js", "./src/utils/imageOptimizer.js"]
        },
        // Clean filenames
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[ext]/[name]-[hash].[ext]"
      }
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 1e3,
    // Enable source maps for production debugging (optional)
    sourcemap: false,
    // Optimize CSS
    cssCodeSplit: true,
    // Compression
    reportCompressedSize: true,
    // Asset inlining threshold
    assetsInlineLimit: 4096
    // 4kb
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "framer-motion",
      "@radix-ui/react-dialog",
      "@radix-ui/react-toast",
      "lucide-react"
    ],
    exclude: []
  },
  // Server config for development
  server: {
    port: 3e3,
    strictPort: true,
    host: true,
    open: true
  },
  // Preview config for production testing
  preview: {
    port: 4173,
    strictPort: true,
    host: true,
    open: true
  },
  // Environment variables
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV)
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcuanNcIjsvLyB2aXRlLmNvbmZpZy5qc1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgcmVhY3Qoe1xuICAgICAgLy8gRW5hYmxlIEZhc3QgUmVmcmVzaFxuICAgICAgZmFzdFJlZnJlc2g6IHRydWUsXG4gICAgICAvLyBPcHRpbWl6ZSBwcm9kdWN0aW9uIGJ1aWxkXG4gICAgICBiYWJlbDoge1xuICAgICAgICBwbHVnaW5zOiBbXG4gICAgICAgICAgLy8gUmVtb3ZlIGNvbnNvbGUubG9nIGluIHByb2R1Y3Rpb25cbiAgICAgICAgICBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ3Byb2R1Y3Rpb24nICYmIFtcbiAgICAgICAgICAgICd0cmFuc2Zvcm0tcmVtb3ZlLWNvbnNvbGUnLFxuICAgICAgICAgICAgeyBleGNsdWRlOiBbJ2Vycm9yJywgJ3dhcm4nXSB9XG4gICAgICAgICAgXVxuICAgICAgICBdLmZpbHRlcihCb29sZWFuKVxuICAgICAgfVxuICAgIH0pXG4gIF0sXG4gIFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXG4gICAgfSxcbiAgfSxcbiAgXG4gIGJ1aWxkOiB7XG4gICAgLy8gT3B0aW1pemUgb3V0cHV0XG4gICAgdGFyZ2V0OiAnZXMyMDE1JyxcbiAgICBtaW5pZnk6ICd0ZXJzZXInLFxuICAgIHRlcnNlck9wdGlvbnM6IHtcbiAgICAgIGNvbXByZXNzOiB7XG4gICAgICAgIGRyb3BfY29uc29sZTogdHJ1ZSxcbiAgICAgICAgZHJvcF9kZWJ1Z2dlcjogdHJ1ZSxcbiAgICAgICAgcHVyZV9mdW5jczogWydjb25zb2xlLmxvZycsICdjb25zb2xlLmluZm8nLCAnY29uc29sZS5kZWJ1ZyddXG4gICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvLyBDb2RlIHNwbGl0dGluZyBmb3IgYmV0dGVyIGNhY2hpbmdcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgLy8gVmVuZG9yIGNodW5rc1xuICAgICAgICAgICdyZWFjdC12ZW5kb3InOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJ10sXG4gICAgICAgICAgJ2ZyYW1lci1tb3Rpb24nOiBbJ2ZyYW1lci1tb3Rpb24nXSxcbiAgICAgICAgICAndWktdmVuZG9yJzogW1xuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1kaWFsb2cnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC10b2FzdCcsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXNsb3QnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1sYWJlbCdcbiAgICAgICAgICBdLFxuICAgICAgICAgIFxuICAgICAgICAgIC8vIEFwcCBjaHVua3NcbiAgICAgICAgICAnd29yZHByZXNzLWFwaSc6IFsnLi9zcmMvc2VydmljZXMvd29yZHByZXNzQXBpLmpzJywgJy4vc3JjL2hvb2tzL3VzZVdvcmRQcmVzcy5qcyddLFxuICAgICAgICAgICd1dGlscyc6IFsnLi9zcmMvdXRpbHMvYW5hbHl0aWNzLmpzJywgJy4vc3JjL3V0aWxzL3BlcmZvcm1hbmNlLmpzJywgJy4vc3JjL3V0aWxzL2ltYWdlT3B0aW1pemVyLmpzJ11cbiAgICAgICAgfSxcbiAgICAgICAgXG4gICAgICAgIC8vIENsZWFuIGZpbGVuYW1lc1xuICAgICAgICBjaHVua0ZpbGVOYW1lczogJ2Fzc2V0cy9qcy9bbmFtZV0tW2hhc2hdLmpzJyxcbiAgICAgICAgZW50cnlGaWxlTmFtZXM6ICdhc3NldHMvanMvW25hbWVdLVtoYXNoXS5qcycsXG4gICAgICAgIGFzc2V0RmlsZU5hbWVzOiAnYXNzZXRzL1tleHRdL1tuYW1lXS1baGFzaF0uW2V4dF0nXG4gICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvLyBDaHVuayBzaXplIHdhcm5pbmdzXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxuICAgIFxuICAgIC8vIEVuYWJsZSBzb3VyY2UgbWFwcyBmb3IgcHJvZHVjdGlvbiBkZWJ1Z2dpbmcgKG9wdGlvbmFsKVxuICAgIHNvdXJjZW1hcDogZmFsc2UsXG4gICAgXG4gICAgLy8gT3B0aW1pemUgQ1NTXG4gICAgY3NzQ29kZVNwbGl0OiB0cnVlLFxuICAgIFxuICAgIC8vIENvbXByZXNzaW9uXG4gICAgcmVwb3J0Q29tcHJlc3NlZFNpemU6IHRydWUsXG4gICAgXG4gICAgLy8gQXNzZXQgaW5saW5pbmcgdGhyZXNob2xkXG4gICAgYXNzZXRzSW5saW5lTGltaXQ6IDQwOTYgLy8gNGtiXG4gIH0sXG4gIFxuICAvLyBPcHRpbWl6ZSBkZXBlbmRlbmNpZXNcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgaW5jbHVkZTogW1xuICAgICAgJ3JlYWN0JyxcbiAgICAgICdyZWFjdC1kb20nLFxuICAgICAgJ3JlYWN0LXJvdXRlci1kb20nLFxuICAgICAgJ2ZyYW1lci1tb3Rpb24nLFxuICAgICAgJ0ByYWRpeC11aS9yZWFjdC1kaWFsb2cnLFxuICAgICAgJ0ByYWRpeC11aS9yZWFjdC10b2FzdCcsXG4gICAgICAnbHVjaWRlLXJlYWN0J1xuICAgIF0sXG4gICAgZXhjbHVkZTogW11cbiAgfSxcbiAgXG4gIC8vIFNlcnZlciBjb25maWcgZm9yIGRldmVsb3BtZW50XG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDMwMDAsXG4gICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgICBob3N0OiB0cnVlLFxuICAgIG9wZW46IHRydWVcbiAgfSxcbiAgXG4gIC8vIFByZXZpZXcgY29uZmlnIGZvciBwcm9kdWN0aW9uIHRlc3RpbmdcbiAgcHJldmlldzoge1xuICAgIHBvcnQ6IDQxNzMsXG4gICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgICBob3N0OiB0cnVlLFxuICAgIG9wZW46IHRydWVcbiAgfSxcbiAgXG4gIC8vIEVudmlyb25tZW50IHZhcmlhYmxlc1xuICBkZWZpbmU6IHtcbiAgICAncHJvY2Vzcy5lbnYuTk9ERV9FTlYnOiBKU09OLnN0cmluZ2lmeShwcm9jZXNzLmVudi5OT0RFX0VOVilcbiAgfVxufSk7Il0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFIakIsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBO0FBQUEsTUFFSixhQUFhO0FBQUE7QUFBQSxNQUViLE9BQU87QUFBQSxRQUNMLFNBQVM7QUFBQTtBQUFBLFVBRVAsUUFBUSxJQUFJLGFBQWEsZ0JBQWdCO0FBQUEsWUFDdkM7QUFBQSxZQUNBLEVBQUUsU0FBUyxDQUFDLFNBQVMsTUFBTSxFQUFFO0FBQUEsVUFDL0I7QUFBQSxRQUNGLEVBQUUsT0FBTyxPQUFPO0FBQUEsTUFDbEI7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFFQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFFQSxPQUFPO0FBQUE7QUFBQSxJQUVMLFFBQVE7QUFBQSxJQUNSLFFBQVE7QUFBQSxJQUNSLGVBQWU7QUFBQSxNQUNiLFVBQVU7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLGVBQWU7QUFBQSxRQUNmLFlBQVksQ0FBQyxlQUFlLGdCQUFnQixlQUFlO0FBQUEsTUFDN0Q7QUFBQSxJQUNGO0FBQUE7QUFBQSxJQUdBLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQTtBQUFBLFVBRVosZ0JBQWdCLENBQUMsU0FBUyxhQUFhLGtCQUFrQjtBQUFBLFVBQ3pELGlCQUFpQixDQUFDLGVBQWU7QUFBQSxVQUNqQyxhQUFhO0FBQUEsWUFDWDtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQTtBQUFBLFVBR0EsaUJBQWlCLENBQUMsa0NBQWtDLDZCQUE2QjtBQUFBLFVBQ2pGLFNBQVMsQ0FBQyw0QkFBNEIsOEJBQThCLCtCQUErQjtBQUFBLFFBQ3JHO0FBQUE7QUFBQSxRQUdBLGdCQUFnQjtBQUFBLFFBQ2hCLGdCQUFnQjtBQUFBLFFBQ2hCLGdCQUFnQjtBQUFBLE1BQ2xCO0FBQUEsSUFDRjtBQUFBO0FBQUEsSUFHQSx1QkFBdUI7QUFBQTtBQUFBLElBR3ZCLFdBQVc7QUFBQTtBQUFBLElBR1gsY0FBYztBQUFBO0FBQUEsSUFHZCxzQkFBc0I7QUFBQTtBQUFBLElBR3RCLG1CQUFtQjtBQUFBO0FBQUEsRUFDckI7QUFBQTtBQUFBLEVBR0EsY0FBYztBQUFBLElBQ1osU0FBUztBQUFBLE1BQ1A7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBQUEsSUFDQSxTQUFTLENBQUM7QUFBQSxFQUNaO0FBQUE7QUFBQSxFQUdBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQSxJQUNaLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQUE7QUFBQSxFQUdBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQSxJQUNaLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQUE7QUFBQSxFQUdBLFFBQVE7QUFBQSxJQUNOLHdCQUF3QixLQUFLLFVBQVUsUUFBUSxJQUFJLFFBQVE7QUFBQSxFQUM3RDtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
