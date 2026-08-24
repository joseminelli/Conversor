import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  base: process.env.NODE_ENV === 'production' && process.env.GITHUB_PAGES === 'true' ? '/Conversor/' : '/',
  server: {
    port: 5173,
    host: true
  }
})
