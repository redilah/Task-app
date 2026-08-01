# 📊 Dokumentasi Dashboard Pemantauan Admin & Integrasi Firebase Firestore (Puncak App)

Dokumen ini menjelaskan secara lengkap dan detail mengenai arsitektur, cara kerja, alur komunikasi data, serta fungsi kode yang digunakan pada **Dashboard Pemantauan Admin** aplikasi **Puncak** (`com.puncak.app`) yang terhubung langsung dengan **Google Firebase Firestore**.

---

## 📑 Daftar Isi
1. [Ikhtisar Arsitektur](#1-ikhtisar-arsitektur)
2. [Struktur File Kode Utama](#2-struktur-file-kode-utama)
3. [Mekanisme Terhubung ke Firebase Firestore (REST API)](#3-mekanisme-terhubung-ke-firebase-firestore-rest-api)
4. [Cara Pengiriman Telemetri (Perekaman Data Pengguna)](#4-cara-pengiriman-telemetri-perekaman-data-pengguna)
5. [Cara Ambil Data Pengguna untuk Dashboard (Pengambilan Data)](#5-cara-ambil-data-pengguna-untuk-dashboard-pengambilan-data)
6. [Fitur-Fitur & Logika Dashboard Admin](#6-fitur-fitur--logika-dashboard-admin)
7. [Privasi & Keamanan Data](#7-privasi--keamanan-data)

---

## 1. Ikhtisar Arsitektur

Aplikasi **Puncak** menggunakan pendekatan **Direct Firebase Firestore REST API v1** tanpa memerlukan SDK Firebase berat pada bundel frontend/mobile. Hal ini menjaga ukuran aplikasi tetap sangat kecil (~4 MB) namun tetap memiliki kemampuan telemetri real-time.

```
┌─────────────────────────────────────────────────────────┐
│              Aplikasi Puncak (Android / Web)            │
│  - Membuat Persistent Device ID & Waktu Pertama Instal  │
│  - Mengirim Telemetri secara berkala via REST API PATCH  │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼ (HTTP PATCH / GET via REST API v1)
┌─────────────────────────────────────────────────────────┐
│               Google Firebase Firestore                 │
│  Project ID : regalia-senpai-app                        │
│  Collection : puncak_telemetry                          │
│  Document   : {deviceId}                                │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼ (HTTP GET Query Documents)
┌─────────────────────────────────────────────────────────┐
│                 Dashboard Admin Puncak                  │
│  - Memuat seluruh dokumen dari koleksi puncak_telemetry  │
│  - Auto-refresh otomatis per 1 jam (3600 detik)         │
│  - Menampilkan Statistik 4 Kartu Metrik & Tabel Detail  │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Struktur File Kode Utama

Sistem Dashboard dan Telemetri Puncak dibangun dari dua file kode utama:

1. **`src/utils/telemetry.js`**
   *Berfungsi sebagai modul pengelola telemetri: pembuatan ID unik perangkat, pencatatan tanggal & jam pertama instalasi, pengiriman sinyal telemetri ke Firestore, dan pemanggilan fetch data untuk Admin.*

2. **`src/components/AdminDashboard.jsx`**
   *Berfungsi sebagai antarmuka (UI) Dashboard Pemantauan Admin yang menampilkan statistik agregat (total pengguna, status update versi, total tugas dibuat, aktivitas tab) dan tabel detail per perangkat.*

---

## 3. Mekanisme Terhubung ke Firebase Firestore (REST API)

Koneksi ke Firebase Firestore menggunakan **Firestore REST API v1** bawaan Google. Konfigurasi kredensial didefinisikan di `src/utils/telemetry.js`:

```javascript
const FIREBASE_PROJECT_ID = 'regalia-senpai-app';
const FIREBASE_API_KEY = 'AIzaSyBhaSgR4Pc4ctnZ_NoTkVVOIPsegPHwvqE';
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/puncak_telemetry`;
```

### Keunggulan Metode REST API:
- **Tanpa Overhead SDK**: Memangkas ukuran APK dari membengkak hingga puluhan MB.
- **Respon Cepat & Ringan**: Langsung berkomunikasi via endpoint HTTPS resmi Google (`firestore.googleapis.com`).

---

## 4. Cara Pengiriman Telemetri (Perekaman Data Pengguna)

Setiap kali pengguna membuka aplikasi, berpindah tab, atau menambah/mengubah tugas, fungsi `sendTelemetrySignal()` dipanggil secara otomatis di latar belakang.

### A. Identifikasi Perangkat Unik (`getDeviceId`)
Setiap instalasi aplikasi menghasilkan **Device ID unik** yang tersimpan permanen di `localStorage` perangkat:

```javascript
export const getDeviceId = () => {
  let id = localStorage.getItem('puncak_device_id');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    localStorage.setItem('puncak_device_id', id);
  }
  return id;
};
```

### B. Pencatatan Tanggal & Jam Pertama Instalasi (`getInstallDateTime`)
Saat aplikasi pertama kali dibuka di suatu perangkat, waktu persis instalasi dikunci di `localStorage`:

```javascript
export const getInstallDateTime = () => {
  let installTime = localStorage.getItem('puncak_install_datetime');
  if (!installTime) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    installTime = `${dateStr} jam ${timeStr} WIB`;
    localStorage.setItem('puncak_install_datetime', installTime);
  }
  return installTime;
};
```

### C. Pengiriman Payload Data Telemetri (`PATCH`)
Data dikirim ke Firestore menggunakan method HTTP **`PATCH`** dengan parameter `updateMask.fieldPaths` agar dokumen ter-update atau terbuat secara otomatis tanpa menimpa data yang tidak perlu:

```javascript
export const sendTelemetrySignal = async (tasks = [], activeTab = 'dashboard') => {
  try {
    const deviceId = getDeviceId();
    const installDate = getInstallDateTime();
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const lastSeenDate = `${dateStr} jam ${timeStr} WIB`;

    const versionStr = `v${CURRENT_VERSION_NAME} (Code ${CURRENT_VERSION_CODE})`;
    const platformStr = isNative() ? 'Android App' : 'Web Browser';
    const taskCount = tasks ? tasks.length : 0;

    // Format dokumen Firestore Value Type
    const payload = {
      fields: {
        deviceId: { stringValue: deviceId },
        installDate: { stringValue: installDate },
        lastSeenDate: { stringValue: lastSeenDate },
        appVersion: { stringValue: versionStr },
        taskCount: { integerValue: taskCount },
        activeTab: { stringValue: activeTab },
        platform: { stringValue: platformStr },
        updatedAtMs: { integerValue: Date.now() }
      }
    };

    // Update mask field paths untuk REST API PATCH Firestore
    const fieldPaths = [
      'updateMask.fieldPaths=deviceId',
      'updateMask.fieldPaths=installDate',
      'updateMask.fieldPaths=lastSeenDate',
      'updateMask.fieldPaths=appVersion',
      'updateMask.fieldPaths=taskCount',
      'updateMask.fieldPaths=activeTab',
      'updateMask.fieldPaths=platform',
      'updateMask.fieldPaths=updatedAtMs'
    ].join('&');

    const documentUrl = `${FIRESTORE_BASE_URL}/${deviceId}?key=${FIREBASE_API_KEY}&${fieldPaths}`;
    
    await fetch(documentUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.warn('Telemetry sync note:', err);
  }
};
```

---

## 5. Cara Ambil Data Pengguna untuk Dashboard (Pengambilan Data)

Admin Dashboard mengambil seluruh dokumen perangkat yang tersimpan di koleksi `puncak_telemetry` melalui fungsi `fetchAllUsersTelemetry()` di `src/utils/telemetry.js`.

### Kode Pemanggilan REST API `GET`:

```javascript
export const fetchAllUsersTelemetry = async () => {
  try {
    const fetchUrl = `${FIRESTORE_BASE_URL}?key=${FIREBASE_API_KEY}`;
    const response = await fetch(fetchUrl);
    if (!response.ok) throw new Error('Gagal mengambil data dari Firebase');
    const data = await response.json();

    if (!data.documents) return [];

    // Parsing struktur dokumen khusus Firestore REST API menjadi Objek JavaScript sederhana
    return data.documents.map(doc => {
      const fields = doc.fields || {};
      return {
        id: doc.name.split('/').pop(),
        deviceId: fields.deviceId?.stringValue || 'Unknown',
        installDate: fields.installDate?.stringValue || 'Tidak Diketahui',
        lastSeenDate: fields.lastSeenDate?.stringValue || 'Tidak Diketahui',
        appVersion: fields.appVersion?.stringValue || 'v1.0.0',
        taskCount: parseInt(fields.taskCount?.integerValue || 0),
        activeTab: fields.activeTab?.stringValue || 'dashboard',
        platform: fields.platform?.stringValue || 'Android App',
        updatedAtMs: parseInt(fields.updatedAtMs?.integerValue || 0)
      };
    });
  } catch (err) {
    console.error('Error fetching admin telemetry:', err);
    return [];
  }
};
```

---

## 6. Fitur-Fitur & Logika Dashboard Admin

Pada komponen `src/components/AdminDashboard.jsx`, data yang telah diparsing diolah secara real-time menjadi informasi visual:

### A. Fitur Auto-Refresh 1 Jam (3600 Detik) & Refresh Manual
Dashboard dilengkapi dengan hitung mundur (*countdown timer*) 1 jam (3600 detik) yang secara otomatis akan memanggil ulang `fetchAllUsersTelemetry()`. Admin juga dapat menekan tombol **"Refresh Sekarang"** kapan saja.

```javascript
const [countdown, setCountdown] = useState(3600); // 1 Jam = 3600 detik

useEffect(() => {
  loadData();

  const timer = setInterval(() => {
    setCountdown(prev => {
      if (prev <= 1) {
        loadData();
        return 3600;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(timer);
}, []);
```

### B. Kalkulasi 4 Kartu Metrik Utama
1. **Total Pengguna**: `usersData.length` (Menghitung akumulasi perangkat terinstal).
2. **Status Update Versi**: Menghitung berapa banyak pengguna yang sudah meng-update ke versi terbaru (`v1.0.7 (Code 8)`) vs pengguna versi lama.
3. **Kuantitas Tugas**: Sum dari seluruh `taskCount` untuk melihat total volume penggunaan aplikasi secara keseluruhan.
4. **Aktivitas Tab**: Perbandingan persentase antara pengguna yang membuka tab **Dashboard** vs tab **Rekap**.

### C. Tabel Detail Perangkat
Tabel menampilkan rincian berikut secara transparan:
- **No** & **ID Perangkat** (contoh: `dev_x9a2b1...`)
- **🗓️ Tanggal & Jam Instal** (Pencatatan persentase hari & jam pertama aplikasi dibuka, misal: `01/08/2026 jam 12:45:10 WIB`)
- **⏱️ Terakhir Aktif**
- **Status Versi APK** (Indikator hijau jika sudah versi terbaru `v1.0.7`, oranye jika belum)
- **Kuantitas Tugas**
- **Platform** (`Android App` atau `Web Browser`)

---

## 7. Privasi & Keamanan Data

- **Tanpa Data Pribadi**: Telemetri ini **TIDAK PERNAH** mencatat nama, email, lokasi GPS, ataupun judul/isi tugas pengguna.
- **Hanya Kuantitas & Performa**: Hanya merekam statistik kuantitas tugas (jumlah angka), versi APK, dan durasi aktif untuk keperluan analisis performa dan kestabilan aplikasi Puncak.
