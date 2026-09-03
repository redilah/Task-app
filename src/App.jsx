import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import DailyDashboard from './components/DailyDashboard';
import WeeklyRecap from './components/WeeklyRecap';
import MonthlyRecap from './components/MonthlyRecap';
import TaskModal from './components/TaskModal';
import UpdateModal from './components/UpdateModal';
import SettingsView from './components/SettingsView';
import AdminDashboard from './components/AdminDashboard';
import VoiceAssistantModal from './components/VoiceAssistantModal';
import { Mic, Plus } from 'lucide-react';
import { loadTasks, saveTasks } from './utils/storage';
import { 
  getNotificationState, 
  setNotificationState, 
  requestNotificationPermission, 
  checkDailyReminders,
  isNative
} from './utils/notifications';
import { checkForAppUpdates } from './utils/version';
import { sendTelemetrySignal } from './utils/telemetry';
import { isTaskExpired, isPastDate, getTodayStr } from './utils/dateUtils';
import { isSyncEnabled, pushTasksToCloud, pullTasksFromCloud } from './utils/cloudSync';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'weekly', 'recap', or 'settings'
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => getTodayStr());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  // Flag untuk mencegah race condition telemetri saat first render
  const isInitialized = useRef(false);

  // In-App Update State
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  useEffect(() => {
    const loaded = loadTasks();
    setTasks(loaded);

    const isNotifOn = getNotificationState();
    setNotifEnabled(isNotifOn);

    if (isNotifOn) {
      checkDailyReminders(loaded);
    }

    // Coba sinkronisasi awal dengan Cloud Firestore (luminacube-rubik-game) jika sync aktif
    if (isSyncEnabled()) {
      pullTasksFromCloud().then(remoteTasks => {
        if (remoteTasks && Array.isArray(remoteTasks) && remoteTasks.length > 0) {
          setTasks(remoteTasks);
          saveTasks(remoteTasks);
        } else {
          pushTasksToCloud(loaded);
        }
      });
    }

    // Deteksi Rute Khusus Admin HANYA pada Web Browser (Bukan APK Android Native)
    if (!isNative()) {
      const searchParams = new URLSearchParams(window.location.search);
      const isPathAdmin = window.location.pathname.includes('/admin');
      const isSearchAdmin = searchParams.get('admin') === 'true' || searchParams.get('mode') === 'admin';
      if (isPathAdmin || isSearchAdmin) {
        setIsAdminMode(true);
      }
    }

    // Kirim sinyal telemetri pertama saat aplikasi dibuka
    sendTelemetrySignal(loaded, 'dashboard');

    // Check for In-App APK Updates automatically in background
    checkForAppUpdates().then((res) => {
      if (res.hasUpdate) {
        const dismissedCode = localStorage.getItem('puncak_dismissed_version_code');
        if (dismissedCode && parseInt(dismissedCode, 10) >= res.latestVersionCode) {
          return;
        }
        setUpdateInfo(res);
        setIsUpdateModalOpen(true);
      }
    });
  }, []);

  // Kirim telemetri setiap kali jumlah tugas atau tab berubah
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      return;
    }
    sendTelemetrySignal(tasks, activeTab);
  }, [tasks, activeTab]);

  const handleToggleNotification = async () => {
    if (!notifEnabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        setNotifEnabled(true);
        checkDailyReminders(tasks);
      } else {
        if (!isNative()) {
          alert('Izin notifikasi tidak diberikan. Harap izinkan notifikasi pada pengaturan browser Anda.');
        }
      }
    } else {
      setNotificationState(false);
      setNotifEnabled(false);
    }
  };

  const updateTasks = (newTasks) => {
    setTasks(newTasks);
    saveTasks(newTasks);
    sendTelemetrySignal(newTasks, activeTab);
    checkDailyReminders(newTasks);
    if (isSyncEnabled()) {
      pushTasksToCloud(newTasks);
    }
  };

  const handleToggleTask = (id) => {
    const updated = tasks.map(t => {
      if (t.id === id) {
        if (isTaskExpired(t)) {
          return t;
        }
        return { ...t, completed: !t.completed };
      }
      return t;
    });
    updateTasks(updated);
  };

  const handleDeleteTask = (id) => {
    let confirmed = false;
    try {
      confirmed = window.confirm('Apakah Anda yakin ingin menghapus tugas ini?');
    } catch (e) {
      confirmed = true;
    }
    if (confirmed) {
      const updated = tasks.filter(t => t.id !== id);
      updateTasks(updated);
    }
  };

  const handleSaveTask = (taskData) => {
    if (Array.isArray(taskData)) {
      const newIds = new Set(taskData.map(t => t.id));
      const filtered = tasks.filter(t => !newIds.has(t.id));
      const updated = [...taskData, ...filtered];
      updateTasks(updated);
      return;
    }
    const exists = tasks.some(t => t.id === taskData.id);
    let updated;
    if (exists) {
      updated = tasks.map(t => (t.id === taskData.id ? taskData : t));
    } else {
      updated = [taskData, ...tasks];
    }
    updateTasks(updated);
  };

  const handleTasksSyncedFromSettings = (remoteTasks) => {
    if (Array.isArray(remoteTasks)) {
      setTasks(remoteTasks);
      saveTasks(remoteTasks);
      checkDailyReminders(remoteTasks);
    }
  };

  const handleCloseUpdateModal = () => {
    if (updateInfo?.latestVersionCode) {
      localStorage.setItem('puncak_dismissed_version_code', String(updateInfo.latestVersionCode));
    }
    setIsUpdateModalOpen(false);
  };

  const handleOpenAddTask = (targetDate) => {
    const checkDate = targetDate || selectedDate || getTodayStr();
    if (isPastDate(checkDate)) {
      alert('Tidak dapat menambahkan tugas untuk hari/bulan yang sudah lewat');
      return;
    }
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleOpenEditTask = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSwitchTab = (tab) => {
    setActiveTab(tab);
    sendTelemetrySignal(tasks, tab);
  };

  // Jika URL khusus admin diakses pada Web Browser, tampilkan Dashboard Pemantauan Admin
  if (isAdminMode && !isNative()) {
    return <AdminDashboard onBackToApp={() => setIsAdminMode(false)} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4f8] font-sans text-slate-900 selection:bg-slate-700 selection:text-white">
      {/* Header Navbar Puncak (Dengan Tombol Pengaturan & Integrasi AI) */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={handleSwitchTab} 
        notifEnabled={notifEnabled}
        onOpenSettings={() => handleSwitchTab('settings')}
        onOpenAddTask={handleOpenAddTask}
      />

      {/* Main Content: Dashboard Harian, Rekap Mingguan, Rekap Bulanan, atau Halaman Pengaturan */}
      <main className="flex-1">
        {activeTab === 'dashboard' && (
          <DailyDashboard 
            tasks={tasks}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            onOpenAddTask={handleOpenAddTask}
            onOpenEditTask={handleOpenEditTask}
          />
        )}

        {activeTab === 'weekly' && (
          <WeeklyRecap tasks={tasks} />
        )}

        {activeTab === 'recap' && (
          <MonthlyRecap tasks={tasks} />
        )}

        {activeTab === 'settings' && (
          <SettingsView 
            onBack={() => handleSwitchTab('dashboard')}
            notifEnabled={notifEnabled}
            onToggleNotification={handleToggleNotification}
            tasks={tasks}
            onTasksSynced={handleTasksSyncedFromSettings}
          />
        )}
      </main>

      {/* Modal Dialog Form Tambah/Edit Tugas */}
      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        editingTask={editingTask}
        tasks={tasks}
      />

      {/* Voice Assistant Modal (Puncak Mic AI) */}
      <VoiceAssistantModal 
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSaveTask={handleSaveTask}
        onOpenEditInModal={(prefillData) => {
          setEditingTask(prefillData);
          setIsModalOpen(true);
        }}
      />

      {/* In-App Auto Update Modal Dialog (Cara B) */}
      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={handleCloseUpdateModal}
        updateInfo={updateInfo}
      />

      {/* Unified Floating Action Buttons Stack (Pojok Kanan Bawah, Rapi di Atas Bottom Nav) */}
      {!isModalOpen && !isUpdateModalOpen && activeTab !== 'settings' && (
        <div className="fixed bottom-20 2xl:bottom-8 right-4 sm:right-6 md:right-8 z-40 flex flex-col items-center gap-2.5">
          {/* 1. Tombol Tambah Manual (+) */}
          <button
            type="button"
            onClick={() => handleOpenAddTask()}
            className="w-12 h-12 sm:w-13 sm:h-13 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-full flex items-center justify-center shadow-md shadow-slate-300/40 border border-slate-200/90 active:scale-95 transition-all duration-200 cursor-pointer"
            title="Tambah Tugas Manual (+)"
            aria-label="Tambah Tugas Manual"
          >
            <Plus className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
          </button>

          {/* 2. Tombol Voice Assistant (Mic) Cassiel-Style */}
          <button
            type="button"
            onClick={() => setIsVoiceModalOpen(prev => !prev)}
            className={`group relative flex items-center justify-center w-12 h-12 sm:w-13 sm:h-13 rounded-full shadow-lg border active:scale-95 transition-all duration-200 focus:outline-none cursor-pointer ${
              isVoiceModalOpen
                ? 'bg-rose-600 border-rose-500 shadow-rose-600/40 text-white animate-pulse'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700/60 shadow-slate-900/30 text-white'
            }`}
            title={isVoiceModalOpen ? 'Tutup Asisten Suara' : 'Bicara untuk Buat Tugas (Voice Assistant)'}
            aria-label="Asisten Suara Tugas"
          >
            {/* Glowing Pulse Accent Ring */}
            <span className={`absolute -inset-1 rounded-full blur-xs transition-opacity duration-300 animate-pulse ${
              isVoiceModalOpen
                ? 'bg-rose-500 opacity-60'
                : 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-amber-400 opacity-40 group-hover:opacity-80'
            }`} />
            
            {/* Mic Icon & Inner Circle */}
            <span className={`relative z-10 flex items-center justify-center w-full h-full rounded-full transition-colors ${
              isVoiceModalOpen ? 'bg-rose-600 text-white' : 'bg-slate-900 group-hover:bg-slate-800 text-indigo-300 group-hover:text-white'
            }`}>
              <Mic className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </span>
          </button>
        </div>
      )}

      {/* Clean Mobile Friendly Footer */}
      <footer className="hidden sm:block bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <div className="flex items-center justify-center gap-4">
          <p>© 2026 Puncak — Manajemen Tugas Harian & Rekap Bulanan.</p>
          {!isNative() && (
            <a 
              href="?admin=true" 
              onClick={(e) => { e.preventDefault(); setIsAdminMode(true); }}
              className="text-slate-400 hover:text-slate-600 underline font-medium"
            >
              Dashboard Admin
            </a>
          )}
        </div>
      </footer>
    </div>
  );
}
