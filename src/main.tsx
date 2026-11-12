import React from 'react';import ReactDOM from 'react-dom/client';import App from './App';import './styles.css';
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) { window.addEventListener('load', () => { navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined); }); }
  // dev: a cache-first SW serves stale modules/assets, so drop any leftover registration and caches
  else { navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())); caches.keys().then((ks) => ks.forEach((k) => caches.delete(k))); }
}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
