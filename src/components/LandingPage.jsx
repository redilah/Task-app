import React from 'react';
import { CheckCircle2, ArrowRight, Calendar, BarChart2, ShieldCheck, Sparkles, Clock, AlertCircle } from 'lucide-react';

export default function LandingPage({ onGoToDashboard, onOpenAddTask, tasks = [] }) {
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#f0f4f8] pb-20 md:pb-12">
      {/* Hero Section */}
      <section className="relative pt-8 pb-12 sm:pt-16 sm:pb-20 px-4 sm:px-6 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white text-xs sm:text-sm font-medium text-slate-700 shadow-sm mb-6 animate-fade-in">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Solusi Manajemen Tugas Harian & Rekap Bulanan</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
          Tulis Tugas Harianmu, <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent">
            Centang Saat Selesai, Rekap Otomatis.
          </span>
        </h1>

        <p className="mt-4 sm:mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
          Platform mencatat tugas harian, tugas kuliah/sekolah, hingga project harian dengan tampilan putih bersih yang nyaman dipandang dan analisis statistik bulanan.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-sm sm:max-w-none mx-auto">
          <button
            onClick={onGoToDashboard}
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 group"
          >
            <span>Buka Dashboard</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
          
          <button
            onClick={onOpenAddTask}
            className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm sm:text-base shadow-sm transition-all active:scale-95"
          >
            + Tambah Tugas Baru
          </button>
        </div>

        {/* Live Preview Card Widget */}
        <div className="mt-12 sm:mt-16 bg-white rounded-2xl p-4 sm:p-6 shadow-md text-left max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Preview Live Progress Hari Ini</span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">Tugas Hari Ini</h3>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-xl shadow-2xs self-start sm:self-auto">
              <div className="w-full sm:w-32 bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-slate-900 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <span className="text-xs font-bold text-slate-700">{progressPercent}%</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {tasks.slice(0, 3).map((task) => (
              <div 
                key={task.id} 
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 shadow-2xs hover:shadow-xs transition-all text-xs sm:text-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    task.completed ? 'bg-emerald-500 text-white shadow-xs' : 'bg-slate-200/80 text-slate-400'
                  }`}>
                    {task.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <span className={`truncate font-medium ${task.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {task.title}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold shrink-0 ${
                  task.priority === 'high' ? 'bg-rose-50 text-rose-600' :
                  task.priority === 'medium' ? 'bg-amber-50 text-amber-600' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {task.priority === 'high' ? 'Tinggi' : task.priority === 'medium' ? 'Sedang' : 'Rendah'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-12 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Mengapa Memakai Taskly?</h2>
          <p className="text-slate-600 text-sm sm:text-base mt-2">Didesain khusus untuk meningkatkan produktivitas harian secara ringkas dan rapi.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Centang Penyelesaian</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Tandai tugas yang telah diselesaikan dengan 1 klik mudah dan rasakan kepuasan mencentang target harian.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Filter Harian & Bulan</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Atur tampilan tugas per tanggal spesifik atau pilih filter bulan untuk fokus pada tenggat waktu.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 font-bold">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Label Prioritas</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Tandai prioritas Tinggi, Sedang, atau Rendah agar tugas krusial tidak terlewat.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 font-bold">
              <BarChart2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Rekap Analytics Bulanan</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Lihat total tugas dibuat, yang telah diselesaikan, belum selesai, dan grafik aktivitas dalam 1 bulan.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="py-10 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Siap Menyelesaikan Tugas Hari Ini?</h2>
          <p className="mt-2 text-slate-300 text-xs sm:text-sm max-w-md mx-auto">
            Mulai catat tugasmu sekarang. Gratis, tanpa perlu login, dan langsung tersimpan di browsermu.
          </p>
          <button
            onClick={onGoToDashboard}
            className="mt-6 px-6 py-3 bg-white text-slate-900 font-semibold rounded-xl text-sm hover:bg-slate-100 transition-all shadow-sm active:scale-95"
          >
            Mulai Kelola Tugas Now
          </button>
        </div>
      </section>
    </div>
  );
}
