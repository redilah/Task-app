import React, { useState, useEffect } from 'react';
import { fetchAllUsersTelemetry } from '../utils/telemetry';
import { 
  Users, 
  Smartphone, 
  Clock, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  BarChart3, 
  ArrowLeft,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { CURRENT_VERSION_CODE, CURRENT_VERSION_NAME } from '../utils/version';

export default function AdminDashboard({ onBackToApp }) {
  const [usersData, setUsersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [countdown, setCountdown] = useState(3600); // 1 Jam = 3600 detik

  const loadData = async () => {
    setLoading(true);
    const data = await fetchAllUsersTelemetry();
    setUsersData(data);
    setLoading(false);
    const now = new Date();
    setLastRefreshed(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
    setCountdown(3600); // Reset ke 1 jam
  };

  useEffect(() => {
    loadData();

    // Countdown timer & Auto Refresh per 1 Jam (3600 detik)
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          loadData();
          return 3600;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format hitungan detik ke MM:SS
  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  // Kalkulasi statistik
  const totalUsers = usersData.length;
  const currentVersionStr = `v${CURRENT_VERSION_NAME} (Code ${CURRENT_VERSION_CODE})`;
  
  const updatedUsers = usersData.filter(u => u.appVersion === currentVersionStr).length;
  const outdatedUsers = totalUsers - updatedUsers;

  const totalTasksSum = usersData.reduce((acc, u) => acc + (u.taskCount || 0), 0);

  const dashboardCount = usersData.filter(u => u.activeTab === 'dashboard').length;
  const recapCount = usersData.filter(u => u.activeTab === 'recap').length;

  const [platformFilter, setPlatformFilter] = useState('all'); // 'all', 'android', 'web'

  // Filter berdasarkan platform
  const filteredUsersData = usersData.filter(user => {
    if (platformFilter === 'android') return user.platform === 'Android App';
    if (platformFilter === 'web') return user.platform === 'Web Browser';
    return true;
  });

  // Urutkan MUTLAK beraturan berdasarkan Waktu Pertama Instalasi (Paling Pertama Instal = No 1)
  const sortedUsersData = [...filteredUsersData].sort((a, b) => a.installDateMs - b.installDateMs);

  const androidPlatformCount = usersData.filter(u => u.platform === 'Android App').length;
  const webPlatformCount = usersData.filter(u => u.platform === 'Web Browser').length;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-16 selection:bg-slate-900 selection:text-white">
      {/* Header Admin Bar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-50 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToApp}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center gap-1.5 text-xs font-semibold"
              title="Kembali ke Aplikasi Puncak"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ke Aplikasi</span>
            </button>
            <div className="h-4 w-px bg-slate-200"></div>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Firebase Realtime Telemetry</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Dashboard Pemantauan Admin Puncak
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/60">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Auto-refresh 1 jam: <strong className="text-slate-800 font-mono">{formatCountdown(countdown)}</strong></span>
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Sekarang</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">

        {/* Status Keterangan Auto Refresh */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2.5 text-xs text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Terhubung ke <strong>Google Firebase Firestore</strong> (Project: <code>regalia-senpai-app</code>)</span>
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Terakhir di-refresh: <span className="text-slate-700 font-semibold">{lastRefreshed || 'Menghubungkan...'}</span>
          </div>
        </div>

        {/* 4 Kartu Metrik Utama */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Total Pengguna */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Pengguna</span>
              <div className="p-2 bg-slate-100 rounded-xl text-slate-700">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {loading ? '...' : totalUsers}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-2">
              <span>Android: <strong>{androidPlatformCount}</strong></span>
              <span>•</span>
              <span>Web: <strong>{webPlatformCount}</strong></span>
            </p>
          </div>

          {/* Card 2: Status Update Versi */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Status Update Versi</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{loading ? '...' : updatedUsers}</span>
              <span className="text-xs font-semibold text-emerald-600">Terbaru ({currentVersionStr})</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {outdatedUsers > 0 ? `${outdatedUsers} orang belum update` : 'Semua pengguna sudah versi terbaru!'}
            </p>
          </div>

          {/* Card 3: Total Tugas Dibuat */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Kuantitas Tugas</span>
              <div className="p-2 bg-slate-100 rounded-xl text-slate-700">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {loading ? '...' : totalTasksSum}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Akumulasi tugas dibuat (Privasi judul aman)
            </p>
          </div>

          {/* Card 4: Tab Paling Sering Dibuka */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Aktivitas Tab</span>
              <div className="p-2 bg-slate-100 rounded-xl text-slate-700">
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>
            <div className="text-sm font-bold text-slate-900 flex items-center justify-between mt-1">
              <span>Dashboard: {dashboardCount}</span>
              <span>Rekap: {recapCount}</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden flex">
              <div 
                className="bg-slate-900 h-full transition-all duration-500" 
                style={{ width: `${totalUsers > 0 ? (dashboardCount / totalUsers) * 100 : 50}%` }}
              ></div>
              <div 
                className="bg-slate-300 h-full transition-all duration-500" 
                style={{ width: `${totalUsers > 0 ? (recapCount / totalUsers) * 100 : 50}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Tabel Detail Per Perangkat / User (Dengan Indikator Tanggal & Jam Instalasi) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-slate-500" />
                Daftar Perangkat Terinstal & Waktu Instalasi
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Diurutkan beraturan berdasarkan waktu pertama kali aplikasi diinstal oleh pengguna.
              </p>
            </div>
            
            <div className="flex items-center gap-2.5">
              {/* Filter Platform */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60 text-xs font-semibold text-slate-600">
                <button
                  onClick={() => setPlatformFilter('all')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    platformFilter === 'all' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  Semua ({totalUsers})
                </button>
                <button
                  onClick={() => setPlatformFilter('android')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    platformFilter === 'android' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  Android ({androidPlatformCount})
                </button>
                <button
                  onClick={() => setPlatformFilter('web')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    platformFilter === 'web' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  Web ({webPlatformCount})
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs font-medium">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-300" />
              Mengambil data telemetri dari Firebase...
            </div>
          ) : sortedUsersData.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-medium">
              Belum ada sinyal data pengguna yang masuk dari Firebase.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">No</th>
                    <th className="py-3.5 px-4 sm:px-6">ID Perangkat</th>
                    <th className="py-3.5 px-4 sm:px-6">🗓️ Tanggal & Jam Instal</th>
                    <th className="py-3.5 px-4 sm:px-6">⏱️ Terakhir Aktif</th>
                    <th className="py-3.5 px-4 sm:px-6">Status Versi APK</th>
                    <th className="py-3.5 px-4 sm:px-6">Kuantitas Tugas</th>
                    <th className="py-3.5 px-4 sm:px-6">Platform</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {sortedUsersData.map((user, idx) => {
                    const isUpdated = user.appVersion === currentVersionStr;
                    return (
                      <tr key={user.id || idx} className="hover:bg-slate-50/80 transition-all">
                        <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-slate-800">{user.deviceId}</td>
                        <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                          {user.installDate}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-slate-500">{user.lastSeenDate}</td>
                        <td className="py-3.5 px-4 sm:px-6">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                            isUpdated ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                          }`}>
                            {isUpdated ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertTriangle className="w-3 h-3 text-amber-600" />}
                            {user.appVersion}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900">{user.taskCount} Tugas</td>
                        <td className="py-3.5 px-4 sm:px-6 text-slate-500">{user.platform}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
