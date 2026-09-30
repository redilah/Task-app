import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { 
  ArrowLeft, Calendar, Edit3, Trash2, MoreVertical,
  Briefcase, Heart, Users, BookOpen, Target, Sparkles, Star,
  MessageSquare, Lightbulb, Cloud, Smile, Coffee, Brain, Compass
} from 'lucide-react';
import { loadDecisions, saveDecisions, loadThoughts, saveThoughts } from '../utils/decisionStorage';
import { getTodayStr, formatDateNumeric } from '../utils/dateUtils';

// Helper pemetaan ikon untuk Keputusan
const DECISION_ICONS = {
  briefcase: { name: 'Koper', comp: Briefcase },
  heart: { name: 'Hati', comp: Heart },
  users: { name: 'Grup', comp: Users },
  book: { name: 'Buku', comp: BookOpen },
  target: { name: 'Target', comp: Target },
  compass: { name: 'Kompas', comp: Compass },
  sparkles: { name: 'Kilau', comp: Sparkles },
  star: { name: 'Bintang', comp: Star }
};

// Helper pemetaan ikon untuk Pikiran
const THOUGHT_ICONS = {
  message: { name: 'Pesan', comp: MessageSquare },
  lightbulb: { name: 'Ide', comp: Lightbulb },
  cloud: { name: 'Awan', comp: Cloud },
  brain: { name: 'Otak', comp: Brain },
  smile: { name: 'Senyum', comp: Smile },
  coffee: { name: 'Kopi', comp: Coffee },
  sparkles: { name: 'Kilau', comp: Sparkles }
};

