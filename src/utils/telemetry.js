import { isNative } from './notifications';
import { CURRENT_VERSION_CODE, CURRENT_VERSION_NAME } from './version';

const FIREBASE_PROJECT_ID = 'regalia-senpai-app';
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/puncak_telemetry`;

// Dapatkan atau buat Persistent Device ID unik untuk perangkat ini
export const getDeviceId = () => {
  let id = localStorage.getItem('puncak_device_id');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    localStorage.setItem('puncak_device_id', id);
  }
  return id;
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
  }
  return installTime;
};

// Kirim Telemetri / Pembaruan Status Perangkat ke Firebase Firestore
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

    // Patch/Upsert dokumen per ID Perangkat di Firestore
    const documentUrl = `${FIRESTORE_URL}/${deviceId}`;
    await fetch(documentUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    // Telemetri berjalan senyap di background tanpa mengganggu user
    console.warn('Telemetry sync note:', err);
  }
};

// Ambil Seluruh Data Pengguna untuk Dashboard Admin (Auto-Refresh 1 Jam)
export const fetchAllUsersTelemetry = async () => {
  try {
    const response = await fetch(FIRESTORE_URL);
    if (!response.ok) throw new Error('Gagal mengambil data dari Firebase');
    const data = await response.json();

    if (!data.documents) return [];

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
