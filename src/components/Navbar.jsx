import React from 'react';
import { LayoutDashboard, Calendar, Bell, BellOff, Plus } from 'lucide-react';
import PuncakLogo from './PuncakLogo';
import { playBirdChirp } from '../utils/audio';
import { isNative } from '../utils/notifications';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  notifEnabled, 
  onToggleNotification,
  onOpenAddTask
}) {
  const handleNotifClick = () => {
    // Hanya mainkan suara di Web Browser — di Android Native sudah ada suara dari notification channel
    if (!isNative()) {
      playBirdChirp(2);
    }
    onToggleNotification();
  };

  return (
    <>
      {/* Desktop & Tablet Header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl saturate-150 border-b border-slate-200/50 shadow-sm transition-all">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            {/* Logo Puncak Melayang (Floating Icon Tanpa Kotak Latar Belakang) */}
            <PuncakLogo className="w-8 h-8 text-slate-900 transition-transform group-hover:scale-105" />
            <div>
              <span className="font-bold text-xl text-slate-900 tracking-tight">Puncak</span>
            </div>
          </div>

          {/* Desktop Nav Links (Hanya di Layar PC/Monitor Besar: 2xl:flex / 1536px+) */}
          <div className="hidden 2xl:flex items-center gap-3">
            <nav className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl shadow-xs">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg active:scale-95 transition-all ${
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
                className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg active:scale-95 transition-all ${
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
              className={`p-2.5 rounded-xl active:scale-95 transition-all flex items-center gap-1.5 text-xs font-semibold ${
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

      {/* Floating Circle Plus Button untuk Mobile & Seluruh Seri iPad / Tablet (Pojok Kanan Bawah) */}
      {onOpenAddTask && (
        <div className="2xl:hidden fixed bottom-20 right-5 sm:right-8 md:right-12 z-50">
          <button
            onClick={() => onOpenAddTask()}
            className="w-12 h-12 sm:w-14 sm:h-14 bg-[#ffffff] hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full flex items-center justify-center shadow-lg border border-slate-200/80 active:scale-95 transition-all"
            title="Tambah Tugas Baru"
            aria-label="Tambah Tugas Baru"
          >
            <Plus className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Mobile & iPad / Tablet Bottom Navigation Bar (Bawah Layar HP & iPad Seri Apapun: 2xl:hidden) */}
      <nav className="2xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0F172A] px-4 py-2.5 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t border-white/20 transition-all">
        {/* Overlay tidak diperlukan lagi karena background sudah solid */}
        <div className="max-w-md mx-auto grid grid-cols-3 items-center text-center relative z-10">
          {/* 1. Tombol Notifikasi Pengingat */}
          <button
            onClick={handleNotifClick}
            className={`flex flex-col items-center gap-1 py-1 rounded-xl active:scale-95 transition-all ${
              notifEnabled ? 'text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {notifEnabled ? (
              <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 fill-emerald-100" />
            ) : (
              <BellOff className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
            <span className="text-[10px] sm:text-xs font-semibold">{notifEnabled ? 'Notif Aktif' : 'Notifikasi'}</span>
          </button>

          {/* 2. Dashboard Harian */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 py-1 rounded-xl active:scale-95 transition-all ${
              activeTab === 'dashboard' ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[10px] sm:text-xs font-semibold">Dashboard</span>
          </button>

          {/* 3. Rekap Bulanan */}
          <button
            onClick={() => setActiveTab('recap')}
            className={`flex flex-col items-center gap-1 py-1 rounded-xl active:scale-95 transition-all ${
              activeTab === 'recap' ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[10px] sm:text-xs font-semibold">Rekap Bulanan</span>
          </button>
        </div>
      </nav>
    </>
  );
}
