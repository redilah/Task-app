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

## Pola Custom Wheel Picker & Inertial Scrolling (WAJIB)

- Gunakan fisika inersia/momentum dengan peluruhan gesekan (friction ~0.93) dan magnetic spring snap ke indeks terdekat.
- Render jendela tampak secara dinamis (`baseIndex = Math.round(-offsetY / ITEM_HEIGHT)`) agar elemen tidak hilang saat digulir cepat.
- Tampilkan tepat 3 baris tanpa ruang kosong: baris tengah (aktif) dengan warna aksen kontras dan sedikit naik (`-translate-y-0.5`), baris atas/bawah redup.

## Ketentuan Debug Sideload Keystore (WAJIB)

- Untuk pengujian langsung di HP pengguna, selalu gunakan build standar `gradlew assembleDebug` kecuali user secara eksplisit meminta release signature. Hal ini mencegah error Android `Package conflict with existing package`.
