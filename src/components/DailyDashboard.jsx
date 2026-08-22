import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Circle, Plus, Trash2, Edit3, Filter, 
  Calendar as CalendarIcon, Tag, AlertCircle, Sparkles, Search, Check, Lock, Clock
} from 'lucide-react';
import { getTodayStr, formatDateNumeric, isTaskExpired, isPastDate } from '../utils/dateUtils';

export default function DailyDashboard({ 
  tasks, 
  selectedDate: propSelectedDate,
  setSelectedDate: propSetSelectedDate,
  onToggleTask, 
  onDeleteTask, 
  onOpenAddTask, 
  onOpenEditTask 
}) {
  const [todayStr, setTodayStr] = useState(() => getTodayStr());
  const selectedDate = propSelectedDate || todayStr;
  const setSelectedDate = propSetSelectedDate || (() => {});
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'completed'
  const [filterPriority, setFilterPriority] = useState('all'); // 'all', 'high', 'medium', 'low'
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyDate, setShowOnlyDate] = useState(true); // true = filter exact date, false = all dates

  // Auto-refresh tanggal hari ini bila aplikasi kembali aktif (resume) atau pergantian jam 00:00
  useEffect(() => {
    const handleCheckDate = () => {
      const currentRealToday = getTodayStr();
      setTodayStr(prevToday => {
        if (prevToday !== currentRealToday) {
          // Jika tanggal berganti dan user sedang di tab 'Hari Ini', perbarui selectedDate ke tanggal baru
          setSelectedDate(prevSel => (prevSel === prevToday ? currentRealToday : prevSel));
          return currentRealToday;
        }
        return prevToday;
      });
    };

    window.addEventListener('focus', handleCheckDate);
    document.addEventListener('visibilitychange', handleCheckDate);
    const timer = setInterval(handleCheckDate, 60000); // Check setiap 1 menit

    return () => {
      window.removeEventListener('focus', handleCheckDate);
      document.removeEventListener('visibilitychange', handleCheckDate);
      clearInterval(timer);
    };
  }, []);

  // Filtering tasks
  const filteredTasks = tasks.filter(task => {
    // Date filter
    if (showOnlyDate && task.date !== selectedDate) return false;

    // Status filter
    if (filterStatus === 'completed' && !task.completed) return false;
    if (filterStatus === 'active' && task.completed) return false;

    // Priority filter
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;

    // Search query filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchCategory = task.category ? task.category.toLowerCase().includes(q) : false;
      if (!matchTitle && !matchCategory) return false;
    }

    return true;
  });

  // Calculate day stats
  const dayTotal = showOnlyDate ? tasks.filter(t => t.date === selectedDate).length : tasks.length;
  const dayCompleted = showOnlyDate 
    ? tasks.filter(t => t.date === selectedDate && t.completed).length 
    : tasks.filter(t => t.completed).length;
  const progressPercent = dayTotal > 0 ? Math.round((dayCompleted / dayTotal) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 pt-6 pb-28 2xl:pb-12">
      {/* Top Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Dashboard Tugas Harian</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {showOnlyDate ? (selectedDate === todayStr ? 'Hari Ini' : formatDateNumeric(selectedDate)) : 'Semua Tanggal'}
            </h1>
          </div>

          <button
            onClick={() => onOpenAddTask(selectedDate)}
            disabled={isPastDate(selectedDate)}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all ${
              isPastDate(selectedDate)
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-95'
            }`}
            title={isPastDate(selectedDate) ? 'Tidak dapat menambahkan tugas untuk hari/bulan yang sudah lewat' : 'Tambah Tugas Baru'}
          >
            {isPastDate(selectedDate) ? <Lock className="w-4 h-4 text-slate-400" /> : <Plus className="w-4 h-4" />}
            <span>{isPastDate(selectedDate) ? 'Terkunci (Hari Lalu)' : 'Tambah Tugas Baru'}</span>
          </button>
        </div>

        {/* Progress Bar Widget */}
        <div className="mt-5 pt-4">
          <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
            <span className="font-semibold text-slate-700">Progres Penyelesaian</span>
            <span className="font-bold text-slate-900">{dayCompleted} dari {dayTotal} Selesai ({progressPercent}%)</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-slate-900 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm mb-6 space-y-3">
        {/* Date Selector & Mode */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => {
                setSelectedDate(todayStr);
                setShowOnlyDate(true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                showOnlyDate && selectedDate === todayStr
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Hari Ini
            </button>

            <button
              onClick={() => setShowOnlyDate(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                !showOnlyDate
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Tanggal
            </button>

            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg text-xs text-slate-700 shrink-0">
              <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setShowOnlyDate(true);
                }}
                className="bg-transparent font-medium focus:outline-none cursor-pointer text-xs"
              />
            </div>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari tugas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Status & Priority Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden sm:inline">Status:</span>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                filterStatus === 'all' ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Semua ({showOnlyDate ? tasks.filter(t => t.date === selectedDate).length : tasks.length})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                filterStatus === 'active' ? 'bg-amber-100 text-amber-900 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Belum Selesai
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                filterStatus === 'completed' ? 'bg-emerald-100 text-emerald-900 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Selesai
            </button>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden sm:inline">Prioritas:</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-slate-50 rounded-md px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none shadow-2xs"
            >
              <option value="all">Semua Prioritas</option>
              <option value="high">🔴 Tinggi</option>
              <option value="medium">🟡 Sedang</option>
              <option value="low">🟢 Rendah</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List / Checklist */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-700">Tidak ada tugas ditemukan</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {tasks.length === 0 
                ? 'Belum ada tugas tercatat. Klik tombol Tambah Tugas untuk membuat tugas pertamamu!' 
                : 'Coba ganti filter tanggal atau kata kunci pencarian.'}
            </p>
            <button
              onClick={onOpenAddTask}
              className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-all shadow-xs"
            >
              + Buat Tugas Baru
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const expired = isTaskExpired(task);

            return (
              <div
                key={task.id}
                className={`group bg-white p-3.5 sm:p-4 rounded-xl transition-all flex items-start sm:items-center justify-between gap-3 shadow-sm hover:shadow-md ${
                  task.completed ? 'bg-slate-50/60' : expired ? 'bg-rose-50/30 border border-rose-100' : ''
                }`}
              >
                {/* Left Checkbox & Details */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {/* Kondisi Tombol Centang */}
                  {expired ? (
                    // 1. Sudah lewat tengah malam (Hari lewat) -> KUNCI TOTAL / TERKUNCI MATI
                    task.completed ? (
                      <div 
                        className="mt-0.5 sm:mt-0 w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 cursor-not-allowed opacity-90"
                        title="Tugas selesai & hari telah lewat (Terkunci)"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div 
                        className="mt-0.5 sm:mt-0 w-5 h-5 rounded-lg bg-rose-100 text-rose-500 flex items-center justify-center shrink-0 cursor-not-allowed"
                        title="Hari telah berganti. Tugas tidak dapat dicentang lagi."
                      >
                        <Lock className="w-3 h-3" />
                      </div>
                    )
                  ) : (
                    // 2. Masih di hari yang sama -> BISA DITEKAN & DIBATALKAN BEBAS
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className={`mt-0.5 sm:mt-0 w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-all active:scale-90 cursor-pointer ${
                        task.completed 
                          ? 'bg-slate-900 text-white shadow-xs' 
                          : 'bg-slate-200/70 hover:bg-slate-300/80 text-slate-400'
                      }`}
                      aria-label="Toggle status selesai"
                    >
                      {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span 
                        onClick={() => {
                          if (!expired) onToggleTask(task.id);
                        }}
                        className={`text-xs sm:text-sm font-semibold transition-all leading-snug break-words ${
                          task.completed 
                            ? 'line-through text-slate-400 cursor-pointer' 
                            : expired 
                            ? 'text-slate-500 line-through decoration-rose-400 cursor-default' 
                            : 'text-slate-900 cursor-pointer'
                        }`}
                      >
                        {task.title}
                      </span>

                      {/* Priority Badge */}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        task.priority === 'high' ? 'bg-rose-50 text-rose-600' :
                        task.priority === 'medium' ? 'bg-amber-50 text-amber-700' :
                        'bg-emerald-50 text-emerald-700'
                      }`}>
                        {task.priority === 'high' ? '🔴 Tinggi' : task.priority === 'medium' ? '🟡 Sedang' : '🟢 Rendah'}
                      </span>

                      {/* Category Badge */}
                      {task.category && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">
                          {task.category}
                        </span>
                      )}

                      {/* Status Badges */}
                      {expired && !task.completed && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Kedaluwarsa
                        </span>
                      )}
                    </div>

                    {/* Task Meta (Date Only) */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3 text-slate-400" />
                        {formatDateNumeric(task.date)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 shrink-0 self-center">
                  <button
                    onClick={() => onOpenEditTask(task)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                    title="Edit Tugas"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="Hapus Tugas"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
