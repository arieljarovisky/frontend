// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const API_BASE = process.env.VITE_API_BASE_URL || "";
const PROXY_TARGET = process.env.VITE_PROXY_TARGET || "";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  define: {
    __API_BASE__: JSON.stringify(API_BASE),
  },
  resolve: {
    dedupe: ["react", "react-dom", "react-is"],
  },
  optimizeDeps: {
    include: ["react-is", "recharts"],
  },
  build: {
    minify: "esbuild",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    commonjsOptions: {
      include: [/react-is/, /recharts/, /node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      // NO marcar react-is como external - debe incluirse en el bundle
    },
  },
});
