import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Grab-style Splash Screen Exit:
// 1. Teks "Puncak" & Latar Gelap tampil singkat saat startup
// 2. Lalu seluruh kontainer background splash screen slide-down + fade-out mulus ke bawah
// 3. Hapus elemen dari DOM setelah animasi selesai
const SPLASH_DURATION = 800;      // 0.8 detik tampil cukup untuk transisi
const EXIT_DURATION   = 400;      // 0.4 detik animasi slide-down keluar

setTimeout(() => {
  const splash = document.getElementById('app-splash');
  if (splash) {
    // Trigger exit animation
    splash.classList.add('splash-exit');

    // Hapus dari DOM setelah animasi exit selesai
    setTimeout(() => {
      if (splash && splash.parentNode) {
        splash.parentNode.removeChild(splash);
      }
    }, EXIT_DURATION);
  }
}, SPLASH_DURATION);
