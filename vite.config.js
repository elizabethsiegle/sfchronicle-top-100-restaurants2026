import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main:   resolve(__dirname, 'index.html'),
        '2025': resolve(__dirname, '2025.html'),
        '2024': resolve(__dirname, '2024.html'),
      },
    },
  },
});
