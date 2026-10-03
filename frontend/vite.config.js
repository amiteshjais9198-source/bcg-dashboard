import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      // Proxy Socket.io polling requests
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,          // <-- enables WebSocket proxying
      },
      // Proxy REST API calls (optional — frontend uses full URL, but useful for relative paths)
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
