import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import DailyDashboard from './components/DailyDashboard';
import WeeklyRecap from './components/WeeklyRecap';
import MonthlyRecap from './components/MonthlyRecap';
import TaskModal from './components/TaskModal';
import UpdateModal from './components/UpdateModal';
import SettingsView from './components/SettingsView';
import AdminDashboard from './components/AdminDashboard';
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

      {/* In-App Auto Update Modal Dialog (Cara B) */}
      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={handleCloseUpdateModal}
        updateInfo={updateInfo}
      />

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
