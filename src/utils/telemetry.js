import { isNative } from './notifications';
import { CURRENT_VERSION_CODE, CURRENT_VERSION_NAME } from './version';

const FIREBASE_PROJECT_ID = 'regalia-senpai-app';
const FIREBASE_API_KEY = 'AIzaSyBhaSgR4Pc4ctnZ_NoTkVVOIPsegPHwvqE';
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/puncak_telemetry`;

// Dapatkan atau buat Persistent Device ID unik untuk perangkat ini
export const getDeviceId = () => {
  let id = localStorage.getItem('puncak_device_id');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    localStorage.setItem('puncak_device_id', id);
  }
  return id;
};

// Helper parser tanggal & jam instalasi Indonesia ke Milliseconds timestamp
export const parseInstallDateToMs = (dateStr, installDateMs) => {
  if (installDateMs && !isNaN(installDateMs) && installDateMs > 0) {
    return installDateMs;
  }
  if (!dateStr || typeof dateStr !== 'string') return 0;
  
  try {
    // Matches "01/08/2026 jam 10:20:00 WIB" or "01/08/2026 jam 10.17.16 WIB"
    const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s+jam\s+(\d{2})[:.](\d{2})[:.](\d{2})/i);
    if (match) {
      const [_, day, month, year, hour, minute, second] = match;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second)).getTime();
    }
  } catch (e) {}
  return 0;
};

// Dapatkan atau buat Tanggal & Jam Pertama Instalasi
export const getInstallDateTime = () => {
  let installTime = localStorage.getItem('puncak_install_datetime');
  if (!installTime) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    installTime = `${dateStr} jam ${timeStr} WIB`;
    localStorage.setItem('puncak_install_datetime', installTime);
    localStorage.setItem('puncak_install_datetimems', now.getTime().toString());
  }
  return installTime;
};

export const getInstallDateTimeMs = () => {
  let ms = localStorage.getItem('puncak_install_datetimems');
  if (!ms) {
    getInstallDateTime();
    ms = localStorage.getItem('puncak_install_datetimems');
  }
  return parseInt(ms || '0');
};

// Kirim Telemetri / Pembaruan Status Perangkat ke Firebase Firestore
export const sendTelemetrySignal = async (tasks = [], activeTab = 'dashboard') => {
  try {
    const deviceId = getDeviceId();
    const installDate = getInstallDateTime();
    const installDateMs = getInstallDateTimeMs();

    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const lastSeenDate = `${dateStr} jam ${timeStr} WIB`;

    const versionStr = `v${CURRENT_VERSION_NAME} (Code ${CURRENT_VERSION_CODE})`;
    const platformStr = isNative() ? 'Android App' : 'Web Browser';
    const taskCount = tasks ? tasks.length : 0;

    const payload = {
      fields: {
        deviceId: { stringValue: deviceId },
        installDate: { stringValue: installDate },
        installDateMs: { integerValue: installDateMs },
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
      'updateMask.fieldPaths=installDateMs',
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
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.warn('Telemetry sync note:', err);
  }
};

// Ambil Seluruh Data Pengguna untuk Dashboard Admin (Auto-Refresh 1 Jam)
export const fetchAllUsersTelemetry = async () => {
  try {
    const fetchUrl = `${FIRESTORE_BASE_URL}?key=${FIREBASE_API_KEY}`;
    const response = await fetch(fetchUrl);
    if (!response.ok) throw new Error('Gagal mengambil data dari Firebase');
    const data = await response.json();

    if (!data.documents) return [];

    const parsedList = data.documents.map(doc => {
      const fields = doc.fields || {};
      const installDateStr = fields.installDate?.stringValue || 'Tidak Diketahui';
      const rawMs = parseInt(fields.installDateMs?.integerValue || 0);
      const computedMs = parseInstallDateToMs(installDateStr, rawMs);

      return {
        id: doc.name.split('/').pop(),
        deviceId: fields.deviceId?.stringValue || 'Unknown',
        installDate: installDateStr,
        installDateMs: computedMs,
        lastSeenDate: fields.lastSeenDate?.stringValue || 'Tidak Diketahui',
        appVersion: fields.appVersion?.stringValue || 'v1.0.0',
        taskCount: parseInt(fields.taskCount?.integerValue || 0),
        activeTab: fields.activeTab?.stringValue || 'dashboard',
        platform: fields.platform?.stringValue || 'Android App',
        updatedAtMs: parseInt(fields.updatedAtMs?.integerValue || 0)
      };
    });

    // Urutkan secara beraturan berdasarkan Waktu Pertama Instalasi (Ascending: Yang pertama kali instal = No. 1)
    parsedList.sort((a, b) => a.installDateMs - b.installDateMs);

    return parsedList;
  } catch (err) {
    console.error('Error fetching admin telemetry:', err);
    return [];
  }
};
