import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/SistemaVacaciones/dist',
  build: {
    outDir: 'C:/xampp/htdocs/SistemaVacaciones/dist',
    emptyOutDir: false,
  },
})