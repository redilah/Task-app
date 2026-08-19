/**
 * Mengambil tanggal hari ini berdasarkan Waktu Lokal Perangkat (WIB / GMT+7, dll)
 * Format output: "YYYY-MM-DD"
 */
export function getTodayStr() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Memformat string tanggal "YYYY-MM-DD" menjadi numerik murni "DD/MM/YYYY"
 * Contoh: "2026-08-01" -> "01/08/2026"
 */
export function formatDateNumeric(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

/**
 * Memeriksa apakah tugas sudah melewati batas waktu 24 jam
 * Memperhitungkan createdAt (timestamp pembuataan) atau jatuh tempo tanggal tugas (t.date + 23:59:59)
 */
export function isTaskExpired(task) {
  if (!task) return false;
  const now = Date.now();
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

  // 1. Jika ada timestamp `createdAt`
  if (task.createdAt) {
    return (now - task.createdAt) > TWENTY_FOUR_HOURS_MS;
  }

  // 2. Fallback untuk data tugas lama yang hanya memiliki `date` ("YYYY-MM-DD")
  if (task.date) {
    // Anggap tugas berakhir pada akhir hari dari tanggal tugas tersebut
    const taskDateEnd = new Date(`${task.date}T23:59:59`).getTime();
    return (now - taskDateEnd) > 0;
  }

  return false;
}

/**
 * Memeriksa apakah suatu tanggal string ("YYYY-MM-DD") berada di hari kemarin atau bulan lalu (sebelum hari ini)
 */
export function isPastDate(dateStr) {
  if (!dateStr) return false;
  const today = getTodayStr();
  return dateStr < today;
}

/**
 * Menghasilkan daftar string tanggal ("YYYY-MM-DD") untuk rentang hari ke depan
 * Mulai dari startDateStr sampai N hari ke depan (default: 30 hari)
 */
export function getFutureDates(startDateStr, days = 30) {
  if (!startDateStr) return [];
  const parts = startDateStr.split('-').map(Number);
  if (parts.length !== 3) return [startDateStr];

  const [year, month, day] = parts;
  const dates = [];

  for (let i = 0; i < days; i++) {
    const d = new Date(year, month - 1, day + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dt = String(d.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${dt}`);
  }
  return dates;
}


