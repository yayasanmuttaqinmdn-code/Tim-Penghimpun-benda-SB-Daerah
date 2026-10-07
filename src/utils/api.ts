import { Asset, SpptPbbRecord } from '../types';

export const DEFAULT_SPREADSHEET_URL = 'https://script.google.com/macros/s/AKfycbxes0-aBJxFQPFeybB9ZfFpBHVioFgMtrPOSngWuY4A53nTeTqaJvbH9hhTfEmTbMFG/exec';

const ASSETS_CACHE_KEY = 'madiun_assets_cache';
const SPPT_CACHE_KEY = 'madiun_sppt_pbb_records';
const SETTINGS_CACHE_KEY = 'madiun_custom_spreadsheet_id';

export const getStoredSpreadsheetUrl = (): string => {
  try {
    const saved = localStorage.getItem(SETTINGS_CACHE_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch (e) {}
  return DEFAULT_SPREADSHEET_URL;
};

export const getHeaders = (googleToken?: string | null): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (googleToken) {
    headers['X-Google-Token'] = googleToken;
  }
  return headers;
};

// Helper to safely parse JSON response
const safeParseJson = async (res: Response): Promise<any> => {
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Respon server bukan format JSON (Status: ${res.status}).`);
    }
  }
  return await res.json();
};

export const fetchAssetsFromAppsScript = async (scriptUrl: string): Promise<Asset[] | null> => {
  try {
    const timestamp = Date.now();
    const url = scriptUrl.includes('?') 
      ? `${scriptUrl}&action=getAssets&_t=${timestamp}` 
      : `${scriptUrl}?action=getAssets&_t=${timestamp}`;
    const res = await fetch(url, { method: 'GET', cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && Array.isArray(data.assets)) {
      return data.assets.map((item: any) => {
        const itemType = (item.type || (item.kategori?.toLowerCase() === 'kendaraan' ? 'kendaraan' : item.kategori?.toLowerCase() === 'bangunan' ? 'bangunan' : 'tanah')) as any;
        const normalized: any = {
          ...item,
          id: item.id || `asset_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          type: itemType,
          lokasi: item.lokasi || ''
        };

        if (itemType === 'tanah') {
          normalized.jenisSertifikat = item.jenisSertifikat || item.statusSertifikat || 'SHM';
          normalized.nomerSertifikat = item.nomerSertifikat || item.nama || item.kode || '';
          normalized.atasNamaSertifikat = item.atasNamaSertifikat || item.pemberiWakaf || '';
          normalized.penggunaan = item.penggunaan || item.peruntukan || '';
          normalized.tempatSimpanBerkas = item.tempatSimpanBerkas || item.keterangan || '';
          normalized.luasTanah = item.luasTanah !== undefined ? item.luasTanah : Number(String(item.luas || '').replace(/[^0-9]/g, '')) || 0;
        } else if (itemType === 'kendaraan') {
          normalized.jenisKendaraan = item.jenisKendaraan || (item.kategori?.toUpperCase().includes('MOTOR') ? 'MOTOR' : 'MOBIL');
          normalized.nomorPolisi = item.nomorPolisi || item.nama || '';
          normalized.merk = item.merk || (item.keterangan ? item.keterangan.split('|')[0].trim() : 'Kendaraan Operasional');
          normalized.atasNama = item.atasNama || item.pemberiWakaf || '';
          normalized.tahunPembuatan = Number(item.tahunPembuatan || item.tahunPerolehan) || 2021;
          normalized.kondisiKendaraan = (item.kondisiKendaraan || item.kondisi || 'BAIK').toUpperCase();
        } else if (itemType === 'bangunan') {
          normalized.namaBangunan = item.namaBangunan || item.nama || 'Bangunan';
          normalized.luasBangunan = item.luasBangunan !== undefined ? item.luasBangunan : Number(String(item.luas || '').replace(/[^0-9]/g, '')) || 0;
          normalized.penggunaanBangunan = item.penggunaanBangunan || item.peruntukan || '';
          normalized.kondisi = (item.kondisi || 'BAIK').toUpperCase();
          normalized.nomerPBG = item.nomerPBG || '-';
          normalized.nomerSLF = item.nomerSLF || '-';
        }

        return normalized as Asset;
      });
    }
    return null;
  } catch (err) {
    console.warn('Direct Apps Script fetch failed:', err);
    return null;
  }
};

