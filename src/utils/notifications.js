import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { getTodayStr } from './dateUtils';
import { playBirdChirp } from './audio';

const NOTIF_KEY = 'puncak_notifications_enabled';
const CHANNEL_ID = 'puncak_notifications_channel_v3';
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
const createNotificationChannel = async () => {
  if (!isNative()) return;
  try {
    // Hapus channel lama agar ter-reset bersih
    try {
      await LocalNotifications.deleteChannel({ id: 'puncak_notifications_channel_v2' });
    } catch (err) {}

    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: 'Pengingat Puncak V3',
      description: 'Pengingat tugas harian Puncak dengan suara kicau burung',
      importance: 5, // High Importance (Suara + Pop-up Banner)
      visibility: 1,
      sound: 'res_custom_notification.mp3',
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
      // 2. NOTIFIKASI TEPAT WAKTU (SCHEDULED TIME ALARM)
      // -------------------------------------------------------------
      const uncompletedTasks = (tasks || []).filter(t => !t.completed);

      // Batalkan notifikasi lama (range ID 3000 - 3099 & 4000 - 4099)
      const cancelNotifs = [];
      for (let i = 0; i < 60; i++) {
        cancelNotifs.push({ id: 3000 + i });
        cancelNotifs.push({ id: 4000 + i });
      }
      try {
        await LocalNotifications.cancel({ notifications: cancelNotifs });
      } catch (err) {}

      const nowMs = Date.now();
      const scheduledTimedNotifs = [];

      // 2a. Notifikasi tepat pada Jam yang ditentukan pengguna di pop-up (Alarm Kalender)
      uncompletedTasks.filter(t => t.time && t.date).slice(0, 30).forEach((task, index) => {
        try {
          const [y, m, d] = task.date.split('-').map(Number);
          const [h, min] = task.time.split(':').map(Number);
          const taskDateObj = new Date(y, m - 1, d, h, min, 0, 0);

          if (taskDateObj.getTime() > nowMs) {
            scheduledTimedNotifs.push({
              title: task.title,
              body: 'Yuk selesaikan sekarang!',
              id: 4000 + index,
              smallIcon: 'ic_notification',
              channelId: CHANNEL_ID,
              schedule: { at: taskDateObj, allowWhileIdle: true }
            });
          }
        } catch (e) {
          console.warn('Error parsing task scheduled time:', e);
        }
      });

      // 2b. Notifikasi cadangan 2 jam jika tugas belum memiliki jam khusus
      uncompletedTasks.filter(t => !t.time && t.date === todayStr).slice(0, 10).forEach((task, index) => {
        const taskTime = task.id ? parseInt(task.id.replace('t-', '')) || nowMs : nowMs;
        const trigger2h = new Date(taskTime + 2 * 60 * 60 * 1000); // H+2 Jam

        if (trigger2h.getTime() > nowMs) {
          scheduledTimedNotifs.push({
            title: '⏱️ Pengingat Tugas Puncak',
            body: `Tugas "${task.title}" belum kamu centang nih. Kerjakan sebentar yuk!`,
            id: 3000 + index,
            smallIcon: 'ic_notification',
            channelId: CHANNEL_ID,
            schedule: { at: trigger2h, allowWhileIdle: true }
          });
        }
      });

      if (scheduledTimedNotifs.length > 0) {
        try {
          await LocalNotifications.schedule({ notifications: scheduledTimedNotifs });
        } catch (err) {
          console.warn('Failed to schedule timed task reminders:', err);
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
      const todayTasks = (tasks || []).filter(t => t.date === todayStr);
      const todayUncompleted = todayTasks.filter(t => !t.completed);
      if (todayUncompleted.length > 0 || todayTasks.length === 0) {
        const motivasi = getRandomMotivasi();
        nightPayload = {
          title: motivasi.title,
          body: motivasi.body,
          id: 1900,
          smallIcon: 'ic_notification',
          channelId: CHANNEL_ID,
          schedule: { at: nightScheduleTime, allowWhileIdle: true }
        };
      } else {
        nightPayload = {
          title: NOTIF_SELESAI.title,
          body: NOTIF_SELESAI.body,
          id: 1901,
          smallIcon: 'ic_notification',
          channelId: CHANNEL_ID,
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
    // 💻 WEB BROWSER FALLBACK — Jadwalkan notifikasi timer & suara kicau burung
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    const nowMs = Date.now();
    const uncompletedTasks = (tasks || []).filter(t => !t.completed);

    // Jadwalkan alarm browser untuk tugas yang memiliki jam
    uncompletedTasks.filter(t => t.time && t.date).forEach(task => {
      try {
        const [y, m, d] = task.date.split('-').map(Number);
        const [h, min] = task.time.split(':').map(Number);
        const targetMs = new Date(y, m - 1, d, h, min, 0, 0).getTime();
        const diffMs = targetMs - nowMs;

        if (diffMs > 0 && diffMs < 24 * 60 * 60 * 1000) {
          setTimeout(() => {
            playBirdChirp(2);
            new Notification(task.title, {
              body: 'Yuk selesaikan sekarang!'
            });
          }, diffMs);
        }
      } catch (e) {}
    });
  }
};

