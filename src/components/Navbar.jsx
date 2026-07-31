import React from 'react';
import { Mountain, LayoutDashboard, Calendar, Bell, BellOff } from 'lucide-react';
import { playBirdChirp } from '../utils/audio';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  notifEnabled, 
  onToggleNotification 
}) {
  const handleNotifClick = () => {
    playBirdChirp(2); // Kicau Ganda terpilih untuk Notifikasi
    onToggleNotification();
  };

  return (
    <>
      {/* Desktop & Tablet Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs transition-transform group-hover:scale-105">
              <Mountain className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="font-bold text-xl text-slate-900 tracking-tight">Puncak</span>
            </div>
          </div>

          {/* Desktop Nav Links (Hanya di Layar Tablet/Desktop: sm:flex) */}
          <div className="hidden sm:flex items-center gap-3">
            <nav className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl shadow-xs">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard Harian
              </button>

              <button
                onClick={() => setActiveTab('recap')}
                className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                  activeTab === 'recap'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Rekap Bulanan
              </button>
            </nav>

            {/* Notification Toggle Button Desktop (Dengan Suara Kicau Ganda) */}
            <button
              onClick={handleNotifClick}
              className={`p-2.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold ${
                notifEnabled
                  ? 'bg-emerald-50 text-emerald-700 shadow-xs'
                  : 'bg-white text-slate-500 hover:text-slate-800 shadow-xs'
              }`}
              title={notifEnabled ? 'Notifikasi Aktif' : 'Aktifkan Notifikasi'}
            >
              {notifEnabled ? <Bell className="w-4 h-4 text-emerald-600 fill-emerald-100" /> : <BellOff className="w-4 h-4" />}
              <span>{notifEnabled ? 'Notif Aktif' : 'Notif'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Ditaruh di Sebelah Kiri Dashboard Khusus Layar HP) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg px-4 py-2 shadow-lg">
        <div className="grid grid-cols-3 items-center text-center">
          {/* 1. Tombol Notifikasi Pengingat (Di Sebelah Kiri Dashboard - Kicau Ganda) */}
          <button
            onClick={handleNotifClick}
            className={`flex flex-col items-center gap-1 py-1 rounded-xl transition-all ${
              notifEnabled ? 'text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {notifEnabled ? (
              <Bell className="w-5 h-5 text-emerald-600 fill-emerald-100" />
            ) : (
              <BellOff className="w-5 h-5" />
            )}
            <span className="text-[10px] font-semibold">{notifEnabled ? 'Notif Aktif' : 'Notifikasi'}</span>
          </button>

          {/* 2. Dashboard Harian */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 py-1 rounded-xl transition-all ${
              activeTab === 'dashboard' ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Dashboard</span>
          </button>

          {/* 3. Rekap Bulanan */}
          <button
            onClick={() => setActiveTab('recap')}
            className={`flex flex-col items-center gap-1 py-1 rounded-xl transition-all ${
              activeTab === 'recap' ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Rekap Bulanan</span>
          </button>
        </div>
      </nav>
    </>
  );
}
