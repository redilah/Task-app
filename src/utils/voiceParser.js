import { getTodayStr, shiftDateByDays, addHoursToTime } from './dateUtils.js';

/**
 * Kamus mapping hari Bahasa Indonesia ke indeks hari JS (0 = Minggu, 1 = Senin, ..., 6 = Sabtu)
 */
const DAY_MAP = {
  minggu: 0,
  ahad: 0,
  senin: 1,
  selasa: 2,
  rabu: 3,
  kamis: 4,
  jumat: 5,
  "jum'at": 5,
  sabtu: 6
};

/**
 * Mapping inferensi kategori cerdas berdasarkan kata kunci
 */
const CATEGORY_KEYWORDS = {
  'Belajar': ['baca buku', 'belajar', 'kuliah', 'ujian', 'skripsi', 'tugas sekolah', 'les', 'kursus', 'materi', 'resume', 'baca jurnal', 'pelajari'],
  'Kerja': ['meeting', 'rapat', 'kantor', 'klien', 'presentasi', 'laporan', 'deadline', 'project', 'kerjaan', 'email', 'coding', 'deploy', 'client', 'proyek'],
  'Kesehatan': ['olahraga', 'gym', 'jogging', 'lari', 'sepeda', 'minum obat', 'dokter', 'checkup', 'yoga', 'workout', 'push up', 'renang', 'istirahat'],
  'Ibadah': ['sholat', 'solat', 'salat', 'doa', 'kajian', 'ibadah', 'gereja', 'ngaji', 'tahajud', 'dhuha', 'puasa'],
  'Belanja': ['beli', 'belanja', 'supermarket', 'pasar', 'checkout', 'tokopedia', 'shopee', 'order', 'minimarket', 'mall'],
  'Keuangan': ['bayar', 'transfer', 'tagihan', 'listrik', 'air', 'gaji', 'rekening', 'cicilan', 'investasi', 'nabung', 'menabung'],
  'Rumah': ['bersih-bersih', 'masak', 'cuci', 'jemur', 'piring', 'beres-beres', 'sapu', 'ngepel', 'kamar', 'dapur', 'belanja bulanan']
};

/**
 * Menghitung tanggal target untuk hari tertentu (misal: "hari senin" berikutnya)
 */
function getNextDateForDay(dayName, baseDateStr) {
  const targetDayIdx = DAY_MAP[dayName.toLowerCase()];
  if (targetDayIdx === undefined) return baseDateStr;

  const [y, m, d] = baseDateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const currentDayIdx = date.getDay();

  let diff = targetDayIdx - currentDayIdx;
  if (diff < 0) {
    diff += 7;
  }
  return shiftDateByDays(baseDateStr, diff);
}

/**
 * Fungsi utama untuk mem-parsing ucapan Bahasa Indonesia menjadi object Tugas Puncak
 * @param {string} rawTranscript - Teks transkripsi suara
 * @param {string} customTodayStr - Tanggal acuan (opsional)
 * @returns {object} { title, time, toTime, date, toDate, priority, category, rawTranscript }
 */
