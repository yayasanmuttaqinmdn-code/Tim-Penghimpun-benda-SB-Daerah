import React, { useState, useMemo } from 'react';
import { 
  FolderOpen, 
  Search, 
  Calendar, 
  User, 
  FileCheck, 
  History, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  PhoneCall, 
  Briefcase,
  PlusCircle,
  Undo2,
  Bookmark,
  Building2,
  Car,
  MapPin,
  FileSpreadsheet
} from 'lucide-react';
import { Asset, PeminjamanBerkas } from '../types';
import CameraCapture from './CameraCapture';
import MenuHeroBanner from './MenuHeroBanner';

interface PinjamBerkasPanelProps {
  assets: Asset[];
  userRole?: 'admin' | 'viewer';
  onSaveAsset: (updatedAsset: Asset) => Promise<void>;
  googleUser?: any;
}

type SubTab = 'active' | 'new-loan' | 'history';

export default function PinjamBerkasPanel({ assets, userRole = 'viewer', onSaveAsset, googleUser }: PinjamBerkasPanelProps) {
  const [activeTab, setActiveTab] = useState<SubTab>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'tanah' | 'kendaraan' | 'bangunan'>('tanah');
  
  // Selection state for borrowing an asset document
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [isSubmitPending, setIsSubmitPending] = useState(false);

  // Form Fields for Loan
  const [peminjamName, setPeminjamName] = useState('');
  const [peminjamJabatan, setPeminjamJabatan] = useState('');
  const [peminjamKontak, setPeminjamKontak] = useState('');
  const [tanggalPinjam, setTanggalPinjam] = useState(new Date().toISOString().split('T')[0]);
  const [keperluan, setKeperluan] = useState('');
  const [tanggalKembaliRencana, setTanggalKembaliRencana] = useState('');
  const [namaPetugas, setNamaPetugas] = useState('');
  const [fotoPinjam, setFotoPinjam] = useState<string | undefined>(undefined);

  // Return state variables
  const [returningAssetId, setReturningAssetId] = useState<string | null>(null);
  const [tanggalKembaliRiil, setTanggalKembaliRiil] = useState(new Date().toISOString().split('T')[0]);
  const [namaPetugasPenerima, setNamaPetugasPenerima] = useState('');
  const [fotoKembali, setFotoKembali] = useState<string | undefined>(undefined);

  // Basic stats
  const stats = useMemo(() => {
    let dipinjam = 0;
    let tersedia = 0;
    let terlambat = 0;
    const todayStr = new Date().toISOString().split('T')[0];

    assets.forEach(a => {
      if (a.sedangDipinjam) {
        dipinjam++;
        if (a.peminjamanAktif?.tanggalKembaliRencana && a.peminjamanAktif.tanggalKembaliRencana < todayStr) {
          terlambat++;
        }
      } else {
        tersedia++;
      }
    });

    return { dipinjam, tersedia, terlambat };
  }, [assets]);

  // Combined Active & History records
  const activeLoans = useMemo(() => {
    return assets.filter(a => a.sedangDipinjam && a.peminjamanAktif);
  }, [assets]);

  const loanHistory = useMemo(() => {
    const list: { asset: Asset; loan: PeminjamanBerkas }[] = [];
    assets.forEach(a => {
      if (a.riwayatPeminjaman && a.riwayatPeminjaman.length > 0) {
        a.riwayatPeminjaman.forEach(loan => {
          list.push({ asset: a, loan });
        });
      }
    });
    // Sort history by return date DESC
    return list.sort((a, b) => {
      const dateA = a.loan.tanggalKembaliRiil || '';
      const dateB = b.loan.tanggalKembaliRiil || '';
      return dateB.localeCompare(dateA);
    });
  }, [assets]);

  // Filter available assets that can be borrowed
  const availableAssets = useMemo(() => {
    return assets.filter(a => !a.sedangDipinjam);
  }, [assets]);

  const filteredAvailableAssets = useMemo(() => {
    return availableAssets.filter(a => {
      const query = searchTerm.toLowerCase();
      const matchMainLabel = a.type === 'tanah'
        ? `${a.jenisSertifikat} No. ${a.nomerSertifikat} a.n ${a.atasNamaSertifikat}`.toLowerCase()
        : a.type === 'kendaraan'
          ? `${a.merk} (${a.nomorPolisi}) a.n ${a.atasNama}`.toLowerCase()
          : `${a.namaBangunan} (${a.lokasi})`.toLowerCase();

      const matchLokasi = (a.type === 'tanah' || a.type === 'bangunan') ? a.lokasi.toLowerCase() : '';
      const matchSimpan = a.type === 'tanah' ? (a.tempatSimpanBerkas || '').toLowerCase() : '';

      return matchMainLabel.includes(query) || matchLokasi.includes(query) || matchSimpan.includes(query);
    });
  }, [availableAssets, searchTerm]);

  const availableTanah = useMemo(() => {
    return filteredAvailableAssets.filter(a => a.type === 'tanah');
  }, [filteredAvailableAssets]);

  const availableKendaraan = useMemo(() => {
    return filteredAvailableAssets.filter(a => a.type === 'kendaraan');
  }, [filteredAvailableAssets]);

  const availableBangunan = useMemo(() => {
    return filteredAvailableAssets.filter(a => a.type === 'bangunan');
  }, [filteredAvailableAssets]);

  const filteredActiveLoans = useMemo(() => {
    return activeLoans.filter(a => {
      const query = searchTerm.toLowerCase();
      const p = a.peminjamanAktif!;
      const matchBorrower = `${p.peminjamName} ${p.peminjamJabatan} ${p.keperluan}`.toLowerCase();
      const matchAsset = a.type === 'tanah'
        ? `${a.jenisSertifikat} No. ${a.nomerSertifikat}`.toLowerCase()
        : a.type === 'kendaraan'
          ? `${a.merk} (${a.nomorPolisi})`.toLowerCase()
          : `${a.namaBangunan}`.toLowerCase();

      return matchBorrower.includes(query) || matchAsset.includes(query);
    });
  }, [activeLoans, searchTerm]);

  const filteredHistory = useMemo(() => {
    return loanHistory.filter(item => {
      const query = searchTerm.toLowerCase();
      const p = item.loan;
      const matchBorrower = `${p.peminjamName} ${p.peminjamJabatan} ${p.keperluan}`.toLowerCase();
      const matchAsset = item.asset.type === 'tanah'
        ? `${item.asset.jenisSertifikat} No. ${item.asset.nomerSertifikat}`.toLowerCase()
        : item.asset.type === 'kendaraan'
          ? `${item.asset.merk} (${item.asset.nomorPolisi})`.toLowerCase()
          : `${item.asset.namaBangunan}`.toLowerCase();

      return matchBorrower.includes(query) || matchAsset.includes(query);
    });
  }, [loanHistory, searchTerm]);

  // Get specific Asset label helper
  const getAssetLabel = (asset: Asset) => {
    if (asset.type === 'tanah') {
      return `Sertifikat Tanah: ${asset.jenisSertifikat} No. ${asset.nomerSertifikat} (${asset.lokasi})`;
    } else if (asset.type === 'kendaraan') {
      return `Dokumen BPKB/STNK: ${asset.merk} (${asset.nomorPolisi})`;
    } else {
      return `Dokumen PBG/SLF Bangunan: ${asset.namaBangunan} (${asset.lokasi})`;
    }
  };

  const resetForm = () => {
    setPeminjamName('');
    setPeminjamJabatan('');
    setPeminjamKontak('');
    setTanggalPinjam(new Date().toISOString().split('T')[0]);
    setKeperluan('');
    setTanggalKembaliRencana('');
    setNamaPetugas('');
    setFotoPinjam(undefined);
    setSelectedAssetId(null);
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId) return;

    const assetToLoan = assets.find(a => a.id === selectedAssetId);
    if (!assetToLoan) return;

    setIsSubmitPending(true);

    const loanPayload: PeminjamanBerkas = {
      peminjamName: peminjamName.trim(),
      peminjamJabatan: peminjamJabatan.trim(),
      peminjamKontak: peminjamKontak.trim(),
      tanggalPinjam,
      keperluan: keperluan.trim(),
      tanggalKembaliRencana: tanggalKembaliRencana || undefined,
      status: 'DIPINJAM',
      namaPetugas: namaPetugas.trim(),
      fotoPinjam: fotoPinjam
    };

    const updatedAsset: Asset = {
      ...assetToLoan,
      sedangDipinjam: true,
      peminjamanAktif: loanPayload
    };

    try {
      await onSaveAsset(updatedAsset);
      resetForm();
      setActiveTab('active');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitPending(false);
    }
  };

  const handleReturnLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningAssetId) return;

    const assetToReturn = assets.find(a => a.id === returningAssetId);
    if (!assetToReturn || !assetToReturn.peminjamanAktif) return;

    setIsSubmitPending(true);

    const active = assetToReturn.peminjamanAktif;
    const historyItem: PeminjamanBerkas = {
      ...active,
      tanggalKembaliRiil,
      status: 'DIKEMBALIKAN',
      namaPetugas: namaPetugasPenerima.trim() || active.namaPetugas, // fallback to initial officer if empty
      fotoKembali: fotoKembali
    };

    const priorHistory = assetToReturn.riwayatPeminjaman || [];
    const updatedAsset: Asset = {
      ...assetToReturn,
      sedangDipinjam: false,
      peminjamanAktif: undefined, // remove active loan
      riwayatPeminjaman: [...priorHistory, historyItem]
    };

    try {
      await onSaveAsset(updatedAsset);
      setReturningAssetId(null);
      setNamaPetugasPenerima('');
      setFotoKembali(undefined);
      setActiveTab('history');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitPending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <MenuHeroBanner
        title="LAYANAN PINJAM BERKAS & SERTIFIKAT"
        subtitle="Sistem Tertib Administrasi Peminjaman Surat, BPKB, & Sertifikat Yayasan."
        badgeText="TIM PENGHIMPUN BENDA SABILILLAH"
        rightElement={
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black px-2.5 sm:px-3 py-1 rounded-xl">
              📂 {stats.dipinjam} Dipinjam
            </span>
            <span className="bg-sky-700/40 text-sky-200 border border-sky-600/30 text-xs font-bold px-2.5 sm:px-3 py-1 rounded-xl">
              ✅ {stats.tersedia} Tersedia
            </span>
            {stats.terlambat > 0 && (
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-black px-2.5 sm:px-3 py-1 rounded-xl">
                ⚠️ {stats.terlambat} Telat
              </span>
            )}
          </div>
        }
      />

      {/* Sub-tabs Nav Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tab Buttons */}
        <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-xl border border-slate-200/60 font-sans gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('active');
              setSearchTerm('');
            }}
            className={`px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'active'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/55'
            }`}
          >
            <Clock className="w-4 h-4" /> Berkas Aktif ({activeLoans.length})
          </button>
          
          <button
            type="button"
            onClick={() => {
              if (userRole === 'viewer') {
                alert('Mode Tamu hanya memiliki hak akses untuk melihat sirkulasi berkas. Peminjaman berkas fisik baru khusus diproses oleh Admin.');
                return;
              }
              setActiveTab('new-loan');
              setSearchTerm('');
            }}
            className={`px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'new-loan'
                ? 'bg-sky-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/55'
            }`}
          >
            <PlusCircle className="w-4 h-4" /> Pinjam Berkas Baru
            {userRole === 'viewer' && (
              <span className="text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded font-bold">
                🔒 Admin
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('history');
              setSearchTerm('');
            }}
            className={`px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/55'
            }`}
          >
            <History className="w-4 h-4" /> Riwayat Kembali ({loanHistory.length})
          </button>
        </div>

        {/* Unified Search Input */}
        <div className="relative w-full sm:max-w-xs pr-1 font-sans">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeTab === 'active' 
                ? "Cari peminjam / nama berkas aktif..." 
                : activeTab === 'new-loan' 
                  ? "Cari berkas tersedia..." 
                  : "Cari arsip riwayat..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-6">
        {/* ACTIVE LOANS TAB ('active') */}
        {activeTab === 'active' && (
          <div className="space-y-4 font-sans">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2.5 bg-amber-400 text-slate-900 rounded-lg text-xs font-black">ACTIVE</span>
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                Daftar Peminjaman Berkas yang masih Aktif ({filteredActiveLoans.length})
              </h2>
            </div>

            {filteredActiveLoans.length === 0 ? (
              <div className="bg-white border text-center py-16 rounded-2xl border-slate-200">
                <span className="text-4xl">📁</span>
                <h3 className="text-xs font-black text-slate-750 mt-2">Tidak ada berkas yang sedang dipinjam</h3>
                <p className="text-[10px] text-slate-400">Semua surat-surat berada lengkap di lemari simpan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredActiveLoans.map((asset) => {
                  const loan = asset.peminjamanAktif!;
                  const isOverdue = loan.tanggalKembaliRencana && loan.tanggalKembaliRencana < new Date().toISOString().split('T')[0];

                  return (
                    <div 
                      key={asset.id} 
                      className={`bg-white border-2 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between transition-all ${
                        isOverdue ? 'border-rose-200 bg-rose-50/5' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Card Header */}
                      <div className="p-4 border-b border-slate-100 flex items-start gap-4">
                        <div className={`p-2.5 rounded-xl ${
                          asset.type === 'tanah' ? 'bg-sky-50 text-sky-800' :
                          asset.type === 'kendaraan' ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-850'
                        }`}>
                          {asset.type === 'tanah' && <FileSpreadsheet className="w-5 h-5" />}
                          {asset.type === 'kendaraan' && <Car className="w-5 h-5" />}
                          {asset.type === 'bangunan' && <Building2 className="w-5 h-5" />}
                        </div>
                        <div className="leading-snug">
                          <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">
                            Berkas {asset.type === 'tanah' ? 'Tanah & Sertifikat' : asset.type === 'kendaraan' ? 'Kendaraan BPKB/STNK' : 'Dokumen PBG/SLF'}
                          </span>
                          <h4 className="text-xs font-black text-slate-800 mt-0.5 leading-snug">
                            {getAssetLabel(asset)}
                          </h4>
                        </div>
                      </div>

                      {/* Card Borrower Detail */}
                      <div className="p-4 bg-slate-50/50 border-b border-slate-100 space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5">
                            <User className="w-4 h-4 text-slate-500" />
                            <span className="text-xs font-extrabold text-slate-900">{loan.peminjamName}</span>
                          </div>
                          <span className="text-[10px] bg-slate-200/50 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
                            {loan.peminjamJabatan}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
                            <span>{loan.peminjamKontak}</span>
                          </div>
                          <div className="flex items-center gap-1.5 justify-end">
                            <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                            <span>Petugas: <strong className="font-extrabold text-slate-850">{loan.namaPetugas}</strong></span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-150 space-y-1 text-[11px] text-slate-600">
                          <div className="flex items-start gap-1.5">
                            <Bookmark className="w-3.5 h-3.5 text-slate-405 mt-0.5" />
                            <p className="leading-normal italic">"{loan.keperluan}"</p>
                          </div>
                        </div>

                        {loan.fotoPinjam && (
                          <div className="pt-2 border-t border-slate-150 space-y-1">
                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block">
                              📸 Bukti Foto Peminjaman:
                            </span>
                            <div className="w-24 h-16 bg-slate-900 rounded-lg overflow-hidden border border-slate-300 relative shadow-inner">
                              <img 
                                src={loan.fotoPinjam} 
                                alt="Foto Bukti Peminjaman" 
                                className="w-full h-full object-cover cursor-pointer hover:opacity-85 transition-opacity" 
                                onClick={() => {
                                  const w = window.open();
                                  if (w) {
                                    w.document.write(`<html><body style="margin:0;background:#0f172a;display:flex;align-items:center;justify-content:center;height:100vh;"><img src="${loan.fotoPinjam}" style="max-width:100%;max-height:100%;margin:auto;display:block;" /></body></html>`);
                                  }
                                }}
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          </div>
                        )}

                        {/* Dates Row */}
                        <div className="pt-2 border-t border-slate-150 grid grid-cols-2 gap-2 text-[10px] font-mono leading-none">
                          <div>
                            <span className="text-[8px] text-slate-400 block pb-1 font-bold uppercase tracking-wider">Tgl Ambil:</span>
                            <strong className="text-slate-700 font-extrabold">📅 {loan.tanggalPinjam}</strong>
                          </div>
                          {loan.tanggalKembaliRencana && (
                            <div className="text-right">
                              <span className="text-[8px] text-slate-400 block pb-1 font-bold uppercase tracking-wider">Jatuh Tempo:</span>
                              <strong className={isOverdue ? 'text-rose-600 font-black animate-pulse' : 'text-slate-700 font-extrabold'}>
                                ⌛ {loan.tanggalKembaliRencana} {isOverdue && '(Terlambat!)'}
                              </strong>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Return Actions inside active cards */}
                      <div className="p-3 bg-white flex justify-end font-sans">
                        {returningAssetId === asset.id ? (
                          <form onSubmit={handleReturnLoanSubmit} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider block">
                              Konfirmasi Penerimaan Kembali:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="block text-[8px] font-extrabold text-slate-600 uppercase tracking-widest">
                                  Tgl Terima Fisik Berkas:
                                </label>
                                <input
                                  type="date"
                                  required
                                  value={tanggalKembaliRiil}
                                  onChange={(e) => setTanggalKembaliRiil(e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:text-slate-800"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[8px] font-extrabold text-slate-600 uppercase tracking-widest">
                                  Petugas Penerima:
                                </label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Nama Anda"
                                  value={namaPetugasPenerima}
                                  onChange={(e) => setNamaPetugasPenerima(e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:text-slate-800 placeholder:text-slate-400"
                                />
                              </div>
                            </div>
                            
                            <div className="pt-2 border-t border-slate-200">
                              <CameraCapture
                                label="Ambil Foto Bukti Pengembalian Berkas"
                                photoDataUrl={fotoKembali}
                                onPhotoCaptured={setFotoKembali}
                              />
                              {!fotoKembali && (
                                <p className="text-[9px] text-amber-600 bg-amber-50 rounded-lg p-1.5 font-bold text-center border border-amber-200/40 mt-1">
                                  ⚠ Persyaratan: Harap ambil foto bukti pengembalian dari kamera untuk mengkonfirmasi penerimaan berkas.
                                </p>
                              )}
                            </div>

                            <div className="flex gap-2 text-xs">
                              <button
                                type="submit"
                                disabled={isSubmitPending || !fotoKembali}
                                className="flex-1 bg-sky-700 hover:bg-sky-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-extrabold uppercase text-[10px] py-1.5 rounded-lg cursor-pointer text-center"
                              >
                                {isSubmitPending ? 'Menyimpan...' : '✔ Berkas Sudah Kembali'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setReturningAssetId(null)}
                                className="px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold uppercase text-[9px] rounded-lg cursor-pointer"
                              >
                                Batal
                              </button>
                            </div>
                          </form>
                        ) : userRole === 'admin' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setReturningAssetId(asset.id);
                              setTanggalKembaliRiil(new Date().toISOString().split('T')[0]);
                            }}
                            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-extrabold uppercase text-[10px] tracking-wide rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Kembalikan Berkas
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            🔒 Sedang Dipinjam
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* NEW LOAN FORM TAB ('new-loan') */}
        {activeTab === 'new-loan' && (
          <div className="space-y-4 font-sans">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2.5 bg-sky-700 text-white rounded-lg text-xs font-black">FORMULIR</span>
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                Pendaftaran & Pengeluaran Berkas Baru
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Box: Asset Selector */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3.5 shadow-sm">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FolderOpen className="w-4 h-4 text-sky-700" />
                    Langkah A: Pilih Berkas yang Tersedia
                  </h3>

                  {/* Categories filtering bar */}
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 lg:max-w-none">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('tanah')}
                      className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wide transition-all cursor-pointer text-center ${
                        selectedCategory === 'tanah'
                          ? 'bg-sky-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-sky-850 hover:bg-slate-200/50'
                      }`}
                    >
                      Tanah ({availableTanah.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('kendaraan')}
                      className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wide transition-all cursor-pointer text-center ${
                        selectedCategory === 'kendaraan'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-amber-700 hover:bg-slate-200/50'
                      }`}
                    >
                      Kendaraan ({availableKendaraan.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('bangunan')}
                      className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wide transition-all cursor-pointer text-center ${
                        selectedCategory === 'bangunan'
                          ? 'bg-slate-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
                      }`}
                    >
                      Bangunan ({availableBangunan.length})
                    </button>
                  </div>

                  {/* List items scrollbox */}
                  <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                    {filteredAvailableAssets.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic py-8 text-center bg-slate-50/50 rounded-xl">
                        Tidak ada berkas tersedia yang cocok dengan pencarian.
                      </p>
                    ) : (
                      <>
                        {/* Section 1: Tanah */}
                        {(selectedCategory === 'all' || selectedCategory === 'tanah') && (
                          <div className="space-y-2 font-sans">
                            <div className="sticky top-0 bg-white/95 backdrop-blur-xs py-1 flex items-center justify-between border-b border-slate-100 z-10">
                              <span className="text-[9px] font-black text-sky-850 uppercase tracking-wider flex items-center gap-1">
                                📜 Berkas Tanah ({availableTanah.length})
                              </span>
                            </div>
                            {availableTanah.length === 0 ? (
                              <p className="text-[10px] text-slate-400 italic pl-2 py-1">Tidak ada berkas tanah yang tersedia</p>
                            ) : (
                              availableTanah.map((asset) => {
                                const isSelected = selectedAssetId === asset.id;
                                return (
                                  <button
                                    key={asset.id}
                                    type="button"
                                    onClick={() => setSelectedAssetId(asset.id)}
                                    className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-start gap-2.5 cursor-pointer ${
                                      isSelected 
                                        ? 'border-sky-700 bg-sky-50/40 text-slate-900 shadow-xs' 
                                        : 'border-slate-100 bg-slate-50/30 hover:bg-slate-50'
                                    }`}
                                  >
                                    <span className="mt-0.5">📜</span>
                                    <div className="leading-snug">
                                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">ID: {asset.id}</span>
                                      <h4 className="text-xs font-bold text-slate-800 line-clamp-2">
                                        {getAssetLabel(asset)}
                                      </h4>
                                      {asset.type === 'tanah' && (
                                        <div className="mt-1 bg-sky-100/50 border border-sky-200/45 text-sky-900 font-extrabold text-[9px] px-2 py-0.5 rounded inline-block uppercase tracking-wider">
                                          👤 a.n: {asset.atasNamaSertifikat}
                                        </div>
                                      )}
                                      <p className="text-[10px] text-slate-500 font-mono mt-1">Lokasi Simpan: {asset.tempatSimpanBerkas || '-'}</p>
                                    </div>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        )}

                        {/* Section 2: Kendaraan */}
                        {(selectedCategory === 'all' || selectedCategory === 'kendaraan') && (
                          <div className="space-y-2 pt-2">
                            <div className="sticky top-0 bg-white/95 backdrop-blur-xs py-1 flex items-center justify-between border-b border-slate-100 z-10">
                              <span className="text-[9px] font-black text-amber-805 uppercase tracking-wider flex items-center gap-1">
                                🚗 Surat / BPKB Kendaraan ({availableKendaraan.length})
                              </span>
                            </div>
                            {availableKendaraan.length === 0 ? (
                              <p className="text-[10px] text-slate-400 italic pl-2 py-1">Tidak ada berkas kendaraan yang tersedia</p>
                            ) : (
                              availableKendaraan.map((asset) => {
                                const isSelected = selectedAssetId === asset.id;
                                return (
                                  <button
                                    key={asset.id}
                                    type="button"
                                    onClick={() => setSelectedAssetId(asset.id)}
                                    className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-start gap-2.5 cursor-pointer ${
                                      isSelected 
                                        ? 'border-amber-500 bg-amber-50/40 text-slate-900 shadow-xs' 
                                        : 'border-slate-100 bg-slate-50/30 hover:bg-slate-50'
                                    }`}
                                  >
                                    <span className="mt-0.5">🚗</span>
                                    <div className="leading-snug">
                                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">ID: {asset.id}</span>
                                      <h4 className="text-xs font-bold text-slate-800 line-clamp-2">
                                        {getAssetLabel(asset)}
                                      </h4>
                                      <p className="text-[10px] text-slate-500 font-mono mt-1">Pemegang STNK BPKB: {asset.atasNama || '-'}</p>
                                    </div>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        )}

                        {/* Section 3: Bangunan */}
                        {(selectedCategory === 'all' || selectedCategory === 'bangunan') && (
                          <div className="space-y-2 pt-2">
                            <div className="sticky top-0 bg-white/95 backdrop-blur-xs py-1 flex items-center justify-between border-b border-slate-100 z-10">
                              <span className="text-[9px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                                🏢 Dokumen Gedung / Bangunan ({availableBangunan.length})
                              </span>
                            </div>
                            {availableBangunan.length === 0 ? (
                              <p className="text-[10px] text-slate-400 italic pl-2 py-1">Tidak ada berkas bangunan yang tersedia</p>
                            ) : (
                              availableBangunan.map((asset) => {
                                const isSelected = selectedAssetId === asset.id;
                                return (
                                  <button
                                    key={asset.id}
                                    type="button"
                                    onClick={() => setSelectedAssetId(asset.id)}
                                    className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-start gap-2.5 cursor-pointer ${
                                      isSelected 
                                        ? 'border-slate-700 bg-slate-100 text-slate-900 shadow-xs' 
                                        : 'border-slate-100 bg-slate-50/30 hover:bg-slate-50'
                                    }`}
                                  >
                                    <span className="mt-0.5">🏢</span>
                                    <div className="leading-snug">
                                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">ID: {asset.id}</span>
                                      <h4 className="text-xs font-bold text-slate-800 line-clamp-2">
                                        {getAssetLabel(asset)}
                                      </h4>
                                      <p className="text-[10px] text-slate-400 font-bold">Lokasi Gedung: {asset.lokasi}</p>
                                    </div>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Box: The Form - ALWAYS rendered and visible */}
              <div className="lg:col-span-7">
                <form onSubmit={handleCreateLoan} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="pb-3 border-b border-slate-100 flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest flex items-center gap-1.5">
                        <PlusCircle className="w-4 h-4 text-sky-700" />
                        Langkah B: Formulir Peminjaman Resmi
                      </h3>
                      {selectedAssetId && (
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                          Aset terpilih: <span className="text-slate-800 font-black">{selectedAssetId}</span>
                        </p>
                      )}
                    </div>
                    {selectedAssetId && (
                      <button
                        type="button"
                        onClick={() => setSelectedAssetId(null)}
                        className="text-xs font-black tracking-wide text-rose-600 hover:underline cursor-pointer flex items-center gap-0.5 whitespace-nowrap"
                      >
                        <Undo2 className="w-3.5 h-3.5" /> Ganti Berkas
                      </button>
                    )}
                  </div>

                  {/* Status bar alert */}
                  {!selectedAssetId ? (
                    <div className="bg-amber-100/50 border-2 border-amber-300/40 p-4 rounded-xl flex items-start gap-3 mt-1">
                      <AlertCircle className="w-4.5 h-4.5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] uppercase font-extrabold block tracking-wider text-amber-850 font-sans">Lengkapi Pemilihan:</span>
                        <p className="text-[10px] font-semibold text-slate-600 mt-0.5 font-sans">
                          Silakan klik dan pilih salah satu berkas yang tersedia di panel sebelah kiri untuk mengaktifkan kolom input data peminjaman di formulir ini.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-sky-100/50 border-2 border-sky-300/40 p-4 rounded-xl flex items-start gap-3">
                      <CheckCircle2 className="w-4.5 h-4.5 text-sky-700 flex-shrink-0 mt-0.5" />
                      <div className="leading-snug">
                        <span className="text-[10px] uppercase font-extrabold block text-sky-900 tracking-wider">Berkas Terbuka Siap Dialokasikan:</span>
                        <p className="text-xs font-extrabold text-slate-800 mt-1">
                          {getAssetLabel(assets.find(a => a.id === selectedAssetId)!)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Grid Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider">
                        Nama Lengkap Peminjam <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        disabled={!selectedAssetId}
                        placeholder="Contoh: Budi Santoso"
                        value={peminjamName}
                        onChange={(e) => setPeminjamName(e.target.value)}
                        className="w-full bg-slate-50 disabled:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider">
                        Jabatan / Lembaga / Bagian <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        disabled={!selectedAssetId}
                        placeholder="Contoh: Pengurus Wakaf Madiun"
                        value={peminjamJabatan}
                        onChange={(e) => setPeminjamJabatan(e.target.value)}
                        className="w-full bg-slate-50 disabled:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider">
                        No. Kontak / HP Aktif <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        disabled={!selectedAssetId}
                        placeholder="Contoh: 0812-xxxx-xxxx"
                        value={peminjamKontak}
                        onChange={(e) => setPeminjamKontak(e.target.value)}
                        className="w-full bg-slate-50 disabled:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-205 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider">
                        Tanggal Pengeluaran / Pinjam <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        disabled={!selectedAssetId}
                        value={tanggalPinjam}
                        onChange={(e) => setTanggalPinjam(e.target.value)}
                        className="w-full bg-slate-50 disabled:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider">
                        Batas Rencana Pengembalian
                      </label>
                      <input
                        type="date"
                        disabled={!selectedAssetId}
                        value={tanggalKembaliRencana}
                        onChange={(e) => setTanggalKembaliRencana(e.target.value)}
                        className="w-full bg-slate-50 disabled:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider">
                        Petugas Penyerah Fisik Berkas <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        disabled={!selectedAssetId}
                        placeholder="Nama Anda / Pengurus"
                        value={namaPetugas}
                        onChange={(e) => setNamaPetugas(e.target.value)}
                        className="w-full bg-slate-50 disabled:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider">
                      Alasan & Tujuan Utama Peminjaman <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      disabled={!selectedAssetId}
                      rows={3}
                      placeholder="Tuliskan detail penggunaan berkas (misal: pengurusan pecah sertifikat, balik nama, atau verifikasi di notaris)..."
                      value={keperluan}
                      onChange={(e) => setKeperluan(e.target.value)}
                      className="w-full bg-slate-50 disabled:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-202 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                    />
                  </div>

                  {/* Live Camera Proof capture when asset is selected */}
                  {selectedAssetId && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <CameraCapture
                        label="Ambil Foto Bukti Peminjaman (Serah Terima Dokumen)"
                        photoDataUrl={fotoPinjam}
                        onPhotoCaptured={setFotoPinjam}
                      />
                      {!fotoPinjam && (
                        <p className="text-[10px] text-amber-600 bg-amber-50 rounded-lg p-2 font-bold text-center border border-amber-200/50">
                          ⚠ Persyaratan: Harap ambil foto bukti peminjaman langsung dari kamera untuk mengaktifkan tombol konfirmasi di bawah.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Submit button - ALWAYS visible */}
                  <button
                    type="submit"
                    disabled={isSubmitPending || !selectedAssetId || !fotoPinjam}
                    className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-600 disabled:text-white disabled:opacity-85 disabled:cursor-not-allowed text-white font-black uppercase text-xs tracking-wider rounded-xl shadow-md transition-all cursor-pointer text-center"
                  >
                    {isSubmitPending ? 'SEDANG MEMPROSES PEMINJAMAN...' : 'KONFIRMASI AMBIL DAN PINJAMKAN BERKAS'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* HISTORY LOANS TAB ('history') */}
        {activeTab === 'history' && (
          <div className="space-y-4 pb-10 font-sans">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2.5 bg-slate-700 text-white rounded-lg text-xs font-black">HISTORY</span>
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                Riwayat Lengkap Peminjaman Berkas ({filteredHistory.length})
              </h2>
            </div>

            <div className="space-y-4">
              {filteredHistory.length === 0 ? (
                <div className="bg-white border text-center py-16 rounded-2xl border-slate-200">
                  <span className="text-4xl text-slate-300">📜</span>
                  <p className="text-xs font-black text-slate-650 mt-2">Belum ada riwayat pengembalian dokumen tercatat</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                        <tr>
                          <th className="p-4">Nama Aset / Berkas</th>
                          <th className="p-4">Identitas Peminjam</th>
                          <th className="p-4">Masa Pinjam (Keluar - Kembali)</th>
                          <th className="p-4">Tujuan / Catatan</th>
                          <th className="p-4">Status & Petugas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {filteredHistory.map((item, index) => {
                          const p = item.loan;
                          return (
                            <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4 max-w-xs">
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  item.asset.type === 'tanah' ? 'bg-sky-50 text-sky-800' :
                                  item.asset.type === 'kendaraan' ? 'bg-amber-50 text-amber-800' :
                                  'bg-slate-50 text-slate-700'
                                }`}>
                                  {item.asset.type === 'tanah' ? 'Tanah' : item.asset.type === 'kendaraan' ? 'Kendaraan' : 'Bangunan'}
                                </span>
                                <p className="text-xs font-black text-slate-800 mt-1.5 leading-snug">
                                  {getAssetLabel(item.asset)}
                                </p>
                              </td>

                              <td className="p-4 leading-normal">
                                <p className="font-extrabold text-slate-900">{p.peminjamName}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{p.peminjamJabatan}</p>
                                <p className="text-[10px] text-slate-500 font-bold font-mono mt-0.5">{p.peminjamKontak}</p>
                              </td>

                              <td className="p-4 text-[11px] font-mono text-slate-600 leading-normal">
                                <p>📤 Keluar: <strong className="font-bold text-slate-800">{p.tanggalPinjam}</strong></p>
                                <p className="text-sky-700 mt-0.5">📥 Masuk: <strong className="font-black text-sky-850">{p.tanggalKembaliRiil}</strong></p>
                                {p.tanggalKembaliRencana && (
                                  <p className="text-[10px] text-slate-405 mt-1">Estimasi batas: {p.tanggalKembaliRencana}</p>
                                )}
                              </td>

                              <td className="p-4 max-w-xs">
                                <p className="text-[11px] text-slate-650 italic leading-normal line-clamp-3">
                                  "{p.keperluan}"
                                </p>
                                <div className="flex gap-2.5 mt-2">
                                  {p.fotoPinjam && (
                                    <div className="flex flex-col items-start">
                                      <span className="text-[7px] font-black text-slate-400 uppercase tracking-wider mb-1">📸 Bukti Pinjam</span>
                                      <div className="w-10 h-8 rounded-md overflow-hidden bg-slate-900 border border-slate-200 shadow-xs">
                                        <img 
                                          src={p.fotoPinjam} 
                                          alt="Bukti Pinjam" 
                                          className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity" 
                                          onClick={() => {
                                            const w = window.open();
                                            if (w) {
                                              w.document.write(`<html><body style="margin:0;background:#0f172a;display:flex;align-items:center;justify-content:center;height:100vh;"><img src="${p.fotoPinjam}" style="max-width:100%;max-height:100%;margin:auto;display:block;" /></body></html>`);
                                            }
                                          }}
                                          referrerPolicy="no-referrer"
                                        />
                                      </div>
                                    </div>
                                  )}
                                  {p.fotoKembali && (
                                    <div className="flex flex-col items-start">
                                      <span className="text-[7px] font-black text-slate-400 uppercase tracking-wider mb-1">📸 Bukti Kembali</span>
                                      <div className="w-10 h-8 rounded-md overflow-hidden bg-slate-900 border border-slate-200 shadow-xs">
                                        <img 
                                          src={p.fotoKembali} 
                                          alt="Bukti Kembali" 
                                          className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity" 
                                          onClick={() => {
                                            const w = window.open();
                                            if (w) {
                                              w.document.write(`<html><body style="margin:0;background:#0f172a;display:flex;align-items:center;justify-content:center;height:100vh;"><img src="${p.fotoKembali}" style="max-width:100%;max-height:100%;margin:auto;display:block;" /></body></html>`);
                                            }
                                          }}
                                          referrerPolicy="no-referrer"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>

                              <td className="p-4 font-sans leading-normal">
                                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-full">
                                  ✔ KEMBALI
                                </span>
                                <p className="text-[10px] text-slate-400 mt-1.5 font-bold">
                                  Petugas: <strong className="text-slate-800 font-bold">{p.namaPetugas}</strong>
                                </p>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
