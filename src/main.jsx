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
// 1. Teks "Puncak" & Latar Gelap tampil selama 3 detik
// 2. Lalu seluruh kontainer background splash screen slide-down + fade-out mulus ke bawah
// 3. Hapus elemen dari DOM setelah animasi selesai
const SPLASH_DURATION = 3000;     // 3.0 detik tampil tenang
const EXIT_DURATION   = 450;      // 0.45 detik animasi slide-down keluar

setTimeout(() => {
  const splash = document.getElementById('app-splash');
  if (splash) {
    // Trigger Grab-style exit animation (slide-down + fade-out)
    splash.classList.add('splash-exit');

    // Hapus dari DOM setelah animasi exit selesai
    setTimeout(() => {
      if (splash.parentNode) {
        splash.parentNode.removeChild(splash);
      }
    }, EXIT_DURATION);
  }
}, SPLASH_DURATION);
