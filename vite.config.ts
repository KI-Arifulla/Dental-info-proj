import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on the LAN so patients on the clinic Wi-Fi can open shared case links.
    host: true,
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
})
