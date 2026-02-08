import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // This plugin automagically fixes "Buffer", "process", "stream" errors
    nodePolyfills({
      protocolImports: true,
      globals: {
        Buffer: true,
        global: true, // This helper also tries to fix global
        process: true,
      },
    }),
  ],
  resolve: {
    alias: {
      // Tells Vite "@" maps to the "src" folder
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // --- CRITICAL FIX FOR VIDEO ---
  // simple-peer relies on "global" existing. This forces it to use the browser window.
  define: {
    'global': 'window',
  },
  // ------------------------------
  server: {
    port: 5173,
    strictPort: true, 
  }
})