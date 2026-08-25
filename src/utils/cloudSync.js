import { isNative } from './notifications';

const FIREBASE_PROJECT_ID = 'luminacube-rubik-game';
const FIREBASE_API_KEY = 'AIzaSyAXEFbCQp57MIb_t_AuFeevY1O1kMT_Ni8';
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

const SYNC_KEY_STORAGE = 'puncak_mcp_sync_key';
const SYNC_ENABLED_STORAGE = 'puncak_mcp_sync_enabled';

// Dapatkan atau buat Sync Key unik (Format: pnc_xxxxxx)
export const getSyncKey = () => {
  let key = localStorage.getItem(SYNC_KEY_STORAGE);
  if (!key) {
    key = 'pnc_' + Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 6);
    localStorage.setItem(SYNC_KEY_STORAGE, key);
  }
  return key;
};

export const setSyncKey = (newKey) => {
  if (newKey && newKey.trim()) {
    const cleanKey = newKey.trim();
    localStorage.setItem(SYNC_KEY_STORAGE, cleanKey);
    return cleanKey;
  }
  return getSyncKey();
};

export const isSyncEnabled = () => {
  return localStorage.getItem(SYNC_ENABLED_STORAGE) === 'true';
};

export const setSyncEnabled = (enabled) => {
  localStorage.setItem(SYNC_ENABLED_STORAGE, enabled ? 'true' : 'false');
};

// URL MCP Server Netlify yang siap dicopy ke ChatGPT
export const getMcpServerUrl = (customSyncKey) => {
  const key = customSyncKey || getSyncKey();
  return `https://puncak-tasks.netlify.app/api/mcp?syncKey=${encodeURIComponent(key)}`;
};

// Helper format task ke Firestore Document Value
const formatTaskToFirestore = (task) => {
  return {
    mapValue: {
      fields: {
        id: { stringValue: String(task.id || Date.now()) },
        title: { stringValue: String(task.title || '') },
        category: { stringValue: String(task.category || 'General') },
        priority: { stringValue: String(task.priority || 'medium') },
        date: { stringValue: String(task.date || '') },
        completed: { booleanValue: Boolean(task.completed) },
        createdMonth: { stringValue: String(task.createdMonth || '') },
        createdAt: { integerValue: String(task.createdAt || Date.now()) },
        updatedAt: { integerValue: String(Date.now()) }
      }
    }
  };
};

// Helper parse Firestore Document Value ke Task Object
const parseFirestoreToTask = (mapVal) => {
  const fields = mapVal?.fields || {};
  return {
    id: fields.id?.stringValue || String(Date.now()),
    title: fields.title?.stringValue || 'Untitled',
    category: fields.category?.stringValue || 'General',
    priority: fields.priority?.stringValue || 'medium',
    date: fields.date?.stringValue || '',
    completed: fields.completed?.booleanValue ?? false,
    createdMonth: fields.createdMonth?.stringValue || '',
    createdAt: parseInt(fields.createdAt?.integerValue || Date.now()),
    updatedAt: parseInt(fields.updatedAt?.integerValue || Date.now())
  };
};

// Upload seluruh tasks lokal ke Firestore (Push to Cloud)
export const pushTasksToCloud = async (tasks = []) => {
  if (!isSyncEnabled()) return { success: false, reason: 'Sync disabled' };
  const syncKey = getSyncKey();
  if (!syncKey) return { success: false, reason: 'No sync key' };

  try {
    const docUrl = `${FIRESTORE_BASE_URL}/puncak_user_tasks/${syncKey}?key=${FIREBASE_API_KEY}`;
    
    const taskValues = tasks.map(formatTaskToFirestore);
    const payload = {
      fields: {
        syncKey: { stringValue: syncKey },
        tasks: {
          arrayValue: {
            values: taskValues
          }
        },
        taskCount: { integerValue: String(tasks.length) },
        lastUpdated: { integerValue: String(Date.now()) },
        lastUpdatedBy: { stringValue: isNative() ? 'Android App' : 'Web' }
      }
    };

    const response = await fetch(docUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('Cloud sync push warning:', errText);
      return { success: false, error: errText };
    }

    return { success: true };
  } catch (err) {
    console.warn('Cloud sync push failed:', err);
    return { success: false, error: err.message };
  }
};

// Ambil tasks dari Firestore (Pull from Cloud)
export const pullTasksFromCloud = async () => {
  const syncKey = getSyncKey();
  if (!syncKey) return null;

  try {
    const docUrl = `${FIRESTORE_BASE_URL}/puncak_user_tasks/${syncKey}?key=${FIREBASE_API_KEY}`;
    const response = await fetch(docUrl);
    if (!response.ok) {
      if (response.status === 404) return []; // Belum ada data
      return null;
    }

    const data = await response.json();
    const rawValues = data.fields?.tasks?.arrayValue?.values || [];
    const tasks = rawValues.map(v => parseFirestoreToTask(v.mapValue));
    return tasks;
  } catch (err) {
    console.warn('Cloud sync pull failed:', err);
    return null;
  }
};
