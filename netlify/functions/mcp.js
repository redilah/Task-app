// ============================================================
// Puncak MCP Server — Netlify Function
// Transport: Streamable HTTP (JSON-RPC 2.0)
// Protocol:  MCP 2024-11-05 (kompatibel 2025-03-01, 2025-11-25, 2026-07-28)
// ============================================================

const FIREBASE_PROJECT_ID = 'luminacube-rubik-game';
const FIREBASE_API_KEY = 'AIzaSyAXEFbCQp57MIb_t_AuFeevY1O1kMT_Ni8';
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

// Validasi format syncKey: wajib diawali "pnc_" dan minimal 8 karakter
const isValidSyncKey = (key) => {
  if (!key || typeof key !== 'string') return false;
  if (!key.startsWith('pnc_')) return false;
  if (key.length < 8) return false;
  return true;
};

// ---- Firestore Helpers ----

const formatTaskToFirestore = (task) => ({
  mapValue: {
    fields: {
      id:           { stringValue:  String(task.id || Date.now()) },
      title:        { stringValue:  String(task.title || '') },
      category:     { stringValue:  String(task.category || 'General') },
      priority:     { stringValue:  String(task.priority || 'medium') },
      date:         { stringValue:  String(task.date || '') },
      completed:    { booleanValue: Boolean(task.completed) },
      createdMonth: { stringValue:  String(task.createdMonth || '') },
      createdAt:    { integerValue: String(task.createdAt || Date.now()) },
      updatedAt:    { integerValue: String(Date.now()) }
    }
  }
});

const parseFirestoreToTask = (mapVal) => {
  const fields = mapVal?.fields || {};
  return {
    id:           fields.id?.stringValue           || String(Date.now()),
    title:        fields.title?.stringValue         || 'Untitled',
    category:     fields.category?.stringValue      || 'General',
    priority:     fields.priority?.stringValue      || 'medium',
    date:         fields.date?.stringValue          || '',
    completed:    fields.completed?.booleanValue    ?? false,
    createdMonth: fields.createdMonth?.stringValue  || '',
    createdAt:    parseInt(fields.createdAt?.integerValue  || Date.now()),
    updatedAt:    parseInt(fields.updatedAt?.integerValue  || Date.now())
  };
};

const getTasksFromFirestore = async (syncKey) => {
  try {
    const docUrl = `${FIRESTORE_BASE_URL}/puncak_user_tasks/${syncKey}?key=${FIREBASE_API_KEY}`;
    const res = await fetch(docUrl);
    if (!res.ok) {
      if (res.status === 404) return [];
      console.error('[MCP] Firestore GET error:', res.status, await res.text());
      return [];
    }
    const data = await res.json();
    const raw = data.fields?.tasks?.arrayValue?.values || [];
    return raw.map(v => parseFirestoreToTask(v.mapValue));
  } catch (e) {
    console.error('[MCP] getTasksFromFirestore exception:', e.message);
    return [];
  }
};

const saveTasksToFirestore = async (syncKey, tasks) => {
  const docUrl = `${FIRESTORE_BASE_URL}/puncak_user_tasks/${syncKey}?key=${FIREBASE_API_KEY}`;
  const payload = {
    fields: {
      syncKey:       { stringValue:  syncKey },
      tasks:         { arrayValue:   { values: tasks.map(formatTaskToFirestore) } },
      taskCount:     { integerValue: String(tasks.length) },
      lastUpdated:   { integerValue: String(Date.now()) },
      lastUpdatedBy: { stringValue:  'Puncak MCP Server' }
    }
  };
  try {
    const res = await fetch(docUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      console.error('[MCP] Firestore PATCH error:', res.status, await res.text());
    }
    return res.ok;
  } catch (e) {
    console.error('[MCP] saveTasksToFirestore exception:', e.message);
    return false;
  }
};

// ---- Tool Definitions ----

const MCP_TOOLS = [
  {
    name: 'get_tasks',
    description: 'Mengambil daftar tugas aktif dan selesai dari aplikasi Puncak (Taskly)',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'string',
          enum: ['all', 'active', 'completed'],
          description: 'Filter status tugas (all, active, completed). Default: all'
        }
      }
    }
  },
  {
    name: 'add_task',
    description: 'Menambahkan tugas baru ke aplikasi Puncak di HP pengguna',
    inputSchema: {
      type: 'object',
      properties: {
        title:    { type: 'string', description: 'Judul tugas (wajib)' },
        category: { type: 'string', description: 'Kategori: Kerja, Pribadi, Rumah, Belanja, Kesehatan, dll' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Prioritas tugas. Default: medium' },
        date:     { type: 'string', description: 'Tanggal jatuh tempo format YYYY-MM-DD. Default: hari ini' }
      },
      required: ['title']
    }
  },
  {
    name: 'complete_task',
    description: 'Menandai tugas sebagai selesai berdasarkan ID atau judul tugas',
    inputSchema: {
      type: 'object',
      properties: {
        taskId:      { type: 'string', description: 'ID tugas (dari get_tasks)' },
        searchTitle: { type: 'string', description: 'Kata kunci judul tugas (pencarian parsial)' }
      }
    }
  },
  {
    name: 'delete_task',
    description: 'Menghapus tugas dari aplikasi Puncak',
    inputSchema: {
      type: 'object',
      properties: {
        taskId:      { type: 'string', description: 'ID tugas yang ingin dihapus' },
        searchTitle: { type: 'string', description: 'Kata kunci judul tugas yang ingin dihapus' }
      }
    }
  }
];

