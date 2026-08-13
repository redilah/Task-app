import React from 'react';
import { Sparkles, Download, X, ShieldCheck, ArrowRight } from 'lucide-react';

export default function UpdateModal({ isOpen, onClose, updateInfo }) {
  if (!isOpen || !updateInfo) return null;

  const handleDownloadUpdate = () => {
    const rawUrl = updateInfo?.apkUrl || 'https://raw.githubusercontent.com/redilah/Task-app/main/Puncak.apk';
    const cleanUrl = rawUrl.split('?')[0] + `?t=${Date.now()}`;
    window.open(cleanUrl, '_system') || (window.location.href = cleanUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden text-slate-900 transform transition-all">
        {/* Top Header Banner */}
        <div className="bg-slate-900 text-white px-6 pt-7 pb-6 relative text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Sparkles className="w-6 h-6 text-emerald-400" />
          </div>

          <h3 className="text-xl font-extrabold tracking-tight">
            Pembaruan Aplikasi
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Versi baru Puncak telah rilis
          </p>
        </div>

        {/* Body Content */}
        <div className="p-6 text-center space-y-6">
          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
            Perbarui aplikasi sekarang untuk menikmati peningkatan performa dan fitur terbaru.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleDownloadUpdate}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 transition-all active:scale-[0.98]"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Update Sekarang</span>
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 text-slate-400 hover:text-slate-700 text-xs font-semibold rounded-xl transition-all"
            >
              Nanti Saja
            </button>
          </div>
        </div>
      </div>
    </div>
  );


}

