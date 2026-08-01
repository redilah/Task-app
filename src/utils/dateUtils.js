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
