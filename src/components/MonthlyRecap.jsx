import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Calendar, CheckCircle2, XCircle, BarChart3, TrendingUp, 
  ChevronLeft, ChevronRight, FileText, Tag, Filter, ChevronDown, Check
} from 'lucide-react';
import { formatDateNumeric } from '../utils/dateUtils';

export default function MonthlyRecap({ tasks = [] }) {
  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Click outside to close custom dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const y = prevDate.getFullYear();
    const m = String(prevDate.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${y}-${m}`);
    setSelectedCategory('all');
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(year, month, 1);
    const y = nextDate.getFullYear();
    const m = String(nextDate.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${y}-${m}`);
    setSelectedCategory('all');
  };

  // 1. Filter tasks untuk bulan terpilih (Semua Tugas Bulan Ini)
  const monthTasks = useMemo(() => {
    return tasks.filter(task => {
      if (!task.date) return task.createdMonth === selectedMonth;
      return task.date.slice(0, 7) === selectedMonth;
    });
  }, [tasks, selectedMonth]);

  // Statistik Utama Keseluruhan Bulan Ini
  const totalCreated = monthTasks.length;
  const totalCompleted = monthTasks.filter(t => t.completed).length;
  const totalUncompleted = totalCreated - totalCompleted;
  const completionRate = totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0;

  // 2. Daftar Kategori Unik yang Pernah Ditulis/Dibuat Pengguna di Bulan Ini
  const userWrittenCategories = useMemo(() => {
    const map = {};
    monthTasks.forEach(t => {
      if (t.category && t.category.trim()) {
        const catName = t.category.trim();
        map[catName] = (map[catName] || 0) + 1;
      }
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [monthTasks]);

  // 3. Rincian Tugas yang difilter oleh Dropdown Kategori
  const filteredListTasks = useMemo(() => {
    if (selectedCategory === 'all') return monthTasks;
    return monthTasks.filter(t => (t.category || '').trim() === selectedCategory);
  }, [monthTasks, selectedCategory]);

  // Format Month Title (Indonesian)
  const formatMonthTitle = (monthStr) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  // Generate Daily Activity Chart Data for all days in the selected month
  const [yearNum, monthNum] = selectedMonth.split('-').map(Number);
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

  const dailyActivityMap = {};
  for (let d = 1; d <= daysInMonth; d++) {
    const dayPadded = String(d).padStart(2, '0');
    const fullDate = `${selectedMonth}-${dayPadded}`;
    dailyActivityMap[fullDate] = { day: d, total: 0, completed: 0, uncompleted: 0 };
  }

  monthTasks.forEach(t => {
    if (t.date && dailyActivityMap[t.date]) {
      dailyActivityMap[t.date].total += 1;
      if (t.completed) dailyActivityMap[t.date].completed += 1;
      else dailyActivityMap[t.date].uncompleted += 1;
    }
  });

  const dailyActivityArray = Object.keys(dailyActivityMap).map(dateKey => dailyActivityMap[dateKey]);
  const maxTasksInDay = Math.max(...dailyActivityArray.map(a => a.total), 1);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 pt-6 pb-28 2xl:pb-12">
      {/* Month Selector Banner (Clean Top) */}
      <div className="bg-white p-5 rounded-2xl shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5" />
            <span>Laporan & Analytics Bulanan</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
            Rekap {formatMonthTitle(selectedMonth)}
          </h1>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl shadow-2xs w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-white rounded-lg transition-all text-slate-700 hover:text-slate-900 shadow-2xs active:scale-95 cursor-pointer"
            title="Bulan Sebelumnya"
            type="button"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
          
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setSelectedCategory('all');
            }}
            className="bg-transparent font-bold text-xs sm:text-sm text-slate-800 text-center focus:outline-none cursor-pointer px-2"
          />

          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-white rounded-lg transition-all text-slate-700 hover:text-slate-900 shadow-2xs active:scale-95 cursor-pointer"
            title="Bulan Berikutnya"
            type="button"
          >
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* 4 Summary Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {/* Card 1: Total Created */}
        <div className="bg-white p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Tugas Dibuat</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalCreated}</div>
          <p className="text-[11px] text-slate-500 mt-1">Total tugas bulan ini</p>
        </div>

        {/* Card 2: Completed */}
        <div className="bg-white p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-emerald-500 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Selesai</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{totalCompleted}</div>
          <p className="text-[11px] text-slate-500 mt-1">Tugas berhasil dicentang</p>
        </div>

        {/* Card 3: Uncompleted */}
        <div className="bg-white p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-rose-500 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Belum Selesai</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-600">{totalUncompleted}</div>
          <p className="text-[11px] text-slate-500 mt-1">Belum diselesaikan</p>
        </div>

        {/* Card 4: Rate (%) */}
        <div className="bg-white p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-purple-500 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Rate Selesai</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{completionRate}%</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div 
              className="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Daily Activity Chart Section */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-slate-800" />
            <h2 className="text-base font-bold text-slate-900">Grafik Aktivitas Penyelesaian Harian</h2>
          </div>
          <span className="text-xs text-slate-500 font-semibold">{formatMonthTitle(selectedMonth)}</span>
        </div>

        {totalCreated === 0 ? (
          <div className="py-12 text-center bg-slate-50/70 rounded-xl shadow-2xs">
            <BarChart3 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">Belum Ada Aktivitas Tugas di Bulan Ini</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Tambahkan tugas harian pada bulan {formatMonthTitle(selectedMonth)} untuk melihat grafik aktivitas Anda di sini.
            </p>
          </div>
        ) : (
          <div className="pt-4 pb-2">
            <div className="h-48 flex items-end justify-between gap-1 sm:gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
              {dailyActivityArray.map((item) => {
                const total = item.total;
                const completed = item.completed;
                
                const barHeightPercent = total > 0 ? Math.max(Math.round((total / maxTasksInDay) * 100), 20) : 0;
                const completedRatio = total > 0 ? (completed / total) * 100 : 0;

                return (
                  <div 
                    key={item.day} 
                    className="flex flex-col items-center flex-1 min-w-[16px] h-full justify-end group relative"
                  >
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-9 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-md pointer-events-none whitespace-nowrap z-30 shadow-md">
                      Tgl {item.day}: {completed} Selesai / {total} Total
                    </div>

                    {total > 0 && (
                      <span className="text-[10px] font-bold text-slate-700 mb-1">
                        {total}
                      </span>
                    )}

                    <div 
                      className="w-full max-w-[20px] bg-slate-100 rounded-t-md flex items-end overflow-hidden transition-all duration-300 relative"
                      style={{ height: total > 0 ? `${barHeightPercent}%` : '4px' }}
                    >
                      {total > 0 ? (
                        <div className="w-full h-full bg-slate-900 flex flex-col justify-end">
                          <div 
                            className="w-full bg-emerald-500 transition-all duration-300"
                            style={{ height: `${completedRatio}%` }}
                          ></div>
                        </div>
                      ) : (
                        <div className="w-full h-1 bg-slate-200/80 rounded-full"></div>
                      )}
                    </div>

                    <span className={`text-[10px] font-semibold mt-1.5 ${
                      total > 0 ? 'text-slate-900 font-bold' : 'text-slate-400'
                    }`}>
                      {item.day}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-6 mt-4 pt-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-xs bg-emerald-500"></div>
                <span className="text-slate-700 font-medium">Tugas Selesai</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-xs bg-slate-900"></div>
                <span className="text-slate-700 font-medium">Belum Diselesaikan</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rincian Daftar Tugas Bulanan */}
      <div className="bg-white p-5 rounded-2xl shadow-sm">
        {/* Section Header & Dropdown Pilihan Kategori */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Rincian Tugas Bulan Ini</h2>
            <p className="text-xs text-slate-400 mt-0.5">{filteredListTasks.length} tugas ditampilkan</p>
          </div>

          {/* Dropdown Kategori Kustom yang Mewah di Atas Rincian Tugas */}
          {userWrittenCategories.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 active:scale-[0.98] border border-slate-200/90 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-between gap-2.5 transition-all cursor-pointer shadow-2xs min-w-[190px]"
              >
                <div className="flex items-center gap-2 truncate">
                  <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {selectedCategory === 'all' 
                      ? `Semua Kategori (${monthTasks.length})` 
                      : `${selectedCategory} (${userWrittenCategories.find(c => c.name === selectedCategory)?.count || 0})`
                    }
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                  isDropdownOpen ? 'rotate-180 text-slate-700' : ''
                }`} />
              </button>

              {/* Floating Custom Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-30 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl p-1.5 animate-apple-pop space-y-0.5 max-h-64 overflow-y-auto">
                  {/* Option: Semua Kategori */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('all');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                      selectedCategory === 'all'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>Semua Kategori</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                      selectedCategory === 'all' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {monthTasks.length}
                    </span>
                  </button>

                  <div className="h-px bg-slate-100 my-1 mx-1"></div>

                  {/* Options: Kategori Pengguna */}
                  {userWrittenCategories.map(cat => {
                    const isSelected = selectedCategory === cat.name;
                    return (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat.name);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate pr-2">{cat.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold shrink-0 ${
                          isSelected ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {cat.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Task List */}
        {filteredListTasks.length === 0 ? (
          <div className="text-center py-8 bg-slate-50/50 rounded-xl shadow-2xs">
            <p className="text-slate-500 text-xs sm:text-sm">
              {monthTasks.length === 0 
                ? `Tidak ada tugas tercatat pada bulan ${formatMonthTitle(selectedMonth)}.`
                : `Tidak ada tugas dengan kategori "${selectedCategory}" pada bulan ini.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredListTasks.map((task, index) => (
              <div key={task.id} className="py-3 px-2 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-between gap-3 text-xs sm:text-sm">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-500 shrink-0">{index + 1}.</span>
                    <span className={`font-semibold ${task.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {task.title}
                    </span>
                    {task.category && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">
                        {task.category}
                      </span>
                    )}
                    {task.time && (
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">
                        🕒 {task.time}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5 pl-5">Tanggal: {formatDateNumeric(task.date)}</span>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                  task.completed 
                    ? 'bg-emerald-50 text-emerald-700' 
                    : 'bg-rose-50 text-rose-700'
                }`}>
                  {task.completed ? '✓ Selesai' : '✕ Belum Diselesaikan'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
