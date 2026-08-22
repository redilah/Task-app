import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  CalendarDays,
  Calendar,
  AlertCircle,
  Tag
} from 'lucide-react';
import { 
  getTodayStr, 
  shiftDateByDays, 
  formatDateNumeric, 
  formatDateLabelNoYear 
} from '../utils/dateUtils';

export default function WeeklyRecap({ tasks = [] }) {
  const todayStr = useMemo(() => getTodayStr(), []);
  
  // State pilihan tab kapsul: '1week' (1 Minggu Lalu) atau '2weeks' (2 Minggu Lalu)
  const [selectedRange, setSelectedRange] = useState('1week');

  // Hitung rentang tanggal untuk 1 Minggu Lalu (-7 s/d -1 hari) dan 2 Minggu Lalu (-14 s/d -8 hari)
  const ranges = useMemo(() => {
    const oneWeekStart = shiftDateByDays(todayStr, -7);
    const oneWeekEnd = shiftDateByDays(todayStr, -1);

    const twoWeeksStart = shiftDateByDays(todayStr, -14);
    const twoWeeksEnd = shiftDateByDays(todayStr, -8);

    return {
      '1week': {
        key: '1week',
        label: '1 Minggu Lalu',
        start: oneWeekStart,
        end: oneWeekEnd,
        displayRange: `${formatDateLabelNoYear(oneWeekStart)} – ${formatDateLabelNoYear(oneWeekEnd)}`
      },
      '2weeks': {
        key: '2weeks',
        label: '2 Minggu Lalu',
        start: twoWeeksStart,
        end: twoWeeksEnd,
        displayRange: `${formatDateLabelNoYear(twoWeeksStart)} – ${formatDateLabelNoYear(twoWeeksEnd)}`
      }
    };
  }, [todayStr]);

  const activeConfig = ranges[selectedRange];

  // Helper untuk mendapatkan tanggal tugas
  const getTaskDateStr = (task) => {
    if (task.date) return task.date;
    if (task.createdAt) {
      const d = new Date(task.createdAt);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    return '';
  };

  // Filter tugas untuk rentang 1 minggu lalu
  const tasks1Week = useMemo(() => {
    const { start, end } = ranges['1week'];
    return tasks.filter(task => {
      const taskDate = getTaskDateStr(task);
      return taskDate >= start && taskDate <= end;
    });
  }, [tasks, ranges]);

  // Filter tugas untuk rentang 2 minggu lalu
  const tasks2Weeks = useMemo(() => {
    const { start, end } = ranges['2weeks'];
    return tasks.filter(task => {
      const taskDate = getTaskDateStr(task);
      return taskDate >= start && taskDate <= end;
    });
  }, [tasks, ranges]);

  // Tugas aktif berdasarkan kapsul yang dipilih
  const currentTasks = selectedRange === '1week' ? tasks1Week : tasks2Weeks;

  // Urutkan tugas: tanggal terbaru di atas
  const sortedTasks = useMemo(() => {
    return [...currentTasks].sort((a, b) => {
      const dateA = getTaskDateStr(a) + (a.time || '00:00');
      const dateB = getTaskDateStr(b) + (b.time || '00:00');
      return dateB.localeCompare(dateA);
    });
  }, [currentTasks]);

  // Statistik ringkasan
  const totalTasks = currentTasks.length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 sm:pb-12">
      {/* Header Rekap Mingguan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-xs font-semibold mb-2">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Riwayat & Rekap Mingguan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Rekap Mingguan
          </h1>
        </div>
      </div>

      {/* Apple-style Capsule Segmented Control (Pill dengan Animasi Sliding Smooth) */}
      <div className="bg-slate-200/80 p-1.5 rounded-full relative shadow-inner mb-6 border border-slate-300/60 max-w-xl mx-auto backdrop-blur-md">
        {/* Sliding Active Pill Background (Animasi Transisi Geser Khas iOS/Apple) */}
        <div 
          className="absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] bg-slate-900 rounded-full shadow-[0_4px_14px_rgba(15,23,42,0.28)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
          style={{
            transform: selectedRange === '1week' ? 'translateX(0%)' : 'translateX(calc(100% + 6px))'
          }}
        />

        {/* 2 Tombol Kapsul */}
        <div className="grid grid-cols-2 relative z-10">
          {/* Kapsul 1: 1 Minggu Lalu */}
          <button
            onClick={() => setSelectedRange('1week')}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-full transition-transform active:scale-95 select-none focus:outline-none"
          >
            <span className={`text-xs sm:text-sm font-bold transition-colors duration-200 ${
              selectedRange === '1week' ? 'text-white' : 'text-slate-600 hover:text-slate-900'
            }`}>
              1 Minggu Lalu
            </span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold transition-all duration-200 ${
              selectedRange === '1week' 
                ? 'bg-white/20 text-white' 
                : 'bg-slate-300 text-slate-700'
            }`}>
              {tasks1Week.length}
            </span>
          </button>

          {/* Kapsul 2: 2 Minggu Lalu */}
          <button
            onClick={() => setSelectedRange('2weeks')}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-full transition-transform active:scale-95 select-none focus:outline-none"
          >
            <span className={`text-xs sm:text-sm font-bold transition-colors duration-200 ${
              selectedRange === '2weeks' ? 'text-white' : 'text-slate-600 hover:text-slate-900'
            }`}>
              2 Minggu Lalu
            </span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold transition-all duration-200 ${
              selectedRange === '2weeks' 
                ? 'bg-white/20 text-white' 
                : 'bg-slate-300 text-slate-700'
            }`}>
              {tasks2Weeks.length}
            </span>
          </button>
        </div>
      </div>

      {/* Header List Tugas */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
          <span>Daftar Tugas</span>
          <span className="text-xs font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
            {totalTasks}
          </span>
        </h2>
        <span className="text-xs text-slate-400">
          Rentang: {activeConfig.displayRange}
        </span>
      </div>

      {/* Konten Daftar Tugas dengan Transisi Smooth */}
      <div key={selectedRange} className="animate-fade-in">
        {sortedTasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-xs">
            <div className="w-14 h-14 mx-auto mb-3.5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Calendar className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Tidak Ada Tugas Pada Rentang Ini
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
              Tidak ada riwayat tugas yang tercatat pada rentang tanggal {activeConfig.displayRange}.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTasks.map((task) => {
              const taskDate = getTaskDateStr(task);
              return (
                <div
                  key={task.id}
                  className={`bg-white rounded-2xl p-4 border transition-all shadow-xs flex items-start justify-between gap-3 ${
                    task.completed 
                      ? 'border-slate-200/70 opacity-80' 
                      : 'border-slate-200/90'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Status Indicator */}
                    <div className="mt-0.5 shrink-0">
                      {task.completed ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-rose-500">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Task Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm sm:text-base font-semibold leading-snug break-words ${
                        task.completed ? 'line-through text-slate-400' : 'text-slate-900'
                      }`}>
                        {task.title}
                      </h3>

                      {task.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 break-words">
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] sm:text-xs">
                        {/* Tanggal & Waktu */}
                        <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                          <CalendarDays className="w-3 h-3 text-slate-400" />
                          {taskDate ? formatDateNumeric(taskDate) : '-'} {task.time ? `• ${task.time}` : ''}
                        </span>

                        {/* Kategori */}
                        {task.category && (
                          <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md font-semibold">
                            <Tag className="w-3 h-3 text-indigo-400" />
                            {task.category}
                          </span>
                        )}

                        {/* Status Label */}
                        <span className={`px-2 py-0.5 rounded-md font-semibold ${
                          task.completed 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : 'bg-rose-50 text-rose-600'
                        }`}>
                          {task.completed ? 'Selesai' : 'Belum Selesai'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
