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
    alias: {
      "react-is": "/node_modules/react-is",
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["react-is"],
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
      include: [/react-is/, /node_modules/],
    },
    rollupOptions: {
      external: ["react-is"],   // 💥 el fix definitivo
    },
  },
});
