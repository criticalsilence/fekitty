import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { zyzz } from 'zyzz/vite'

export default defineConfig({
  plugins: [
    react(),
    zyzz(),
  ],
  ssr: {
    noExternal: ['zyzz'],
  },
})
