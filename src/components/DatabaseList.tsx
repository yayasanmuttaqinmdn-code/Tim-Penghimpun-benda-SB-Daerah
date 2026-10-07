import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  MapPin, 
  Car, 
  Building, 
  SlidersHorizontal, 
  Trash2, 
  Edit, 
  Calendar, 
  Activity, 
  FileText, 
  X, 
  Grid3X3,
  ExternalLink
} from 'lucide-react';
import { Asset, AssetType } from '../types';
import MenuHeroBanner from './MenuHeroBanner';

interface DatabaseListProps {
  assets: Asset[];
  onEditAsset: (asset: Asset) => void;
  onDeleteAsset: (id: string) => void;
  userRole?: 'admin' | 'viewer';
}

export default function DatabaseList({ assets, onEditAsset, onDeleteAsset }: DatabaseListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<AssetType | 'all'>('tanah');
  const [showFilters, setShowFilters] = useState(false);

  // Deep conditions
  const [filterSertifikat, setFilterSertifikat] = useState<string>('all');
  const [filterKondisi, setFilterKondisi] = useState<string>('all');
  const [filterJenisKendaraan, setFilterJenisKendaraan] = useState<string>('all');

  // Active Inspect State
  const [activeInspectId, setActiveInspectId] = useState<string | null>(null);
  
  // Confirm Delete Dialog
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Computed filtered list
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      // 1. Type Filter
      if (selectedType !== 'all' && asset.type !== selectedType) return false;

      // 2. Deep Filters
      if (asset.type === 'tanah') {
        if (filterSertifikat !== 'all' && asset.jenisSertifikat !== filterSertifikat) return false;
      }
      if (asset.type === 'kendaraan') {
        if (filterKondisi !== 'all' && asset.kondisiKendaraan !== filterKondisi) return false;
        if (filterJenisKendaraan !== 'all' && asset.jenisKendaraan !== filterJenisKendaraan) return false;
      }
      if (asset.type === 'bangunan') {
        if (filterKondisi !== 'all' && asset.kondisi !== filterKondisi) return false;
      }

      // 3. Text Search
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();

      if (asset.type === 'tanah') {
        return (
          asset.nomerSertifikat.toLowerCase().includes(term) ||
          asset.atasNamaSertifikat.toLowerCase().includes(term) ||
          asset.lokasi.toLowerCase().includes(term) ||
          asset.penggunaan.toLowerCase().includes(term) ||
          asset.tempatSimpanBerkas.toLowerCase().includes(term)
        );
      } else if (asset.type === 'kendaraan') {
        const pjd = asset.penanggungJawabDaerah || '';
        const tbp = asset.tanggalBulanPajak || '';
        return (
          asset.nomorPolisi.toLowerCase().includes(term) ||
          asset.merk.toLowerCase().includes(term) ||
          asset.atasNama.toLowerCase().includes(term) ||
          asset.jenisKendaraan.toLowerCase().includes(term) ||
          String(asset.tahunPembuatan).includes(term) ||
          pjd.toLowerCase().includes(term) ||
          tbp.toLowerCase().includes(term)
        );
      } else {
        // bangunan
        return (
          asset.namaBangunan.toLowerCase().includes(term) ||
          asset.lokasi.toLowerCase().includes(term) ||
          asset.penggunaanBangunan.toLowerCase().includes(term) ||
          asset.nomerPBG.toLowerCase().includes(term) ||
          asset.nomerSLF.toLowerCase().includes(term) ||
          (asset.keteranganKerusakan || '').toLowerCase().includes(term)
        );
      }
    });
  }, [assets, selectedType, filterSertifikat, filterKondisi, filterJenisKendaraan, searchTerm]);

  const activeInspectAsset = useMemo(() => {
    return assets.find(a => a.id === activeInspectId) || null;
  }, [assets, activeInspectId]);

  const handleTriggerDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmId) {
      onDeleteAsset(deleteConfirmId);
      if (activeInspectId === deleteConfirmId) {
        setActiveInspectId(null);
      }
      setDeleteConfirmId(null);
    }
  };

  const handleEdit = (asset: Asset, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveInspectId(null);
    onEditAsset(asset);
  };

  return (
    <div className="space-y-4 pb-24">
       {/* Header Hero Banner */}
      <MenuHeroBanner
        title="DATABASE & PENCARIAN ASET MADIUN"
        subtitle="Cari, filter, dan telusuri seluruh berkas aset daerah Madiun yang tersimpan di sistem."
        badgeText="TIM PENGHIMPUN BENDA SABILILLAH"
        rightElement={
          <span className="bg-sky-700/40 text-sky-200 border border-sky-600/30 text-xs font-bold px-3 py-1 rounded-xl">
            📦 {assets.length} Unit Aset
          </span>
        }
      />

      {/* Modern Search Controls */}
      <div className="space-y-3">
        <div className="relative flex items-center text-slate-800">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nopol, sertifikat, nama pemilik, dll..."
            className="w-full bg-white border-2 border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs font-medium text-slate-800 shadow-sm focus:border-slate-450 focus:outline-none transition-all h-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-650 focus:outline-none"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Categories Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none snap-x">
          <button
            onClick={() => { setSelectedType('tanah'); }}
            className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap snap-center transition-all focus:outline-none flex items-center gap-1.5 cursor-pointer border-2 ${
              selectedType === 'tanah' 
                ? 'bg-sky-600 border-sky-700 text-white shadow-sm' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            🏘️ Tanah ({assets.filter(a => a.type === 'tanah').length})
          </button>
          <button
            onClick={() => { setSelectedType('kendaraan'); }}
            className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap snap-center transition-all focus:outline-none flex items-center gap-1.5 cursor-pointer border-2 ${
              selectedType === 'kendaraan' 
                ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-sm' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            🚐 Kendaraan ({assets.filter(a => a.type === 'kendaraan').length})
          </button>
          <button
            onClick={() => { setSelectedType('bangunan'); }}
            className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap snap-center transition-all focus:outline-none flex items-center gap-1.5 cursor-pointer border-2 ${
              selectedType === 'bangunan' 
                ? 'bg-purple-600 border-purple-700 text-white shadow-sm' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            🏢 Bangunan ({assets.filter(a => a.type === 'bangunan').length})
          </button>
        </div>

        {/* Dynamic Filters Button */}
        {selectedType !== 'all' && (
          <div className="flex justify-end">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
                showFilters || filterSertifikat !== 'all' || filterKondisi !== 'all' || filterJenisKendaraan !== 'all'
                  ? 'bg-sky-50 text-sky-800 border border-sky-100'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Detail Filters</span>
              {(filterSertifikat !== 'all' || filterKondisi !== 'all' || filterJenisKendaraan !== 'all') && (
                <span className="w-2 h-2 rounded-full bg-sky-600 inline-block ml-0.5" />
              )}
            </button>
          </div>
        )}

        {/* Expanded Deep Filters panel */}
        <AnimatePresence>
          {showFilters && selectedType !== 'all' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-gray-50 p-4 rounded-xl border border-gray-150 space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                {/* 1. If Category is Tanah */}
                {selectedType === 'tanah' && (
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Jenis Sertifikat</label>
                    <select
                      value={filterSertifikat}
                      onChange={(e) => setFilterSertifikat(e.target.value)}
                      className="bg-white border border-gray-200 rounded-lg p-2 text-xs focus:outline-none"
                    >
                      <option value="all">Semua Jenis</option>
                      <option value="SHM">SHM</option>
                      <option value="WAQAF">WAQAF</option>
                      <option value="SHGB">SHGB</option>
                      <option value="LETER C">LETER C</option>
                    </select>
                  </div>
                )}

                {/* 2. If Category is Kendaraan */}
                {selectedType === 'kendaraan' && (
                  <>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] uppercase font-bold text-gray-400">Jenis Kendaraan</label>
                      <select
                        value={filterJenisKendaraan}
                        onChange={(e) => setFilterJenisKendaraan(e.target.value)}
                        className="bg-white border border-gray-200 rounded-lg p-2 text-xs focus:outline-none"
                      >
                        <option value="all">Semua Jenis</option>
                        <option value="MOTOR">MOTOR</option>
                        <option value="MOBIL">MOBIL</option>
                        <option value="ELF">ELF</option>
                        <option value="BUS">BUS</option>
                      </select>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] uppercase font-bold text-gray-400">Kondisi Kendaraan</label>
                      <select
                        value={filterKondisi}
                        onChange={(e) => setFilterKondisi(e.target.value)}
                        className="bg-white border border-gray-200 rounded-lg p-2 text-xs focus:outline-none"
                      >
                        <option value="all">Semua Kondisi</option>
                        <option value="BAIK">BAIK</option>
                        <option value="RUSAK RINGAN">RUSAK RINGAN</option>
                        <option value="RUSAK BERAT">RUSAK BERAT</option>
                      </select>
                    </div>
                  </>
                )}

                {/* 3. If Category is Bangunan */}
                {selectedType === 'bangunan' && (
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Kondisi Bangunan</label>
                    <select
                      value={filterKondisi}
                      onChange={(e) => setFilterKondisi(e.target.value)}
                      className="bg-white border border-gray-200 rounded-lg p-2 text-xs focus:outline-none"
                    >
                      <option value="all">Semua Kondisi</option>
                      <option value="BAIK">BAIK</option>
                      <option value="RUSAK RINGAN">RUSAK RINGAN</option>
                      <option value="RUSAK BERAT">RUSAK BERAT</option>
                    </select>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setFilterSertifikat('all');
                    setFilterKondisi('all');
                    setFilterJenisKendaraan('all');
                  }}
                  className="text-[11px] text-rose-600 font-bold hover:underline"
                >
                  Reset Filter Detail
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Database Listing cards */}
      <div className="space-y-3">
        {filteredAssets.length === 0 ? (
          <div className="bg-white text-center py-12 rounded-2xl border-2 border-slate-200 p-6 space-y-2">
            <X className="w-8 h-8 text-slate-300 mx-auto" />
            <span className="block text-sm font-black text-slate-800">Aset Tidak Ditemukan</span>
            <p className="text-slate-400 text-xs max-w-xs mx-auto">
              Tidak ada data yang cocok dengan kriteria pencarian "{searchTerm}" atau filter aktif Anda.
            </p>
          </div>
        ) : (
          filteredAssets.map((asset) => {
            const isTanah = asset.type === 'tanah';
            const isKendaraan = asset.type === 'kendaraan';
            const isBangunan = asset.type === 'bangunan';

            let cardBorderHover = 'hover:border-sky-400';
            let tagColor = 'bg-sky-100 text-sky-700 border border-sky-200';
            let emojiIcon = '🏘️';
            let emojiBg = 'bg-sky-50';

            if (isKendaraan) {
              cardBorderHover = 'hover:border-amber-450';
              tagColor = 'bg-amber-100 text-slate-900 border border-amber-300';
              emojiIcon = '🚐';
              emojiBg = 'bg-amber-50';
            } else if (isBangunan) {
              cardBorderHover = 'hover:border-purple-400';
              tagColor = 'bg-purple-100 text-purple-700 border border-purple-200';
              emojiIcon = '🏢';
              emojiBg = 'bg-purple-50';
            }

            return (
              <motion.div
                key={asset.id}
                layoutId={`card-${asset.id}`}
                onClick={() => setActiveInspectId(asset.id)}
                className={`bg-white border-2 border-slate-200 ${cardBorderHover} rounded-2xl p-4 shadow-sm relative overflow-hidden transition-all duration-150 cursor-pointer active:scale-[0.99]`}
              >
                {/* Visual Accent Badge */}
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-xs ${emojiBg}`}>
                      {emojiIcon}
                    </div>
                    <div>
                      {/* Name Header */}
                      <h3 className="text-sm font-black text-slate-900 tracking-tight leading-snug">
                        {isTanah && `${asset.jenisSertifikat} - No. ${asset.nomerSertifikat}`}
                        {isKendaraan && `${asset.merk} (${asset.nomorPolisi})`}
                        {isBangunan && asset.namaBangunan}
                      </h3>
                      
                      {/* Sub-label */}
                      <p className="text-slate-500 text-xs mt-1 flex items-center gap-1 font-mono">
                        {isTanah && `An. ${asset.atasNamaSertifikat}`}
                        {isKendaraan && `An. ${asset.atasNama}`}
                        {isBangunan && `PBG: ${asset.nomerPBG || '-'}`}
                      </p>
                    </div>
                  </div>

                  {/* Top-Right Badge */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${tagColor}`}>
                      {asset.type}
                    </span>
                    {asset.sedangDipinjam && (
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-250 text-[8px] font-black uppercase tracking-wide flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-pulse" /> DIPINJAM
                      </span>
                    )}
                  </div>
                </div>

                {/* Compact Stats Grid */}
                <div className="mt-4 grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-[11px] text-slate-600">
                  <div>
                    <span className="block text-slate-400 font-bold uppercase tracking-wider text-[8px]">
                      {isKendaraan ? 'Penanggung Jawab' : 'Lokasi Penempatan'}
                    </span>
                    <span className="truncate block font-semibold mt-0.5 text-slate-700">
                      {isKendaraan ? (asset.penanggungJawabDaerah || 'Umum') : asset.lokasi}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-bold uppercase tracking-wider text-[8px]">Karakteristik Aset</span>
                    <span className="block text-[11px] truncate mt-0.5 font-semibold text-slate-700">
                      {isTanah && `Guna: ${asset.penggunaan}${asset.luasTanah ? ` | Luas: ${asset.luasTanah} m²` : ''}`}
                      {isKendaraan && `Kondisi: ${asset.kondisiKendaraan}${asset.tanggalBulanPajak ? ` | Pajak: ${asset.tanggalBulanPajak}` : ''}`}
                      {isBangunan && `Luas: ${asset.luasBangunan} m²`}
                    </span>
                  </div>
                </div>

                {/* Hover Indicator */}
                <div className="absolute bottom-2 right-4 text-[10px] text-slate-500 flex items-center gap-0.5 font-bold opacity-0 group-hover:opacity-100 md:opacity-100">
                  Detail <ExternalLink className="w-2.5 h-2.5" />
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* DETAILED INSPECT MODAL (DRAWER LOOK) */}
      <AnimatePresence>
        {activeInspectId && activeInspectAsset && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center px-0 md:px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 cursor-pointer"
              onClick={() => setActiveInspectId(null)}
            />
            {/* Modal Body */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-xl p-6 z-10 max-h-[85vh] overflow-y-auto space-y-6 pb-12"
            >
              {/* Close Bar */}
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-2 md:hidden" onClick={() => setActiveInspectId(null)} />
              
              <div className="flex justify-between items-start">
                <span className="bg-sky-900 text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
                  DETAIL ASET {activeInspectAsset.type}
                </span>
                <button
                  onClick={() => setActiveInspectId(null)}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-all focus:outline-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Inspect Header Title */}
              <div className="space-y-1">
                <h3 className="text-lg font-black text-gray-900 leading-tight">
                  {activeInspectAsset.type === 'tanah' && `Tanah: ${activeInspectAsset.jenisSertifikat}`}
                  {activeInspectAsset.type === 'kendaraan' && activeInspectAsset.merk}
                  {activeInspectAsset.type === 'bangunan' && activeInspectAsset.namaBangunan}
                </h3>
                <p className="text-gray-400 text-xs font-mono">ID: {activeInspectAsset.id}</p>
              </div>

              {/* Core Attributes Panel */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150 divide-y divide-gray-150 space-y-3.5">
                
                {/* TANAH FIELDS */}
                {activeInspectAsset.type === 'tanah' && (
                  <>
                    <div className="pt-0 flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Jenis Sertifikat</span>
                      <span className="text-xs font-bold text-gray-800 mt-0.5">{activeInspectAsset.jenisSertifikat}</span>
                    </div>
                    <div className="pt-3 flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Nomor Sertifikat</span>
                      <span className="text-xs font-mono font-bold text-gray-800 mt-0.5">{activeInspectAsset.nomerSertifikat}</span>
                    </div>
                    <div className="pt-3 flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Atas Nama Sertifikat</span>
                      <span className="text-xs font-bold text-gray-800 mt-0.5">{activeInspectAsset.atasNamaSertifikat}</span>
                    </div>
                    <div className="pt-3 flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Lokasi / Kecamatan</span>
                      <span className="text-xs font-semibold text-gray-800 mt-0.5">{activeInspectAsset.lokasi}</span>
                    </div>
                    {activeInspectAsset.koordinatGoogleMaps && (
                      <div className="pt-3 flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Koordinat Google Maps</span>
                        <a 
                          href={activeInspectAsset.koordinatGoogleMaps.startsWith('http') ? activeInspectAsset.koordinatGoogleMaps : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeInspectAsset.koordinatGoogleMaps)}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-xs font-bold text-sky-600 hover:text-sky-800 hover:underline mt-0.5 flex items-center gap-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                          Buka Google Maps
                        </a>
                      </div>
                    )}
                    <div className="pt-3 flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Penggunaan / Hak Guna</span>
                      <span className="text-xs font-semibold text-gray-800 mt-0.5">{activeInspectAsset.penggunaan || '-'}</span>
                    </div>
                    {activeInspectAsset.luasTanah !== undefined && activeInspectAsset.luasTanah !== null && activeInspectAsset.luasTanah !== '' && (
                      <div className="pt-3 flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Luas Tanah</span>
                        <span className="text-xs font-bold text-gray-800 mt-0.5">{activeInspectAsset.luasTanah} m²</span>
                      </div>
                    )}
                    <div className="pt-3 flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tempat Simpan Berkas Fisik</span>
                      <span className="text-xs font-semibold text-gray-800 mt-0.5">{activeInspectAsset.tempatSimpanBerkas || '-'}</span>
                    </div>
                  </>
                )}

                {/* KENDARAAN FIELDS */}
                {activeInspectAsset.type === 'kendaraan' && (
                  <>
                    <div className="pt-0 flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Jenis Kendaraan Mobilisasi</span>
                      <span className="text-xs font-bold text-gray-800 mt-0.5">{activeInspectAsset.jenisKendaraan}</span>
                    </div>
                    <div className="pt-3 flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Nomor Polisi (Nopol)</span>
                      <span className="text-xs font-mono font-bold text-gray-800 mt-0.5">{activeInspectAsset.nomorPolisi}</span>
                    </div>
                    <div className="pt-3 flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Atas Nama Pemilik STNK</span>
                      <span className="text-xs font-bold text-gray-800 mt-0.5">{activeInspectAsset.atasNama}</span>
                    </div>
                    <div className="pt-3 flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tahun Pembuatan</span>
                      <span className="text-xs font-bold text-gray-800 mt-0.5">{activeInspectAsset.tahunPembuatan}</span>
                    </div>
                    <div className="pt-3 flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Kondisi Kendaraan</span>
                      <span className="text-xs mt-0.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          activeInspectAsset.kondisiKendaraan === 'BAIK' ? 'bg-sky-100 text-sky-800' :
                          activeInspectAsset.kondisiKendaraan === 'RUSAK RINGAN' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {activeInspectAsset.kondisiKendaraan}
                        </span>
                      </span>
                    </div>
                    {activeInspectAsset.tanggalBulanPajak && (
                      <div className="pt-3 flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tanggal &amp; Bulan Pajak</span>
                        <span className="text-xs font-bold text-gray-800 mt-0.5">📅 {activeInspectAsset.tanggalBulanPajak}</span>
                      </div>
                    )}
                    {activeInspectAsset.penanggungJawabDaerah && (
                      <div className="pt-3 flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Penanggung Jawab</span>
                        <span className="text-xs font-bold text-gray-800 mt-0.5">📍 {activeInspectAsset.penanggungJawabDaerah}</span>
                      </div>
                    )}
                  </>
                )}

                {/* BANGUNAN FIELDS */}
                {activeInspectAsset.type === 'bangunan' && (
                  <>
                    <div className="pt-0 flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Nama Gedung</span>
                      <span className="text-xs font-bold text-gray-800 mt-0.5">{activeInspectAsset.namaBangunan}</span>
                    </div>
                    <div className="pt-3 flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Lokasi / Kecamatan</span>
                      <span className="text-xs font-semibold text-gray-800 mt-0.5">{activeInspectAsset.lokasi}</span>
                    </div>
                    {activeInspectAsset.koordinatGoogleMaps && (
                      <div className="pt-3 flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Koordinat Google Maps</span>
                        <a 
                          href={activeInspectAsset.koordinatGoogleMaps.startsWith('http') ? activeInspectAsset.koordinatGoogleMaps : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeInspectAsset.koordinatGoogleMaps)}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-xs font-bold text-sky-600 hover:text-sky-800 hover:underline mt-0.5 flex items-center gap-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                          Buka Google Maps
                        </a>
                      </div>
                    )}
                    <div className="pt-3 flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Luas Bangunan</span>
                      <span className="text-xs font-bold text-gray-800 mt-0.5">{activeInspectAsset.luasBangunan} M²</span>
                    </div>
                    <div className="pt-3 flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Fungsi Penggunaan</span>
                      <span className="text-xs font-semibold text-gray-800 mt-0.5">{activeInspectAsset.penggunaanBangunan}</span>
                    </div>
                    <div className="pt-3 grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">Nomor PBG (IMB)</span>
                        <span className="text-[11px] font-mono text-gray-700 truncate mt-0.5">{activeInspectAsset.nomerPBG || '-'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">Nomor SLF</span>
                        <span className="text-[11px] font-mono text-gray-700 truncate mt-0.5">{activeInspectAsset.nomerSLF || '-'}</span>
                      </div>
                    </div>
                    <div className="pt-3 flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Kondisi Fisik Gedung</span>
                      <span className="text-xs mt-0.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          activeInspectAsset.kondisi === 'BAIK' ? 'bg-sky-100 text-sky-800' :
                          activeInspectAsset.kondisi === 'RUSAK RINGAN' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {activeInspectAsset.kondisi}
                        </span>
                      </span>
                    </div>
                    {activeInspectAsset.kondisi !== 'BAIK' && (
                      <div className="pt-3 flex flex-col">
                        <span className="text-[10px] text-rose-800 font-bold uppercase tracking-wider">Keterangan Hambatan / Kerusakan</span>
                        <p className="text-xs text-rose-950 mt-1 italic font-medium leading-relaxed bg-rose-50/50 p-2.5 rounded-xl border border-rose-100">
                          {activeInspectAsset.keteranganKerusakan || '-'}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Status Peminjaman Berkas Aktif */}
                {activeInspectAsset.sedangDipinjam && activeInspectAsset.peminjamanAktif && (
                  <div className="pt-3.5 border-t border-gray-200 mt-2 space-y-2 bg-amber-50/50 p-3 rounded-2xl border border-amber-200 text-left">
                    <span className="text-[10px] text-amber-900 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                      <span>📖</span> Status Berkas: Sedang Dipinjam
                    </span>
                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-gray-800">
                        Peminjam: <span className="text-gray-950 font-extrabold">{activeInspectAsset.peminjamanAktif.peminjamName}</span> ({activeInspectAsset.peminjamanAktif.peminjamJabatan})
                      </p>
                      <p className="text-gray-500 text-[10px]">
                        Kontak: <strong className="text-gray-800 font-bold">{activeInspectAsset.peminjamanAktif.peminjamKontak}</strong> | Petugas: <strong className="text-gray-800 font-bold">{activeInspectAsset.peminjamanAktif.namaPetugas}</strong>
                      </p>
                      <p className="text-gray-500 text-[10px]">
                        Tgl Pinjam: <strong className="text-gray-850 font-bold">{activeInspectAsset.peminjamanAktif.tanggalPinjam}</strong> 
                        {activeInspectAsset.peminjamanAktif.tanggalKembaliRencana && ` | Rencana Kembali: ${activeInspectAsset.peminjamanAktif.tanggalKembaliRencana}`}
                      </p>
                      <p className="text-gray-600 text-[11px] leading-relaxed italic border-l-2 border-amber-300 pl-2.5 mt-2 bg-white/60 p-1.5 rounded">
                        "{activeInspectAsset.peminjamanAktif.keperluan}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Riwayat Peminjaman Berkas (History) */}
                {activeInspectAsset.riwayatPeminjaman && activeInspectAsset.riwayatPeminjaman.length > 0 && (
                  <div className="pt-4 border-t border-gray-200 mt-2 space-y-2 text-left">
                    <span className="text-[10px] text-gray-800 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                      <span>📜</span> Riwayat Peminjaman Berkas
                    </span>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {activeInspectAsset.riwayatPeminjaman.map((log, idx) => (
                        <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-[11px] leading-relaxed space-y-1.5">
                          <div className="flex justify-between items-center text-gray-700 font-bold">
                            <span>Peminjam: <strong className="font-extrabold text-gray-950">{log.peminjamName}</strong></span>
                            <span className="text-[9px] text-gray-400 font-mono bg-white px-1.5 py-0.5 rounded border border-gray-150">{log.peminjamJabatan}</span>
                          </div>
                          <div className="text-[10px] text-gray-550 grid grid-cols-2 gap-2 pt-0.5 border-t border-gray-100">
                            <div>
                              <span className="block text-[8px] text-gray-400 font-bold uppercase tracking-wider">Masa Pinjam</span>
                              <span>{log.tanggalPinjam} s.d {log.tanggalKembaliRiil}</span>
                            </div>
                            <div>
                              <span className="block text-[8px] text-gray-400 font-bold uppercase tracking-wider">Serah / Terima</span>
                              <span>{log.namaPetugas}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Riwayat Balik Nama (History) */}
                {activeInspectAsset.riwayatBalikNama && activeInspectAsset.riwayatBalikNama.length > 0 && (
                  <div className="pt-4 border-t border-gray-200 mt-2 space-y-2">
                    <span className="text-[10px] text-gray-800 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                      <span>📜</span> Riwayat Balik Nama (Kepemilikan Sebelumnya)
                    </span>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {activeInspectAsset.riwayatBalikNama.map((log, idx) => (
                        <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-[11px] leading-relaxed space-y-2">
                          <div className="flex justify-between items-center text-gray-700 font-bold">
                            <span>Pemilik Sebelumnya:</span>
                            <span className="text-[9px] text-gray-400 font-mono bg-white px-1.5 py-0.5 rounded border border-gray-150">{log.tanggalSelesai}</span>
                          </div>
                          <p className="font-extrabold text-gray-900 text-xs bg-white/60 p-1.5 rounded border border-gray-100">{log.atasNamaLama}</p>
                          
                          <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500 pt-1">
                            <div>
                              <span className="block text-[8px] text-gray-400 font-bold uppercase tracking-wider text-left">No. Dokumen Lama</span>
                              <span className="font-mono text-gray-800 font-semibold">{log.nomerSertifikatLama}</span>
                            </div>
                            <div>
                              <span className="block text-[8px] text-sky-600 font-bold uppercase tracking-wider text-left">No. Dokumen Baru</span>
                              <span className="font-mono text-sky-800 font-bold">{log.nomorSertifikatBaru}</span>
                            </div>
                          </div>
                          {log.catatanLama && (
                            <div className="text-[10px] text-gray-500 italic bg-amber-50/30 p-2 rounded border border-amber-100/50">
                              <span className="not-italic text-[8px] font-black text-amber-800 uppercase block mb-0.5">Catatan Terakhir:</span>
                              {log.catatanLama}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shared Properties */}
                <div className="pt-3 flex justify-between text-[10px] text-gray-400 font-mono">
                  <span>Waktu Terdaftar:</span>
                  <span>{new Date(activeInspectAsset.createdAt).toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Action Buttons inside Drawer */}
              <div className="space-y-3">
                <div className="flex gap-2.5">
                  <button
                    onClick={(e) => handleEdit(activeInspectAsset, e)}
                    className="flex-1 py-3 border border-sky-600 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer active:scale-95 shadow-xs"
                  >
                    <Edit className="w-4 h-4 text-sky-100" />
                    Edit / Sunting Data
                  </button>

                  <button
                    onClick={(e) => handleTriggerDelete(activeInspectAsset.id, e)}
                    className="flex-1 py-3 border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100/80 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" /> Hapus Aset
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRM DIALOG OVERLAY */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black/70 z-55 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white max-w-sm w-full rounded-2xl p-5 shadow-xl border border-gray-100 space-y-4"
            >
              <div className="text-center space-y-2">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                  <Trash2 className="w-6 h-6 stroke-2" />
                </div>
                <h3 className="text-sm font-black text-gray-950">Konfirmasi Hapus Aset?</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Tindakan ini permanen. Seluruh data aset yang terhapus tidak dapat dipulihkan dari basis data servermaupun local storage.
                </p>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
                >
                  Ya, Hapus
                </button>
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold focus:outline-none cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
