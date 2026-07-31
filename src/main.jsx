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
// 1. Teks "Puncak" bertahan selama 3 detik (smooth, tidak terburu-buru)
// 2. Lalu slide-down + fade-out mulus ke bawah (persis Grab)
// 3. Hapus elemen dari DOM setelah animasi selesai
const SPLASH_DURATION = 1200;     // 1.2 detik tampil instan lalu buka app
const EXIT_DURATION   = 400;      // 0.4 detik animasi slide-down keluar

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
