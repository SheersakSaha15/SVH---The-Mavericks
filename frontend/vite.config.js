import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        chat: resolve(__dirname, 'chat.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        profile: resolve(__dirname, 'profile.html'),
        settings: resolve(__dirname, 'settings.html'),
        emergency: resolve(__dirname, 'emergency-help.html'),
        tips: resolve(__dirname, 'daily-health-tips.html'),
        awareness: resolve(__dirname, 'disease-awareness.html'),
        alerts: resolve(__dirname, 'health-alerts.html'),
        symptom: resolve(__dirname, 'symptom-checker.html'),
        vaccination: resolve(__dirname, 'vaccination-tracker.html')
      }
    }
  }
});
