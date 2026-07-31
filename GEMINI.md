# Rules Proyek Puncak

Aturan-aturan berikut WAJIB diikuti saat bekerja dengan proyek Puncak (aplikasi Capacitor Android).

## Dev Server Management (WAJIB)

Sebelum menjalankan `npm run dev` baru, SELALU periksa dan matikan semua proses dev server lama menggunakan `manage_task` → `kill`. Pastikan hanya ada **1 proses dev server** yang aktif pada satu waktu (port `3000`). Jangan biarkan proses `npm run dev` menumpuk.

## Urutan Pengujian: Localhost Dulu (WAJIB)

Untuk setiap perubahan kode baru, ikuti urutan pengujian berikut secara ketat:

1. Jalankan `npm run dev` → Uji perubahan di `http://localhost:3000`
2. Tunggu konfirmasi eksplisit dari user bahwa tampilan localhost sudah benar dan sesuai
3. Baru jalankan pipeline build lengkap: `npm run build` → `npx cap sync android` → `gradlew assembleDebug` → copy APK → deploy Netlify

DILARANG langsung build APK atau deploy ke Netlify tanpa konfirmasi localhost dari user terlebih dahulu, kecuali user secara eksplisit meminta untuk melewati tahap localhost.