export const syncAssetsToAppsScript = async (scriptUrl: string, assets: Asset[], spptRecords?: SpptPbbRecord[]): Promise<boolean> => {
  try {
    const mapped = assets.map(a => ({
      id: a.id,
      kode: a.id,
      nama: a.type === 'tanah' ? `${(a as any).jenisSertifikat || ''} ${(a as any).nomerSertifikat || ''}`.trim() : (a.type === 'kendaraan' ? (a as any).nomorPolisi : (a as any).namaBangunan || ''),
      kategori: a.type.toUpperCase(),
      lokasi: (a as any).lokasi || '',
      tahunPerolehan: (a as any).tahunPembuatan || 2024,
      nilaiAset: 0,
      kondisi: (a as any).kondisiKendaraan || (a as any).kondisi || 'Baik',
      statusSertifikat: (a as any).jenisSertifikat || '',
      luas: (a as any).luasTanah ? `${(a as any).luasTanah} m²` : ((a as any).luasBangunan ? `${(a as any).luasBangunan} m²` : ''),
      keterangan: (a as any).tempatSimpanBerkas || (a as any).keterangan || '',
      pemberiWakaf: (a as any).atasNamaSertifikat || (a as any).atasNama || '',
      peruntukan: (a as any).penggunaan || (a as any).penggunaanBangunan || '',
      rawJson: JSON.stringify(a)
    }));

    const payload: any = {
      action: 'syncAll',
      assets: mapped
    };

    if (spptRecords && spptRecords.length > 0) {
      payload.sppt = spptRecords.map(r => ({
        id: r.id,
        nop: r.nop,
        namaWajibPajak: r.namaWajibPajak,
        lokasi: r.lokasi,
        pajakTerutang: r.pajakTerutang,
        totalBayarYayasan: r.totalBayarYayasanTahunan,
        keterangan: r.keteranganTambahan || '',
        rawJson: JSON.stringify(r)
      }));
    }

    await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    return true;
  } catch (err) {
    console.error('Failed direct Apps Script sync:', err);
    return false;
  }
};

export const fetchAssets = async (googleToken?: string | null): Promise<Asset[]> => {
  const scriptUrl = getStoredSpreadsheetUrl();

  // 1. Direct fetch from Google Apps Script Web App (Primary for multi-device sync)
  if (scriptUrl && scriptUrl.includes('script.google.com')) {
    const cloudAssets = await fetchAssetsFromAppsScript(scriptUrl);
    if (cloudAssets !== null && Array.isArray(cloudAssets)) {
      try {
        localStorage.setItem(ASSETS_CACHE_KEY, JSON.stringify(cloudAssets));
      } catch (e) {}
      return cloudAssets;
    }
  }

  // 2. Try Express API endpoint
  try {
    const res = await fetch(`/api/assets?_t=${Date.now()}`, {
      headers: getHeaders(googleToken),
      cache: 'no-store'
    });

    if (res.ok) {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data)) {
          try {
            localStorage.setItem(ASSETS_CACHE_KEY, JSON.stringify(data));
          } catch (e) {}
          return data;
        }
      }
    }
  } catch (err) {
    // API endpoint unavailable
  }

  // 3. Fallback to local cache
  const cached = localStorage.getItem(ASSETS_CACHE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {}
  }
  return [];
};

export const syncAssets = async (assets: Asset[], googleToken?: string | null): Promise<Asset[]> => {
  const scriptUrl = getStoredSpreadsheetUrl();

  // 1. Try server sync
  try {
    const res = await fetch('/api/assets/sync', {
      method: 'POST',
      headers: getHeaders(googleToken),
      body: JSON.stringify({ assets }),
    });

    if (res.ok) {
      const data = await safeParseJson(res);
      const syncedAssets = data.assets || assets;
      try {
        localStorage.setItem(ASSETS_CACHE_KEY, JSON.stringify(syncedAssets));
      } catch (e) {}
      return syncedAssets;
    }
  } catch (err) {
    // Server endpoint not available
  }

  // 2. Sync directly to Google Apps Script cloud database
  if (scriptUrl && scriptUrl.includes('script.google.com')) {
    syncAssetsToAppsScript(scriptUrl, assets);
  }

  // 3. Persist locally
  try {
    localStorage.setItem(ASSETS_CACHE_KEY, JSON.stringify(assets));
  } catch (e) {}
  return assets;
};

