import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  define: {
    global: "globalThis",
  },
  plugins: [react() , tailwindcss()],
  server: {
    proxy: {
      "/users-service": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/class-service": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/note-service": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/message-notification-service": {
        target: "http://localhost:8080",
        changeOrigin: true,
        ws: true,
      },

    },
  },
})
