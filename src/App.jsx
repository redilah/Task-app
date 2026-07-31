import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DailyDashboard from './components/DailyDashboard';
import MonthlyRecap from './components/MonthlyRecap';
import TaskModal from './components/TaskModal';
import UpdateModal from './components/UpdateModal';
import { loadTasks, saveTasks } from './utils/storage';
import { 
  getNotificationState, 
  setNotificationState, 
  requestNotificationPermission, 
  checkDailyReminders 
} from './utils/notifications';
import { checkForAppUpdates } from './utils/version';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'recap'
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [notifEnabled, setNotifEnabled] = useState(false);

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

    // Check for In-App APK Updates automatically in background
    checkForAppUpdates().then((res) => {
      if (res.hasUpdate) {
        setUpdateInfo(res);
        setIsUpdateModalOpen(true);
      }
    });
  }, []);

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
  };

  const handleToggleTask = (id) => {
    const updated = tasks.map(t => {
      if (t.id === id) {
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

  const handleOpenAddTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleOpenEditTask = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4f8] font-sans text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* Header Navbar Puncak (Dengan Toggle Notifikasi) */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        notifEnabled={notifEnabled}
        onToggleNotification={handleToggleNotification}
      />

      {/* Main Content: Dashboard Harian atau Rekap Bulanan */}
      <main className="flex-1">
        {activeTab === 'dashboard' && (
          <DailyDashboard 
            tasks={tasks}
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
        <p>© 2026 Puncak — Manajemen Tugas Harian & Rekap Bulanan.</p>
      </footer>
    </div>
  );
}