// ---- JSON-RPC Helpers ----

const jsonResponse = (statusCode, headers, data) => ({
  statusCode,
  headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

const rpcOk  = (id, result, headers) =>
  jsonResponse(200, headers, { jsonrpc: '2.0', id, result });

const rpcErr = (id, code, message, headers) =>
  jsonResponse(200, headers, { jsonrpc: '2.0', id, error: { code, message } });

// ============================================================
// Handler utama
// ============================================================

export const handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-sync-key, mcp-session-id',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
    'Cache-Control':                'no-store'
  };

  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod === 'HEAD') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  // Ambil syncKey dari query string atau header
  const queryParams = event.queryStringParameters || {};
  const reqHeaders  = event.headers || {};
  const syncKey = queryParams.syncKey
    || reqHeaders['x-sync-key']
    || reqHeaders['mcp-sync-key']
    || null;

  // ---- GET: Server info / SSE handshake ----
  if (event.httpMethod === 'GET') {
    const acceptHeader = (reqHeaders.accept || reqHeaders.Accept || '').toLowerCase();

    // SSE Handshake (untuk backward compatibility dengan client lama yang expect text/event-stream di GET)
    if (acceptHeader.includes('text/event-stream')) {
      const mcpUrl = syncKey
        ? `https://puncak-tasks.netlify.app/api/mcp?syncKey=${encodeURIComponent(syncKey)}`
        : `https://puncak-tasks.netlify.app/api/mcp`;
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type':  'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection':    'keep-alive'
        },
        body: `event: endpoint\ndata: ${mcpUrl}\n\n`
      };
    }

    // Probe GET standar — kembalikan server info
    return jsonResponse(200, corsHeaders, {
      jsonrpc: '2.0',
      id:      null,
      result: {
        protocolVersion: '2024-11-05',
        serverInfo:      { name: 'puncak-tasks', version: '1.2.5' },
        capabilities:    { tools: { listChanged: false } }
      }
    });
  }

  // ---- POST: JSON-RPC 2.0 ----
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }

  let body = {};
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return rpcErr(null, -32700, 'Parse error: invalid JSON', corsHeaders);
  }

  const requestId = body.id !== undefined ? body.id : null;
  const method    = body.method || '';
  const params    = body.params || {};

  // 0. Ping
  if (method === 'ping') {
    return rpcOk(requestId, {}, corsHeaders);
  }

  // 1. Initialize
  if (method === 'initialize') {
    const clientVersion = params.protocolVersion || '2024-11-05';
    return rpcOk(requestId, {
      protocolVersion: clientVersion,
      capabilities:    { tools: { listChanged: false } },
      serverInfo:      { name: 'puncak-tasks', version: '1.2.5' },
      supportedProtocolVersions: ['2024-11-05', '2025-03-26']
    }, corsHeaders);
  }

  // 2. Notifications (one-way, tidak butuh response body)
  if (method === 'notifications/initialized' || method === 'initialized') {
    return { statusCode: 202, headers: corsHeaders, body: '' };
  }

  // 3. tools/list
  if (method === 'tools/list') {
    return rpcOk(requestId, { tools: MCP_TOOLS }, corsHeaders);
  }

  // 4. tools/call — butuh syncKey valid
  if (method === 'tools/call') {
    // Validasi syncKey sebelum akses Firestore
    if (!isValidSyncKey(syncKey)) {
      return rpcOk(requestId, {
        content: [{
          type: 'text',
          text: '❌ Authentication error: syncKey tidak ada atau tidak valid. Pastikan URL mengandung ?syncKey=pnc_xxxx atau header x-sync-key diisi. Dapatkan syncKey dari menu Sinkronisasi di aplikasi Puncak.'
        }],
        isError: true
      }, corsHeaders);
    }

    const toolName = params.name;
    const args     = params.arguments || {};

    // Ambil tasks dari Firestore
    const currentTasks = await getTasksFromFirestore(syncKey);

    // ---- get_tasks ----
    if (toolName === 'get_tasks') {
      let list = currentTasks;
      if (args.filter === 'active')    list = currentTasks.filter(t => !t.completed);
      if (args.filter === 'completed') list = currentTasks.filter(t =>  t.completed);

      const summary = list.length === 0
        ? 'Tidak ada tugas ditemukan.'
        : `Ditemukan ${list.length} tugas.`;

      return rpcOk(requestId, {
        content: [{ type: 'text', text: `${summary}\n\n${JSON.stringify(list, null, 2)}` }]
      }, corsHeaders);
    }

    // ---- add_task ----
    if (toolName === 'add_task') {
      if (!args.title || !String(args.title).trim()) {
        return rpcOk(requestId, {
          content: [{ type: 'text', text: '❌ Judul tugas (title) wajib diisi.' }],
          isError: true
        }, corsHeaders);
      }
      const todayStr = new Date().toISOString().split('T')[0];
      const taskDate = args.date || todayStr;
      const newTask = {
        id:           'pnc_mcp_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36),
        title:        String(args.title).trim(),
        category:     args.category || 'Pribadi',
        priority:     args.priority || 'medium',
        date:         taskDate,
        completed:    false,
        createdMonth: taskDate.substring(0, 7),
        createdAt:    Date.now(),
        updatedAt:    Date.now()
      };

      const updated = [newTask, ...currentTasks];
      const saved   = await saveTasksToFirestore(syncKey, updated);

      return rpcOk(requestId, {
        content: [{
          type: 'text',
          text: saved
            ? `✅ Tugas "${newTask.title}" (${newTask.priority}, ${newTask.category}) berhasil ditambahkan untuk tanggal ${newTask.date}. ID: ${newTask.id}`
            : `⚠️ Tugas dibuat secara lokal tapi gagal disimpan ke server. Coba lagi.`
        }]
      }, corsHeaders);
    }

    // ---- complete_task ----
    if (toolName === 'complete_task') {
      if (!args.taskId && !args.searchTitle) {
        return rpcOk(requestId, {
          content: [{ type: 'text', text: '❌ Harap sediakan taskId atau searchTitle untuk menyelesaikan tugas.' }],
          isError: true
        }, corsHeaders);
      }

      let found   = false;
      let matched = '';
      const updated = currentTasks.map(t => {
        if (args.taskId && t.id === args.taskId) {
          found = true; matched = t.title;
          return { ...t, completed: true, updatedAt: Date.now() };
        }
        if (args.searchTitle && t.title.toLowerCase().includes(args.searchTitle.toLowerCase())) {
          found = true; matched = t.title;
          return { ...t, completed: true, updatedAt: Date.now() };
        }
        return t;
      });

      if (found) {
        await saveTasksToFirestore(syncKey, updated);
        return rpcOk(requestId, {
          content: [{ type: 'text', text: `✅ Tugas "${matched}" berhasil ditandai selesai di aplikasi Puncak.` }]
        }, corsHeaders);
      } else {
        return rpcOk(requestId, {
          content: [{ type: 'text', text: `❌ Tugas tidak ditemukan. Gunakan get_tasks untuk melihat daftar tugas yang tersedia.` }],
          isError: true
        }, corsHeaders);
      }
    }

    // ---- delete_task ----
    if (toolName === 'delete_task') {
      if (!args.taskId && !args.searchTitle) {
        return rpcOk(requestId, {
          content: [{ type: 'text', text: '❌ Harap sediakan taskId atau searchTitle untuk menghapus tugas.' }],
          isError: true
        }, corsHeaders);
      }

      const initialCount = currentTasks.length;
      let deletedTitle   = '';
      const updated = currentTasks.filter(t => {
        if (args.taskId && t.id === args.taskId)                                                { deletedTitle = t.title; return false; }
        if (args.searchTitle && t.title.toLowerCase().includes(args.searchTitle.toLowerCase())) { deletedTitle = t.title; return false; }
        return true;
      });

      if (updated.length < initialCount) {
        await saveTasksToFirestore(syncKey, updated);
        return rpcOk(requestId, {
          content: [{ type: 'text', text: `✅ Tugas "${deletedTitle}" berhasil dihapus dari aplikasi Puncak.` }]
        }, corsHeaders);
      } else {
        return rpcOk(requestId, {
          content: [{ type: 'text', text: `❌ Tugas tidak ditemukan. Gunakan get_tasks untuk melihat daftar tugas yang tersedia.` }],
          isError: true
        }, corsHeaders);
      }
    }

    // Unknown tool
    return rpcErr(requestId, -32601, `Tool '${toolName}' tidak dikenal. Gunakan tools/list untuk melihat daftar tool.`, corsHeaders);
  }

  // Unknown method
  return rpcErr(requestId, -32601, `Method '${method}' tidak dikenal.`, corsHeaders);
};
