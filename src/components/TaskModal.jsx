import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Check, CalendarDays, Clock, Calendar as CalendarIcon, ChevronRight } from 'lucide-react';
import { 
  getTodayStr, isPastDate, getFutureDates, formatFullDateTimeIndo, 
  addHoursToTime, formatDateLabelNoYear, formatDateTimeNoYear, shiftDateByDays 
} from '../utils/dateUtils';

// Komponen Custom Wheel Picker dengan Inertial Momentum, Magnetic Snap & Infinite Loop (Jam/Menit)
const ITEM_HEIGHT = 44; // px per item (Tinggi baris aktif)

function CustomWheelPickerColumn({ items, selectedValue, onSelect, isDate = false, isInfinite = false }) {
  const containerRef = useRef(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const currentOffsetY = useRef(0);
  const animFrameId = useRef(null);

  // Velocity tracking buffer untuk sentuhan & drag inersia alami (fling physics)
  const historyRef = useRef([]); // [{ y, time }]

  const totalItems = items.length;

  // Temukan initial index
  const getIndexFromVal = useCallback((val) => {
    const idx = items.findIndex(it => it.value === val);
    return idx >= 0 ? idx : 0;
  }, [items]);

  const [offsetY, setOffsetY] = useState(() => -getIndexFromVal(selectedValue) * ITEM_HEIGHT);

  // Sync saat selectedValue berubah dari luar
  useEffect(() => {
    if (!isDragging.current) {
      const targetIdx = getIndexFromVal(selectedValue);
      if (isInfinite) {
        // Cari posisi virtual terdekat agar transisinya tidak melompat
        const currentIdx = Math.round(-currentOffsetY.current / ITEM_HEIGHT);
        const modCurrent = ((currentIdx % totalItems) + totalItems) % totalItems;
        let diff = targetIdx - modCurrent;
        if (diff > totalItems / 2) diff -= totalItems;
        if (diff < -totalItems / 2) diff += totalItems;
        const newVirtualIdx = currentIdx + diff;
        const targetOffset = -newVirtualIdx * ITEM_HEIGHT;
        currentOffsetY.current = targetOffset;
        setOffsetY(targetOffset);
      } else {
        const targetOffset = -targetIdx * ITEM_HEIGHT;
        currentOffsetY.current = targetOffset;
        setOffsetY(targetOffset);
      }
    }
  }, [selectedValue, getIndexFromVal, isInfinite, totalItems]);

  const commitSelection = useCallback((finalOffset) => {
    let rawIndex = Math.round(-finalOffset / ITEM_HEIGHT);
    let selectedItem;
    if (isInfinite) {
      const normalizedIndex = ((rawIndex % totalItems) + totalItems) % totalItems;
      selectedItem = items[normalizedIndex];
    } else {
      rawIndex = Math.max(0, Math.min(totalItems - 1, rawIndex));
      selectedItem = items[rawIndex];
    }
    if (selectedItem && selectedItem.value !== selectedValue) {
      onSelect(selectedItem.value);
    }
  }, [items, isInfinite, onSelect, selectedValue, totalItems]);

  const startInertialSnap = useCallback((startOffset, initialVelocity = 0) => {
    if (animFrameId.current) cancelAnimationFrame(animFrameId.current);

    let currentPos = startOffset;
    // Batasi kecepatan maksimal agar tidak meluncur liar/terlalu licin
    let vel = Math.max(-25, Math.min(25, initialVelocity * 0.65));
    const friction = 0.88; // Gesekan alami yang pas (berbobot, tidak licin seperti es)

    const step = () => {
      if (Math.abs(vel) > 0.6) {
        currentPos += vel;
        vel *= friction;

        // Boundary resistance untuk non-infinite
        if (!isInfinite) {
          const maxOffset = 0;
          const minOffset = -(totalItems - 1) * ITEM_HEIGHT;
          if (currentPos > maxOffset + 25) {
            currentPos = maxOffset + 25;
            vel = 0;
          } else if (currentPos < minOffset - 25) {
            currentPos = minOffset - 25;
            vel = 0;
          }
        }

        currentOffsetY.current = currentPos;
        setOffsetY(currentPos);
        animFrameId.current = requestAnimationFrame(step);
      } else {
        // Magnetic spring snap ke integer index terdekat
        let targetIndex = Math.round(-currentPos / ITEM_HEIGHT);
        if (!isInfinite) {
          targetIndex = Math.max(0, Math.min(totalItems - 1, targetIndex));
        }
        const targetOffset = -targetIndex * ITEM_HEIGHT;

        // Smooth spring settle
        const settleStep = () => {
          const diff = targetOffset - currentOffsetY.current;
          if (Math.abs(diff) > 0.4) {
            currentOffsetY.current += diff * 0.32;
            setOffsetY(currentOffsetY.current);
            animFrameId.current = requestAnimationFrame(settleStep);
          } else {
            currentOffsetY.current = targetOffset;
            setOffsetY(targetOffset);
            commitSelection(targetOffset);
          }
        };
        settleStep();
      }
    };

    animFrameId.current = requestAnimationFrame(step);
  }, [commitSelection, isInfinite, totalItems]);

  // Helper untuk menghitung kecepatan lemparan (fling velocity) dari 100ms terakhir
  const computeFlingVelocity = () => {
    const now = Date.now();
    const recent = historyRef.current.filter(p => now - p.time <= 100);
    if (recent.length < 2) return 0;
    const first = recent[0];
    const last = recent[recent.length - 1];
    const dt = last.time - first.time;
    if (dt <= 0) return 0;
    const dy = last.y - first.y;
    return (dy / dt) * 16.6;
  };

  // Touch Handlers
  const handleTouchStart = (e) => {
    if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    isDragging.current = true;
    const pageY = e.touches[0].pageY;
    startY.current = pageY;
    historyRef.current = [{ y: pageY, time: Date.now() }];
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    const pageY = e.touches[0].pageY;
    const now = Date.now();
    const prevHistory = historyRef.current;
    const lastPoint = prevHistory[prevHistory.length - 1];
    const deltaY = pageY - lastPoint.y;

    historyRef.current.push({ y: pageY, time: now });
    if (historyRef.current.length > 20) historyRef.current.shift();

    let newOffset = currentOffsetY.current + deltaY;

    // Resistance saat drag melebihi batas (untuk non-infinite)
    if (!isInfinite) {
      const maxOffset = 0;
      const minOffset = -(totalItems - 1) * ITEM_HEIGHT;
      if (newOffset > maxOffset) {
        newOffset = maxOffset + (newOffset - maxOffset) * 0.35;
      } else if (newOffset < minOffset) {
        newOffset = minOffset + (newOffset - minOffset) * 0.35;
      }
    }

    currentOffsetY.current = newOffset;
    setOffsetY(newOffset);
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const flingVel = computeFlingVelocity();
    startInertialSnap(currentOffsetY.current, flingVel);
  };

  // Mouse Drag Handlers (untuk testing mulus di PC/Localhost)
  const handleMouseDown = (e) => {
    if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    isDragging.current = true;
    startY.current = e.pageY;
    historyRef.current = [{ y: e.pageY, time: Date.now() }];

    const onMouseMove = (ev) => {
      if (!isDragging.current) return;
      const now = Date.now();
      const prevHistory = historyRef.current;
      const lastPoint = prevHistory[prevHistory.length - 1];
      const deltaY = ev.pageY - lastPoint.y;

      historyRef.current.push({ y: ev.pageY, time: now });
      if (historyRef.current.length > 20) historyRef.current.shift();

      let newOffset = currentOffsetY.current + deltaY;
      if (!isInfinite) {
        const maxOffset = 0;
        const minOffset = -(totalItems - 1) * ITEM_HEIGHT;
        if (newOffset > maxOffset) {
          newOffset = maxOffset + (newOffset - maxOffset) * 0.35;
        } else if (newOffset < minOffset) {
          newOffset = minOffset + (newOffset - minOffset) * 0.35;
        }
      }
      currentOffsetY.current = newOffset;
      setOffsetY(newOffset);
    };

    const onMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      const flingVel = computeFlingVelocity();
      startInertialSnap(currentOffsetY.current, flingVel);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Wheel (Mouse scroll) handler dengan inersia terkalibrasi per step
  const handleWheel = (e) => {
    e.preventDefault();
    if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    startInertialSnap(currentOffsetY.current, -Math.sign(e.deltaY) * 6);
  };

  // Render 3 baris dinamis (Atas, Tengah/Aktif, Bawah)
  const baseIndex = Math.round(-offsetY / ITEM_HEIGHT);
  const visualIndices = [-2, -1, 0, 1, 2]; // Render 5 jendela agar saat scrolling cepat angka selalu terlihat utuh di atas & bawah

  return (
    <div 
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      className="h-[132px] relative overflow-hidden select-none cursor-grab active:cursor-grabbing touch-none"
    >
      <div 
        className="w-full relative pointer-events-none"
        style={{ height: `${ITEM_HEIGHT}px`, top: `${ITEM_HEIGHT}px` }}
      >
        {visualIndices.map((delta) => {
          const virtualIdx = baseIndex + delta;
          let realIdx;
          if (isInfinite) {
            realIdx = ((virtualIdx % totalItems) + totalItems) % totalItems;
          } else {
            if (virtualIdx < 0 || virtualIdx >= totalItems) return null;
            realIdx = virtualIdx;
          }
          const item = items[realIdx];
          if (!item) return null;

          const itemPos = (virtualIdx * ITEM_HEIGHT) + offsetY;
          const isCenter = Math.abs(itemPos) < ITEM_HEIGHT * 0.45;

          return (
            <div
              key={`${item.id || item.value}-${virtualIdx}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: `${ITEM_HEIGHT}px`,
                transform: `translateY(${itemPos}px)`,
                lineHeight: `${ITEM_HEIGHT}px`
              }}
              className={`flex items-center justify-center transition-opacity text-center ${
                isCenter
                  ? isDate
                    ? 'text-[18px] font-extrabold text-blue-600 -translate-y-0.5 tracking-tight scale-105 opacity-100'
                    : 'text-[22px] font-extrabold text-blue-600 -translate-y-0.5 scale-110 opacity-100'
                  : isDate
                    ? 'text-[14px] font-semibold text-slate-400 opacity-60'
                    : 'text-[15px] font-bold text-slate-400 opacity-60'
              }`}
            >
              {item.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TaskModal({ isOpen, onClose, onSave, editingTask = null }) {
  const todayStr = getTodayStr();

  const getDefaultCurrentTime = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    return `${h}:00`;
  };

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  
  const [fromDate, setFromDate] = useState(todayStr);
  const [fromTime, setFromTime] = useState(getDefaultCurrentTime());

  const [toDate, setToDate] = useState(todayStr);
  const [toTime, setToTime] = useState(() => addHoursToTime(getDefaultCurrentTime(), 1));

  const [customPickerOpen, setCustomPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState('from'); 
  const [tempDate, setTempDate] = useState(todayStr);
  const [tempHour, setTempHour] = useState(11);
  const [tempMinute, setTempMinute] = useState(0);

  // List tanggal dinamis otomatis bergeser mengikuti waktu (1 tahun ke belakang s/d 10 tahun / 3650 hari ke depan)
  const dateItems = useMemo(() => {
    const list = [];
    for (let i = -365; i <= 3650; i++) {
      const dStr = shiftDateByDays(todayStr, i);
      list.push({
        id: `d-${dStr}`,
        value: dStr,
        label: formatDateLabelNoYear(dStr)
      });
    }
    return list;
  }, [todayStr]);

  // List jam (00 - 23)
  const hourItems = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const hStr = String(i).padStart(2, '0');
      return {
        id: `h-${hStr}`,
        value: i,
        label: hStr
      };
    });
  }, []);

  // List menit (00 - 59)
  const minuteItems = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => {
      const mStr = String(i).padStart(2, '0');
      return {
        id: `m-${mStr}`,
        value: i,
        label: mStr
      };
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (editingTask) {
        setTitle(editingTask.title || '');
        setCategory(editingTask.category || '');
        setPriority(editingTask.priority || 'medium');
        setFromDate(editingTask.date || todayStr);
        setFromTime(editingTask.time || getDefaultCurrentTime());
        setToDate(editingTask.toDate || editingTask.date || todayStr);
        setToTime(editingTask.toTime || addHoursToTime(editingTask.time || getDefaultCurrentTime(), 1));
      } else {
        setTitle('');
        setCategory('');
        setPriority('medium');
        setFromDate(todayStr);
        const currTime = getDefaultCurrentTime();
        setFromTime(currTime);
        setToDate(todayStr);
        setToTime(addHoursToTime(currTime, 1));
      }
      setCustomPickerOpen(false);
    }
  }, [isOpen, editingTask]);

  const openCustomPicker = (mode) => {
    setPickerMode(mode);
    if (mode === 'from') {
      setTempDate(fromDate || todayStr);
      const [h, m] = (fromTime || '11:00').split(':').map(Number);
      setTempHour(isNaN(h) ? 11 : h);
      setTempMinute(isNaN(m) ? 0 : m);
    } else {
      setTempDate(toDate || fromDate || todayStr);
      const [h, m] = (toTime || '12:00').split(':').map(Number);
      setTempHour(isNaN(h) ? 12 : h);
      setTempMinute(isNaN(m) ? 0 : m);
    }
    setCustomPickerOpen(true);
  };

  const handleConfirmCustomPicker = () => {
    const formattedTime = `${String(tempHour).padStart(2, '0')}:${String(tempMinute).padStart(2, '0')}`;
    if (pickerMode === 'from') {
      setFromDate(tempDate);
      setFromTime(formattedTime);
      setToDate(tempDate);
      setToTime(addHoursToTime(formattedTime, 1));
    } else {
      setToDate(tempDate);
      setToTime(formattedTime);
    }
    setCustomPickerOpen(false);
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      alert('Silakan isi judul tugas terlebih dahulu');
      return;
    }

    if (isPastDate(fromDate)) {
      alert('Tidak dapat menambahkan tugas untuk hari/bulan yang sudah lewat');
      return;
    }

    const nowTs = Date.now();
    onSave({
      id: editingTask ? editingTask.id : `t-${nowTs}`,
      title: title.trim(),
      category: category.trim(),
      time: fromTime,
      toTime: toTime,
      toDate: toDate || fromDate,
      priority,
      date: fromDate,
      completed: editingTask ? editingTask.completed : false,
      createdMonth: fromDate.slice(0, 7),
      createdAt: editingTask ? (editingTask.createdAt || nowTs) : nowTs
    });

    onClose();
  };

  const handleApplyAllDay = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Silakan isi judul tugas terlebih dahulu sebelum menerapkan ke semua hari');
      return;
    }

    if (window.confirm('Terapkan tugas ini setiap hari selama 30 hari ke depan?')) {
      const dates = getFutureDates(fromDate, 30);
      const baseTs = Date.now();
      const newTasks = dates.map((dateStr, index) => ({
        id: `t-${baseTs}-${index}`,
        title: title.trim(),
        category: category.trim(),
        time: fromTime,
        toTime: toTime,
        toDate: dateStr,
        priority,
        date: dateStr,
        completed: false,
        createdMonth: dateStr.slice(0, 7),
        createdAt: baseTs + index
      }));

      onSave(newTasks);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#f8fafc] flex flex-col w-full h-full min-h-screen overflow-y-auto animate-fade-in">
      <div className="w-full max-w-2xl mx-auto flex flex-col min-h-screen bg-white sm:shadow-lg sm:border-x sm:border-slate-100">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-4 flex items-center justify-between border-b border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="p-2 -ml-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
              title="Batal / Kembali"
            >
              <X className="w-6 h-6 stroke-[2.2]" />
            </button>
            <h1 className="text-base sm:text-lg font-bold text-slate-900">
              {editingTask ? 'Edit Tugas' : 'Tambah Tugas'}
            </h1>
            <button
              type="submit"
              className="p-2 -mr-2 rounded-xl text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 active:scale-95 transition-all cursor-pointer"
              title="Simpan Tugas"
            >
              <Check className="w-6 h-6 stroke-[2.8]" />
            </button>
          </div>

          <div className="p-5 sm:p-8 space-y-6 flex-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Judul Tugas <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Target kemenanganmu hari ini apa?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none transition-all shadow-2xs"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kategori / Subjek
              </label>
              <input
                type="text"
                placeholder="Kerja, Pasangan, Belanja"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none transition-all shadow-2xs"
              />
            </div>

            <div className="bg-white border-2 border-slate-300 rounded-2xl overflow-hidden divide-y divide-slate-200/80 shadow-2xs">
              <div 
                onClick={() => openCustomPicker('from')}
                className="relative p-4 bg-white hover:bg-slate-50 active:bg-slate-100 transition-all flex items-center justify-between gap-4 cursor-pointer group"
              >
                <span className="text-sm font-bold text-slate-900">From</span>
                <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-xs sm:text-sm">
                  <span>{formatFullDateTimeIndo(fromDate, fromTime)}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              <div 
                onClick={() => openCustomPicker('to')}
                className="relative p-4 bg-white hover:bg-slate-50 active:bg-slate-100 transition-all flex items-center justify-between gap-4 cursor-pointer group"
              >
                <span className="text-sm font-bold text-slate-900">To</span>
                <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-xs sm:text-sm">
                  <span>{formatFullDateTimeIndo(toDate, toTime)}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>

            <div className="pt-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tingkat Prioritas
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPriority('high')}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer ${
                    priority === 'high'
                      ? 'bg-rose-50 text-rose-700 border-2 border-rose-400 shadow-xs'
                      : 'bg-white text-slate-600 border-2 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span>🔴 Tinggi</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPriority('medium')}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer ${
                    priority === 'medium'
                      ? 'bg-amber-50 text-amber-700 border-2 border-amber-400 shadow-xs'
                      : 'bg-white text-slate-600 border-2 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span>🟡 Sedang</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPriority('low')}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer ${
                    priority === 'low'
                      ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-400 shadow-xs'
                      : 'bg-white text-slate-600 border-2 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span>🟢 Rendah</span>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleApplyAllDay}
                className="w-full py-3.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 active:scale-[0.98] text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs border-2 border-emerald-300/80"
                title="Otomatis terapkan tugas ini setiap hari untuk 30 hari ke depan"
              >
                <CalendarDays className="w-4 h-4 text-emerald-600" />
                <span>Apply All Day (Terapkan Setiap Hari selama 30 Hari)</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {customPickerOpen && (
        <div 
          onClick={() => setCustomPickerOpen(false)}
          className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="w-full max-w-sm bg-white text-slate-900 rounded-[32px] p-6 shadow-2xl animate-apple-pop flex flex-col gap-4 border-none"
          >
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 tracking-wide capitalize">
                {pickerMode === 'from' ? 'From' : 'To'}
              </h3>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                {formatDateLabelNoYear(tempDate)}, {String(tempHour).padStart(2, '0')}:{String(tempMinute).padStart(2, '0')}
              </p>
            </div>

            {/* Area Roda Pemilih (Native Momentum Physics, Anti-Hilang, Teks +2px, Mulus 120fps) */}
            <div className="py-2 select-none relative">
              {/* Highlight Bar Tengah Lembut */}
              <div className="pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2 h-[44px] bg-slate-100/80 rounded-xl z-0 border border-slate-200/50" />

              <div className="grid grid-cols-12 items-center gap-1 relative z-10">
                <div className="col-span-6">
                  <CustomWheelPickerColumn
                    items={dateItems}
                    selectedValue={tempDate}
                    onSelect={(val) => setTempDate(val)}
                    isDate={true}
                    isInfinite={false}
                  />
                </div>

                <div className="col-span-3">
                  <CustomWheelPickerColumn
                    items={hourItems}
                    selectedValue={tempHour}
                    onSelect={(val) => setTempHour(val)}
                    isDate={false}
                    isInfinite={true}
                  />
                </div>

                <div className="col-span-3">
                  <CustomWheelPickerColumn
                    items={minuteItems}
                    selectedValue={tempMinute}
                    onSelect={(val) => setTempMinute(val)}
                    isDate={false}
                    isInfinite={true}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCustomPickerOpen(false)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs sm:text-sm font-bold rounded-2xl transition-all cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCustomPicker}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-2xl transition-all cursor-pointer text-center shadow-md shadow-blue-600/25"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
