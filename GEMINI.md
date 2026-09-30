# Rules Proyek Puncak

Aturan-aturan berikut WAJIB diikuti saat bekerja dengan proyek Puncak (aplikasi Capacitor Android).

## Ketentuan Versioning & Build APK (WAJIB)

- **Increment `versionCode` Setiap Update**: Setiap kali membuat pembaruan dan commit/push APK baru ke GitHub, `versionCode` di `android/app/build.gradle`, `public/version.json`, dan `src/utils/version.js` WAJIB dinaikkan 1 tingkat.
- **Fleksibilitas Ukuran APK**: Tidak perlu menargetkan ukuran APK secara kaku (misalnya harus 1MB). Ukuran APK 2-3 MB (atau lebih) sangat wajar dan sepenuhnya dapat diterima. Fokus utama adalah kestabilan, fitur, dan UI/UX yang prima. Jangan berlebihan mengomentari ukuran file.
- **Signed APK Only**: Pastikan Release build selalu dikompilasi menggunakan signingConfig agar tidak mengalami error "package invalid" di Android.

## Dev Server Management (WAJIB)

Sebelum menjalankan `npm run dev` baru, SELALU periksa dan matikan semua proses dev server lama menggunakan `manage_task` → `kill`. Pastikan hanya ada **1 proses dev server** yang aktif pada satu waktu (port `3000`). Jangan biarkan proses `npm run dev` menumpuk.

## Urutan Pengujian: Localhost Dulu (WAJIB)

Untuk setiap perubahan kode baru, ikuti urutan pengujian berikut secara ketat:

1. Jalankan `npm run dev` → Uji perubahan di `http://localhost:3000`
2. Tunggu konfirmasi eksplisit dari user bahwa tampilan localhost sudah benar dan sesuai
3. Baru jalankan pipeline build lengkap: `npm run build` → `npx cap sync android` → `gradlew assembleDebug` → copy APK (deploy ke Netlify HANYA dilakukan jika diminta secara manual oleh user)

DILARANG langsung build APK tanpa konfirmasi localhost dari user terlebih dahulu, kecuali user secara eksplisit meminta untuk melewati tahap localhost.

## Penempatan File APK (WAJIB)

Setiap selesai me-render/kompilasi APK baru (`gradlew assembleDebug`), file APK disalin HANYA ke lokasi-lokasi berikut:
- `Puncak.apk` di root proyek (wajib untuk GitHub Raw auto-update).
- `dist/Puncak.apk` (wajib untuk Netlify web download).
- **HANYA 1 tempat di Desktop**: `C:\Users\GC\Downloads\OneDrive\Desktop\Puncak App\Puncak.apk` (DILARANG membuat salinan ganda di Desktop luar agar Desktop tetap rapi).

## Larangan Recursive Bundling APK (WAJIB)

**DILARANG KERAS** meletakkan file `Puncak.apk` di dalam folder `public/`. Alasan:
- Vite otomatis menyalin semua isi `public/` ke `dist/` saat `npm run build`.
- `npx cap sync android` menyalin semua isi `dist/` ke `android/app/src/main/assets/public/`.
- Akibatnya, APK **memuat dirinya sendiri** (recursive bundling) → ukuran membengkak dari ~4 MB menjadi ~20 MB.

Mekanisme in-app update menggunakan URL remote (GitHub Raw / Netlify), **bukan** file lokal di dalam bundle. Jadi `Puncak.apk` di `public/` tidak diperlukan.

## Larangan Membuat Aset Baru Tanpa Verifikasi (WAJIB)

**DILARANG** membuat file ikon, logo, atau aset visual baru untuk keperluan store (APKPure, Play Store, dll) tanpa terlebih dahulu memeriksa apakah file asli sudah ada di proyek. Langkah wajib:
1. Cari file ikon/aset yang sudah ada di seluruh proyek (`src/`, `resources/`, `android/app/src/main/res/`).
2. Jika sudah ada → **SALIN dan RESIZE** file yang ada, **JANGAN buat dari scratch**.
3. Hanya buat aset baru jika file sumber benar-benar tidak ditemukan sama sekali.

Alasan: standar industri menetapkan 1 aplikasi = 1 logo yang konsisten di semua platform. Membuat logo baru menyebabkan inkonsistensi visual antara ikon di HP dan ikon di store.

## Verifikasi Nama File Sebelum Menyebut Path/URL (WAJIB)

Sebelum menyebut path file, URL raw GitHub, atau nama file dalam instruksi kepada user, **WAJIB** verifikasi nama file yang sebenarnya dengan `list_dir` atau `grep_search` terlebih dahulu.

**DILARANG** menebak nama file berdasarkan konvensi umum (misal: `PRIVACY_POLICY.md`, `README.md`, dll) tanpa mengecek keberadaannya di filesystem proyek. Contoh kasus: file privasi proyek ini bernama `PRIVACY.md`, **bukan** `PRIVACY_POLICY.md`.

## Pola Floating Voice Assistant Bubble (WAJIB)

- **Floating Column Sebelah Kiri**: Tampilan preview suara mengambang tepat di sebelah kiri tombol Mic (`right-[4.5rem] bottom-20`), bukan di tengah layar.
- **Borderless & Clean Light Theme**: Gunakan latar putih bersih berbayang lembut tanpa garis tepi (borderless), dengan animasi nada musik, teks ucapan real-time, dan tombol X dalam satu baris terpadu.
- **Silent Auto-Save**: Simpan tugas secara otomatis setelah jeda bicara selesai tanpa efek suara kicau burung.
- **Mobile Responsive**: Lebar maksimal `w-[calc(100vw-5.5rem)] max-w-[275px]` agar tidak terpotong pada layar iPhone SE (375px).