export const saveAsset = async (asset: Asset, googleToken?: string | null): Promise<Asset> => {
  const scriptUrl = getStoredSpreadsheetUrl();

  // Try server PUT
  try {
    const res = await fetch(`/api/assets/${encodeURIComponent(asset.id)}`, {
      method: 'PUT',
      headers: getHeaders(googleToken),
      body: JSON.stringify(asset),
    });

    if (res.ok) {
      const data = await safeParseJson(res);
      return data.asset || asset;
    }
  } catch (err) {
    // Standalone mode
  }

  // Update local cache and cloud
  try {
    const cached = localStorage.getItem(ASSETS_CACHE_KEY);
    let list: Asset[] = cached ? JSON.parse(cached) : [];
    const idx = list.findIndex(a => a.id === asset.id);
    if (idx >= 0) {
      list[idx] = asset;
    } else {
      list.push(asset);
    }
    localStorage.setItem(ASSETS_CACHE_KEY, JSON.stringify(list));
    if (scriptUrl && scriptUrl.includes('script.google.com')) {
      syncAssetsToAppsScript(scriptUrl, list);
    }
  } catch (e) {}

  return asset;
};

export const deleteAsset = async (id: string, googleToken?: string | null): Promise<void> => {
  const scriptUrl = getStoredSpreadsheetUrl();

  try {
    const res = await fetch(`/api/assets/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getHeaders(googleToken),
    });
    if (res.ok) return;
  } catch (err) {}

  try {
    const cached = localStorage.getItem(ASSETS_CACHE_KEY);
    if (cached) {
      let list: Asset[] = JSON.parse(cached);
      list = list.filter(a => a.id !== id);
      localStorage.setItem(ASSETS_CACHE_KEY, JSON.stringify(list));
      if (scriptUrl && scriptUrl.includes('script.google.com')) {
        syncAssetsToAppsScript(scriptUrl, list);
      }
    }
  } catch (e) {}
};

export const fetchAdminPassword = async (): Promise<string> => {
  try {
    const res = await fetch('/api/admin/password', {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const data = await safeParseJson(res);
      return data.password || 'muttaqin';
    }
  } catch (err) {}
  return 'muttaqin';
};

export const updateAdminPassword = async (newPassword: string): Promise<void> => {
  try {
    const res = await fetch('/api/admin/password', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ password: newPassword }),
    });
    if (!res.ok) {
      throw new Error('Gagal memperbarui sandi admin di server.');
    }
  } catch (err) {
    console.error('Error updating admin password:', err);
    throw err;
  }
};

export const resetAdminPassword = async (): Promise<string> => {
  try {
    const res = await fetch('/api/admin/password/reset', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
    });
    if (res.ok) {
      const data = await safeParseJson(res);
      return data.password || 'muttaqin';
    }
  } catch (err) {}
  return 'muttaqin';
};

export const fetchSettings = async (): Promise<{ spreadsheetId: string }> => {
  try {
    const res = await fetch('/api/settings', {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const data = await safeParseJson(res);
      if (data?.spreadsheetId) {
        localStorage.setItem(SETTINGS_CACHE_KEY, data.spreadsheetId);
        return data;
      }
    }
  } catch (err) {}
  return { spreadsheetId: getStoredSpreadsheetUrl() };
};

export const updateSettings = async (spreadsheetId: string): Promise<any> => {
  try {
    localStorage.setItem(SETTINGS_CACHE_KEY, spreadsheetId);
  } catch (e) {}

  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ spreadsheetId }),
    });
    if (res.ok) {
      return await safeParseJson(res);
    }
  } catch (err) {}
  return { success: true, spreadsheetId };
};

export const checkSheetsStatus = async (
  googleToken?: string | null
): Promise<{ connected: boolean; error: string | null; spreadsheetId?: string; isAppsScript?: boolean }> => {
  const currentUrl = getStoredSpreadsheetUrl();

  try {
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (googleToken) {
      headers['X-Google-Token'] = googleToken;
    }
    const res = await fetch('/api/sheets/status', { headers });
    if (res.ok) {
      return await safeParseJson(res);
    }
  } catch (err: any) {}

  // Direct check for Google Apps Script Web App
  if (currentUrl && currentUrl.includes('script.google.com')) {
    return {
      connected: true,
      error: null,
      spreadsheetId: currentUrl,
      isAppsScript: true
    };
  }

  return { connected: false, error: 'Database belum terhubung.' };
};

// ==========================================
// SPPT PBB CENTRALIZED & CLOUD SYNC API
// ==========================================
export const fetchSpptRecords = async (googleToken?: string | null): Promise<SpptPbbRecord[]> => {
  const scriptUrl = getStoredSpreadsheetUrl();

  // 1. Direct fetch from Apps Script Web App (Primary for multi-device sync)
  if (scriptUrl && scriptUrl.includes('script.google.com')) {
    try {
      const timestamp = Date.now();
      const url = scriptUrl.includes('?') 
        ? `${scriptUrl}&action=getSppt&_t=${timestamp}` 
        : `${scriptUrl}?action=getSppt&_t=${timestamp}`;
      const res = await fetch(url, { method: 'GET', cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.sppt)) {
          try {
            localStorage.setItem(SPPT_CACHE_KEY, JSON.stringify(data.sppt));
          } catch (e) {}
          return data.sppt;
        }
      }
    } catch (e) {}
  }

  // 2. Try server
  try {
    const res = await fetch(`/api/sppt?_t=${Date.now()}`, {
      headers: getHeaders(googleToken),
      cache: 'no-store'
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        try {
          localStorage.setItem(SPPT_CACHE_KEY, JSON.stringify(data));
        } catch (e) {}
        return data;
      }
    }
  } catch (err) {}

  // 3. Cached fallback
  const cached = localStorage.getItem(SPPT_CACHE_KEY);
  if (cached) {
    try { return JSON.parse(cached); } catch (e) {}
  }
  return [];
};

export const saveSpptRecord = async (record: SpptPbbRecord, googleToken?: string | null): Promise<SpptPbbRecord[]> => {
  const scriptUrl = getStoredSpreadsheetUrl();

  try {
    const res = await fetch('/api/sppt', {
      method: 'POST',
      headers: getHeaders(googleToken),
      body: JSON.stringify(record),
    });

    if (res.ok) {
      const data = await safeParseJson(res);
      const updatedRecords = data.records || [];
      try {
        localStorage.setItem(SPPT_CACHE_KEY, JSON.stringify(updatedRecords));
      } catch (e) {}
      return updatedRecords;
    }
  } catch (err) {}

  // Standalone fallback
  const cached = localStorage.getItem(SPPT_CACHE_KEY);
  let records: SpptPbbRecord[] = cached ? JSON.parse(cached) : [];
  const idx = records.findIndex(r => r.id === record.id);
  if (idx >= 0) {
    records[idx] = record;
  } else {
    records.push(record);
  }
  try {
    localStorage.setItem(SPPT_CACHE_KEY, JSON.stringify(records));
  } catch (e) {}

  if (scriptUrl && scriptUrl.includes('script.google.com')) {
    const assetsCached = localStorage.getItem(ASSETS_CACHE_KEY);
    const assetsList = assetsCached ? JSON.parse(assetsCached) : [];
    syncAssetsToAppsScript(scriptUrl, assetsList, records);
  }

  return records;
};

export const deleteSpptRecord = async (id: string, googleToken?: string | null): Promise<SpptPbbRecord[]> => {
  const scriptUrl = getStoredSpreadsheetUrl();

  try {
    const res = await fetch(`/api/sppt/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getHeaders(googleToken),
    });

    if (res.ok) {
      const data = await safeParseJson(res);
      const updatedRecords = data.records || [];
      try {
        localStorage.setItem(SPPT_CACHE_KEY, JSON.stringify(updatedRecords));
      } catch (e) {}
      return updatedRecords;
    }
  } catch (err) {}

  const cached = localStorage.getItem(SPPT_CACHE_KEY);
  let records: SpptPbbRecord[] = cached ? JSON.parse(cached) : [];
  records = records.filter(r => r.id !== id);
  try {
    localStorage.setItem(SPPT_CACHE_KEY, JSON.stringify(records));
  } catch (e) {}

  if (scriptUrl && scriptUrl.includes('script.google.com')) {
    const assetsCached = localStorage.getItem(ASSETS_CACHE_KEY);
    const assetsList = assetsCached ? JSON.parse(assetsCached) : [];
    syncAssetsToAppsScript(scriptUrl, assetsList, records);
  }

  return records;
};

export const syncSpptRecords = async (records: SpptPbbRecord[], googleToken?: string | null): Promise<SpptPbbRecord[]> => {
  const scriptUrl = getStoredSpreadsheetUrl();

  try {
    const res = await fetch('/api/sppt/sync', {
      method: 'POST',
      headers: getHeaders(googleToken),
      body: JSON.stringify({ records }),
    });

    if (res.ok) {
      const data = await safeParseJson(res);
      const updatedRecords = data.records || records;
      try {
        localStorage.setItem(SPPT_CACHE_KEY, JSON.stringify(updatedRecords));
      } catch (e) {}
      return updatedRecords;
    }
  } catch (err) {}

  try {
    localStorage.setItem(SPPT_CACHE_KEY, JSON.stringify(records));
  } catch (e) {}

  if (scriptUrl && scriptUrl.includes('script.google.com')) {
    const assetsCached = localStorage.getItem(ASSETS_CACHE_KEY);
    const assetsList = assetsCached ? JSON.parse(assetsCached) : [];
    syncAssetsToAppsScript(scriptUrl, assetsList, records);
  }

  return records;
};

