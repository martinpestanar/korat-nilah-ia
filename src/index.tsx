import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
// El registro de Service Worker y aviso de actualización amigable se gestiona centralizadamente en ReloadPrompt (App.tsx)

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
