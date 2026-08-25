import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Bell, 
  BellOff, 
  Bot, 
  Key, 
  Copy, 
  Check, 
  RefreshCw, 
  Smartphone, 
  ExternalLink, 
  Info, 
  Sparkles,
  CloudUpload,
  CheckCircle2,
  Sliders,
  ShieldCheck
} from 'lucide-react';
import { 
  getSyncKey, 
  setSyncKey, 
  isSyncEnabled, 
  setSyncEnabled, 
  getMcpServerUrl,
  pushTasksToCloud,
  pullTasksFromCloud
} from '../utils/cloudSync';
import { CURRENT_VERSION_NAME, CURRENT_VERSION_CODE } from '../utils/version';

export default function SettingsView({
  onBack,
  notifEnabled,
  onToggleNotification,
  tasks,
  onTasksSynced
}) {
  const [syncOn, setSyncOn] = useState(isSyncEnabled());
  const [syncKeyVal, setSyncKeyVal] = useState(getSyncKey());
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [syncStatus, setSyncStatus] = useState(''); // 'syncing', 'success', 'error'
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [tempKey, setTempKey] = useState(syncKeyVal);

  useEffect(() => {
    setSyncOn(isSyncEnabled());
    const currentKey = getSyncKey();
    setSyncKeyVal(currentKey);
    setTempKey(currentKey);
  }, []);

  const serverUrl = getMcpServerUrl(syncKeyVal);

  const handleToggleSync = async () => {
    const nextState = !syncOn;
    setSyncOn(nextState);
    setSyncEnabled(nextState);

    if (nextState) {
      setSyncStatus('syncing');
      const res = await pushTasksToCloud(tasks);
      if (res.success) {
        setSyncStatus('success');
        setTimeout(() => setSyncStatus(''), 3000);
      } else {
        setSyncStatus('error');
      }
    }
  };

  const handleManualSyncNow = async () => {
    setSyncStatus('syncing');
    await pushTasksToCloud(tasks);
    const remoteTasks = await pullTasksFromCloud();
    if (remoteTasks && Array.isArray(remoteTasks)) {
      if (remoteTasks.length > 0 && onTasksSynced) {
        onTasksSynced(remoteTasks);
      }
      setSyncStatus('success');
      setTimeout(() => setSyncStatus(''), 3000);
    } else {
      setSyncStatus('success');
      setTimeout(() => setSyncStatus(''), 3000);
    }
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleSaveCustomKey = () => {
    if (tempKey.trim()) {
      const saved = setSyncKey(tempKey.trim());
      setSyncKeyVal(saved);
      setIsEditingKey(false);
      if (syncOn) {
        pushTasksToCloud(tasks);
      }
    }
  };

  const handleGenerateNewKey = () => {
    const newRandom = 'pnc_' + Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 6);
    setTempKey(newRandom);
    const saved = setSyncKey(newRandom);
    setSyncKeyVal(saved);
    setIsEditingKey(false);
    if (syncOn) {
      pushTasksToCloud(tasks);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 pb-24 animate-fade-in">
      
      {/* Header Halaman Pengaturan (Full Page View) */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3.5">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all flex items-center justify-center"
            title="Kembali ke Dashboard"
            aria-label="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-slate-800" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              Pengaturan & Integrasi
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Kelola preferensi notifikasi dan koneksi MCP ChatGPT
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* KOLOM KIRI: NOTIFIKASI & INFO APLIKASI */}
        <div className="space-y-6">
          
          {/* SECTION 1: NOTIFIKASI */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-base">Notifikasi Pengingat</h2>
                <p className="text-xs text-slate-500">Peringatan tugas harian & deadline</p>
              </div>
            </div>

            <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-4 border border-slate-200/60">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${notifEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                  {notifEnabled ? <Bell className="w-4 h-4 text-emerald-600 fill-emerald-100" /> : <BellOff className="w-4 h-4" />}
                </div>
                <div>
                  <span className="font-semibold text-slate-800 text-sm block">
                    {notifEnabled ? 'Notifikasi Aktif' : 'Notifikasi Nonaktif'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {notifEnabled ? 'Pengingat akan dikirimkan ke perangkat' : 'Tidak ada pengingat yang dikirim'}
                  </span>
                </div>
              </div>

              <button
                onClick={onToggleNotification}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notifEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={notifEnabled}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    notifEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* SECTION 3: APP INFO */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-base">Informasi Aplikasi</h2>
                <p className="text-xs text-slate-500">Detail versi & sistem Puncak</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-100 text-slate-600">
                <span className="font-medium">Nama Aplikasi</span>
                <span className="font-bold text-slate-800">Puncak (Taskly)</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 text-slate-600">
                <span className="font-medium">Versi APK</span>
                <span className="font-bold text-slate-800">v{CURRENT_VERSION_NAME} (Build {CURRENT_VERSION_CODE})</span>
              </div>
              <div className="flex items-center justify-between py-2 text-slate-600">
                <span className="font-medium">Status Koneksi Cloud</span>
                <span className={`font-bold flex items-center gap-1 ${syncOn ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${syncOn ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                  {syncOn ? 'Tersambung (Firebase)' : 'Offline / Lokal'}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* KOLOM KANAN: CHATGPT MCP INTEGRATION */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 rounded-3xl p-6 border border-indigo-100 shadow-xs space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-indigo-100/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-xs">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-slate-800 text-base">ChatGPT (MCP Server)</h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">100% Gratis</span>
                  </div>
                  <p className="text-xs text-slate-500">Kelola tugas langsung lewat perintah suara/chat di ChatGPT</p>
                </div>
              </div>

              <button
                onClick={handleToggleSync}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  syncOn ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={syncOn}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    syncOn ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {syncOn ? (
              <div className="space-y-4 pt-1 animate-fade-in">
                
                {/* 1. Kolom Server URL untuk ChatGPT */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    1. Server URL (Salin ke Form New Plugin ChatGPT)
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-600 truncate select-all shadow-2xs">
                      {serverUrl}
                    </div>
                    <button
                      onClick={() => handleCopy(serverUrl, 'url')}
                      className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-xs shrink-0"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUrl ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  </div>
                </div>

                {/* 2. Sync Key / Kode Penghubung */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-indigo-600" />
                      2. Sync Key (ID Akun Khusus Perangkat Anda)
                    </label>
                    {!isEditingKey && (
                      <button
                        onClick={() => setIsEditingKey(true)}
                        className="text-[11px] text-indigo-600 hover:underline font-semibold"
                      >
                        Ubah ID
                      </button>
                    )}
                  </div>

                  {isEditingKey ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tempKey}
                        onChange={(e) => setTempKey(e.target.value)}
                        className="flex-1 bg-white border border-indigo-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Contoh: pnc_user_123"
                      />
                      <button
                        onClick={handleSaveCustomKey}
                        className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold active:scale-95"
                      >
                        Simpan
                      </button>
                      <button
                        onClick={handleGenerateNewKey}
                        className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs active:scale-95"
                        title="Acak ID Baru"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs shadow-2xs">
                      <span className="font-mono font-bold text-indigo-900">{syncKeyVal}</span>
                      <button
                        onClick={() => handleCopy(syncKeyVal, 'key')}
                        className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-[11px] font-medium"
                      >
                        {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey ? 'Disalin' : 'Salin Key'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Tombol Sinkronisasi Manual Sekarang */}
                <div className="pt-2 flex items-center justify-between bg-white p-3.5 rounded-2xl border border-indigo-100 shadow-2xs">
                  <div className="text-xs text-indigo-900 font-medium flex items-center gap-2">
                    {syncStatus === 'syncing' ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                        <span>Menyinkronkan dengan Cloud...</span>
                      </>
                    ) : syncStatus === 'success' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Sinkronisasi Berhasil</span>
                      </>
                    ) : (
                      <>
                        <CloudUpload className="w-4 h-4 text-indigo-600" />
                        <span>Sinkronisasi Otomatis Aktif</span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={handleManualSyncNow}
                    disabled={syncStatus === 'syncing'}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-xl text-xs font-bold active:scale-95 transition-all shadow-2xs flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                    <span>Sync Sekarang</span>
                  </button>
                </div>

                {/* Petunjuk Singkat Penggunaan di ChatGPT */}
                <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-600 space-y-2 border border-slate-200/60">
                  <p className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-indigo-600" />
                    Langkah Pasang di ChatGPT:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1 leading-relaxed text-[11px] sm:text-xs">
                    <li>Buka menu <b>Plugins / Custom MCP</b> di ChatGPT.</li>
                    <li>Pilih <b>Server URL</b> lalu tempel (paste) URL di atas.</li>
                    <li>Pilih Authentication: <b>None</b> (atau biarkan default).</li>
                    <li>Selesai! Anda bisa langsung minta ChatGPT: <i>"Tambahkan tugas meeting besok jam 9 pagi di aplikasi Puncak"</i>.</li>
                  </ol>
                </div>

              </div>
            ) : (
              <p className="text-xs text-slate-500 leading-relaxed bg-white p-4 rounded-2xl border border-slate-100">
                Aktifkan opsi di atas untuk mengizinkan ChatGPT atau Asisten AI membaca, menambah, dan menyelesaikan tugas langsung di aplikasi Puncak HP Android Anda.
              </p>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
