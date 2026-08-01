import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DailyDashboard from './components/DailyDashboard';
import MonthlyRecap from './components/MonthlyRecap';
import TaskModal from './components/TaskModal';
import UpdateModal from './components/UpdateModal';
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

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'recap'
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => getTodayStr());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);

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
        setUpdateInfo(res);
        setIsUpdateModalOpen(true);
      }
    });
  }, []);

  // Kirim telemetri setiap kali jumlah tugas atau tab berubah
  useEffect(() => {
    if (tasks.length >= 0) {
      sendTelemetrySignal(tasks, activeTab);
    }
  }, [tasks, activeTab]);

  const handleToggleNotification = async () => {
    if (!notifEnabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        setNotifEnabled(true);
        checkDailyReminders(tasks);
      } else {
        alert('Izin notifikasi tidak diberikan oleh browser. Harap izinkan notifikasi pada pengaturan browser Anda.');
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
  };

  const handleToggleTask = (id) => {
    const updated = tasks.map(t => {
      if (t.id === id) {
        // Mencegah toggle HANYA JIKA tugas sudah kadaluwarsa (>24 jam dari dibuat)
        if (isTaskExpired(t)) {
          return t;
        }
        // Jika masih dalam 24 jam, bebas toggle completed (true / false)
        return { ...t, completed: !t.completed };
      }
      return t;
    });
    updateTasks(updated);
  };

  const handleDeleteTask = (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus tugas ini?')) {
      const updated = tasks.filter(t => t.id !== id);
      updateTasks(updated);
    }
  };

  const handleSaveTask = (taskData) => {
    const exists = tasks.some(t => t.id === taskData.id);
    let updated;
    if (exists) {
      updated = tasks.map(t => (t.id === taskData.id ? taskData : t));
    } else {
      updated = [taskData, ...tasks];
    }
    updateTasks(updated);
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
    <div className="min-h-screen flex flex-col bg-[#f0f4f8] font-sans text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* Header Navbar Puncak (Dengan Toggle Notifikasi) */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={handleSwitchTab} 
        notifEnabled={notifEnabled}
        onToggleNotification={handleToggleNotification}
        onOpenAddTask={handleOpenAddTask}
      />

      {/* Main Content: Dashboard Harian atau Rekap Bulanan */}
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

        {activeTab === 'recap' && (
          <MonthlyRecap tasks={tasks} />
        )}
      </main>

      {/* Modal Dialog Form Tambah/Edit Tugas */}
      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        editingTask={editingTask}
      />

      {/* In-App Auto Update Modal Dialog (Cara B) */}
      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
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
