import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RefreshCw, 
  UserCheck, 
  Calendar, 
  FileEdit, 
  Check, 
  Trash2, 
  User, 
  AlertCircle, 
  PlusCircle, 
  HelpCircle,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Asset } from '../types';
import MenuHeroBanner from './MenuHeroBanner';

interface BalikNamaPanelProps {
  assets: Asset[];
  onSaveAsset: (asset: Asset) => void;
  userRole?: 'admin' | 'viewer';
  onNavigateToTab?: (tab: string) => void;
  googleUser?: any;
}

export default function BalikNamaPanel({ assets, onSaveAsset, userRole = 'viewer', onNavigateToTab, googleUser }: BalikNamaPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddQueue, setShowAddQueue] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  // States for interactive inline confirmation actions
  const [confirmingCompleteId, setConfirmingCompleteId] = useState<string | null>(null);
  const [confirmingCancelId, setConfirmingCancelId] = useState<string | null>(null);

  // Editable local draft state for selected card
  const [draftNamaBaru, setDraftNamaBaru] = useState('');
  const [draftTanggal, setDraftTanggal] = useState('');
  const [draftCatatan, setDraftCatatan] = useState('');
  const [newSertifikatNo, setNewSertifikatNo] = useState('');
  const [draftProgressList, setDraftProgressList] = useState<any[]>([]);
  const [draftProgressKeterangan, setDraftProgressKeterangan] = useState('');
  const [draftProgressTanggal, setDraftProgressTanggal] = useState('');
  const [draftProgressBiaya, setDraftProgressBiaya] = useState('');

  const [activeSubTab, setActiveSubTab] = useState<'progress' | 'completed'>('progress');

  // Assets current undergoing balik nama
  const inProgressAssets = assets.filter(a => a.sedangBalikNama === true);

  // Assets that HAVE BEEN successfully transferred to Yayasan Pondok Pesantren Muttaqin Josenan
  const completedAssets = assets.filter(a => {
    if (a.sedangBalikNama) return false;

    const currentOwnerName = a.type === 'tanah' 
      ? a.atasNamaSertifikat 
      : a.type === 'kendaraan' 
        ? a.atasNama 
        : '';

    const normalizedOwnerName = (currentOwnerName || '').trim().toUpperCase();
    return (
      normalizedOwnerName === 'YAYASAN PONDOK PESANTREN MUTTAQIN JOSENAN MADIUN' || 
      normalizedOwnerName === 'YAYASAN PONDOK PESANTREN MUTTAQIN JOSENAN' || 
      normalizedOwnerName.includes('MUTTAQIN JOSENAN') ||
      normalizedOwnerName.includes('MUTTAQIN')
    );
  });

  // Assets that are NOT currently in balik nama process AND NOT already owned by Yayasan Muttaqin Josenan
  const readyForQueueAssets = assets.filter(a => {
    if (a.sedangBalikNama) return false;

    const currentOwnerName = a.type === 'tanah' 
      ? a.atasNamaSertifikat 
      : a.type === 'kendaraan' 
        ? a.atasNama 
        : '';

    const normalizedOwnerName = (currentOwnerName || '').trim().toUpperCase();
    if (
      normalizedOwnerName === 'YAYASAN PONDOK PESANTREN MUTTAQIN JOSENAN MADIUN' || 
      normalizedOwnerName === 'YAYASAN PONDOK PESANTREN MUTTAQIN JOSENAN' || 
      normalizedOwnerName.includes('MUTTAQIN JOSENAN')
    ) {
      return false; // Already owned, no need to show in queue input list
    }
    return true;
  }).filter(a => {
    const term = searchTerm.toLowerCase();
    const isTanah = a.type === 'tanah';
    const isKendaraan = a.type === 'kendaraan';
    const isBangunan = a.type === 'bangunan';

    if (isTanah) {
      return (
        (a.atasNamaSertifikat || '').toLowerCase().includes(term) ||
        (a.nomerSertifikat || '').toLowerCase().includes(term) ||
        (a.lokasi || '').toLowerCase().includes(term)
      );
    } else if (isKendaraan) {
      return (
        (a.atasNama || '').toLowerCase().includes(term) ||
        (a.nomorPolisi || '').toLowerCase().includes(term) ||
        (a.merk || '').toLowerCase().includes(term)
      );
    } else if (isBangunan) {
      return (
        (a.namaBangunan || '').toLowerCase().includes(term) ||
        (a.lokasi || '').toLowerCase().includes(term)
      );
    }
    return false;
  });

  const startEditCard = (asset: Asset) => {
    setEditingCardId(asset.id);
    setDraftNamaBaru(asset.namaPemilikBaru || '');
    setDraftTanggal(asset.tanggalMulaiBalikNama || new Date().toISOString().split('T')[0]);
    setDraftCatatan(asset.catatanBalikNama || '');
    setDraftProgressList(asset.progresBalikNama || []);
    setDraftProgressTanggal(new Date().toISOString().split('T')[0]);
    setDraftProgressKeterangan('');
    setDraftProgressBiaya('');
  };

  const handleAddProgress = () => {
    if (!draftProgressKeterangan || !draftProgressTanggal) return;
    const newItem = {
      id: crypto.randomUUID(),
      tanggal: draftProgressTanggal,
      keterangan: draftProgressKeterangan,
      biaya: Number(draftProgressBiaya) || 0
    };
    setDraftProgressList([...draftProgressList, newItem]);
    setDraftProgressKeterangan('');
    setDraftProgressBiaya('');
    setDraftProgressTanggal(new Date().toISOString().split('T')[0]);
  };

  const handleDeleteProgress = (id: string) => {
    setDraftProgressList(draftProgressList.filter(p => p.id !== id));
  };

  const handleSaveDraft = (asset: Asset) => {
    const updatedAsset: Asset = {
      ...asset,
      namaPemilikBaru: draftNamaBaru,
      tanggalMulaiBalikNama: draftTanggal,
      catatanBalikNama: draftCatatan,
      progresBalikNama: draftProgressList,
    };
    onSaveAsset(updatedAsset);
    setEditingCardId(null);
  };

  const handleAddToQueue = (asset: Asset) => {
    const updatedAsset: Asset = {
      ...asset,
      sedangBalikNama: true,
      namaPemilikBaru: asset.namaPemilikBaru || 'YAYASAN PONDOK PESANTREN MUTTAQIN JOSENAN MADIUN',
      tanggalMulaiBalikNama: asset.tanggalMulaiBalikNama || new Date().toISOString().split('T')[0],
      catatanBalikNama: asset.catatanBalikNama || 'Berkas mulai dihimpun oleh tim sekretariat.',
    };
    onSaveAsset(updatedAsset);
    setShowAddQueue(false);
  };

  const handleCancelProcess = (asset: Asset) => {
    const updatedAsset: Asset = {
      ...asset,
      sedangBalikNama: false,
    };
    onSaveAsset(updatedAsset);
    setConfirmingCancelId(null);
  };

  const handleCompleteProcess = (asset: Asset, finalCertNo: string) => {
    
    // Duplicate check for new cert number
    if (asset.type === 'tanah') {
      if (assets.some(a => a.type === 'tanah' && a.nomerSertifikat?.toLowerCase().trim() === finalCertNo.toLowerCase().trim() && a.id !== asset.id)) {
        alert('Nomor Sertifikat sudah terdaftar. Data tidak boleh ganda.');
        return;
      }
    } else if (asset.type === 'kendaraan') {
      if (assets.some(a => a.type === 'kendaraan' && a.nomorPolisi?.toLowerCase().trim() === finalCertNo.toLowerCase().trim() && a.id !== asset.id)) {
        alert('Nomor Polisi sudah terdaftar. Data tidak boleh ganda.');
        return;
      }
    }

    const finalOwnerName = 'YAYASAN PONDOK PESANTREN MUTTAQIN JOSENAN MADIUN';
    
    // Extract prior states for audit trail
    const atasNamaLama = (asset.type === 'tanah' ? asset.atasNamaSertifikat : asset.type === 'kendaraan' ? asset.atasNama : 'Gedung/Bangunan') || '-';
    const nomerSertifikatLama = (asset.type === 'tanah' ? asset.nomerSertifikat : asset.type === 'kendaraan' ? asset.nomorPolisi : (asset.nomerPBG || asset.nomerSLF || '-')) || '-';
    
    // Build new history log entry
    const historyEntry = {
      tanggalSelesai: new Date().toLocaleDateString('id-ID'),
      atasNamaLama,
      nomerSertifikatLama,
      catatanLama: asset.catatanBalikNama || '',
      nomorSertifikatBaru: finalCertNo,
      progresDetail: asset.progresBalikNama || []
    };

    const priorHistory = asset.riwayatBalikNama || [];
    const updatedHistory = [...priorHistory, historyEntry];

    let updatedAsset: Asset;
    if (asset.type === 'tanah') {
      updatedAsset = {
        ...asset,
        atasNamaSertifikat: finalOwnerName,
        nomerSertifikat: finalCertNo,
        sedangBalikNama: false,
        progresBalikNama: [],
        catatanBalikNama: `Selesai balik nama ke ${finalOwnerName} pada ${new Date().toLocaleDateString('id-ID')}. Nomor Sertifikat baru: ${finalCertNo}.`,
        riwayatBalikNama: updatedHistory
      };
    } else if (asset.type === 'kendaraan') {
      updatedAsset = {
        ...asset,
        atasNama: finalOwnerName,
        nomorPolisi: finalCertNo,
        sedangBalikNama: false,
        progresBalikNama: [],
        catatanBalikNama: `Selesai balik nama ke ${finalOwnerName} pada ${new Date().toLocaleDateString('id-ID')}. Nomor Polisi/Surat baru: ${finalCertNo}.`,
        riwayatBalikNama: updatedHistory
      };
    } else {
      updatedAsset = {
        ...asset,
        nomerPBG: finalCertNo,
        sedangBalikNama: false,
        progresBalikNama: [],
        catatanBalikNama: `Selesai balik nama ke ${finalOwnerName} pada ${new Date().toLocaleDateString('id-ID')}. Nomor PBG baru: ${finalCertNo}.`,
        riwayatBalikNama: updatedHistory
      };
    }

    onSaveAsset(updatedAsset);
    setEditingCardId(null);
    setConfirmingCompleteId(null);
    setNewSertifikatNo('');
    
    // Auto-navigate to database tab so user can see the updated asset immediately!
    if (onNavigateToTab) {
      setTimeout(() => {
        onNavigateToTab('database');
      }, 100);
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Title & Banner */}
      <MenuHeroBanner
        title="LAYANAN BALIK NAMA SERTIFIKAT & DOKUMEN"
        subtitle="Pelacakan progres pengurusan dan mutasi sertifikat resmi atas nama yayasan."
        badgeText="TIM PENGHIMPUN BENDA SABILILLAH"
        rightElement={
          <div className="flex items-center gap-2">
            <span className="bg-sky-700/40 text-sky-200 border border-sky-600/30 text-xs font-bold px-3 py-1 rounded-xl">
              ⚖️ {inProgressAssets.length} Sedang Proses
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-xl">
              ✅ {completedAssets.length} Selesai
            </span>
          </div>
        }
      />

      {/* Stats Quick Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-3.5 rounded-xl border-2 border-slate-200 shadow-xs text-center">
          <span className="block text-slate-400 font-bold uppercase tracking-wider text-[8px] mb-1">Dalam Proses</span>
          <span className="text-xl font-black text-sky-600">{inProgressAssets.length}</span>
          <span className="block text-[8px] text-slate-500 mt-1">Unit Sedang Diurus</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border-2 border-slate-200 shadow-xs text-center">
          <span className="block text-slate-400 font-bold uppercase tracking-wider text-[8px] mb-1">Selesai Balik Nama</span>
          <span className="text-xl font-black text-sky-700">
            {completedAssets.length}
          </span>
          <span className="block text-[8px] text-sky-600 mt-1">Milik Resmi Yayasan</span>
        </div>
      </div>

      {/* Sub-Tabs Selector */}
      <div className="flex bg-slate-100 p-1 rounded-xl">
        <button
          onClick={() => setActiveSubTab('progress')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer ${
            activeSubTab === 'progress'
              ? 'bg-white text-slate-800 shadow-xs border border-transparent font-black'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Sedang Diproses ({inProgressAssets.length})
        </button>
        <button
          onClick={() => setActiveSubTab('completed')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer ${
            activeSubTab === 'completed'
              ? 'bg-sky-600 text-white shadow-xs font-black'
              : 'text-slate-500 hover:text-sky-700'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          Berhasil / Selesai ({completedAssets.length})
        </button>
      </div>

      {/* Queued Action Box */}
      {activeSubTab === 'progress' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-sky-200 dark:border-slate-800 overflow-hidden">
          {userRole === 'admin' ? (
            <button 
              onClick={() => setShowAddQueue(!showAddQueue)}
              className="w-full p-3.5 bg-sky-50/60 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700/80 text-sky-800 dark:text-sky-300 font-black text-xs flex items-center justify-between focus:outline-none transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-sky-600" />
                Masukkan Aset ke Antrean Balik Nama
              </span>
              <span className="text-[10px] bg-sky-100 dark:bg-slate-700 px-2 py-0.5 rounded font-bold">
                {showAddQueue ? 'Sembunyikan' : 'Buka'}
              </span>
            </button>
          ) : (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs flex items-center justify-between font-medium">
              <span className="flex items-center gap-2 font-bold">
                <span>🔒</span> Mode Tamu: Memantau Progres Mutasi Balik Nama Sertifikat
              </span>
              <span className="text-[10px] text-slate-500 font-bold bg-white dark:bg-slate-700 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-600">
                Pendaftaran Khusus Admin
              </span>
            </div>
          )}

          <AnimatePresence>
            {showAddQueue && (
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden border-t border-slate-100"
              >
                <div className="p-3.5 space-y-3 bg-slate-50/50">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Cari aset dari database daerah..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white border-2 border-slate-200 rounded-lg p-2 pl-3 text-xs focus:outline-none focus:border-sky-400 h-9 font-medium"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                    {readyForQueueAssets.length === 0 ? (
                      <div className="text-center py-4 text-slate-400 text-xs font-semibold">
                        Aset tidak ditemukan atau seluruh aset telah masuk antrean.
                      </div>
                    ) : (
                      readyForQueueAssets.map(asset => {
                        const isTanah = asset.type === 'tanah';
                        const isKendaraan = asset.type === 'kendaraan';
                        return (
                          <div key={asset.id} className="pt-2 flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded mr-1.5 bg-slate-200 text-slate-700">
                                {asset.type}
                              </span>
                              <span className="text-xs font-black text-slate-800">
                                {isTanah && `${asset.jenisSertifikat} - No. ${asset.nomerSertifikat}`}
                                {isKendaraan && `${asset.merk} (${asset.nomorPolisi})`}
                                {!isTanah && !isKendaraan && asset.namaBangunan}
                              </span>
                              <p className="text-[10px] text-slate-400 truncate">
                                Pemilik saat ini: {isTanah ? asset.atasNamaSertifikat : isKendaraan ? asset.atasNama : 'Gedung'}
                              </p>
                            </div>
                            <button
                              onClick={() => handleAddToQueue(asset)}
                              className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[10px] font-black cursor-pointer transition-colors shrink-0"
                            >
                              Pilih
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Primary Listing */}
      {activeSubTab === 'completed' ? (
        <div className="space-y-3">
          {completedAssets.length === 0 ? (
            <div className="bg-white text-center py-12 rounded-2xl border-2 border-slate-200 p-6 space-y-2">
              <UserCheck className="w-8 h-8 text-slate-300 mx-auto" />
              <span className="block text-sm font-black text-slate-800">Belum Ada Berkas Selesai</span>
              <p className="text-slate-400 text-[11px] max-w-xs mx-auto">
                Belum ada laporan atau aset daerah yang telah selesai dibalik nama ke atas nama Yayasan Pondok Pesantren Muttaqin Josenan.
              </p>
            </div>
          ) : (
            completedAssets.map((asset) => {
              const isTanah = asset.type === 'tanah';
              const isKendaraan = asset.type === 'kendaraan';

              let mainLabel = '';
              let searchTarget = '';
              let visualEmoji = '🏘️';
              let cardBg = 'hover:border-sky-400 border-slate-200';

              if (isTanah) {
                mainLabel = `${asset.jenisSertifikat} - No. ${asset.nomerSertifikat}`;
                searchTarget = asset.lokasi || '';
                visualEmoji = '🏘️';
              } else if (isKendaraan) {
                mainLabel = `${asset.merk} (${asset.nomorPolisi})`;
                searchTarget = asset.penanggungJawabDaerah || '';
                visualEmoji = '🚐';
              } else {
                mainLabel = asset.namaBangunan;
                searchTarget = asset.lokasi || '';
                visualEmoji = '🏢';
              }

              return (
                <div 
                  key={asset.id}
                  className={`bg-white border-2 rounded-2xl p-4.5 shadow-sm space-y-3.5 relative overflow-hidden transition-all duration-150 ${cardBg}`}
                >
                  {/* Subtle completed background stamp */}
                  <div className="absolute right-2 bottom-2 text-sky-100/35 pointer-events-none select-none text-9xl font-black">
                    ✓
                  </div>

                  {/* Header */}
                  <div className="flex justify-between items-start gap-2 relative z-10">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 bg-sky-50 text-xl flex items-center justify-center rounded-xl shrink-0 border border-sky-100">
                        {visualEmoji}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-black uppercase text-sky-800 bg-sky-100 rounded px-1.5 py-0.5 border border-sky-200/50">
                          ✓ Berhasil Balik Nama
                        </span>
                        <h3 className="text-xs font-black text-slate-900 truncate mt-1">
                          {mainLabel}
                        </h3>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono bg-sky-50 text-sky-700 px-2 py-0.5 rounded uppercase border border-sky-100">
                      {asset.type}
                    </span>
                  </div>

                  {/* Visual indication card - showing target reached! */}
                  <div className="bg-sky-50/50 p-3.5 rounded-xl border border-sky-100 text-left relative z-10 flex items-center gap-3">
                    <div className="bg-sky-600/10 p-2 rounded-lg text-sky-700 shrink-0">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[8px] text-sky-600 font-extrabold uppercase tracking-wider">Pemilik Resmi Terdaftar</span>
                      <span className="text-[11px] font-black text-sky-950 block truncate">
                        YAYASAN PONDOK PESANTREN MUTTAQIN JOSENAN MADIUN
                      </span>
                    </div>
                  </div>

                  {/* Detail Information */}
                  <div className="space-y-2 text-xs relative z-10">
                    {searchTarget && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="text-sm">📍</span>
                        <span className="font-semibold text-[11px] text-slate-500">Keterangan / Wilayah:</span>
                        <span className="font-bold text-[11px] text-slate-800">
                          {searchTarget}
                        </span>
                      </div>
                    )}
                    {asset.catatanBalikNama ? (
                      <div className="flex items-start gap-2 text-slate-600">
                        <span className="text-sm mt-0.5">📝</span>
                        <div className="space-y-0.5">
                          <span className="font-semibold text-[11px] block text-slate-500">Catatan Riwayat Transfer:</span>
                          <p className="text-[11px] text-sky-900 font-medium leading-relaxed bg-sky-50/15 p-2 rounded-lg border border-sky-100/40">
                            {asset.catatanBalikNama}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-500 italic">
                        <span className="text-sm">📝</span>
                        <span className="text-[11px]">Sertifikat kepemilikan resmi atas nama Yayasan Pondok Pesantren Muttaqin Josenan seutuhnya.</span>
                      </div>
                    )}

                    {asset.riwayatBalikNama && asset.riwayatBalikNama.length > 0 && (
                      <div className="pt-2.5 border-t border-slate-150 mt-2 space-y-2">
                        <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider flex items-center gap-1">
                          <span>📜</span> Riwayat Kepemilikan & Sertifikat Lama:
                        </span>
                        <div className="space-y-2">
                          {asset.riwayatBalikNama.map((r, i) => (
                            <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-left text-[11px] space-y-1 font-sans">
                              <div className="flex justify-between items-center text-slate-700 font-bold">
                                <span>Pemilik Lama: <span className="font-extrabold text-slate-900">{r.atasNamaLama}</span></span>
                                <span className="text-[9px] text-slate-400 font-mono font-bold bg-slate-200/50 px-1.5 py-0.5 rounded">{r.tanggalSelesai}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 pt-1">
                                <div>
                                  <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider">No. Dokumen Lama</span>
                                  <span className="font-mono text-slate-700 font-semibold">{r.nomerSertifikatLama}</span>
                                </div>
                                <div>
                                  <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider">No. Dokumen Baru (Yayasan)</span>
                                  <span className="font-mono text-sky-800 font-bold">{r.nomorSertifikatBaru}</span>
                                </div>
                              </div>
                              {r.catatanLama && (
                                <p className="text-[9px] text-slate-400 leading-normal italic mt-1 border-l border-slate-300 pl-1.5">{r.catatanLama}</p>
                              )}
                              
                              {r.progresDetail && r.progresDetail.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  <span className="font-semibold text-[9px] uppercase text-slate-400 block mb-1 tracking-wider border-t border-dashed border-slate-200 pt-1">Log Histori Progres & Biaya:</span>
                                  {r.progresDetail.map((prog, k) => (
                                    <div key={k} className="bg-white border text-[9px] text-slate-600 flex justify-between gap-1 items-start p-1.5 rounded">
                                      <div className="space-y-0.5 min-w-0 flex-1">
                                        <span className="font-mono font-bold text-slate-400">{new Date(prog.tanggal).toLocaleDateString('id-ID')}</span>
                                        <p className="leading-relaxed truncate pr-2">{prog.keterangan}</p>
                                      </div>
                                      {prog.biaya > 0 && (
                                        <div className="shrink-0 text-right font-mono font-bold text-slate-400">
                                          Rp {prog.biaya.toLocaleString('id-ID')}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  <div className="text-right text-[9px] font-bold text-slate-500 pt-1 pr-1">
                                    Total Biaya: <span className="text-slate-700">Rp {r.progresDetail.reduce((sum, p) => sum + (p.biaya || 0), 0).toLocaleString('id-ID')}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {inProgressAssets.length === 0 ? (
            <div className="bg-white text-center py-12 rounded-2xl border-2 border-slate-200 p-6 space-y-2">
              <RefreshCw className="w-8 h-8 text-slate-300 mx-auto animate-pulse" />
              <span className="block text-sm font-black text-slate-800">Tidak Ada Proses Balik Nama Aktif</span>
              <p className="text-slate-400 text-[11px] max-w-xs mx-auto">
                Saat ini tidak ada laporan atau aset daerah yang didaftarkan dalam proses balik nama sertifikasi pemilik.
              </p>
            </div>
          ) : (
            inProgressAssets.map((asset) => {
              const isTanah = asset.type === 'tanah';
              const isKendaraan = asset.type === 'kendaraan';
              const isEditing = editingCardId === asset.id;

              let mainLabel = '';
              let currentOwner = '';
              let visualEmoji = '🏘️';
              let cardBg = 'hover:border-sky-400 border-slate-200';

              if (isTanah) {
                mainLabel = `${asset.jenisSertifikat} - No. ${asset.nomerSertifikat}`;
                currentOwner = asset.atasNamaSertifikat;
                visualEmoji = '🏘️';
              } else if (isKendaraan) {
                mainLabel = `${asset.merk} (${asset.nomorPolisi})`;
                currentOwner = asset.atasNama;
                visualEmoji = '🚐';
                cardBg = 'hover:border-amber-450 border-slate-200';
              } else {
                mainLabel = asset.namaBangunan;
                currentOwner = '-';
                visualEmoji = '🏢';
                cardBg = 'hover:border-purple-400 border-slate-200';
              }

              return (
                <div 
                  key={asset.id}
                  className={`bg-white border-2 rounded-2xl p-4.5 shadow-sm space-y-3.5 relative overflow-hidden transition-all duration-150 ${cardBg}`}
                >
                  {/* Header */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 bg-slate-50 text-xl flex items-center justify-center rounded-xl shrink-0">
                        {visualEmoji}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-black uppercase text-amber-800 bg-amber-100 rounded px-1.5 py-0.5">
                          Proses Balik Nama
                        </span>
                        <h3 className="text-xs font-black text-slate-900 truncate mt-1">
                          {mainLabel}
                        </h3>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">
                      {asset.type}
                    </span>
                  </div>

                  {/* Transfer Map */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 grid grid-cols-7 items-center gap-1.5 text-center">
                    <div className="col-span-3 min-w-0">
                      <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider">Pemilik Lama</span>
                      <span className="text-[10px] font-bold text-slate-700 block truncate" title={currentOwner}>
                        {currentOwner || '-'}
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-center text-slate-400">
                      <ChevronRight className="w-4 h-4 text-slate-400 animate-pulse" />
                    </div>
                    <div className="col-span-3 min-w-0">
                      <span className="block text-[8px] text-sky-500 font-bold uppercase tracking-wider">Target Baru</span>
                      <span className="text-[10px] font-extrabold text-sky-700 block truncate" title={asset.namaPemilikBaru}>
                        {asset.namaPemilikBaru || 'Belum Diisi'}
                      </span>
                    </div>
                  </div>

                  {/* Detail Information */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span className="font-semibold text-[11px]">Tanggal Mulai:</span>
                      <span className="font-mono text-[11px] text-slate-700">
                        {asset.tanggalMulaiBalikNama ? new Date(asset.tanggalMulaiBalikNama).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) : '-'}
                      </span>
                    </div>
                    
                    <div className="flex items-start gap-2 text-slate-600">
                      <Clock className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                      <div className="space-y-2 flex-1">
                        <span className="font-semibold text-[11px] block text-slate-600">Catatan Info Utama:</span>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-sans bg-amber-50/40 p-2.5 rounded-lg border border-amber-100/70">
                          {asset.catatanBalikNama || 'Menunggu pembaruan catatan administrasi...'}
                        </p>

                        {/* List of Progres Balik Nama Detailed logs */}
                        {asset.progresBalikNama && asset.progresBalikNama.length > 0 && (
                          <div className="mt-3 space-y-1.5">
                            <span className="font-semibold text-[10px] uppercase text-slate-500 block mb-1 tracking-wider">Log Progres & Biaya:</span>
                            {asset.progresBalikNama.map((prog, i) => (
                              <div key={prog.id} className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-[10px] text-slate-700 flex justify-between gap-1 items-start">
                                <div className="space-y-0.5 min-w-0 flex-1">
                                  <span className="font-mono font-bold text-[9px] text-slate-500">{new Date(prog.tanggal).toLocaleDateString('id-ID')}</span>
                                  <p className="font-medium text-slate-800 leading-relaxed break-words pr-2">{prog.keterangan}</p>
                                </div>
                                {prog.biaya > 0 && (
                                  <div className="shrink-0 text-right">
                                    <span className="inline-block bg-rose-50 text-rose-700 border border-rose-100 rounded px-1.5 py-0.5 font-bold font-mono whitespace-nowrap">
                                      Rp {prog.biaya.toLocaleString('id-ID')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                            {asset.progresBalikNama.length > 0 && (
                              <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 px-1 pt-1">
                                <span>Total Biaya:</span>
                                <span className="text-rose-700 font-black">
                                  Rp {asset.progresBalikNama.reduce((sum, p) => sum + (p.biaya || 0), 0).toLocaleString('id-ID')}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Edit Form Sub-section */}
                  {isEditing && (
                    <div className="border-t-2 border-dotted border-slate-200 pt-4.5 space-y-3.5">
                      <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-1">
                        <span>✏️ Sunting Progres Administrasi</span>
                      </h4>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-600">Nama Pemilik Baru / Target Balik Nama</label>
                          <input 
                            type="text" 
                            value={draftNamaBaru}
                            onChange={(e) => setDraftNamaBaru(e.target.value)}
                            placeholder="Masukkan nama pemilik baru"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:bg-white h-10 font-bold text-slate-800"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-600">Tanggal Mulai Proses</label>
                            <input 
                              type="date" 
                              value={draftTanggal}
                              onChange={(e) => setDraftTanggal(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:bg-white h-10 font-mono"
                            />
                          </div>
                          <div className="space-y-1 flex flex-col justify-end">
                            <button
                              type="button"
                              onClick={() => setDraftNamaBaru('YAYASAN PONDOK PESANTREN MUTTAQIN JOSENAN MADIUN')}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-black py-2.5 rounded-lg border border-slate-200 h-10 transition-colors cursor-pointer"
                            >
                              Set PP Muttaqin
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-600">Catatan Info Utama</label>
                          <textarea 
                            rows={2}
                            value={draftCatatan}
                            onChange={(e) => setDraftCatatan(e.target.value)}
                            placeholder="Contoh: Proses pengajuan ke BPN Kabupaten."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:bg-white leading-relaxed font-sans"
                          />
                        </div>

                        {/* Add Progress and Cost Detail */}
                        <div className="space-y-2 border-t border-slate-100 pt-3">
                          <label className="text-[10px] font-black text-slate-600 flex justify-between">
                            <span>Detail Log Progres & Biaya Tambahan</span>
                          </label>
                          
                          {draftProgressList.length > 0 && (
                            <div className="space-y-1 mb-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                              {draftProgressList.map((prog) => (
                                <div key={prog.id} className="flex items-center justify-between gap-2 bg-white px-2 py-1.5 rounded border border-slate-100 text-[10px]">
                                  <div className="flex-1 min-w-0 flex flex-col">
                                    <span className="font-mono text-slate-500 font-bold text-[9px]">{new Date(prog.tanggal).toLocaleDateString('id-ID')}</span>
                                    <span className="truncate text-slate-800 font-medium">{prog.keterangan}</span>
                                  </div>
                                  {prog.biaya > 0 && (
                                    <span className="shrink-0 text-slate-600 font-mono font-bold">
                                      Rp {prog.biaya.toLocaleString('id-ID')}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProgress(prog.id)}
                                    className="p-1 hover:bg-rose-50 text-rose-500 rounded text-xs cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <input 
                                type="date" 
                                value={draftProgressTanggal}
                                onChange={(e) => setDraftProgressTanggal(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded p-2 text-xs focus:outline-none h-8 font-mono"
                              />
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">Rp</span>
                                <input 
                                  type="number" 
                                  step="any"
                                  min="0"
                                  placeholder="Biaya (Opsional)"
                                  value={draftProgressBiaya}
                                  onChange={(e) => setDraftProgressBiaya(e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded p-2 pl-7 text-xs focus:outline-none h-8 font-mono"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <input 
                                type="text"
                                placeholder="Keterangan progres (Cth: Bayar Notaris)"
                                value={draftProgressKeterangan}
                                onChange={(e) => setDraftProgressKeterangan(e.target.value)}
                                className="flex-1 bg-white border border-slate-200 rounded p-2 text-xs focus:outline-none h-8 font-sans"
                              />
                              <button 
                                type="button" 
                                onClick={handleAddProgress}
                                disabled={!draftProgressKeterangan || !draftProgressTanggal}
                                className="px-3 shrink-0 bg-sky-100 hover:bg-sky-200 text-sky-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-[10px] font-black flex items-center gap-1 cursor-pointer"
                              >
                                <PlusCircle className="w-3.5 h-3.5" /> Tambah
                              </button>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Submit Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveDraft(asset)}
                          className="flex-1 py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-black transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Simpan
                        </button>
                        <button
                          onClick={() => setEditingCardId(null)}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Bottom Row Actions & Confirmation states */}
                  {!isEditing && (
                    <div className="border-t border-slate-100 pt-3">
                      {confirmingCompleteId === asset.id ? (
                        <div className="bg-sky-50 border border-sky-100 rounded-xl p-3.5 space-y-3">
                          <p className="text-[10px] font-black text-sky-900 leading-relaxed uppercase tracking-wider">
                            ⚠️ Selesaikan Balik Nama? Nama pemilik aset secara resmi akan diubah menjadi <strong className="underline text-sky-950 font-black">"YAYASAN PONDOK PESANTREN MUTTAQIN JOSENAN MADIUN"</strong>.
                          </p>

                          {/* Dynamic Certificate No input field */}
                          <div className="space-y-1 bg-white p-2.5 rounded-lg border border-sky-100">
                            <label className="block text-[9px] font-black text-slate-700 uppercase tracking-wider">
                              {asset.type === 'tanah' && 'Nomor Sertifikat Baru (Wajib Diisi)'}
                              {asset.type === 'kendaraan' && 'Nomor Polisi / Dokumen Baru (Wajib Diisi)'}
                              {asset.type === 'bangunan' && 'Nomor PBG / SLF Baru (Wajib Diisi)'}
                            </label>
                            <input
                              type="text"
                              value={newSertifikatNo}
                              onChange={(e) => setNewSertifikatNo(e.target.value)}
                              placeholder={
                                asset.type === 'tanah' ? "Contoh: Madiun/10.05/2026" :
                                asset.type === 'kendaraan' ? "Contoh: AE 1234 AP" :
                                "Contoh: PBG-357701-..."
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-sky-600 font-bold font-mono text-slate-800"
                            />
                            {!newSertifikatNo.trim() && (
                              <p className="text-[9px] text-rose-500 font-extrabold uppercase tracking-wide mt-1">
                                ● Harap masukkan nomor sertifikat / dokumen baru untuk disimpan otomatis!
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button
                              disabled={!newSertifikatNo.trim()}
                              onClick={() => handleCompleteProcess(asset, newSertifikatNo)}
                              className="flex-1 py-1.5 bg-sky-700 hover:bg-sky-800 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-lg text-[10px] font-black transition-colors cursor-pointer text-center uppercase tracking-wide"
                            >
                              Ya, Ubah & Selesaikan
                            </button>
                            <button
                              onClick={() => {
                                setConfirmingCompleteId(null);
                                setNewSertifikatNo('');
                              }}
                              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer text-center uppercase tracking-wide"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : confirmingCancelId === asset.id ? (
                        <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 space-y-2.5">
                          <p className="text-[10px] font-black text-rose-900 leading-relaxed">
                            ⚠️ Apakah Anda yakin ingin membatalkan proses balik nama untuk aset ini? Data akan ditarik dari antrean balik nama.
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCancelProcess(asset)}
                              className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black transition-colors cursor-pointer"
                            >
                              Ya, Batalkan
                            </button>
                            <button
                              onClick={() => setConfirmingCancelId(null)}
                              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              Kembali
                            </button>
                          </div>
                        </div>
                      ) : userRole === 'admin' ? (
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => startEditCard(asset)}
                              className="px-3 py-1.5 text-[10px] font-black hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <FileEdit className="w-3 h-3 text-slate-500" /> Progres
                            </button>
                            <button
                              onClick={() => {
                                setConfirmingCancelId(asset.id);
                                setConfirmingCompleteId(null);
                              }}
                              className="px-3 py-1.5 text-[10px] font-black hover:bg-rose-50 border border-slate-200 hover:border-rose-100 rounded-lg text-rose-600 flex items-center gap-1 cursor-pointer transition-colors"
                              title="Hapus dari antrean balik nama"
                            >
                              <Trash2 className="w-3 h-3 text-rose-500" /> Batalkan
                            </button>
                          </div>

                          <button
                            onClick={() => {
                              setConfirmingCompleteId(asset.id);
                              setConfirmingCancelId(null);
                              // Auto-populate with current certificate / license plate / PBG number
                              const initialNo = (asset.type === 'tanah' ? asset.nomerSertifikat : asset.type === 'kendaraan' ? asset.nomorPolisi : (asset.nomerPBG || asset.nomerSLF || '')) || '';
                              setNewSertifikatNo(initialNo);
                            }}
                            className="px-3 py-1.5 text-[10px] font-black bg-sky-600 hover:bg-sky-700 text-white rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-xs active:scale-95 duration-100"
                          >
                            <UserCheck className="w-3 h-3" /> Selesai BN
                          </button>
                        </div>
                      ) : (
                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-center text-[10px] text-slate-500 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-700">
                          🔒 Mode Tamu: Memantau Log Mutasi (Khusus Admin untuk Mengubah)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Helpful Guide / Info */}
      <div className="bg-slate-100 p-4.5 rounded-2xl border border-slate-200 space-y-2.5 text-slate-600 font-medium">
        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" /> Alur Balik Nama Sabilillah
        </h4>
        <ol className="list-decimal pl-4 text-[10px] text-slate-500 space-y-1.5 leading-relaxed">
          <li>Admin memilih aset yang akan dibalik nama pada menu pencarian di atas.</li>
          <li>Aset dimasukkan ke antrean proses sertifikasi dan dicatat tanggal mulainya.</li>
          <li>Tim administrasi memperbarui progres rekam catatan secara manual.</li>
          <li>Setelah BPN / Dinas mengeluarkan akta kepemilikan baru, admin menekan tombol <strong className="text-slate-700">"Selesai BN"</strong> untuk melakukan pembaruan status final kepemilikan aset secara otomatis di sistem.</li>
        </ol>
      </div>
    </div>
  );
}
