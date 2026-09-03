import React from 'react';
import { LayoutDashboard, Calendar, CalendarDays, Settings, Plus } from 'lucide-react';
import PuncakLogo from './PuncakLogo';
import { playBirdChirp } from '../utils/audio';
import { isNative } from '../utils/notifications';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  notifEnabled, 
  onOpenSettings,
  onOpenAddTask
}) {
  const handleSettingsClick = () => {
    if (onOpenSettings) {
      onOpenSettings();
    }
  };

  return (
    <>
      {/* Desktop & Mobile Header Sticky */}
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
                onClick={() => setActiveTab('weekly')}
                className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg active:scale-95 transition-all ${
                  activeTab === 'weekly'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                Rekap Mingguan
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

            {/* Settings Button Desktop */}
            <button
              onClick={handleSettingsClick}
              className="p-2.5 rounded-xl bg-slate-100/90 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-semibold relative shadow-xs"
              title="Pengaturan & Integrasi AI"
            >
              <Settings className="w-4 h-4 text-slate-700" />
              <span>Pengaturan</span>
              {notifEnabled && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
              )}
            </button>
          </div>

          {/* Settings Button Mobile / Tablet (Pojok Kanan Atas Header: 2xl:hidden) */}
          <div className="flex 2xl:hidden items-center">
            <button
              onClick={handleSettingsClick}
              className="p-2.5 rounded-xl active:scale-95 transition-all flex items-center gap-1.5 text-xs font-semibold bg-slate-100/90 text-slate-700 hover:text-slate-900 border border-slate-200/70 shadow-xs relative"
              title="Pengaturan"
              aria-label="Pengaturan"
            >
              <Settings className="w-5 h-5 text-slate-700" />
              {notifEnabled && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile & iPad / Tablet Bottom Navigation Bar (Bawah Layar HP & iPad Seri Apapun: 2xl:hidden) */}
      <nav className="2xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#f0f4f8] px-4 py-2.5 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.06)] border-t border-slate-200 transition-all">
        <div className="max-w-md mx-auto grid grid-cols-3 items-center text-center relative z-10">
          {/* 1. Dashboard Harian */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 py-1 rounded-xl active:scale-95 transition-all ${
              activeTab === 'dashboard' ? 'text-slate-800 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[10px] sm:text-xs font-semibold">Dashboard</span>
          </button>

          {/* 2. Rekap Mingguan */}
          <button
            onClick={() => setActiveTab('weekly')}
            className={`flex flex-col items-center gap-1 py-1 rounded-xl active:scale-95 transition-all ${
              activeTab === 'weekly' ? 'text-slate-800 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[10px] sm:text-xs font-semibold">Rekap Mingguan</span>
          </button>

          {/* 3. Rekap Bulanan */}
          <button
            onClick={() => setActiveTab('recap')}
            className={`flex flex-col items-center gap-1 py-1 rounded-xl active:scale-95 transition-all ${
              activeTab === 'recap' ? 'text-slate-800 font-bold' : 'text-slate-400 hover:text-slate-600'
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

