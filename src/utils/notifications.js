import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const NOTIF_KEY = 'puncak_notifications_enabled';
const CHANNEL_ID = 'puncak_notifications_channel';

// Daftar pesan motivasi pedas untuk tugas belum selesai jam 21:00
const MOTIVASI_PEDAS = [
  {
    title: '⚠️ Tugas Hari Ini Belum Beres!',
    body: 'Selesaiin lah tugasnya, masa ginian aja ketunda. Mau numpuk sampai kapan?'
  },
  {
    title: '⚠️ Udah Jam 9 Malam Lho...',
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

// Buat notification channel untuk Android 8.0+
const createNotificationChannel = async () => {
  if (!isNative()) return;
  try {
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: 'Pengingat Puncak',
      description: 'Pengingat tugas harian Puncak',
      importance: 4,
      visibility: 1,
      sound: 'res_custom_notification'
    });
  } catch (e) {
    console.warn('Failed to create notification channel:', e);
  }
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

        // Konfirmasi aktivasi dengan ikon ic_launcher
        try {
          await LocalNotifications.schedule({
            notifications: [
              {
                title: '🔔 Pengingat Puncak Aktif!',
                body: 'Notifikasi pengingat malam & tugas harian telah berhasil diaktifkan di HP Anda.',
                id: 1001,
                smallIcon: 'ic_launcher',
                channelId: CHANNEL_ID,
                schedule: { at: new Date(Date.now() + 800) }
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
    // 💻 WEB BROWSER — Notifikasi web standar
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationState(true);
        try {
          new Notification('🔔 Pengingat Puncak Aktif!', {
            body: 'Notifikasi pengingat malam & tugas harian telah berhasil diaktifkan di Web Browser.'
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

  const todayStr = new Date().toISOString().split('T')[0];

  if (isNative()) {
    // 📱 Android Native: Jadwalkan notifikasi 21:00 setiap hari
    try {
      await createNotificationChannel();

      // Cek pending dengan safe optional chaining
      const pending = await LocalNotifications.getPending();
      const pendingList = pending?.notifications || [];
      const alreadyScheduled = pendingList.some(n => n.id === 2100 || n.id === 2101);

      if (!alreadyScheduled) {
        const todayTasks = (tasks || []).filter(t => t.date === todayStr);
        const hasUncompleted = todayTasks.some(t => !t.completed);

        if (hasUncompleted) {
          const motivasi = getRandomMotivasi();
          await LocalNotifications.schedule({
            notifications: [
              {
                title: motivasi.title,
                body: motivasi.body,
                id: 2100,
                smallIcon: 'ic_launcher',
                channelId: CHANNEL_ID,
                schedule: { on: { hour: 21, minute: 0 } }
              }
            ]
          });
        } else if (todayTasks.length > 0) {
          await LocalNotifications.schedule({
            notifications: [
              {
                title: NOTIF_SELESAI.title,
                body: NOTIF_SELESAI.body,
                id: 2101,
                smallIcon: 'ic_launcher',
                channelId: CHANNEL_ID,
                schedule: { on: { hour: 21, minute: 0 } }
              }
            ]
          });
        } else {
          // Gak ada tugas sama sekali, beri pengingat motivasi
          const motivasi = getRandomMotivasi();
          await LocalNotifications.schedule({
            notifications: [
              {
                title: motivasi.title,
                body: motivasi.body,
                id: 2100,
                smallIcon: 'ic_launcher',
                channelId: CHANNEL_ID,
                schedule: { on: { hour: 21, minute: 0 } }
              }
            ]
          });
        }
      }
    } catch (e) {
      console.error('Failed to schedule Android local notifications', e);
    }
  } else {
    // 💻 Web Browser: Kirim langsung saat dipanggil
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    const todayTasks = (tasks || []).filter(t => t.date === todayStr);
    const hasUncompleted = todayTasks.some(t => !t.completed);

    try {
      if (hasUncompleted) {
        const motivasi = getRandomMotivasi();
        new Notification(motivasi.title, { body: motivasi.body });
      } else if (todayTasks.length > 0) {
        new Notification(NOTIF_SELESAI.title, { body: NOTIF_SELESAI.body });
      }
    } catch (e) {
      console.error('Error creating browser notification:', e);
    }
  }
};