## Pola Custom Wheel Picker & Inertial Scrolling (WAJIB)

- Gunakan fisika inersia/momentum dengan peluruhan gesekan (friction ~0.93) dan magnetic spring snap ke indeks terdekat.
- Render jendela tampak secara dinamis (`baseIndex = Math.round(-offsetY / ITEM_HEIGHT)`) agar elemen tidak hilang saat digulir cepat.
- Tampilkan tepat 3 baris tanpa ruang kosong: baris tengah (aktif) dengan warna aksen kontras dan sedikit naik (`-translate-y-0.5`), baris atas/bawah redup.

## Ketentuan Debug Sideload Keystore & Deterministic Signing (WAJIB)

- **Penguncian Keystore Permanen**: File keystore penandatanganan build lokal WAJIB dikunci tetap pada `android/app/debug.keystore` dan dikonfigurasikan pada `signingConfigs.debug` di `android/app/build.gradle`.
- **Larangan Bergantung pada Auto-Generated Keystore**: Dilarang mengandalkan keystore default global Android SDK yang rentan ter-generate ulang secara acak. Hal ini menjamin fingerprint sertifikat (SHA-256) selalu identik 100% antar-versi, sehingga user dapat selalu meng-update APK langsung di HP tanpa pernah mengalami error *"Package conflicts with an existing package"*.

## Standar Pembuatan File ZIP & Konfigurasi (WAJIB)

- **Wajib Forward Slash (/) di ZIP**: Saat membuat arsip `.zip` di lingkungan Windows (untuk plugin Claude, bundle MCP, atau distribusi cross-platform), DILARANG menggunakan tool yang menyimpan backslash (`\`) sebagai pemisah direktori. Wajib gunakan `tar -a -c -f output.zip -C <dir> .` atau script Node/Python agar entri path selalu menggunakan `/` standar.
- **Wajib UTF-8 Tanpa BOM**: Saat membuat file JSON/manifest/config via PowerShell/Node, pastikan ditulis menggunakan UTF-8 No BOM (hindari `Set-Content -Encoding utf8` standar PowerShell 5.1 yang menambahkan 3 byte BOM). Gunakan `[System.IO.File]::WriteAllText($path, $text, (New-Object System.Text.UTF8Encoding($false)))` atau Node.js `fs.writeFileSync`.
- **Unix Line Endings (LF)**: Selalu gunakan line ending `\n` (LF) untuk file manifest dan JSON cross-platform.

## Pola Halaman Decision & Form Input (WAJIB)

- **Header Bersih**: Judul halaman tampil ringkas dan murni (misal: "Decision") tanpa sub-teks deskripsi di bawahnya.
- **Apple-Style Capsule Segmented Toggle**: Gunakan kapsul `rounded-full` dengan sliding active pill `bg-slate-900` dan transisi inersia lembut Apple `ease-[cubic-bezier(0.16,1,0.3,1)]` persis seperti pada Rekap Mingguan.
- **Ikon Melayang Bebas (Boxless)**: Ikon pada kartu konten melayang langsung tanpa kotak/lingkaran pembungkus background.
- **Opsi Ikon `none`**: Pilihan tanpa ikon wajib menggunakan tombol bertuliskan teks `none` murni tanpa logo/ikon pembungkus.
- **Clean Input Placeholder**: Pada kolom input/textarea formulir, DILARANG menyertakan kalimat contoh (seperti *"Contoh: ..."*). Gunakan placeholder bersih atau kosong.
- **Integrasi Floating Action Button (+)**: Jangan membuat tombol blok lebar di atas daftar kartu; gunakan tombol bulat floating (+) di pojok kanan bawah yang dinamis membuka form sesuai sub-tab aktif (Keputusan vs Pikiran Saat Ini), dan disembunyikan saat form sedang terbuka.

## Setup Izin Mikrofon Android Native (WAJIB)

- **Manifest Permission**: Wajib mendaftarkan `android.permission.RECORD_AUDIO` dan `android.permission.MODIFY_AUDIO_SETTINGS` di `android/app/src/main/AndroidManifest.xml` agar menu "Mikrofon" selalu muncul di Pengaturan HP > Info Aplikasi > Izin.
- **Pemicu Izin WebView**: Gunakan pemicu `navigator.mediaDevices.getUserMedia({ audio: true })` sebelum rekaman Web Speech API dimulai agar dialog izin native sistem Android otomatis muncul.
- **Android SDK Path**: Pastikan `android/local.properties` terkonfigurasi dengan `sdk.dir=C\:\\Users\\GC\\AppData\\Local\\Android\\Sdk`.

## Larangan Filter Pembersihan Data Berbasis Prefix Timestamp (WAJIB)

**DILARANG KERAS** menggunakan pembersihan/filtering data `localStorage` berbasis substring/prefix angka acak (seperti `.startsWith('dec-1')`, `.startsWith('thought-1')`, atau `.startsWith('task-1')`) untuk membersihkan data dummy lama.
- **Alasan**: Timestamp epoch Unix modern (`Date.now()`) di era 2026+ selalu diawali dengan digit `1` (misal `1790...`). Pemfilteran berbasis prefix tersebut akan menghapus data riil pengguna secara instan dan permanen saat aplikasi dibuka atau saat berpindah tab.
- **Standar Solusi**: Pembersihan data dummy atau migrasi skema HANYA boleh dilakukan dengan:
  1. Daftar ID spesifik yang eksak (misal `id === 'dummy-decision-001'`), atau
  2. Menggunakan flag migrasi versi terpisah di `localStorage` (misal `localStorage.getItem('puncak_schema_v2')`).

