export const CURRENT_VERSION_CODE = 31;
export const CURRENT_VERSION_NAME = '1.2.4';

export const checkForAppUpdates = async () => {
  try {
    // Pada localhost mengambil /version.json lokal, pada production mengambil dari GitHub Raw repository
    const isDev = import.meta.env?.DEV ?? false;
    const url = isDev
      ? `/version.json?t=${Date.now()}`
      : `https://raw.githubusercontent.com/redilah/Task-app/main/public/version.json?t=${Date.now()}`;

    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store'
    });
    if (!response.ok) return { hasUpdate: false };

    const data = await response.json();
    const latestVersionCode = data.versionCode || 0;
    const latestVersionName = data.versionName || data.version || '1.0.0';

    // Pengecekan berbasis versionCode (Integer comparison) sesuai standar sideload Android
    if (latestVersionCode > CURRENT_VERSION_CODE) {
      const rawApkUrl = data.apkUrl || 'https://raw.githubusercontent.com/redilah/Task-app/main/Puncak.apk';
      const cleanApkUrl = rawApkUrl.split('?')[0] + `?t=${Date.now()}`;
      return {
        hasUpdate: true,
        currentVersionCode: CURRENT_VERSION_CODE,
        currentVersionName: CURRENT_VERSION_NAME,
        latestVersionCode: latestVersionCode,
        latestVersionName: latestVersionName,
        apkUrl: cleanApkUrl,
        releaseNotes: data.releaseNotes || 'Pembaruan versi terbaru dengan peningkatan stabilitas dan fitur baru.'
      };
    }
    return { hasUpdate: false };
  } catch (error) {
    console.error('Failed to check for app updates via custom checker:', error);
    return { hasUpdate: false };
  }
};


