import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.VITE_PORT ?? '25173'),
    proxy: {
      '/api': {
        target: `http://backend:${process.env.BACKEND_PORT ?? '23000'}`,
        changeOrigin: true,
      },
    },
  },
});