export function parseVoiceToTask(rawTranscript = '', customTodayStr = null) {
  if (!rawTranscript || typeof rawTranscript !== 'string') {
    return {
      title: '',
      time: '12:00',
      toTime: '13:00',
      date: customTodayStr || getTodayStr(),
      toDate: customTodayStr || getTodayStr(),
      priority: 'medium',
      category: 'Umum',
      rawTranscript: ''
    };
  }

  const todayStr = customTodayStr || getTodayStr();
  let text = rawTranscript.trim();
  let lower = text.toLowerCase();

  let detectedPriority = 'medium';
  let detectedCategory = '';
  let detectedDate = todayStr;
  let detectedTime = '';

  // -------------------------------------------------------------
  // 1. DETEKSI TINGKAT PRIORITAS
  // -------------------------------------------------------------
  const highPriorityRegex = /\b(?:prioritas\s+(?:sangat\s+)?(?:tinggi|urgent|penting|mendesak)|urgent|penting\s+banget|sangat\s+penting|mendesak|top\s+priority|prioritas\s+tinggi)\b/gi;
  const lowPriorityRegex = /\b(?:prioritas\s+(?:rendah|santai)|santai\s+aja|santai|tidak\s+mendesak|gak\s+mendesak|gak\s+buru-buru|low\s+priority|prioritas\s+rendah)\b/gi;
  const mediumPriorityRegex = /\b(?:prioritas\s+(?:sedang|normal|biasa)|sedang|normal|standar|prioritas\s+sedang)\b/gi;

  if (highPriorityRegex.test(lower)) {
    detectedPriority = 'high';
    text = text.replace(highPriorityRegex, ' ');
  } else if (lowPriorityRegex.test(lower)) {
    detectedPriority = 'low';
    text = text.replace(lowPriorityRegex, ' ');
  } else if (mediumPriorityRegex.test(lower)) {
    detectedPriority = 'medium';
    text = text.replace(mediumPriorityRegex, ' ');
  }

  // Bersihkan sisa kata "prioritas" atau "penting" jika berdiri sendiri
  text = text.replace(/\bprioritas\b/gi, ' ');
  lower = text.toLowerCase();

  // -------------------------------------------------------------
  // 2. DETEKSI KATEGORI
  // -------------------------------------------------------------
  // 2a. Eksplisit: "kategori [nama]"
  const categoryExplicitRegex = /\bkategori\s+([a-zA-Z0-9_\-]+)\b/i;
  const catMatch = lower.match(categoryExplicitRegex);
  if (catMatch) {
    const rawCat = catMatch[1];
    detectedCategory = rawCat.charAt(0).toUpperCase() + rawCat.slice(1);
    text = text.replace(categoryExplicitRegex, ' ');
  }

  lower = text.toLowerCase();

  // -------------------------------------------------------------
  // 3. DETEKSI TANGGAL / HARI
  // -------------------------------------------------------------
  if (/\b(lusa)\b/i.test(lower)) {
    detectedDate = shiftDateByDays(todayStr, 2);
    text = text.replace(/\b(lusa)\b/gi, ' ');
  } else if (/\b(besok|esok\s+hari|esok)\b/i.test(lower)) {
    detectedDate = shiftDateByDays(todayStr, 1);
    text = text.replace(/\b(besok|esok\s+hari|esok)\b/gi, ' ');
  } else if (/\b(hari\s+ini)\b/i.test(lower)) {
    detectedDate = todayStr;
    text = text.replace(/\b(hari\s+ini)\b/gi, ' ');
  } else {
    // Cek nama hari: "hari senin", "hari selasa", "pada hari rabu", dll.
    const dayRegex = /\b(?:hari|pada\s+hari)\s+(senin|selasa|rabu|kamis|jumat|jum'at|sabtu|minggu|ahad)\b/i;
    const dayMatch = lower.match(dayRegex);
    if (dayMatch) {
      detectedDate = getNextDateForDay(dayMatch[1], todayStr);
      text = text.replace(dayRegex, ' ');
    } else {
      // Cek nama hari tunggal jika didahului preposisi atau di akhir
      const singleDayRegex = /\b(senin|selasa|rabu|kamis|jumat|jum'at|sabtu|minggu|ahad)\s+(depan|nanti)\b/i;
      const singleDayMatch = lower.match(singleDayRegex);
      if (singleDayMatch) {
        detectedDate = getNextDateForDay(singleDayMatch[1], todayStr);
        text = text.replace(singleDayRegex, ' ');
      }
    }
  }

  lower = text.toLowerCase();

  // Deteksi indikator periode waktu global dalam kalimat (pagi/siang/sore/malam)
  const isGlobalMalam = /\b(malam)\b/i.test(lower);
  const isGlobalSore = /\b(sore)\b/i.test(lower);
  const isGlobalSiang = /\b(siang)\b/i.test(lower);
  const isGlobalPagi = /\b(pagi|subuh)\b/i.test(lower);

  // -------------------------------------------------------------
  // 4. DETEKSI WAKTU / JAM
  // -------------------------------------------------------------
  // 4a. Format: "jam setengah 4 sore", "jam setengah 12"
  const halfHourRegex = /\b(?:jam|pukul)\s+setengah\s+(\d{1,2})(?:\s+(pagi|siang|sore|malam))?\b/i;
  const halfMatch = lower.match(halfHourRegex);
  if (halfMatch) {
    let baseH = parseInt(halfMatch[1], 10);
    const period = halfMatch[2] ? halfMatch[2].toLowerCase() : (isGlobalMalam ? 'malam' : isGlobalSore ? 'sore' : isGlobalSiang ? 'siang' : isGlobalPagi ? 'pagi' : '');
    
    // "setengah 4" berarti 03:30 (atau 15:30 jika sore)
    let actualH = baseH - 1;
    if (actualH < 0) actualH = 23;

    if (period === 'malam' && actualH < 12) actualH += 12;
    else if (period === 'sore' && actualH < 12) actualH += 12;
    else if (period === 'siang' && actualH >= 1 && actualH <= 4) actualH += 12;
    else if (period === 'pagi' && actualH === 12) actualH = 0;

    detectedTime = `${String(actualH).padStart(2, '0')}:30`;
    text = text.replace(halfHourRegex, ' ');
  }

  // 4b. Format: "jam 11:30", "jam 11.30", "jam 11 lewat 30", "pukul 14.00"
  if (!detectedTime) {
    const timeWithMinRegex = /\b(?:jam|pukul)\s+(\d{1,2})(?:[:.]|\s+lewat\s+|\s+lebih\s+)(\d{1,2})(?:\s+(pagi|siang|sore|malam))?\b/i;
    const matchMin = lower.match(timeWithMinRegex);
    if (matchMin) {
      let h = parseInt(matchMin[1], 10);
      let m = parseInt(matchMin[2], 10);
      const period = matchMin[3] ? matchMin[3].toLowerCase() : (isGlobalMalam ? 'malam' : isGlobalSore ? 'sore' : isGlobalSiang ? 'siang' : isGlobalPagi ? 'pagi' : '');

      if (period === 'malam' && h < 12) h += 12;
      else if (period === 'sore' && h < 12) h += 12;
      else if (period === 'siang' && h >= 1 && h <= 4) h += 12;
      else if (period === 'pagi' && h === 12) h = 0;

      detectedTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      text = text.replace(timeWithMinRegex, ' ');
    }
  }

  // 4c. Format: "jam 11 siang", "jam 8 malam", "jam 7 pagi", "jam 2 siang", "jam 10"
  if (!detectedTime) {
    const simpleHourRegex = /\b(?:jam|pukul)\s+(\d{1,2})(?:\s+(pagi|siang|sore|malam))?\b/i;
    const matchHour = lower.match(simpleHourRegex);
    if (matchHour) {
      let h = parseInt(matchHour[1], 10);
      const period = matchHour[2] ? matchHour[2].toLowerCase() : (isGlobalMalam ? 'malam' : isGlobalSore ? 'sore' : isGlobalSiang ? 'siang' : isGlobalPagi ? 'pagi' : '');

      if (period === 'malam' && h < 12) h += 12;
      else if (period === 'sore' && h < 12) h += 12;
      else if (period === 'siang' && h >= 1 && h <= 4) h += 12;
      else if (period === 'pagi' && h === 12) h = 0;
      else if (!period) {
        // Asumsi intuitif jika tanpa embel-embel:
        // jam 1 - 6 diasumsikan sore (13 - 18) kecuali jika >= 7 diasumsikan pagi/siang
        if (h >= 1 && h <= 6) h += 12;
      }

      detectedTime = `${String(h).padStart(2, '0')}:00`;
      text = text.replace(simpleHourRegex, ' ');
    }
  }

  // 4d. Frasa waktu relatif umum: "nanti malam", "nanti sore", "siang ini", "pagi-pagi"
  if (!detectedTime) {
    if (/\b(nanti\s+malam|malam\s+nanti|malam\s+ini)\b/i.test(lower)) {
      detectedTime = '19:00';
      text = text.replace(/\b(nanti\s+malam|malam\s+nanti|malam\s+ini)\b/gi, ' ');
    } else if (/\b(nanti\s+sore|sore\s+nanti|sore\s+ini)\b/i.test(lower)) {
      detectedTime = '16:00';
      text = text.replace(/\b(nanti\s+sore|sore\s+nanti|sore\s+ini)\b/gi, ' ');
    } else if (/\b(siang\s+ini|nanti\s+siang)\b/i.test(lower)) {
      detectedTime = '12:00';
      text = text.replace(/\b(siang\s+ini|nanti\s+siang)\b/gi, ' ');
    } else if (/\b(pagi\s+ini|besok\s+pagi)\b/i.test(lower)) {
      detectedTime = '08:00';
      text = text.replace(/\b(pagi\s+ini|besok\s+pagi)\b/gi, ' ');
    }
  }

  // Default waktu jika tidak terdeteksi: 1 jam dari sekarang dibulatkan atau 10:00
  if (!detectedTime) {
    const now = new Date();
    const nextHour = (now.getHours() + 1) % 24;
    detectedTime = `${String(nextHour).padStart(2, '0')}:00`;
  }

  const toTime = addHoursToTime(detectedTime, 1);

  // -------------------------------------------------------------
  // 5. PEMBERSIHAN JUDUL TUGAS (TITLE EXTRACTION)
  // -------------------------------------------------------------
  // Hapus kata pengantar umum
  const fillerPrefixRegex = /^(?:tolong\s+)?(?:buatkan|buat|bikin|tambahkan|tambah|jadwalkan|ingatkan\s+saya\s+untuk|ingatkan\s+untuk|ingatkan|catat|tulis)\s+(?:tugas|task|agenda)?\s*/i;
  text = text.replace(fillerPrefixRegex, ' ');

  // Hapus sisa-sisa partikel atau kata hubung di awal/akhir
  text = text.replace(/^(?:untuk|pada|di|jam|tanggal|tgl|hari|dengan)\s+/i, '');
  text = text.replace(/\s+(?:untuk|pada|di|jam|tanggal|tgl|hari|dengan)$/i, '');
  text = text.replace(/\s{2,}/g, ' ').trim();

  // Jika setelah dibersihkan teks kosong, gunakan fallback transkripsi asli
  let cleanTitle = text || rawTranscript.trim();
  if (cleanTitle) {
    cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
  }

  // -------------------------------------------------------------
  // 6. INFERENSI KATEGORI OTOMATIS (Jika belum ditentukan eksplisit)
  // -------------------------------------------------------------
  if (!detectedCategory) {
    const titleLower = cleanTitle.toLowerCase();
    for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(kw => titleLower.includes(kw))) {
        detectedCategory = catName;
        break;
      }
    }
    if (!detectedCategory) {
      detectedCategory = 'Umum';
    }
  }

  return {
    title: cleanTitle,
    time: detectedTime,
    toTime: toTime,
    date: detectedDate,
    toDate: detectedDate,
    priority: detectedPriority,
    category: detectedCategory,
    rawTranscript: rawTranscript
  };
}
