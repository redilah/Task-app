import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { getTodayStr } from './dateUtils';
import { playBirdChirp } from './audio';

const NOTIF_KEY = 'puncak_notifications_enabled';
const CHANNEL_ID = 'puncak_notifications_channel_v2';
const EMPTY_NOTIF_ID = 1010;

// Daftar pesan motivasi pedas untuk tugas belum selesai jam 19:00 (7 Malam)
const MOTIVASI_PEDAS = [
  {
    title: '⚠️ Tugas Hari Ini Belum Beres!',
    body: 'Selesaiin lah tugasnya, masa ginian aja ketunda. Mau numpuk sampai kapan?'
  },
  {
    title: '⚠️ Udah Jam 7 Malam Lho...',
    body: 'Kok belum diselesaiin juga? Beresin sekarang biar tidurnya tenang.'
  },
  {
    title: '⚠️ Masih Ada Tugas Tertunda',
    body: 'Jangan ditunda terus, besok nyesel sendiri pas udah makin mepet.'
  },
  {
    title: '⚠️ Cicil Sekarang!',
    body: 'Mumpung belum kemalaman, kerjain sebentar terus centang. Beres kan?'
  },
  {
    title: '⚠️ Gak Usah Banyak Alasan',
    body: 'Tinggal diselesaiin aja kok susah banget. Buruan beresin dulu!'
  }
];

const NOTIF_SELESAI = {
  title: '🎉 Mantap! Tugas Hari Ini Tuntas!',
  body: 'Semua tugas selesai. Saatnya istirahat dan susun target esok hari.'
};

export const isNative = () => Capacitor.isNativePlatform();

export const getNotificationState = () => {
  try {
    return localStorage.getItem(NOTIF_KEY) === 'true';
  } catch (e) {
    return false;
  }
};

export const setNotificationState = (enabled) => {
  try {
    localStorage.setItem(NOTIF_KEY, enabled ? 'true' : 'false');
  } catch (e) {
    console.error('Failed to set notification state', e);
  }
};

// Buat notification channel untuk Android 8.0+ dengan Suara Kicau Burung Kustom (res_custom_notification)
// PENTING: sound hanya boleh di channel, JANGAN di objek notifikasi individual — akan NPE di Android
const createNotificationChannel = async () => {
  if (!isNative()) return;
  try {
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: 'Pengingat Puncak',
      description: 'Pengingat tugas harian Puncak dengan suara kicau burung',
      importance: 5, // High Importance (Suara + Pop-up Banner)
      visibility: 1,
      sound: 'res_custom_notification', // Sound HANYA di channel
      vibration: true
    });
  } catch (e) {
    console.warn('Failed to create notification channel:', e);
  }
};

// Hitung waktu jam 19:00 WIB hari ini atau besok
// Menggunakan `at` eksplisit, BUKAN `on` recurring yang bisa NPE di Android 12+
const getNext19Schedule = () => {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0, 0, 0);
  // Jika jam 19:00 hari ini sudah lewat, jadwalkan untuk besok
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target;
};

// Pilih pesan motivasi secara acak
const getRandomMotivasi = () => {
  const idx = Math.floor(Math.random() * MOTIVASI_PEDAS.length);
  return MOTIVASI_PEDAS[idx];
};

export const requestNotificationPermission = async () => {
  if (isNative()) {
    // 📱 ANDROID NATIVE — Pop-up izin resmi OS Android
    try {
      await createNotificationChannel();

      const status = await LocalNotifications.requestPermissions();
      if (status.display === 'granted') {
        setNotificationState(true);

        // Konfirmasi aktivasi — delay 3 detik agar sistem siap, TANPA `sound` di notif individual (sudah ada di channel)
        try {
          await LocalNotifications.schedule({
            notifications: [
              {
                title: '🔔 Pengingat Puncak Aktif!',
                body: 'Notifikasi pengingat & tugas harian telah berhasil diaktifkan dengan suara kicau burung.',
                id: 1001,
                smallIcon: 'ic_notification',
                channelId: CHANNEL_ID,
                // TIDAK ada `sound` di sini — sound dihandle oleh channel
                schedule: { at: new Date(Date.now() + 3000) } // 3 detik, aman dari past-time NPE
              }
            ]
          });
        } catch (schedErr) {
          console.error('Error scheduling confirmation notification:', schedErr);
        }
        return true;
      } else {
        setNotificationState(false);
        return false;
      }
    } catch (e) {
      console.error('Error requesting Android Native notification permission', e);
      return false;
    }
  } else {
    // 💻 WEB BROWSER — Notifikasi web standar dengan Suara Kicau Burung
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationState(true);
        try {
          playBirdChirp(2); // Suara Kicau Burung
          new Notification('🔔 Pengingat Puncak Aktif!', {
            body: 'Notifikasi pengingat & tugas harian telah berhasil diaktifkan di Web Browser.'
          });
        } catch (notifErr) {
          console.error('Error showing web notification:', notifErr);
        }
        return true;
      } else {
        setNotificationState(false);
        return false;
      }
    } catch (e) {
      console.error('Error requesting Web notification permission', e);
      return false;
    }
  }
};

