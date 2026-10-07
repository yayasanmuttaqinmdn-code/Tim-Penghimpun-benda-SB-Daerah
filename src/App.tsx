import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  MapPin, 
  CheckCircle2, 
  Database,
  Menu
} from 'lucide-react';
import { Asset } from './types';
import Dashboard from './components/Dashboard';
import FormInput from './components/FormInput';
import DatabaseList from './components/DatabaseList';
import ExportPanel from './components/ExportPanel';
import SidebarNav from './components/SidebarNav';
import BalikNamaPanel from './components/BalikNamaPanel';
import PinjamBerkasPanel from './components/PinjamBerkasPanel';
import SettingsPanel from './components/SettingsPanel';
import SpptPbbManager from './components/SpptPbbManager';
import PondokLogo from './components/PondokLogo';
import { INITIAL_SAMPLE_ASSETS } from './data';
import { initAuth, googleSignIn, logout, getAccessToken } from './utils/auth';
import { 
  fetchAssets, 
  saveAsset, 
  deleteAsset, 
  syncAssets, 
  fetchSettings, 
  updateSettings, 
  checkSheetsStatus as apiCheckSheetsStatus 
} from './utils/api';

export default function App() {
  const [assets, setAssets] = useState<Asset[]>(() => {
    try {
      const cached = localStorage.getItem('madiun_assets_cache');
      if (cached !== null) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {}
    return INITIAL_SAMPLE_ASSETS;
  });
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'offline'>('synced');
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Google authentication & Sheets database states
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string>('1TABYBj6rdO--FUbHbelQG7SG4j-gttvR25mSpurAU2Y');
  const [sheetsError, setSheetsError] = useState<string | null>(null);
  const [sheetsConnected, setSheetsConnected] = useState<boolean>(false);

  const checkSheetsStatus = async (tokenOverride?: string | null) => {
    const activeToken = tokenOverride !== undefined ? tokenOverride : googleToken;
    try {
      const data = await apiCheckSheetsStatus(activeToken);
      setSheetsConnected(data.connected);
      setSheetsError(data.error);
    } catch (e: any) {
      console.error('Sheets status error:', e);
      setSheetsConnected(false);
      setSheetsError('Gagal memeriksa status koneksi spreadsheet.');
    }
  };

  const handleUpdateSpreadsheetId = async (newId: string) => {
    try {
      const result = await updateSettings(newId);
      if (result.settings?.spreadsheetId) {
        setSpreadsheetId(result.settings.spreadsheetId);
        showToast('Spreadsheet ID berhasil diperbarui!');
        // Force database sync with the new sheet
        setSyncStatus('pending');
        await syncAssets(assets, googleToken);
        setSyncStatus('synced');
        showToast('Data berhasil diselaraskan ke Google Sheets baru!');
        await checkSheetsStatus(googleToken);
      } else {
        showToast('Gagal mengubah Spreadsheet ID.');
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal mengubah Spreadsheet ID (Koneksi offline).');
    }
  };

  // Sidebar toggle/visible and collapsed state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Auto-collapse / hide sidebar on smaller screens initially
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  // Load assets from server and sync with Google Sheets
  const loadAssets = async (tokenOverride?: string | null) => {
    setSyncStatus('pending');
    const token = tokenOverride !== undefined ? tokenOverride : googleToken;
    try {
      const serverData = await fetchAssets(token);
      if (serverData !== null && Array.isArray(serverData)) {
        setAssets(serverData);
      }
      setSyncStatus('synced');
    } catch (err) {
      console.warn('Gagal memuat data dari server, menggunakan cache lokal:', err);
      try {
        const cached = localStorage.getItem('madiun_assets_cache');
        if (cached !== null) {
          setAssets(JSON.parse(cached));
        }
      } catch (e) {}
      setSyncStatus('offline');
    }
  };

  // Initialize Auth & Settings on mount
  useEffect(() => {
    fetchSettings()
      .then(async (settings) => {
        if (settings?.spreadsheetId) {
          setSpreadsheetId(settings.spreadsheetId);
          await checkSheetsStatus(null);
        }
      })
      .catch(console.error);

    // Initial asset load
    loadAssets(null);

    // Subscribe to Google Auth state
    const unsubscribe = initAuth(
      async (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        await checkSheetsStatus(token);
        await loadAssets(token);
      },
      async () => {
        setGoogleUser(null);
        setGoogleToken(null);
        await checkSheetsStatus(null);
        await loadAssets(null);
      }
    );

    // Auto-sync when returning to the tab/window from Google Sheets
    const handleWindowFocus = () => {
      loadAssets(googleToken);
    };
    window.addEventListener('focus', handleWindowFocus);

    // Periodic fast sync check every 8 seconds across all connected devices
    const syncInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadAssets(googleToken);
      }
    }, 8000);

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      window.removeEventListener('focus', handleWindowFocus);
      clearInterval(syncInterval);
    };
  }, [googleToken]);

  const handleSignInGoogle = async () => {
    try {
      showToast('Menghubungkan akun Google...');
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
        showToast(`Berhasil login: ${result.user.displayName || result.user.email || 'Google User'}`);
        await checkSheetsStatus(result.accessToken);
        // Sync database with Google Sheets
        setSyncStatus('pending');
        await syncAssets(assets, result.accessToken);
        const liveAssets = await fetchAssets(result.accessToken);
        if (liveAssets) {
          setAssets(liveAssets);
        }
        setSyncStatus('synced');
        showToast('Database berhasil tersambung & disinkronkan ke Google Sheets!');
      }
    } catch (err: any) {
      console.error('Google Sign in error:', err);
      showToast(`Gagal login Google: ${err?.message || 'Error'}`);
    }
  };

  const handleLogoutGoogle = async () => {
    try {
      await logout();
      setGoogleUser(null);
      setGoogleToken(null);
      setSheetsConnected(false);
      setSheetsError(null);
      showToast('Koneksi Google Sheets berhasil diputuskan.');
      await loadAssets(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Keep server and state matched on save operations
  const handleSaveAsset = async (savedAsset: Asset) => {
    setSyncStatus('pending');

    let updatedList: Asset[] = [];
    const isNew = !assets.some(a => a.id === savedAsset.id);

    if (isNew) {
      updatedList = [...assets, savedAsset];
    } else {
      updatedList = assets.map(a => a.id === savedAsset.id ? savedAsset : a);
    }
    
    setAssets(updatedList);

    try {
      await saveAsset(savedAsset, googleToken);
      setSyncStatus('synced');
      showToast(isNew ? 'Aset berhasil didaftarkan ke server!' : 'Perubahan aset berhasil disimpan!');
    } catch (e: any) {
      setSyncStatus('offline');
      console.error('Save error:', e);
      showToast(`Gagal menyimpan: ${e?.message || 'Koneksi offline / Error'}`);
    }

    if (editingAsset) {
      setEditingAsset(null);
      setCurrentTab('database');
    }
  };

  // Delete asset handler (triggered from confirmation modal in DatabaseList)
  const handleDeleteAsset = async (id: string) => {
    setSyncStatus('pending');
    const updatedList = assets.filter(a => a.id !== id);
    setAssets(updatedList);
    try {
      localStorage.setItem('madiun_assets_cache', JSON.stringify(updatedList));
    } catch (e) {}

    try {
      await deleteAsset(id, googleToken);
      setSyncStatus('synced');
      showToast('Aset berhasil dihapus dari database & Google Sheets.');
    } catch (e: any) {
      setSyncStatus('offline');
      console.error('Delete error:', e);
      showToast(`Gagal menghapus aset: ${e?.message || 'Error'}`);
    }
  };

  // Bulk restore importer
  const handleImportBackup = (importedAssets: Asset[]): boolean => {
    setSyncStatus('pending');
    showToast('Sedang mengimpor data ke server...');

    const mergedMap = new Map<string, Asset>();
    assets.forEach(a => mergedMap.set(a.id, a));
    importedAssets.forEach(a => mergedMap.set(a.id, a));

    const unifiedList = Array.from(mergedMap.values());
    setAssets(unifiedList);

    syncAssets(unifiedList, googleToken)
      .then(() => {
        setSyncStatus('synced');
        showToast(`Berhasil mengimpor ${importedAssets.length} aset.`);
      })
      .catch(() => {
        setSyncStatus('offline');
        showToast('Gagal menyimpan ke server (Koneksi offline).');
      });

    return true;
  };

  // Replace assets state completely (for backup restores)
  const handleReplaceAssets = async (newList: Asset[]) => {
    setSyncStatus('pending');
    showToast('Menyinkronkan data...');
    try {
      await syncAssets(newList, googleToken);
      setAssets(newList);
      showToast('Data berhasil disinkronisasi ke server!');
      setSyncStatus('synced');
    } catch (err) {
      console.error('Failed to sync to server:', err);
      setSyncStatus('offline');
      showToast('Gagal terhubung ke server.');
    }
  };

  // Forced Sync (Pull live changes and deletions from Google Sheets)
  const handleManualSync = async () => {
    setSyncStatus('pending');
    try {
      showToast('Menyelaraskan data dengan Google Sheets...');
      const updatedFromServer = await fetchAssets(googleToken);
      if (Array.isArray(updatedFromServer)) {
        setAssets(updatedFromServer);
        showToast(`Sinkronisasi sukses! Data aktif: ${updatedFromServer.length} aset.`);
      }
      setSyncStatus('synced');
      await checkSheetsStatus(googleToken);
    } catch (e) {
      setSyncStatus('offline');
      showToast('Tidak ada koneksi internet / server offline.');
    }
  };

  const handleTriggerEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setCurrentTab('input');
  };

  const getTabInfo = (tab: string) => {
    switch (tab) {
      case 'dashboard': return { title: 'Dashboard Utama', subtitle: 'Statistik & Ringkasan Aset' };
      case 'input': return { title: editingAsset ? 'Edit Data Aset' : 'Pendaftaran Aset', subtitle: 'Formulir Tanah, Kendaraan & Bangunan' };
      case 'database': return { title: 'Lihat & Cari Aset', subtitle: 'Database Inventaris Lengkap' };
      case 'sppt-pbb': return { title: 'Pengelolaan SPPT PBB', subtitle: 'Pencatatan NOP & Ceklis Bayar 2025-2035' };
      case 'baliknama': return { title: 'Balik Nama Sertifikat', subtitle: 'Monitoring Pengurusan Mutasi BPN' };
      case 'pinjamberkas': return { title: 'Peminjaman Berkas', subtitle: 'Pengawasan Berkas Asli & Dokumen' };
      case 'export': return { title: 'Ekspor & Cetak', subtitle: 'Unduh Format Google Sheets & CSV' };
      case 'settings': return { title: 'Pengaturan', subtitle: 'Konfigurasi Spreadsheet & Keamanan' };
      default: return { title: 'Aset Daerah Madiun', subtitle: 'Tim Penghimpun Benda SB' };
    }
  };

  const activeTabInfo = getTabInfo(currentTab);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex overflow-hidden">
      {/* Visual Government-Inspired Left Sidebar Navigation */}
      <SidebarNav 
        currentTab={currentTab} 
        onChangeTab={(tab) => {
          // Reset edit state if user moves away from input tab manually
          if (tab !== 'input' && editingAsset) {
            setEditingAsset(null);
          }
          setCurrentTab(tab);
        }}
        syncStatus={syncStatus}
        totalCount={assets.length}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />

      {/* Main Right Content Panel */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
        {/* Visual Government-Inspired Top Header */}
        <header className="bg-sky-800 border-b-4 border-sky-900 text-white py-2.5 px-4 sticky top-0 z-45 shadow-md">
          <div className="w-full max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Menu Toggle Button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 hover:bg-sky-700/80 rounded-lg text-sky-100 hover:text-white transition-all cursor-pointer flex items-center justify-center mr-0.5"
                title={sidebarOpen ? "Sembunyikan Menu" : "Tampilkan Menu"}
              >
                <Menu className="w-4.5 h-4.5" />
              </button>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-sky-800 font-black text-md shadow-sm">
                  T
                </div>
                <div>
                  <h1 className="text-xs font-black tracking-wide text-white leading-none uppercase">
                    {sidebarOpen ? activeTabInfo.title : "TIM PENGHIMPUN BENDA SB"}
                  </h1>
                  <p className="text-[9px] text-sky-300 uppercase tracking-widest font-extrabold mt-1 leading-none">
                    {sidebarOpen ? activeTabInfo.subtitle : "DAERAH MADIUN"}
                  </p>
                </div>
              </div>
            </div>

            {/* Sync Pill Indicator & Manual Sync Button */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={async () => {
                  setSyncStatus('pending');
                  showToast('Menyinkronkan data...');
                  await loadAssets(googleToken);
                  showToast('Data berhasil disinkronkan!');
                }}
                className="bg-white/15 hover:bg-white/25 active:scale-95 text-white border border-white/20 text-[10px] px-2.5 py-1 rounded-full font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title="Tarik data terbaru dari Google Sheets & Server sekarang"
              >
                <RefreshCw className={`w-3 h-3 ${syncStatus === 'pending' ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Sinkron Data</span>
              </button>

              {syncStatus === 'synced' && (
                <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                  <Wifi className="w-3 h-3" /> Online
                </span>
              )}
              {syncStatus === 'pending' && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1 animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Sinkron
                </span>
              )}
              {syncStatus === 'offline' && (
                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                  <WifiOff className="w-3 h-3" /> Offline
                </span>
              )}

              {/* Google Sheets Sync Pill */}
              {sheetsConnected ? (
                <button 
                  onClick={() => setCurrentTab('dashboard')}
                  className="px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                  title="Google Sheets / Apps Script Aktif & Terhubung"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span className="hidden sm:inline">Sheets Terhubung</span>
                </button>
              ) : googleUser ? (
                <button 
                  onClick={() => setCurrentTab('dashboard')}
                  className="px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
                  title={sheetsError || 'Perlu verifikasi Spreadsheet'}
                >
                  <RefreshCw className="w-3 h-3 text-amber-300" />
                  <span className="hidden sm:inline">Perlu Sinkron</span>
                </button>
              ) : (
                <button
                  onClick={() => setCurrentTab('settings')}
                  className="bg-white/10 hover:bg-white/20 text-sky-100 hover:text-white border border-white/20 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 transition-all cursor-pointer"
                  title="Hubungkan database dengan Google Sheets / Apps Script"
                >
                  <Database className="w-3 h-3 text-sky-300" />
                  <span className="hidden sm:inline">Hubungkan Sheets</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Responsive Body Container */}
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-4 mb-6 overflow-x-hidden">
        
        <AnimatePresence mode="wait">
          {currentTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
            >
              <Dashboard 
                assets={assets} 
                onNavigateToTab={(tab) => setCurrentTab(tab)} 
                syncStatus={syncStatus}
                onSyncManual={handleManualSync}
                googleUser={googleUser}
                googleToken={googleToken}
                onSignInGoogle={handleSignInGoogle}
                onLogoutGoogle={handleLogoutGoogle}
                spreadsheetId={spreadsheetId}
                onUpdateSpreadsheetId={handleUpdateSpreadsheetId}
                sheetsConnected={sheetsConnected}
                sheetsError={sheetsError}
              />
            </motion.div>
          )}

          {currentTab === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <FormInput 
                onSaveAsset={handleSaveAsset} 
                editingAsset={editingAsset}
                assets={assets}
                onCancelEdit={() => {
                  setEditingAsset(null);
                  setCurrentTab('database');
                }}
              />
            </motion.div>
          )}

          {currentTab === 'database' && (
            <motion.div
              key="database"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <DatabaseList 
                assets={assets} 
                onEditAsset={handleTriggerEdit} 
                onDeleteAsset={handleDeleteAsset}
              />
            </motion.div>
          )}

          {currentTab === 'sppt-pbb' && (
            <motion.div
              key="sppt-pbb"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <SpptPbbManager />
            </motion.div>
          )}

          {currentTab === 'baliknama' && (
            <motion.div
              key="baliknama"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <BalikNamaPanel 
                assets={assets} 
                onSaveAsset={handleSaveAsset}
                onNavigateToTab={(tab) => setCurrentTab(tab)}
                googleUser={googleUser}
              />
            </motion.div>
          )}

          {currentTab === 'pinjamberkas' && (
            <motion.div
              key="pinjamberkas"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <PinjamBerkasPanel 
                assets={assets} 
                onSaveAsset={handleSaveAsset}
                googleUser={googleUser}
              />
            </motion.div>
          )}

          {currentTab === 'export' && (
            <motion.div
              key="export"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              <ExportPanel 
                assets={assets} 
                onImportBackup={handleImportBackup}
              />
            </motion.div>
          )}

          {currentTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <SettingsPanel 
                spreadsheetId={spreadsheetId}
                onUpdateSpreadsheetId={handleUpdateSpreadsheetId}
                sheetsConnected={sheetsConnected}
                sheetsError={sheetsError}
                googleUser={googleUser}
                googleToken={googleToken}
                onSignInGoogle={handleSignInGoogle}
                onLogoutGoogle={handleLogoutGoogle}
                onSyncManual={handleManualSync}
                syncStatus={syncStatus}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Persistent Floating Bottom Action Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            key="toast-message"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-6 left-4 right-4 z-55 flex justify-center"
          >
            <div className="bg-slate-900 border border-slate-800 text-white font-semibold text-xs py-3 px-4 rounded-xl shadow-lg flex items-center gap-2 max-w-sm">
              <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
              <span>{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
