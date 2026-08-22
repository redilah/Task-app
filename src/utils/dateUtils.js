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
 * Memeriksa apakah tugas sudah melewati batas hari (kedaluwarsa setelah jam 23:59:59 / tengah malam pergantian hari)
 * Tugas di tanggal hari ini tetap aktif sampai jam 23:59:59. Begitu masuk hari esoknya (< today), tugas terkunci.
 */
export function isTaskExpired(task) {
  if (!task) return false;
  const todayStr = getTodayStr();

  // 1. Jika ada string tanggal "YYYY-MM-DD" (standar utama)
  if (task.date) {
    return task.date < todayStr;
  }

  // 2. Fallback untuk data yang hanya memiliki timestamp `createdAt`
  if (task.createdAt) {
    const createdDate = new Date(task.createdAt);
    const y = createdDate.getFullYear();
    const m = String(createdDate.getMonth() + 1).padStart(2, '0');
    const d = String(createdDate.getDate()).padStart(2, '0');
    const taskDateStr = `${y}-${m}-${d}`;
    return taskDateStr < todayStr;
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

/**
 * Memformat tanggal & jam menjadi format kalender ringkas (contoh: "Jum, 21 Agu 2026 11:00")
 */
export function formatFullDateTimeIndo(dateStr, timeStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  const dateObj = new Date(year, month - 1, day);
  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  
  const dayName = days[dateObj.getDay()];
  const monthName = months[dateObj.getMonth()];
  const formattedDate = `${dayName}, ${day} ${monthName} ${year}`;
  
  return timeStr ? `${formattedDate}  ${timeStr}` : formattedDate;
}

/**
 * Memformat tanggal & jam tanpa tahun (contoh: "Jum, 21 Agu, 11:00")
 */
export function formatDateTimeNoYear(dateStr, timeStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  const dateObj = new Date(year, month - 1, day);
  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  
  const dayName = days[dateObj.getDay()];
  const monthName = months[dateObj.getMonth()];
  const formattedDate = `${dayName}, ${day} ${monthName}`;
  
  return timeStr ? `${formattedDate}, ${timeStr}` : formattedDate;
}

/**
 * Memformat tanggal hanya "Hari, Tgl Bln" tanpa tahun (contoh: "Jum, 21 Agu")
 */
export function formatDateLabelNoYear(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  const dateObj = new Date(year, month - 1, day);
  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  
  const dayName = days[dateObj.getDay()];
  const monthName = months[dateObj.getMonth()];
  return `${dayName}, ${day} ${monthName}`;
}

/**
 * Menggeser tanggal YYYY-MM-DD sejumlah offset hari (+1, -1, dst)
 */
export function shiftDateByDays(dateStr, offsetDays = 0) {
  if (!dateStr) return dateStr;
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  const dateObj = new Date(y, m - 1, d + offsetDays);
  const newY = dateObj.getFullYear();
  const newM = String(dateObj.getMonth() + 1).padStart(2, '0');
  const newD = String(dateObj.getDate()).padStart(2, '0');
  return `${newY}-${newM}-${newD}`;
}

/**
 * Menambahkan sejumlah jam ke string waktu "HH:mm"
 * Contoh: ("10:00", 1) -> "11:00", ("23:30", 2) -> "01:30"
 */
export function addHoursToTime(timeStr, hoursToAdd = 1) {
  if (!timeStr || !timeStr.includes(':')) return '11:00';
  const [h, m] = timeStr.split(':').map(Number);
  const newHour = (h + hoursToAdd) % 24;
  return `${String(newHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
