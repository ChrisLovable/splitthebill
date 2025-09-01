import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/veryfi': {
        target: 'https://api.veryfi.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/veryfi/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Client-Id', 'vrfNVLAahBk1YnNna8BtubLRTUBjzVJJVhTTvIL')
            proxyReq.setHeader('Authorization', 'apikey chrisdevries.personal:b21db4e417060b1ff31d3d2c369d8ad6')
          })
        }
      }
    }
  }
})
