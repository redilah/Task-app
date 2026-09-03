import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, CalendarDays, Tag, Check } from 'lucide-react';
import { parseVoiceToTask } from '../utils/voiceParser.js';
import { formatDateNumeric, getTodayStr } from '../utils/dateUtils.js';

export default function VoiceAssistantModal({ 
  isOpen, 
  onClose, 
  onSaveTask 
}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const recognitionRef = useRef(null);
  const autoSaveTimerRef = useRef(null);

  // Inisialisasi dan jalankan speech recognition saat popup terbuka
  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setInterimText('');
      setErrorMsg('');
      setIsSaved(false);
      startListening();
    } else {
      stopListening();
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    }

    return () => {
      stopListening();
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [isOpen]);

  const activeFullText = (transcript + (interimText ? ' ' + interimText : '')).trim();
  const parsedTask = parseVoiceToTask(activeFullText, getTodayStr());
  const hasValidResult = Boolean(parsedTask.title && parsedTask.title.length > 1);

  // Auto save saat ada hasil ucapan valid dan jeda bicara
  useEffect(() => {
    if (hasValidResult && !isSaved) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        commitTaskSave();
      }, 1400); // 1.4 detik setelah jeda bicara selesai
    }
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [activeFullText, hasValidResult, isSaved]);

  const commitTaskSave = () => {
    if (!hasValidResult || isSaved) return;

    const nowTs = Date.now();
    const newTask = {
      id: `t-${nowTs}`,
      title: parsedTask.title,
      category: parsedTask.category,
      time: parsedTask.time,
      toTime: parsedTask.toTime,
      toDate: parsedTask.toDate || parsedTask.date,
      priority: parsedTask.priority,
      date: parsedTask.date,
      completed: false,
      createdMonth: parsedTask.date.slice(0, 7),
      createdAt: nowTs
    };

    setIsSaved(true);
    onSaveTask(newTask);

    setTimeout(() => {
      onClose();
    }, 700);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMsg('Browser belum mendukung Web Speech API.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMsg('');
      };

      recognition.onresult = (event) => {
        let finalStr = '';
        let interimStr = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            finalStr += res[0].transcript + ' ';
          } else {
            interimStr += res[0].transcript;
          }
        }

        if (finalStr) {
          setTranscript(prev => (prev + ' ' + finalStr).trim());
        }
        setInterimText(interimStr);
      };

      recognition.onerror = (event) => {
        if (event.error === 'not-allowed') {
          setErrorMsg('Izin mic belum aktif.');
        } else if (event.error !== 'no-speech') {
          setErrorMsg(`Error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        // Jika recognition berakhir dan ada teks valid, langsung simpan
        if (hasValidResult && !isSaved) {
          commitTaskSave();
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      setErrorMsg('Gagal memulai mic.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setIsListening(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop transparan tipis untuk klik luar tutup */}
      <div 
        className="fixed inset-0 z-30" 
        onClick={onClose} 
      />

      {/* 1 Kolom Preview Ngambang Sebelah Kiri Tombol Mic (Tema Putih Bersih Tanpa Garis Tepi) */}
      <div className="fixed bottom-20 2xl:bottom-8 right-[4.5rem] sm:right-[5.25rem] md:right-24 z-40 w-[calc(100vw-5.5rem)] max-w-[275px] bg-white text-slate-800 rounded-2xl p-2.5 shadow-xl shadow-slate-900/12 animate-apple-pop select-none">
        
        {/* Kolom Tunggal Terpadu (Nada Musik Animasi + Teks Ucapan + Tombol X di dalam 1 kolom putih tanpa border) */}
        <div className="flex items-start gap-2 bg-slate-100/70 rounded-xl px-2.5 py-2 min-h-[42px]">
          
          {/* Nada Musik Animasi (Tanpa Dot Merah) */}
          {isListening && (
            <div className="flex items-center gap-0.5 h-3 shrink-0 mt-0.5">
              <span className="w-0.5 bg-indigo-600 rounded-full animate-bounce h-2" style={{ animationDelay: '0ms' }} />
              <span className="w-0.5 bg-amber-500 rounded-full animate-bounce h-3" style={{ animationDelay: '150ms' }} />
              <span className="w-0.5 bg-emerald-500 rounded-full animate-bounce h-2.5" style={{ animationDelay: '300ms' }} />
              <span className="w-0.5 bg-rose-500 rounded-full animate-bounce h-1.5" style={{ animationDelay: '450ms' }} />
            </div>
          )}

          {/* Area Teks Ucapan Real-Time */}
          <div className="flex-1 min-w-0 pr-1">
            {isSaved ? (
              <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 stroke-[3]" /> Tersimpan!
              </p>
            ) : activeFullText ? (
              <p className="text-xs font-semibold text-slate-900 leading-snug italic break-words">
                "{activeFullText}"
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 italic">
                Bicara tugas Anda...
              </p>
            )}
          </div>

          {/* Tombol X (Tutup) di pojok kanan dalam kolom yang sama */}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors shrink-0 -mr-0.5"
            title="Tutup"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Error Info (Jika ada) */}
        {errorMsg && (
          <p className="text-[10px] text-amber-600 mt-1.5 px-1 font-medium">{errorMsg}</p>
        )}

        {/* Rincian Hasil Deteksi (Ringkas & Otomatis Tersimpan) */}
        {hasValidResult && (
          <div className="mt-2 pt-1.5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 truncate px-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">{parsedTask.title}</span>
            </div>

            <div className="flex flex-wrap items-center gap-1 text-[10px] px-0.5">
              {/* Jam */}
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-medium">
                <Clock className="w-2.5 h-2.5 text-indigo-500" />
                {parsedTask.time}
              </span>

              {/* Tanggal */}
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-medium">
                <CalendarDays className="w-2.5 h-2.5 text-slate-400" />
                {formatDateNumeric(parsedTask.date)}
              </span>

              {/* Prioritas */}
              <span className={`px-1.5 py-0.5 rounded font-bold ${
                parsedTask.priority === 'high'
                  ? 'bg-rose-50 text-rose-700'
                  : parsedTask.priority === 'low'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}>
                {parsedTask.priority === 'high' ? 'Tinggi 🔥' : parsedTask.priority === 'low' ? 'Rendah ☕' : 'Sedang ⚡'}
              </span>

              {/* Kategori */}
              {parsedTask.category && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded font-semibold">
                  <Tag className="w-2.5 h-2.5" />
                  {parsedTask.category}
                </span>
              )}
            </div>
          </div>
        )}

      </div>
    </>
  );
}
