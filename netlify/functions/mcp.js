const FIREBASE_PROJECT_ID = 'luminacube-rubik-game';
const FIREBASE_API_KEY = 'AIzaSyAXEFbCQp57MIb_t_AuFeevY1O1kMT_Ni8';
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

// Helper format task ke Firestore Document Value
const formatTaskToFirestore = (task) => ({
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
});

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

// Ambil data task dari Firestore
const getTasksFromFirestore = async (syncKey) => {
  try {
    const docUrl = `${FIRESTORE_BASE_URL}/puncak_user_tasks/${syncKey}?key=${FIREBASE_API_KEY}`;
    const res = await fetch(docUrl);
    if (!res.ok) {
      if (res.status === 404) return [];
      return [];
    }
    const data = await res.json();
    const raw = data.fields?.tasks?.arrayValue?.values || [];
    return raw.map(v => parseFirestoreToTask(v.mapValue));
  } catch (e) {
    return [];
  }
};

// Simpan data task ke Firestore
const saveTasksToFirestore = async (syncKey, tasks) => {
  const docUrl = `${FIRESTORE_BASE_URL}/puncak_user_tasks/${syncKey}?key=${FIREBASE_API_KEY}`;
  const taskValues = tasks.map(formatTaskToFirestore);
  const payload = {
    fields: {
      syncKey: { stringValue: syncKey },
      tasks: { arrayValue: { values: taskValues } },
      taskCount: { integerValue: String(tasks.length) },
      lastUpdated: { integerValue: String(Date.now()) },
      lastUpdatedBy: { stringValue: 'ChatGPT MCP Plugin' }
    }
  };

  const res = await fetch(docUrl, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.ok;
};

// Daftar Tools MCP resmi ChatGPT JSON-RPC 2.0
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
          description: 'Filter status tugas (all, active, completed)'
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
        title: { type: 'string', description: 'Judul tugas' },
        category: { type: 'string', description: 'Kategori (Kerja, Pribadi, Rumah, Belanja, Kesehatan, dll)' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Prioritas tugas' },
        date: { type: 'string', description: 'Tanggal YYYY-MM-DD (contoh: 2026-08-25)' }
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
        taskId: { type: 'string', description: 'ID tugas' },
        searchTitle: { type: 'string', description: 'Judul tugas' }
      }
    }
  },
  {
    name: 'delete_task',
    description: 'Menghapus tugas dari aplikasi Puncak',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'ID tugas yang ingin dihapus' },
        searchTitle: { type: 'string', description: 'Judul tugas yang ingin dihapus' }
      }
    }
  }
];

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-sync-key, mcp-session-id',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS' || event.httpMethod === 'HEAD') {
    return { statusCode: 200, headers, body: '' };
  }

  const queryParams = event.queryStringParameters || {};
  const reqHeaders = event.headers || {};
  const syncKey = queryParams.syncKey || reqHeaders['x-sync-key'] || 'pnc_default';

  // GET: Handshake / SSE Endpoint
  if (event.httpMethod === 'GET') {
    // SSE Stream Handshake
    const acceptHeader = reqHeaders.accept || reqHeaders.Accept || '';
    if (acceptHeader.includes('text/event-stream')) {
      const endpointUri = `https://puncak-tasks.netlify.app/api/mcp?syncKey=${encodeURIComponent(syncKey)}`;
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        },
        body: `event: endpoint\ndata: ${endpointUri}\n\n`
      };
    }

    // Default JSON Response untuk HTTP GET Probe
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        result: {
          protocolVersion: '2024-11-05',
          serverInfo: {
            name: 'puncak-tasks',
            version: '1.2.5'
          },
          capabilities: {
            tools: { listChanged: false }
          }
        }
      })
    };
  }

  // POST: JSON-RPC 2.0 Requests dari ChatGPT
  if (event.httpMethod === 'POST') {
    let body = {};
    try {
      body = JSON.parse(event.body || '{}');
    } catch (e) {
      body = {};
    }

    const requestId = body.id !== undefined ? body.id : 1;
    const method = body.method;
    const params = body.params || {};

    // 0. Ping
    if (method === 'ping') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: requestId,
          result: {}
        })
      };
    }

    // 1. Handshake / Initialize & Discover
    if (method === 'initialize' || method === 'server/discover') {
      const clientProtocolVersion = params.protocolVersion || '2024-11-05';
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: requestId,
          result: {
            protocolVersion: clientProtocolVersion,
            capabilities: {
              tools: { listChanged: false }
            },
            serverInfo: {
              name: 'puncak-tasks',
              version: '1.2.5'
            },
            supportedProtocolVersions: ['2024-11-05', '2025-03-01', '2025-11-25', '2026-07-28']
          }
        })
      };
    }

    // 2. Notifications (notifications/initialized)
    if (method === 'notifications/initialized' || method === 'initialized') {
      return { statusCode: 200, headers, body: '' };
    }

    // 3. List Tools (tools/list)
    if (method === 'tools/list' || method === 'list_tools' || !method) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: requestId,
          result: {
            tools: MCP_TOOLS
          }
        })
      };
    }

    // 4. Call Tool (tools/call)
    if (method === 'tools/call') {
      const toolName = params.name;
      const args = params.arguments || {};
      const currentTasks = await getTasksFromFirestore(syncKey);

      // get_tasks
      if (toolName === 'get_tasks') {
        let list = currentTasks;
        if (args.filter === 'active') list = currentTasks.filter(t => !t.completed);
        if (args.filter === 'completed') list = currentTasks.filter(t => t.completed);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: requestId,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(list, null, 2)
                }
              ]
            }
          })
        };
      }

      // add_task
      if (toolName === 'add_task') {
        const todayStr = new Date().toISOString().split('T')[0];
        const taskDate = args.date || todayStr;
        const newTask = {
          id: 'gpt_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36),
          title: args.title || 'Tugas Baru',
          category: args.category || 'Pribadi',
          priority: args.priority || 'medium',
          date: taskDate,
          completed: false,
          createdMonth: taskDate.substring(0, 7),
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        const updated = [newTask, ...currentTasks];
        await saveTasksToFirestore(syncKey, updated);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: requestId,
            result: {
              content: [
                {
                  type: 'text',
                  text: `Tugas "${newTask.title}" berhasil ditambahkan ke aplikasi Puncak untuk tanggal ${newTask.date}.`
                }
              ]
            }
          })
        };
      }

      // complete_task
      if (toolName === 'complete_task') {
        let found = false;
        const updated = currentTasks.map(t => {
          if (args.taskId && t.id === args.taskId) {
            found = true;
            return { ...t, completed: true, updatedAt: Date.now() };
          }
          if (args.searchTitle && t.title.toLowerCase().includes(args.searchTitle.toLowerCase())) {
            found = true;
            return { ...t, completed: true, updatedAt: Date.now() };
          }
          return t;
        });

        if (found) {
          await saveTasksToFirestore(syncKey, updated);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: requestId,
              result: {
                content: [{ type: 'text', text: 'Tugas berhasil ditandai selesai di aplikasi Puncak.' }]
              }
            })
          };
        } else {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: requestId,
              result: {
                content: [{ type: 'text', text: 'Tugas tidak ditemukan di aplikasi Puncak.' }],
                isError: true
              }
            })
          };
        }
      }

      // delete_task
      if (toolName === 'delete_task') {
        const initialCount = currentTasks.length;
        const updated = currentTasks.filter(t => {
          if (args.taskId && t.id === args.taskId) return false;
          if (args.searchTitle && t.title.toLowerCase().includes(args.searchTitle.toLowerCase())) return false;
          return true;
        });

        if (updated.length < initialCount) {
          await saveTasksToFirestore(syncKey, updated);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: requestId,
              result: {
                content: [{ type: 'text', text: 'Tugas berhasil dihapus dari aplikasi Puncak.' }]
              }
            })
          };
        } else {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: requestId,
              result: {
                content: [{ type: 'text', text: 'Tugas tidak ditemukan untuk dihapus.' }],
                isError: true
              }
            })
          };
        }
      }
    }

    // Default Fallback Response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: requestId,
        error: { code: -32601, message: `Method '${method}' not found` }
      })
    };
  }

  return { statusCode: 405, headers, body: 'Method Not Allowed' };
};
