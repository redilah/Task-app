const STORAGE_KEY = 'taskly_tasks_v1';

// Seed default tasks dengan data simulasi (Bulan Lalu Juli 2026 & Bulan Ini Agustus 2026)
const defaultTasks = [
  // --- Bulan Lalu (Juli 2026) ---
  { id: 'sim-1', title: 'Laporan Keuangan Bulanan Juli', category: 'Kerja', priority: 'high', date: '2026-07-10', completed: true, createdMonth: '2026-07', createdAt: new Date('2026-07-10T08:00:00').getTime() },
  { id: 'sim-2', title: 'Meeting Evaluasi Tim', category: 'Kerja', priority: 'medium', date: '2026-07-15', completed: true, createdMonth: '2026-07', createdAt: new Date('2026-07-15T10:00:00').getTime() },
  { id: 'sim-3', title: 'Servis Mobil Berkala', category: 'Pribadi', priority: 'low', date: '2026-07-18', completed: false, createdMonth: '2026-07', createdAt: new Date('2026-07-18T09:00:00').getTime() },
  { id: 'sim-4', title: 'Bayar Tagihan Listrik & Air', category: 'Rumah', priority: 'high', date: '2026-07-20', completed: true, createdMonth: '2026-07', createdAt: new Date('2026-07-20T14:00:00').getTime() },
  { id: 'sim-5', title: 'Belanja Kebutuhan Dapur', category: 'Belanja', priority: 'medium', date: '2026-07-25', completed: false, createdMonth: '2026-07', createdAt: new Date('2026-07-25T11:00:00').getTime() },
  { id: 'sim-6', title: 'Backup Data Laptop', category: 'Pribadi', priority: 'low', date: '2026-07-28', completed: true, createdMonth: '2026-07', createdAt: new Date('2026-07-28T16:00:00').getTime() },

  // --- Bulan Ini (Agustus 2026) ---
  { id: 'sim-7', title: 'Review Target Q3 Proyek Puncak', category: 'Kerja', priority: 'high', date: '2026-08-01', completed: true, createdMonth: '2026-08', createdAt: new Date('2026-08-01T08:00:00').getTime() },
  { id: 'sim-8', title: 'Desain UI Dashboard Baru', category: 'Kerja', priority: 'medium', date: '2026-08-01', completed: true, createdMonth: '2026-08', createdAt: new Date('2026-08-01T09:30:00').getTime() },
  { id: 'sim-9', title: 'Olahraga Pagi 30 Menit', category: 'Kesehatan', priority: 'low', date: '2026-08-01', completed: true, createdMonth: '2026-08', createdAt: new Date('2026-08-01T06:00:00').getTime() },
  { id: 'sim-10', title: 'Update Aplikasi Puncak Versi Baru', category: 'Kerja', priority: 'high', date: '2026-08-01', completed: true, createdMonth: '2026-08', createdAt: new Date('2026-08-01T13:00:00').getTime() },
  { id: 'sim-11', title: 'Beli Buku Catatan Baru', category: 'Belanja', priority: 'low', date: '2026-08-01', completed: false, createdMonth: '2026-08', createdAt: new Date('2026-08-01T15:00:00').getTime() },
];

export const loadTasks = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTasks));
      return defaultTasks;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load tasks from localStorage', error);
    return defaultTasks;
  }
};

export const saveTasks = (tasks) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Failed to save tasks to localStorage', error);
  }
};

export const clearAllTasks = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear tasks from localStorage', error);
  }
};
