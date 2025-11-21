import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'public',
  publicDir: '../assets',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'public/index.html')
      }
    }
  },
  server: {
    port: 5173,
    open: true,
    cors: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'public'),
      '@assets': path.resolve(__dirname, 'assets')
    }
  },
  optimizeDeps: {
    include: ['pixi.js', 'chart.js', 'gsap']
  }
});
