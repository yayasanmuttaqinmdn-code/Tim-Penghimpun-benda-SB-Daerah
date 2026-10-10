import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Car, 
  Building, 
  Plus, 
  Save, 
  FileText, 
  ListRestart, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { 
  Asset, 
  AssetType, 
  SertifikatTanahType, 
  JenisKendaraanType, 
  KondisiType, 
  KECAMATAN_MADIUN,
  DAERAH_LIST
} from '../types';
import { DESA_KELURAHAN_MADIUN } from '../data';
import MenuHeroBanner from './MenuHeroBanner';

interface FormInputProps {
  onSaveAsset: (asset: Asset) => void;
  editingAsset?: Asset | null;
  onCancelEdit?: () => void;
  userRole?: 'admin' | 'viewer';
  onSwitchToAdmin?: () => void;
  assets?: Asset[];
}

export default function FormInput({ 
  onSaveAsset, 
  editingAsset, 
  onCancelEdit, 
  userRole = 'viewer', 
  onSwitchToAdmin,
  assets = [] 
}: FormInputProps) {
  const [activeType, setActiveType] = useState<AssetType>(() => userRole === 'viewer' ? 'kendaraan' : 'tanah');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // States for Land Asset
  const [jenisSertifikat, setJenisSertifikat] = useState<SertifikatTanahType>('SHM');
  const [nomerSertifikat, setNomerSertifikat] = useState('');
  const [atasNamaSertifikat, setAtasNamaSertifikat] = useState('');
  const [tanahLokasi, setTanahLokasi] = useState('');
  const [tanahKecamatan, setTanahKecamatan] = useState('');
  const [tanahDesa, setTanahDesa] = useState('');
  const [tanahPenggunaan, setTanahPenggunaan] = useState('');
  const [tempatSimpanBerkas, setTempatSimpanBerkas] = useState('');
  const [tanahKoordinat, setTanahKoordinat] = useState('');
  const [luasTanah, setLuasTanah] = useState<number | ''>('');

  // States for Vehicle Asset
  const [jenisKendaraan, setJenisKendaraan] = useState<JenisKendaraanType>('MOTOR');
  const [nomorPolisi, setNomorPolisi] = useState('');
  const [merk, setMerk] = useState('');
  const [atasNama, setAtasNama] = useState('');
  const [tahunPembuatan, setTahunPembuatan] = useState<number>(new Date().getFullYear());
  const [kondisiKendaraan, setKondisiKendaraan] = useState<KondisiType>('BAIK');
  const [pajakHari, setPajakHari] = useState('1');
  const [pajakBulan, setPajakBulan] = useState('Januari');
  const [penanggungJawabDaerah, setPenanggungJawabDaerah] = useState('');

  const HARI_LIST = Array.from({ length: 31 }, (_, i) => String(i + 1));
  const BULAN_LIST = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // States for Building Asset
  const [namaBangunan, setNamaBangunan] = useState('');
  const [bangunanLokasi, setBangunanLokasi] = useState('');
  const [bangunanKecamatan, setBangunanKecamatan] = useState('');
  const [bangunanDesa, setBangunanDesa] = useState('');
  const [luasBangunan, setLuasBangunan] = useState<number>(0);
  const [penggunaanBangunan, setPenggunaanBangunan] = useState('');
  const [bangunanKoordinat, setBangunanKoordinat] = useState('');
  const [nomerPBG, setNomerPBG] = useState('');
  const [nomerSLF, setNomerSLF] = useState('');
  const [kondisiBangunan, setKondisiBangunan] = useState<KondisiType>('BAIK');
  const [keteranganKerusakan, setKeteranganKerusakan] = useState('');

  // Ensure viewer role defaults to 'kendaraan'
  useEffect(() => {
    if (userRole === 'viewer' && !editingAsset) {
      setActiveType('kendaraan');
    }
  }, [userRole, editingAsset]);

  // Pre-populate if editing
  useEffect(() => {
    if (editingAsset) {
      setActiveType(editingAsset.type);
      if (editingAsset.type === 'tanah') {
        setJenisSertifikat(editingAsset.jenisSertifikat);
        setNomerSertifikat(editingAsset.nomerSertifikat);
        setAtasNamaSertifikat(editingAsset.atasNamaSertifikat);
        
        // Split subdistrict and village if possible
        const loc = editingAsset.lokasi;
        const matchingKec = KECAMATAN_MADIUN.find(k => loc.includes(k));
        let remainingLoc = loc;

        if (matchingKec) {
          setTanahKecamatan(matchingKec);
          remainingLoc = loc.replace(new RegExp(`\\s*Kec\\.\\s*${matchingKec}|\\s*${matchingKec}`, 'i'), '').replace(/(^,\s*)|(,\s*$)/g, '').trim();
        } else {
          setTanahKecamatan('');
        }

        const villages = matchingKec ? DESA_KELURAHAN_MADIUN[matchingKec] : [];
        const matchingVillage = villages?.find(v => remainingLoc.includes(v));
        
        if (matchingVillage) {
          setTanahDesa(matchingVillage);
          setTanahLokasi(remainingLoc.replace(new RegExp(`\\s*Ds/Kel\\.\\s*${matchingVillage}|\\s*${matchingVillage}`, 'i'), '').replace(/(^,\s*)|(,\s*$)/g, '').trim());
        } else {
          setTanahDesa('');
          setTanahLokasi(remainingLoc);
        }

        setTanahPenggunaan(editingAsset.penggunaan);
        setTempatSimpanBerkas(editingAsset.tempatSimpanBerkas);
        setTanahKoordinat(editingAsset.koordinatGoogleMaps || '');
        setLuasTanah(editingAsset.luasTanah !== undefined ? editingAsset.luasTanah : '');
      } else if (editingAsset.type === 'kendaraan') {
        setJenisKendaraan(editingAsset.jenisKendaraan);
        setNomorPolisi(editingAsset.nomorPolisi);
        setMerk(editingAsset.merk);
        setAtasNama(editingAsset.atasNama);
        setTahunPembuatan(editingAsset.tahunPembuatan);
        setKondisiKendaraan(editingAsset.kondisiKendaraan);
        
        if (editingAsset.tanggalBulanPajak) {
          const parts = editingAsset.tanggalBulanPajak.split(' ');
          if (parts.length === 2) {
            setPajakHari(parts[0]);
            setPajakBulan(parts[1]);
          } else {
            setPajakHari('1');
            setPajakBulan('Januari');
          }
        } else {
          setPajakHari('1');
          setPajakBulan('Januari');
        }
        setPenanggungJawabDaerah(editingAsset.penanggungJawabDaerah || '');
      } else if (editingAsset.type === 'bangunan') {
        setNamaBangunan(editingAsset.namaBangunan);
        
        // Split subdistrict and village
        const loc = editingAsset.lokasi;
        const matchingKec = KECAMATAN_MADIUN.find(k => loc.includes(k));
        let remainingLoc = loc;

        if (matchingKec) {
          setBangunanKecamatan(matchingKec);
          remainingLoc = loc.replace(new RegExp(`\\s*Kec\\.\\s*${matchingKec}|\\s*${matchingKec}`, 'i'), '').replace(/(^,\s*)|(,\s*$)/g, '').trim();
        } else {
          setBangunanKecamatan('');
        }

        const villages = matchingKec ? DESA_KELURAHAN_MADIUN[matchingKec] : [];
        const matchingVillage = villages?.find(v => remainingLoc.includes(v));

        if (matchingVillage) {
          setBangunanDesa(matchingVillage);
          setBangunanLokasi(remainingLoc.replace(new RegExp(`\\s*Ds/Kel\\.\\s*${matchingVillage}|\\s*${matchingVillage}`, 'i'), '').replace(/(^,\s*)|(,\s*$)/g, '').trim());
        } else {
          setBangunanDesa('');
          setBangunanLokasi(remainingLoc);
        }

        setBangunanKoordinat(editingAsset.koordinatGoogleMaps || '');
        setLuasBangunan(editingAsset.luasBangunan);
        setPenggunaanBangunan(editingAsset.penggunaanBangunan);
        setNomerPBG(editingAsset.nomerPBG);
        setNomerSLF(editingAsset.nomerSLF);
        setKondisiBangunan(editingAsset.kondisi);
        setKeteranganKerusakan(editingAsset.keteranganKerusakan);
      }
    }
  }, [editingAsset]);

  const handleReset = () => {
    // Land resets
    setNomerSertifikat('');
    setAtasNamaSertifikat('');
    setTanahLokasi('');
    setTanahDesa('');
    setTanahKecamatan('');
    setTanahPenggunaan('');
    setTempatSimpanBerkas('');
    setTanahKoordinat('');
    setLuasTanah('');

    // Vehicle resets
    setNomorPolisi('');
    setMerk('');
    setAtasNama('');
    setTahunPembuatan(new Date().getFullYear());
    setKondisiKendaraan('BAIK');
    setPajakHari('1');
    setPajakBulan('Januari');
    setPenanggungJawabDaerah('');

    // Building resets
    setNamaBangunan('');
    setBangunanLokasi('');
    setBangunanDesa('');
    setBangunanKecamatan('');
    setBangunanKoordinat('');
    setLuasBangunan(0);
    setPenggunaanBangunan('');
    setNomerPBG('');
    setNomerSLF('');
    setKondisiBangunan('BAIK');
    setKeteranganKerusakan('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Guard: Mode Tamu only allowed to input kendaraan
    if (userRole === 'viewer' && activeType !== 'kendaraan') {
      alert('Mode Tamu hanya diizinkan untuk mendaftarkan aset kendaraan. Untuk tanah atau bangunan, silakan masuk ke Mode Admin.');
      if (onSwitchToAdmin) onSwitchToAdmin();
      return;
    }

    if (activeType === 'tanah' && nomerSertifikat) {
      const exists = assets.some(a => a.type === 'tanah' && a.nomerSertifikat?.toLowerCase().trim() === nomerSertifikat.toLowerCase().trim() && a.id !== editingAsset?.id);
      if (exists) {
        alert('Nomor Hak / Sertifikat sudah terdaftar. Data tidak boleh ganda.');
        return;
      }
    } else if (activeType === 'kendaraan' && nomorPolisi) {
      const exists = assets.some(a => a.type === 'kendaraan' && a.nomorPolisi?.toLowerCase().trim() === nomorPolisi.toLowerCase().trim() && a.id !== editingAsset?.id);
      if (exists) {
        alert('Nomor Polisi sudah terdaftar. Data tidak boleh ganda.');
        return;
      }
    }

    let assetData: Asset;
    const generatedId = editingAsset ? editingAsset.id : `ast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const originalCreatedAt = editingAsset ? editingAsset.createdAt : Date.now();

    if (activeType === 'tanah') {
      if (!nomerSertifikat || !atasNamaSertifikat) {
        alert('Mohon isi semua data wajib (Nomor dan Atas Nama).');
        return;
      }
      
      const dKel = tanahDesa ? `Ds/Kel. ${tanahDesa}, ` : '';
      const dKec = tanahKecamatan ? `Kec. ${tanahKecamatan}` : '';
      const baseLokasi = tanahLokasi ? `${tanahLokasi}, ` : '';
      const fullLokasi = `${baseLokasi}${dKel}${dKec}`.replace(/(^,\s*)|(,\s*$)/g, '').trim();

      assetData = {
        id: generatedId,
        type: 'tanah',
        jenisSertifikat,
        nomerSertifikat,
        atasNamaSertifikat,
        lokasi: fullLokasi,
        penggunaan: tanahPenggunaan || '-',
        tempatSimpanBerkas: tempatSimpanBerkas || '-',
        koordinatGoogleMaps: tanahKoordinat || undefined,
        luasTanah: luasTanah !== '' ? Number(luasTanah) : undefined,
        createdAt: originalCreatedAt,
        sedangBalikNama: editingAsset?.type === 'tanah' ? editingAsset.sedangBalikNama : undefined,
        namaPemilikBaru: editingAsset?.type === 'tanah' ? editingAsset.namaPemilikBaru : undefined,
        catatanBalikNama: editingAsset?.type === 'tanah' ? editingAsset.catatanBalikNama : undefined,
        tanggalMulaiBalikNama: editingAsset?.type === 'tanah' ? editingAsset.tanggalMulaiBalikNama : undefined,
        progresBalikNama: editingAsset?.type === 'tanah' ? editingAsset.progresBalikNama : undefined,
        riwayatBalikNama: editingAsset?.type === 'tanah' ? editingAsset.riwayatBalikNama : undefined,
        sedangDipinjam: editingAsset?.type === 'tanah' ? editingAsset.sedangDipinjam : undefined,
        peminjamanAktif: editingAsset?.type === 'tanah' ? editingAsset.peminjamanAktif : undefined,
        riwayatPeminjaman: editingAsset?.type === 'tanah' ? editingAsset.riwayatPeminjaman : undefined,
      };
    } else if (activeType === 'kendaraan') {
      if (!nomorPolisi || !merk || !atasNama || !penanggungJawabDaerah) {
        alert('Mohon isi semua data wajib (No Polisi, Merk, Atas Nama, dan Penanggung Jawab Daerah).');
        return;
      }
      assetData = {
        id: generatedId,
        type: 'kendaraan',
        jenisKendaraan,
        nomorPolisi: nomorPolisi.toUpperCase(),
        merk,
        atasNama,
        tahunPembuatan: Number(tahunPembuatan) || new Date().getFullYear(),
        kondisiKendaraan,
        tanggalBulanPajak: `${pajakHari} ${pajakBulan}`,
        penanggungJawabDaerah,
        createdAt: originalCreatedAt,
        sedangBalikNama: editingAsset?.type === 'kendaraan' ? editingAsset.sedangBalikNama : undefined,
        namaPemilikBaru: editingAsset?.type === 'kendaraan' ? editingAsset.namaPemilikBaru : undefined,
        catatanBalikNama: editingAsset?.type === 'kendaraan' ? editingAsset.catatanBalikNama : undefined,
        tanggalMulaiBalikNama: editingAsset?.type === 'kendaraan' ? editingAsset.tanggalMulaiBalikNama : undefined,
        progresBalikNama: editingAsset?.type === 'kendaraan' ? editingAsset.progresBalikNama : undefined,
        riwayatBalikNama: editingAsset?.type === 'kendaraan' ? editingAsset.riwayatBalikNama : undefined,
        sedangDipinjam: editingAsset?.type === 'kendaraan' ? editingAsset.sedangDipinjam : undefined,
        peminjamanAktif: editingAsset?.type === 'kendaraan' ? editingAsset.peminjamanAktif : undefined,
        riwayatPeminjaman: editingAsset?.type === 'kendaraan' ? editingAsset.riwayatPeminjaman : undefined,
      };
    } else {
      // bangunan
      if (!namaBangunan || !penggunaanBangunan) {
        alert('Mohon isi semua data wajib (Nama Bangunan dan Penggunaan).');
        return;
      }

      const dKel = bangunanDesa ? `Ds/Kel. ${bangunanDesa}, ` : '';
      const dKec = bangunanKecamatan ? `Kec. ${bangunanKecamatan}` : '';
      const baseLokasi = bangunanLokasi ? `${bangunanLokasi}, ` : '';
      const fullLokasi = `${baseLokasi}${dKel}${dKec}`.replace(/(^,\s*)|(,\s*$)/g, '').trim();

      assetData = {
        id: generatedId,
        type: 'bangunan',
        namaBangunan,
        lokasi: fullLokasi,
        luasBangunan: Number(luasBangunan) || 0,
        koordinatGoogleMaps: bangunanKoordinat || undefined,
        penggunaanBangunan,
        nomerPBG: nomerPBG || '-',
        nomerSLF: nomerSLF || '-',
        kondisi: kondisiBangunan,
        keteranganKerusakan: kondisiBangunan === 'BAIK' ? '-' : (keteranganKerusakan || '-'),
        createdAt: originalCreatedAt,
        sedangBalikNama: editingAsset?.type === 'bangunan' ? editingAsset.sedangBalikNama : undefined,
        namaPemilikBaru: editingAsset?.type === 'bangunan' ? editingAsset.namaPemilikBaru : undefined,
        catatanBalikNama: editingAsset?.type === 'bangunan' ? editingAsset.catatanBalikNama : undefined,
        tanggalMulaiBalikNama: editingAsset?.type === 'bangunan' ? editingAsset.tanggalMulaiBalikNama : undefined,
        progresBalikNama: editingAsset?.type === 'bangunan' ? editingAsset.progresBalikNama : undefined,
        riwayatBalikNama: editingAsset?.type === 'bangunan' ? editingAsset.riwayatBalikNama : undefined,
        sedangDipinjam: editingAsset?.type === 'bangunan' ? editingAsset.sedangDipinjam : undefined,
        peminjamanAktif: editingAsset?.type === 'bangunan' ? editingAsset.peminjamanAktif : undefined,
        riwayatPeminjaman: editingAsset?.type === 'bangunan' ? editingAsset.riwayatPeminjaman : undefined,
      };
    }

    onSaveAsset(assetData);
    setSuccessMsg(editingAsset ? 'Perubahan aset berhasil disimpan!' : 'Data aset berhasil ditambahkan!');
    
    if (!editingAsset) {
      handleReset();
    }

    setTimeout(() => {
      setSuccessMsg(null);
    }, 4000);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Title */}
      {/* Header Banner */}
      <MenuHeroBanner
        title={editingAsset ? "EDIT DATA ASET SB MADIUN" : "INPUT ASET SB DAERAH MADIUN"}
        subtitle="Formulir pendaftaran dan pendataan aset baru (Tanah, Kendaraan Mobilisasi, dan Bangunan Gedung)."
        badgeText="TIM PENGHIMPUN BENDA SABILILLAH"
        rightElement={
          editingAsset ? (
            <span className="bg-amber-400 text-sky-950 text-xs font-black px-3 py-1 rounded-xl shadow-xs">
              Mode Edit Aset
            </span>
          ) : (
            <span className="bg-sky-700/50 text-sky-200 text-xs font-bold px-3 py-1 rounded-xl border border-sky-600/40">
              Formulir Aktif
            </span>
          )
        }
      />

      {/* Mode Tamu Info Notice if userRole === 'viewer' */}
      {userRole === 'viewer' && !editingAsset && (
        <div className="bg-amber-50/80 dark:bg-amber-950/30 border-2 border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
          <div className="p-2 bg-amber-500 text-slate-950 font-black rounded-xl text-xs shrink-0 mt-0.5">
            🚐 TAMU
          </div>
          <div>
            <h4 className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wide">
              Mode Tamu Aktif: Input Khusus Aset Kendaraan
            </h4>
            <p className="text-[11px] text-amber-800 dark:text-amber-300/90 mt-0.5 leading-relaxed font-medium">
              Pada <strong>Mode Tamu</strong>, Anda memiliki hak akses untuk mendaftarkan aset operasional <strong>Kendaraan</strong> baru. Hak akses pendataan aset Tanah &amp; Bangunan dibatasi khusus untuk <strong>Admin</strong> guna menjaga keamanan dokumen sertifikat.
            </p>
          </div>
        </div>
      )}

      {/* Selector Tabs: When Admin, freely switchable. When Viewer, Kendaraan is active while Tanah & Bangunan indicate Admin-only */}
      {!editingAsset && (
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-sm animate-fade-in">
          <button
            type="button"
            onClick={() => {
              if (userRole === 'viewer') {
                if (onSwitchToAdmin) {
                  onSwitchToAdmin();
                } else {
                  alert('Pendaftaran aset Tanah khusus untuk Administrator. Silakan masuk dengan PIN Admin.');
                }
                return;
              }
              setActiveType('tanah');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all flex items-center justify-center gap-1.5 touch-manipulation focus:outline-none cursor-pointer ${
              activeType === 'tanah'
                ? 'bg-sky-600 text-white shadow-sm border border-sky-700'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/60'
            }`}
          >
            <span>🏘️ Tanah</span>
            {userRole === 'viewer' && (
              <span className="text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-bold">🔒 Admin</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveType('kendaraan')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all flex items-center justify-center gap-1.5 touch-manipulation focus:outline-none cursor-pointer ${
              activeType === 'kendaraan'
                ? 'bg-amber-500 text-slate-950 shadow-sm border border-amber-600 font-black'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/60'
            }`}
          >
            <span>🚐 Kendaraan</span>
            {userRole === 'viewer' && (
              <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold">✓ Buka</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              if (userRole === 'viewer') {
                if (onSwitchToAdmin) {
                  onSwitchToAdmin();
                } else {
                  alert('Pendaftaran aset Bangunan khusus untuk Administrator. Silakan masuk dengan PIN Admin.');
                }
                return;
              }
              setActiveType('bangunan');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all flex items-center justify-center gap-1.5 touch-manipulation focus:outline-none cursor-pointer ${
              activeType === 'bangunan'
                ? 'bg-purple-600 text-white shadow-sm border border-purple-700'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/60'
            }`}
          >
            <span>🏢 Bangunan</span>
            {userRole === 'viewer' && (
              <span className="text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-bold">🔒 Admin</span>
            )}
          </button>
        </div>
      )}

      {/* Editing Info Tag */}
      {editingAsset && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-xl p-3.5 text-xs flex items-center justify-between shadow-sm animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Sedang mengedit tipe aset: <strong>{editingAsset.type.toUpperCase()}</strong></span>
          </div>
          <button 
            type="button" 
            onClick={onCancelEdit}
            className="text-xs font-bold text-amber-700 dark:text-amber-400 underline focus:outline-none cursor-pointer"
          >
            Batal
          </button>
        </div>
      )}

      {/* Form Area */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors duration-200">
          
          {/* SUCCESS ALERTS */}
          <AnimatePresence>
            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-sky-50 text-sky-800 p-3 rounded-xl border border-sky-200 text-xs flex items-center gap-2"
              >
                <CheckCircle2 className="w-4.5 h-4.5 text-sky-600 flex-shrink-0" />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 1. TANAH FORM */}
          {activeType === 'tanah' && (
            <div className="space-y-4">
              {/* Jenis Sertifikat */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-extrabold text-gray-700">Jenis Sertifikat <strong className="text-rose-500">*</strong></label>
                <select
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-medium focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all focus:outline-none h-11"
                  value={jenisSertifikat}
                  onChange={(e) => setJenisSertifikat(e.target.value as SertifikatTanahType)}
                >
                  <option value="SHM">SHM (Sertifikat Hak Milik)</option>
                  <option value="WAQAF">WAQAF</option>
                  <option value="SHGB">SHGB (Sertifikat Hak Guna Bangunan)</option>
                  <option value="LETER C">LETER C</option>
                </select>
              </div>

              {/* Nomer Sertifikat */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-extrabold text-gray-700">Nomor Sertifikat <strong className="text-rose-500">*</strong></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: No. 10.05.01.03.1.00234"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all focus:outline-none h-11"
                  value={nomerSertifikat}
                  onChange={(e) => setNomerSertifikat(e.target.value)}
                />
              </div>

              {/* Atas Nama Sertifikat */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-extrabold text-gray-700">Atas Nama Sertifikat <strong className="text-rose-500">*</strong></label>
                <input
                  type="text"
                  required
                  placeholder="Nama pemilik sah yang tercantum"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all focus:outline-none h-11"
                  value={atasNamaSertifikat}
                  onChange={(e) => setAtasNamaSertifikat(e.target.value)}
                />
              </div>

              {/* Lokasi, Kecamatan, Desa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-extrabold text-gray-700">Kecamatan</label>
                  <input
                    list="tanah-kecamatan-list"
                    placeholder="Pilih atau ketik kecamatan..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all focus:outline-none h-11"
                    value={tanahKecamatan}
                    onChange={(e) => {
                      setTanahKecamatan(e.target.value);
                      if (DESA_KELURAHAN_MADIUN[e.target.value]) {
                        setTanahDesa('');
                      }
                    }}
                  />
                  <datalist id="tanah-kecamatan-list">
                    {KECAMATAN_MADIUN.map(k => (
                      <option key={k} value={k} />
                    ))}
                  </datalist>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-extrabold text-gray-700">Desa / Kelurahan</label>
                  <input
                    list="tanah-desa-list"
                    placeholder="Pilih atau ketik desa..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all focus:outline-none h-11"
                    value={tanahDesa}
                    onChange={(e) => setTanahDesa(e.target.value)}
                  />
                  <datalist id="tanah-desa-list">
                    {tanahKecamatan && DESA_KELURAHAN_MADIUN[tanahKecamatan] && DESA_KELURAHAN_MADIUN[tanahKecamatan].map(d => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Penggunaan */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-extrabold text-gray-700">Penggunaan</label>
                <input
                  type="text"
                  placeholder="Contoh: Kantor, Sawah, Fasilitas Kesehatan"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all focus:outline-none h-11"
                  value={tanahPenggunaan}
                  onChange={(e) => setTanahPenggunaan(e.target.value)}
                />
              </div>

              {/* Luas Tanah */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-extrabold text-gray-700">Luas Tanah (m²)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Contoh: 150 (kosongkan jika tidak tahu)"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all focus:outline-none h-11"
                  value={luasTanah}
                  onChange={(e) => setLuasTanah(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>

              {/* Koordinat Google Maps */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-extrabold text-gray-700">Koordinat Google Maps (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: -7.6298, 111.5303 atau link Gmaps"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all focus:outline-none h-11"
                  value={tanahKoordinat}
                  onChange={(e) => setTanahKoordinat(e.target.value)}
                />
                <p className="text-[10px] text-gray-500">Bisa diisi link Google Maps atau titik koordinat.</p>
              </div>

              {/* Tempat Simpan Berkas */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-extrabold text-gray-700">Tempat Simpan Berkas Asli</label>
                <input
                  type="text"
                  placeholder="Contoh: Brankas Kantor Pusat (Madiun)"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all focus:outline-none h-11"
                  value={tempatSimpanBerkas}
                  onChange={(e) => setTempatSimpanBerkas(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* 2. KENDARAAN FORM */}
          {activeType === 'kendaraan' && (
            <div className="space-y-4">
              {/* Jenis Kendaraan */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-extrabold text-gray-700">Jenis Kendaraan <strong className="text-rose-500">*</strong></label>
                <select
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-medium focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all focus:outline-none h-11"
                  value={jenisKendaraan}
                  onChange={(e) => setJenisKendaraan(e.target.value as JenisKendaraanType)}
                >
                  <option value="MOTOR">MOTOR</option>
                  <option value="MOBIL">MOBIL</option>
                  <option value="ELF">ELF / MINI BUS</option>
                  <option value="BUS">BUS BESAR</option>
                </select>
              </div>

              {/* Nomor Polisi */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-extrabold text-gray-700">Nomor Polisi (Nopol) <strong className="text-rose-500">*</strong></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: AE 1234 BZ"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs uppercase focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all focus:outline-none h-11"
                  value={nomorPolisi}
                  onChange={(e) => setNomorPolisi(e.target.value)}
                />
              </div>

              {/* Merk / Tipe */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-extrabold text-gray-700">Merk / Tipe <strong className="text-rose-500">*</strong></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Honda Vario 150, Toyota Avanza"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all focus:outline-none h-11"
                  value={merk}
                  onChange={(e) => setMerk(e.target.value)}
                />
              </div>

              {/* Atas Nama Kendaraan */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-extrabold text-gray-700">Atas Nama STNK/BPKB <strong className="text-rose-500">*</strong></label>
                <input
                  type="text"
                  required
                  placeholder="Nama pemilik STNK asli"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all focus:outline-none h-11"
                  value={atasNama}
                  onChange={(e) => setAtasNama(e.target.value)}
                />
              </div>

              {/* Tahun Pembuatan */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-extrabold text-gray-700">Tahun Pembuatan <strong className="text-rose-500">*</strong></label>
                <input
                  type="number"
                  required
                  min={2000}
                  max={2027}
                  placeholder="Tahun pembuatan kendaraan"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all focus:outline-none h-11"
                  value={tahunPembuatan}
                  onChange={(e) => setTahunPembuatan(Number(e.target.value))}
                />
              </div>

              {/* Kondisi Kendaraan */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-extrabold text-gray-700">Kondisi Kendaraan <strong className="text-rose-500">*</strong></label>
                <select
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all focus:outline-none h-11"
                  value={kondisiKendaraan}
                  onChange={(e) => setKondisiKendaraan(e.target.value as KondisiType)}
                >
                  <option value="BAIK">✅ BAIK (Layak Jalan)</option>
                  <option value="RUSAK RINGAN">⚠️ RUSAK RINGAN (Butuh Servis Minor)</option>
                  <option value="RUSAK BERAT">❌ RUSAK BERAT (Sakit / Tidak Layak)</option>
                </select>
              </div>

              {/* Tanggal & Bulan Pajak */}
              <div className="flex flex-col space-y-2 pt-1">
                <label className="text-xs font-extrabold text-gray-700">Tanggal &amp; Bulan Pajak <strong className="text-rose-500">*</strong></label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hari / Tanggal</span>
                    <select
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all focus:outline-none h-11 cursor-pointer"
                      value={pajakHari}
                      onChange={(e) => setPajakHari(e.target.value)}
                    >
                      {HARI_LIST.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nama Bulan</span>
                    <select
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all focus:outline-none h-11 cursor-pointer"
                      value={pajakBulan}
                      onChange={(e) => setPajakBulan(e.target.value)}
                    >
                      {BULAN_LIST.map(mo => (
                        <option key={mo} value={mo}>{mo}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Penanggung Jawab Daerah */}
              <div className="flex flex-col space-y-1 pt-1">
                <label className="text-xs font-extrabold text-gray-700">Penanggung Jawab <strong className="text-rose-500">*</strong></label>
                <select
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all focus:outline-none h-11 cursor-pointer"
                  value={penanggungJawabDaerah}
                  onChange={(e) => setPenanggungJawabDaerah(e.target.value)}
                >
                  <option value="">-- Pilih Daerah / Kelompok --</option>
                  {DAERAH_LIST.map(daerah => (
                    <option key={daerah} value={daerah}>{daerah}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 3. BANGUNAN FORM */}
          {activeType === 'bangunan' && (
            <div className="space-y-4">
              {/* Nama Bangunan */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-extrabold text-gray-700">Nama Gedung / Bangunan <strong className="text-rose-500">*</strong></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Gedung Serba Guna Madiun Baru"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all focus:outline-none h-11"
                  value={namaBangunan}
                  onChange={(e) => setNamaBangunan(e.target.value)}
                />
              </div>

              {/* Lokasi, Kecamatan, Desa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-extrabold text-gray-700">Kecamatan</label>
                  <input
                    list="bangunan-kecamatan-list"
                    placeholder="Pilih atau ketik kecamatan..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all focus:outline-none h-11"
                    value={bangunanKecamatan}
                    onChange={(e) => {
                      setBangunanKecamatan(e.target.value);
                      if (DESA_KELURAHAN_MADIUN[e.target.value]) {
                        setBangunanDesa('');
                      }
                    }}
                  />
                  <datalist id="bangunan-kecamatan-list">
                    {KECAMATAN_MADIUN.map(k => (
                      <option key={k} value={k} />
                    ))}
                  </datalist>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-extrabold text-gray-700">Desa / Kelurahan</label>
                  <input
                    list="bangunan-desa-list"
                    placeholder="Pilih atau ketik desa..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all focus:outline-none h-11"
                    value={bangunanDesa}
                    onChange={(e) => setBangunanDesa(e.target.value)}
                  />
                  <datalist id="bangunan-desa-list">
                    {bangunanKecamatan && DESA_KELURAHAN_MADIUN[bangunanKecamatan] && DESA_KELURAHAN_MADIUN[bangunanKecamatan].map(d => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Luas Bangunan */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-extrabold text-gray-700">Luas Bangunan (M²) <strong className="text-rose-500">*</strong></label>
                <input
                  type="number"
                  required
                  min={0}
                  step="any"
                  placeholder="Luas dalam Meter Persegi (angka)"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all focus:outline-none h-11"
                  value={luasBangunan || ''}
                  onChange={(e) => setLuasBangunan(Number(e.target.value))}
                />
              </div>

              {/* Penggunaan Bangunan */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-extrabold text-gray-700">Fungsi / Penggunaan Gedung <strong className="text-rose-500">*</strong></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Gedung Pertemuan, Gudang Logistik"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all focus:outline-none h-11"
                  value={penggunaanBangunan}
                  onChange={(e) => setPenggunaanBangunan(e.target.value)}
                />
              </div>

              {/* Koordinat Google Maps */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-extrabold text-gray-700">Koordinat Google Maps (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: -7.6298, 111.5303 atau link Gmaps"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all focus:outline-none h-11"
                  value={bangunanKoordinat}
                  onChange={(e) => setBangunanKoordinat(e.target.value)}
                />
                <p className="text-[10px] text-gray-500">Bisa diisi link Google Maps atau titik koordinat.</p>
              </div>

              {/* PBG & SLF */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-extrabold text-gray-700">Nomor PBG (IMB Lama)</label>
                  <input
                    type="text"
                    placeholder="Contoh: PBG-357701-..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all focus:outline-none h-11"
                    value={nomerPBG}
                    onChange={(e) => setNomerPBG(e.target.value)}
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-extrabold text-gray-700">Nomor SLF (Laik Fungsi)</label>
                  <input
                    type="text"
                    placeholder="Contoh: SLF-357701-..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all focus:outline-none h-11"
                    value={nomerSLF}
                    onChange={(e) => setNomerSLF(e.target.value)}
                  />
                </div>
              </div>

              {/* Kondisi Bangunan & Keterangan Kerusakan */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-extrabold text-gray-700">Kondisi Bangunan <strong className="text-rose-500">*</strong></label>
                <select
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all focus:outline-none h-11"
                  value={kondisiBangunan}
                  onChange={(e) => setKondisiBangunan(e.target.value as KondisiType)}
                >
                  <option value="BAIK">✅ BAIK (Kondisi Kokoh)</option>
                  <option value="RUSAK RINGAN">⚠️ RUSAK RINGAN (Retak Rambut, Cat Mengelupas)</option>
                  <option value="RUSAK BERAT">❌ RUSAK BERAT (Struktur Rusak / Bahaya Plafon Ambruk)</option>
                </select>
              </div>

              {kondisiBangunan !== 'BAIK' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex flex-col space-y-1"
                >
                  <label className="text-xs font-extrabold text-rose-800">Keterangan Detail Kerusakan <strong className="text-rose-500">*</strong></label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Tulis bagian yang bocor, retak, atau butuh renovasi darurat..."
                    className="w-full bg-rose-50/30 border border-rose-200 rounded-xl px-3 py-2 p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all focus:outline-none"
                    value={keteranganKerusakan}
                    onChange={(e) => setKeteranganKerusakan(e.target.value)}
                  />
                </motion.div>
              )}
            </div>
          )}

           {/* Buttons */}
          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer text-white focus:outline-none ${
                activeType === 'tanah' ? 'bg-sky-600 hover:bg-sky-700 border border-sky-700' :
                activeType === 'kendaraan' ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border border-amber-550' :
                'bg-purple-600 hover:bg-purple-700 border border-purple-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" /> 
              {editingAsset ? 'Simpan Perubahan' : 'Simpan Data Aset'}
            </button>

            <button
              type="button"
              onClick={editingAsset ? onCancelEdit : handleReset}
              className="px-4 py-3 border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 focus:outline-none active:scale-98 cursor-pointer"
            >
              <ListRestart className="w-4 h-4" />
              {editingAsset ? 'Batal' : 'Reset'}
            </button>
          </div>
        </form>
    </div>
  );
}