const DecisionView = forwardRef(function DecisionView({ onOpenSettings, onFormStateChange }, ref) {
  const [subTab, setSubTab] = useState('decision'); // 'decision' | 'thought'
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'form_decision' | 'form_thought'
  
  const [decisions, setDecisions] = useState([]);
  const [thoughts, setThoughts] = useState([]);

  // State untuk form Keputusan (Status dihapus)
  const [editingDecisionId, setEditingDecisionId] = useState(null);
  const [decTitle, setDecTitle] = useState('');
  const [decReason, setDecReason] = useState('');
  const [decDate, setDecDate] = useState(() => getTodayStr());
  const [decIcon, setDecIcon] = useState('briefcase'); // 'none' atau key ikon

  // State untuk form Pikiran (Jam dihapus, cukup tanggal)
  const [editingThoughtId, setEditingThoughtId] = useState(null);
  const [thoughtTitle, setThoughtTitle] = useState('');
  const [thoughtContent, setThoughtContent] = useState('');
  const [thoughtDate, setThoughtDate] = useState(() => getTodayStr());
  const [thoughtIcon, setThoughtIcon] = useState('message'); // 'none' atau key ikon

  // Menu popup delete confirm
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    setDecisions(loadDecisions());
    setThoughts(loadThoughts());
  }, []);

  // Beritahu parent (App.jsx) saat form sedang terbuka/tertutup untuk mengatur tampilan FAB
  useEffect(() => {
    if (onFormStateChange) {
      onFormStateChange(viewMode !== 'list');
    }
  }, [viewMode, onFormStateChange]);

  // Update storage & state
  const handleUpdateDecisions = (newDecs) => {
    setDecisions(newDecs);
    saveDecisions(newDecs);
  };

  const handleUpdateThoughts = (newThoughts) => {
    setThoughts(newThoughts);
    saveThoughts(newThoughts);
  };

  // Buka Form Tambah Keputusan
  const handleOpenAddDecision = () => {
    setEditingDecisionId(null);
    setDecTitle('');
    setDecReason('');
    setDecDate(getTodayStr());
    setDecIcon('briefcase');
    setViewMode('form_decision');
    setActiveMenuId(null);
  };

  // Buka Form Edit Keputusan
  const handleOpenEditDecision = (item) => {
    setEditingDecisionId(item.id);
    setDecTitle(item.title || '');
    setDecReason(item.reason || '');
    setDecDate(item.date || getTodayStr());
    setDecIcon(item.iconType || 'none');
    setViewMode('form_decision');
    setActiveMenuId(null);
  };

  // Buka Form Tambah Pikiran
  const handleOpenAddThought = () => {
    setEditingThoughtId(null);
    setThoughtTitle('');
    setThoughtContent('');
    setThoughtDate(getTodayStr());
    setThoughtIcon('message');
    setViewMode('form_thought');
    setActiveMenuId(null);
  };

  // Buka Form Edit Pikiran
  const handleOpenEditThought = (item) => {
    setEditingThoughtId(item.id);
    setThoughtTitle(item.title || '');
    setThoughtContent(item.content || '');
    setThoughtDate(item.date || getTodayStr());
    setThoughtIcon(item.iconType || 'none');
    setViewMode('form_thought');
    setActiveMenuId(null);
  };

  // Expose fungsi buka form via ref untuk dipanggil oleh Floating Action Button (+) di App.jsx
  useImperativeHandle(ref, () => ({
    openAdd: () => {
      if (subTab === 'decision') {
        handleOpenAddDecision();
      } else {
        handleOpenAddThought();
      }
    }
  }), [subTab]);

  // Simpan Keputusan (Tambah / Edit)
  const handleSaveDecision = (e) => {
    e.preventDefault();
    if (!decTitle.trim()) return;

    if (editingDecisionId) {
      const updated = decisions.map(d => {
        if (d.id === editingDecisionId) {
          return {
            ...d,
            title: decTitle.trim(),
            reason: decReason.trim(),
            date: decDate,
            iconType: decIcon
          };
        }
        return d;
      });
      handleUpdateDecisions(updated);
    } else {
      const newItem = {
        id: 'dec-' + Date.now(),
        title: decTitle.trim(),
        reason: decReason.trim(),
        date: decDate,
        iconType: decIcon,
        createdAt: Date.now()
      };
      handleUpdateDecisions([newItem, ...decisions]);
    }

    setViewMode('list');
  };

  // Hapus Keputusan
  const handleDeleteDecision = (id) => {
    if (window.confirm('Hapus catatan keputusan ini?')) {
      handleUpdateDecisions(decisions.filter(d => d.id !== id));
      setActiveMenuId(null);
    }
  };

  // Simpan Pikiran (Tambah / Edit)
  const handleSaveThought = (e) => {
    e.preventDefault();
    if (!thoughtContent.trim() && !thoughtTitle.trim()) return;

    const titleToUse = thoughtTitle.trim() || thoughtContent.trim().slice(0, 30);

    if (editingThoughtId) {
      const updated = thoughts.map(t => {
        if (t.id === editingThoughtId) {
          return {
            ...t,
            title: titleToUse,
            content: thoughtContent.trim(),
            date: thoughtDate,
            iconType: thoughtIcon
          };
        }
        return t;
      });
      handleUpdateThoughts(updated);
    } else {
      const newItem = {
        id: 'thought-' + Date.now(),
        title: titleToUse,
        content: thoughtContent.trim(),
        date: thoughtDate,
        iconType: thoughtIcon,
        createdAt: Date.now()
      };
      handleUpdateThoughts([newItem, ...thoughts]);
    }

    setViewMode('list');
  };

  // Hapus Pikiran
  const handleDeleteThought = (id) => {
    if (window.confirm('Hapus catatan pikiran ini?')) {
      handleUpdateThoughts(thoughts.filter(t => t.id !== id));
      setActiveMenuId(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-3 pb-28">
      {/* ===================== VIEW MODE: LIST ===================== */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {/* Apple-style Capsule Segmented Control (Pill Ramping dengan Animasi Sliding Smooth Persis Rekap Mingguan) */}
          <div className="bg-slate-200/80 p-1 rounded-full relative shadow-inner mb-5 border border-slate-300/60 max-w-sm mx-auto backdrop-blur-md">
            {/* Sliding Active Pill Background */}
            <div 
              className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-slate-900 rounded-full shadow-[0_2px_8px_rgba(15,23,42,0.22)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
              style={{
                transform: subTab === 'decision' ? 'translateX(0%)' : 'translateX(calc(100% + 4px))'
              }}
            />

            {/* 2 Tombol Kapsul */}
            <div className="grid grid-cols-2 relative z-10">
              {/* Kapsul 1: Keputusan */}
              <button
                type="button"
                onClick={() => { setSubTab('decision'); setActiveMenuId(null); }}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-full transition-transform active:scale-95 select-none focus:outline-none cursor-pointer"
              >
                <span className={`text-xs sm:text-sm font-bold transition-colors duration-200 ${
                  subTab === 'decision' ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                }`}>
                  Keputusan
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-all duration-200 ${
                  subTab === 'decision' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-slate-300 text-slate-700'
                }`}>
                  {decisions.length}
                </span>
              </button>

              {/* Kapsul 2: Pikiran Saat Ini */}
              <button
                type="button"
                onClick={() => { setSubTab('thought'); setActiveMenuId(null); }}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-full transition-transform active:scale-95 select-none focus:outline-none cursor-pointer"
              >
                <span className={`text-xs sm:text-sm font-bold transition-colors duration-200 ${
                  subTab === 'thought' ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                }`}>
                  Pikiran Saat Ini
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-all duration-200 ${
                  subTab === 'thought' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-slate-300 text-slate-700'
                }`}>
                  {thoughts.length}
                </span>
              </button>
            </div>
          </div>

          {/* ================= DAFTAR KEPUTUSAN ================= */}
          {subTab === 'decision' && (
            <div className="space-y-3 pt-1">
              {decisions.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 shadow-xs">
                  <p className="text-sm text-slate-500 font-medium">Belum ada keputusan yang dicatat.</p>
                  <p className="text-xs text-slate-400 mt-1">Tekan tombol (+) di pojok kanan bawah untuk mencatat keputusan baru.</p>
                </div>
              ) : (
                decisions.map((item) => {
                  const hasIcon = item.iconType && item.iconType !== 'none' && DECISION_ICONS[item.iconType];
                  const IconComp = hasIcon ? DECISION_ICONS[item.iconType].comp : null;

                  return (
                    <div 
                      key={item.id}
                      className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all relative"
                    >
                      <div className="flex items-start gap-3.5">
                        {/* Ikon Melayang Bebas (Tanpa Kotak Pembungkus) — hanya jika bukan 'none' */}
                        {IconComp && (
                          <div className="shrink-0 pt-0.5 text-slate-700">
                            <IconComp className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[1.8]" />
                          </div>
                        )}

                        {/* Konten Kartu */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                              {item.title}
                            </h3>

                            {/* Tombol Aksi: Edit & Menu Titik Tiga */}
                            <div className="flex items-center gap-1 shrink-0 relative">
                              <button
                                type="button"
                                onClick={() => handleOpenEditDecision(item)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Edit Keputusan"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Opsi"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {/* Dropdown Menu Titik Tiga */}
                              {activeMenuId === item.id && (
                                <div className="absolute right-0 top-8 z-30 bg-white border border-slate-200 rounded-xl shadow-lg py-1 w-32 animate-in fade-in zoom-in-95">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditDecision(item)}
                                    className="w-full px-3 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDecision(item.id)}
                                    className="w-full px-3 py-1.5 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Hapus</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Baris Tanggal */}
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDateNumeric(item.date)}</span>
                          </div>

                          {/* Alasan / Pertimbangan */}
                          {item.reason && (
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2.5">
                              {item.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ================= DAFTAR PIKIRAN SAAT INI ================= */}
          {subTab === 'thought' && (
            <div className="space-y-3 pt-1">
              {thoughts.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 shadow-xs">
                  <p className="text-sm text-slate-500 font-medium">Belum ada pikiran yang dicatat.</p>
                  <p className="text-xs text-slate-400 mt-1">Tekan tombol (+) di pojok kanan bawah untuk menuangkan pikiranmu.</p>
                </div>
              ) : (
                thoughts.map((item) => {
                  const hasIcon = item.iconType && item.iconType !== 'none' && THOUGHT_ICONS[item.iconType];
                  const IconComp = hasIcon ? THOUGHT_ICONS[item.iconType].comp : null;

                  return (
                    <div 
                      key={item.id}
                      className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all relative"
                    >
                      <div className="flex items-start gap-3.5">
                        {/* Ikon Melayang Bebas (Tanpa Kotak Pembungkus) — hanya jika bukan 'none' */}
                        {IconComp && (
                          <div className="shrink-0 pt-0.5 text-slate-700">
                            <IconComp className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[1.8]" />
                          </div>
                        )}

                        {/* Konten Kartu */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                              {item.title}
                            </h3>

                            {/* Tombol Aksi: Edit & Menu Titik Tiga */}
                            <div className="flex items-center gap-1 shrink-0 relative">
                              <button
                                type="button"
                                onClick={() => handleOpenEditThought(item)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Edit Pikiran"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Opsi"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {/* Dropdown Menu Titik Tiga */}
                              {activeMenuId === item.id && (
                                <div className="absolute right-0 top-8 z-30 bg-white border border-slate-200 rounded-xl shadow-lg py-1 w-32 animate-in fade-in zoom-in-95">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditThought(item)}
                                    className="w-full px-3 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteThought(item.id)}
                                    className="w-full px-3 py-1.5 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Hapus</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Baris Tanggal (Hanya tanggal, tanpa jam) */}
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDateNumeric(item.date)}</span>
                          </div>

                          {/* Isi Pikiran */}
                          {item.content && (
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2.5">
                              {item.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* ===================== VIEW MODE: FORM KEPUTUSAN ===================== */}
      {viewMode === 'form_decision' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Subpage dengan Tombol Kembali */}
          <div className="flex items-center gap-3 pb-2 border-b border-slate-200/60">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="p-2 -ml-2 rounded-xl text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
              title="Kembali ke Daftar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-lg text-slate-900">
              {editingDecisionId ? 'Edit Keputusan' : 'Catat Keputusan Baru'}
            </h2>
          </div>

          <form onSubmit={handleSaveDecision} className="space-y-5">
            {/* Field 1: Keputusan apa yang kamu ambil? (Tanpa contoh di placeholder, counter 0/1000) */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-900">
                Keputusan apa yang kamu ambil?
              </label>
              <div className="relative">
                <textarea
                  value={decTitle}
                  onChange={(e) => setDecTitle(e.target.value.slice(0, 1000))}
                  placeholder=""
                  rows={3}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all resize-none"
                />
                <div className="text-right text-[11px] text-slate-400 mt-1">
                  {decTitle.length}/1000
                </div>
              </div>
            </div>

            {/* Field 2: Kenapa kamu mengambil keputusan ini? (Tanpa contoh di placeholder, counter 0/1000) */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-900">
                Kenapa kamu mengambil keputusan ini?
              </label>
              <div className="relative">
                <textarea
                  value={decReason}
                  onChange={(e) => setDecReason(e.target.value.slice(0, 1000))}
                  placeholder=""
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all resize-none"
                />
                <div className="text-right text-[11px] text-slate-400 mt-1">
                  {decReason.length}/1000
                </div>
              </div>
            </div>

            {/* Field 3: Pilihan Ikon (Termasuk Opsi None / Tanpa Ikon) */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-900">
                Ikon
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Opsi none (tanpa logo/ikon) */}
                <button
                  type="button"
                  onClick={() => setDecIcon('none')}
                  className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    decIcon === 'none'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-slate-900/20'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  none
                </button>

                {Object.keys(DECISION_ICONS).map((key) => {
                  const { comp: Comp } = DECISION_ICONS[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setDecIcon(key)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                        decIcon === key
                          ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-900/20 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Comp className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Field 4: Tanggal Keputusan */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-900">
                Tanggal keputusan
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={decDate}
                  onChange={(e) => setDecDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all cursor-pointer"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-sm shadow-sm transition-all duration-150 active:scale-[0.99] cursor-pointer mt-4"
            >
              Simpan Keputusan
            </button>
          </form>
        </div>
      )}

      {/* ===================== VIEW MODE: FORM PIKIRAN ===================== */}
      {viewMode === 'form_thought' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Subpage dengan Tombol Kembali */}
          <div className="flex items-center gap-3 pb-2 border-b border-slate-200/60">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="p-2 -ml-2 rounded-xl text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
              title="Kembali ke Daftar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-lg text-slate-900">
              {editingThoughtId ? 'Edit Pikiran Saat Ini' : 'Catat Pikiran Saat Ini'}
            </h2>
          </div>

          <form onSubmit={handleSaveThought} className="space-y-5">
            {/* Field Judul Singkat */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-900">
                Judul atau Inti Pikiran
              </label>
              <input
                type="text"
                value={thoughtTitle}
                onChange={(e) => setThoughtTitle(e.target.value.slice(0, 100))}
                placeholder=""
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
              />
            </div>

            {/* Field Apa yang sedang kamu pikirkan? (Tanpa contoh di placeholder, counter 0/1000) */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-900">
                Apa yang sedang kamu pikirkan?
              </label>
              <div className="relative">
                <textarea
                  value={thoughtContent}
                  onChange={(e) => setThoughtContent(e.target.value.slice(0, 1000))}
                  placeholder=""
                  rows={5}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all resize-none"
                />
                <div className="text-right text-[11px] text-slate-400 mt-1">
                  {thoughtContent.length}/1000
                </div>
              </div>
            </div>

            {/* Field Pilihan Ikon (Termasuk Opsi None / Tanpa Ikon) */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-900">
                Ikon
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Opsi none (tanpa logo/ikon) */}
                <button
                  type="button"
                  onClick={() => setThoughtIcon('none')}
                  className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    thoughtIcon === 'none'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-slate-900/20'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  none
                </button>

                {Object.keys(THOUGHT_ICONS).map((key) => {
                  const { comp: Comp } = THOUGHT_ICONS[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setThoughtIcon(key)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                        thoughtIcon === key
                          ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-900/20 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Comp className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Field Tanggal (Hanya Tanggal, Jam Dihapus) */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-900">
                Tanggal
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={thoughtDate}
                  onChange={(e) => setThoughtDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all cursor-pointer"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-sm shadow-sm transition-all duration-150 active:scale-[0.99] cursor-pointer mt-4"
            >
              Simpan Pikiran
            </button>
          </form>
        </div>
      )}
    </div>
  );
});

export default DecisionView;