export const checkDailyReminders = async (tasks = []) => {
  if (!getNotificationState()) return;

  const todayStr = getTodayStr(); // Tanggal lokal WIB

  if (isNative()) {
    // 📱 ANDROID NATIVE ENGINE
    try {
      await createNotificationChannel();

      // -------------------------------------------------------------
      // 1. CHIP NOTIFIKASI INAKTIVITAS 10 MENIT (Jika belum ada tugas)
      // -------------------------------------------------------------
      if (tasks.length === 0) {
        const isScheduled = localStorage.getItem('puncak_empty_10m_scheduled');
        if (!isScheduled) {
          const triggerTime = new Date(Date.now() + 10 * 60 * 1000); // 10 menit dari sekarang
          await LocalNotifications.schedule({
            notifications: [
              {
                title: '📝 Pengingat Puncak',
                body: 'Eh kok kamu belum jadwalin tugas, tulis lah!',
                id: EMPTY_NOTIF_ID,
                smallIcon: 'ic_notification',
                channelId: CHANNEL_ID,
                // Tidak ada `sound` di sini — sudah dihandle channel
                schedule: { at: triggerTime, allowWhileIdle: true }
              }
            ]
          });
          localStorage.setItem('puncak_empty_10m_scheduled', 'true');
        }
      } else {
        // Jika sudah ada tugas yang dibuat, batalkan notifikasi 10 menit
        try {
          await LocalNotifications.cancel({ notifications: [{ id: EMPTY_NOTIF_ID }] });
          localStorage.removeItem('puncak_empty_10m_scheduled');
        } catch (err) {}
      }

      // -------------------------------------------------------------
      // 2. CHIP NOTIFIKASI TUGAS TERTUNDA 2 JAM
      // -------------------------------------------------------------
      const todayTasks = (tasks || []).filter(t => t.date === todayStr);
      const uncompletedTasks = todayTasks.filter(t => !t.completed);

      // Batalkan notifikasi 2 jam lama (range ID 3000 - 3099)
      const cancelNotifs = [];
      for (let i = 0; i < 50; i++) {
        cancelNotifs.push({ id: 3000 + i });
      }
      try {
        await LocalNotifications.cancel({ notifications: cancelNotifs });
      } catch (err) {}

      // Jadwalkan notifikasi 2 jam untuk tugas yang belum selesai
      const nowMs = Date.now();
      const task2hNotifs = [];

      uncompletedTasks.slice(0, 10).forEach((task, index) => {
        // Ambil timestamp pembuatan tugas (atau default saat ini)
        const taskTime = task.id ? parseInt(task.id.replace('t-', '')) || nowMs : nowMs;
        const trigger2h = new Date(taskTime + 2 * 60 * 60 * 1000); // H+2 Jam

        // Hanya jadwalkan jika waktu H+2 jam masih di masa depan
        if (trigger2h.getTime() > nowMs) {
          task2hNotifs.push({
            title: '⏱️ Pengingat Tugas Puncak',
            body: `Tugas "${task.title}" belum kamu centang nih. Kerjakan sebentar yuk, cicil sekarang!`,
            id: 3000 + index,
            smallIcon: 'ic_notification',
            channelId: CHANNEL_ID,
            // Tidak ada `sound` di sini — sudah dihandle channel
            schedule: { at: trigger2h, allowWhileIdle: true }
          });
        }
      });

      if (task2hNotifs.length > 0) {
        try {
          await LocalNotifications.schedule({ notifications: task2hNotifs });
        } catch (err) {
          console.warn('Failed to schedule 2h task reminders:', err);
        }
      }

      // -------------------------------------------------------------
      // 3. EVALUASI MALAM HARI JAM 19:00 WIB (7 Malam)
      // Menggunakan `at` eksplisit (bukan `on` recurring) untuk menghindari NPE
      // di Android 12+ akibat AlarmManager.setRepeating yang deprecated
      // -------------------------------------------------------------
      try {
        await LocalNotifications.cancel({ notifications: [{ id: 1900 }, { id: 1901 }] });
      } catch (err) {}

      const nightScheduleTime = getNext19Schedule(); // Jam 19:00 hari ini atau besok

      let nightPayload;
      if (uncompletedTasks.length > 0 || todayTasks.length === 0) {
        const motivasi = getRandomMotivasi();
        nightPayload = {
          title: motivasi.title,
          body: motivasi.body,
          id: 1900,
          smallIcon: 'ic_notification',
          channelId: CHANNEL_ID,
          // Tidak ada `sound` di sini — sudah dihandle channel
          schedule: { at: nightScheduleTime, allowWhileIdle: true }
        };
      } else {
        nightPayload = {
          title: NOTIF_SELESAI.title,
          body: NOTIF_SELESAI.body,
          id: 1901,
          smallIcon: 'ic_notification',
          channelId: CHANNEL_ID,
          // Tidak ada `sound` di sini — sudah dihandle channel
          schedule: { at: nightScheduleTime, allowWhileIdle: true }
        };
      }

      try {
        await LocalNotifications.schedule({ notifications: [nightPayload] });
      } catch (err) {
        console.warn('Failed to schedule night reminder:', err);
      }

    } catch (e) {
      console.error('Failed to schedule Android smart local notifications', e);
    }
  } else {
    // 💻 WEB BROWSER FALLBACK — Kirim notifikasi web & suara kicau burung
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    const todayTasks = (tasks || []).filter(t => t.date === todayStr);
    const uncompletedTasks = todayTasks.filter(t => !t.completed);

    try {
      if (tasks.length === 0) {
        playBirdChirp(2); // Suara Kicau Burung
        new Notification('📝 Pengingat Puncak', {
          body: 'Eh kok kamu belum jadwalin tugas, tulis lah!'
        });
      } else if (uncompletedTasks.length > 0) {
        const motivasi = getRandomMotivasi();
        playBirdChirp(2); // Suara Kicau Burung
        new Notification(motivasi.title, { body: motivasi.body });
      }
    } catch (e) {
      console.error('Error creating browser notification:', e);
    }
  }
};
