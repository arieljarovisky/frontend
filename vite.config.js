// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Lee la URL del backend (puede ser ngrok)
const API_BASE = process.env.VITE_API_BASE_URL || "";

// Si preferís trabajar con proxy en dev, poné tu URL ngrok acá:
const PROXY_TARGET = process.env.VITE_PROXY_TARGET || "";

export default defineConfig({
  plugins: [react()],
  server: {
    // Si usás API_BASE (cliente axios apunta directo), NO necesitás proxy.
    // Si preferís proxy (axios con baseURL=""), descomentá abajo y seteá PROXY_TARGET.
    // proxy: PROXY_TARGET
    //   ? {
    //       "/auth": PROXY_TARGET,
    //       "/api": PROXY_TARGET,
    //     }
    //   : undefined,
    host: true,
    port: 5173,
  },
  define: {
    __API_BASE__: JSON.stringify(API_BASE),
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'react-is'],
  },
  optimizeDeps: {
    include: ['react-is'],
  },
  build: {
    // Eliminar console.log/error/warn en producción
    minify: 'esbuild',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    commonjsOptions: {
      include: [/react-is/, /node_modules/],
    },
  },
});
