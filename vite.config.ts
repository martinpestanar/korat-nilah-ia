import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isDev = mode === 'development';
  return {
    server: {
      port: 5173,
      host: '0.0.0.0',
      proxy: {
        '/api/n8n': {
          target: 'https://hooks.koratflow.agency',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/n8n/, '/webhook'),
          secure: true
        }
      }
    },
    plugins: [
      react(),
      tailwindcss(),
      ...(isDev ? [] : [VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['apple-touch-icon.png'],
        manifest: {
          name: 'Nilah IA — Dashboard Inteligente',
          short_name: 'Nilah IA',
          description: 'CRM y agendamiento inteligente para salones de belleza',
          theme_color: '#ffffff',
          background_color: '#09090B',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/#/login',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ],
          shortcuts: [
            {
              name: 'Nueva Cita',
              short_name: 'Nueva',
              description: 'Agendar cita rápidamente',
              url: '/#/nilah/app/calendar?action=new_appointment',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }]
            },
            {
              name: 'Ver Agenda',
              short_name: 'Agenda',
              description: 'Revisar citas del día',
              url: '/#/nilah/app/calendar',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }]
            },
            {
              name: 'Super Admin',
              short_name: 'Admin',
              description: 'Panel de control global',
              url: '/#/god-mode',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }]
            }
          ]
        },
        workbox: {
          importScripts: ['/push-sw.js'],
          globPatterns: ['**/*.{ico,png,svg,woff2,js,css,html}'],
          skipWaiting: true,
          clientsClaim: true,
          runtimeCaching: [
            {
              urlPattern: /\.(?:js|css|html)$/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'code-assets-cache',
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
              }
            },
            {
              urlPattern: /^https:\/\/[^.]+\.supabase\.co\/rest\/v1\/.*$/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 7
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })])
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    }
  };
});
