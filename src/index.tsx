import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Registro automático de Service Worker para actualizaciones PWA en tiempo real
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Cuando hay nueva versión en Vercel, recarga automáticamente con el nuevo código
    updateSW(true);
  },
  onOfflineReady() {
    console.log('[PWA] Lista para modo offline');
  },
  onRegisteredSW(swUrl, registration) {
    if (registration) {
      // Verificar actualizaciones cada 10 minutos
      setInterval(() => {
        registration.update();
      }, 10 * 60 * 1000);

      // Verificar actualizaciones cada vez que el usuario regresa/abre la app PWA en el celular
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          registration.update();
        }
      });
    }
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
