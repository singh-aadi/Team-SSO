import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Team-SSO/',
  server: {
    port: 3001,
    strictPort: false,
    host: true
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
