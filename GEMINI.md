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
- `public/Puncak.apk` dan `dist/Puncak.apk` (wajib untuk web bundle).
- **HANYA 1 tempat di Desktop**: `C:\Users\GC\Downloads\OneDrive\Desktop\Puncak App\Puncak.apk` (DILARANG membuat salinan ganda di Desktop luar agar Desktop tetap rapi).
