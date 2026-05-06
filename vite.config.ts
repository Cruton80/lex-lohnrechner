import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  root: '.',
  server: {
    port: 3000,
    open: '/src/ui/index.html',
  },
  build: {
    target: 'ES2020',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/ui/index.html'),
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@data': path.resolve(__dirname, './src/data'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
})
