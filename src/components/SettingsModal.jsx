import React, { useState, useEffect } from 'react';
import { 
  X, 
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
  CheckCircle2
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

export default function SettingsModal({
  isOpen,
  onClose,
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
    if (isOpen) {
      setSyncOn(isSyncEnabled());
      const currentKey = getSyncKey();
      setSyncKeyVal(currentKey);
      setTempKey(currentKey);
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
    // 1. Push local changes
    await pushTasksToCloud(tasks);
    // 2. Pull any new changes from cloud (e.g. from ChatGPT)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-900 text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-800 tracking-tight">Pengaturan & Integrasi</h2>
              <p className="text-xs text-slate-500">Notifikasi & Koneksi AI ChatGPT</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 text-sm">
          
          {/* SECTION 1: NOTIFIKASI */}
          <div className="bg-slate-50/80 rounded-2xl p-4.5 border border-slate-200/60 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${notifEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                  {notifEnabled ? <Bell className="w-5 h-5 text-emerald-600 fill-emerald-100" /> : <BellOff className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Notifikasi Pengingat Tugas</h3>
                  <p className="text-xs text-slate-500">Pemberitahuan harian & deadline tugas di HP</p>
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

          {/* SECTION 2: CHATGPT MCP INTEGRATION */}
          <div className="bg-gradient-to-br from-indigo-50/50 via-slate-50 to-white rounded-2xl p-5 border border-indigo-100/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-indigo-100/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-slate-800 text-sm">Integrasi ChatGPT (MCP Server)</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">100% Gratis</span>
                  </div>
                  <p className="text-xs text-slate-500">Hubungkan ChatGPT untuk kelola tugas via suara/chat</p>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    1. Server URL (Paste di Form New Plugin ChatGPT)
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-600 truncate select-all shadow-2xs">
                      {serverUrl}
                    </div>
                    <button
                      onClick={() => handleCopy(serverUrl, 'url')}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-xs shrink-0"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUrl ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  </div>
                </div>

                {/* 2. Sync Key / Kode Penghubung */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <Key className="w-3.5 h-3.5 text-indigo-600" />
                      2. Sync Key (ID Khusus Akun Anda)
                    </label>
                    {!isEditingKey && (
                      <button
                        onClick={() => setIsEditingKey(true)}
                        className="text-[11px] text-indigo-600 hover:underline font-medium"
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
                        className="flex-1 bg-white border border-indigo-300 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Contoh: pnc_user_123"
                      />
                      <button
                        onClick={handleSaveCustomKey}
                        className="px-2.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold active:scale-95"
                      >
                        Simpan
                      </button>
                      <button
                        onClick={handleGenerateNewKey}
                        className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs active:scale-95"
                        title="Acak ID Baru"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs">
                      <span className="font-mono font-bold text-indigo-900">{syncKeyVal}</span>
                      <button
                        onClick={() => handleCopy(syncKeyVal, 'key')}
                        className="text-slate-400 hover:text-slate-700 flex items-center gap-1 text-[11px]"
                      >
                        {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey ? 'Disalin' : 'Salin Key'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Tombol Sinkronisasi Manual Sekarang */}
                <div className="pt-2 flex items-center justify-between bg-indigo-50/70 p-3 rounded-xl border border-indigo-100/70">
                  <div className="text-xs text-indigo-900 font-medium flex items-center gap-1.5">
                    {syncStatus === 'syncing' ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                        <span>Menyinkronkan tugas...</span>
                      </>
                    ) : syncStatus === 'success' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">Tersinkron dengan Cloud</span>
                      </>
                    ) : (
                      <>
                        <CloudUpload className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Status: Cloud Sync Aktif</span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={handleManualSyncNow}
                    disabled={syncStatus === 'syncing'}
                    className="px-2.5 py-1.5 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold active:scale-95 transition-all shadow-2xs flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                    <span>Sync Sekarang</span>
                  </button>
                </div>

                {/* Petunjuk Singkat Penggunaan di ChatGPT */}
                <div className="bg-slate-100/70 rounded-xl p-3 text-[11px] text-slate-600 space-y-1.5">
                  <p className="font-semibold text-slate-700 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-slate-500" />
                    Cara Pasang di ChatGPT:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-500 pl-1">
                    <li>Buka menu <b>Plugins / Custom MCP</b> di ChatGPT.</li>
                    <li>Pilih <b>Server URL</b> lalu paste URL di atas.</li>
                    <li>Pilih Authentication: <b>None</b> (atau biarkan default).</li>
                    <li>Selesai! Anda bisa langsung minta ChatGPT: <i>"Tambahkan tugas meeting besok jam 9 pagi"</i>.</li>
                  </ol>
                </div>

              </div>
            ) : (
              <p className="text-xs text-slate-500 leading-relaxed">
                Aktifkan opsi ini untuk mengizinkan ChatGPT atau Asisten AI membaca dan menambahkan tugas langsung ke aplikasi Puncak di HP Android Anda.
              </p>
            )}
          </div>

          {/* SECTION 3: APP INFO */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 px-1">
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Puncak App v{CURRENT_VERSION_NAME} (Build {CURRENT_VERSION_CODE})</span>
            </div>
            <span>© 2026 Puncak</span>
          </div>

        </div>
      </div>
    </div>
  );
}
