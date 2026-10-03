import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    server: {
      // Allow LAN / tunnel / preview hostnames (previously every non-localhost
      // Host header was answered with "403 Blocked request").
      allowedHosts: [
        'localhost',
        '.local',
        '.e2b.app',
        '.e2b.dev',
        '.ngrok-free.app',
        '.trycloudflare.com',
        '.loca.lt',
        ...(process.env.ALLOWED_HOSTS || '')
          .split(',')
          .map((h) => h.trim())
          .filter(Boolean),
      ],
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
