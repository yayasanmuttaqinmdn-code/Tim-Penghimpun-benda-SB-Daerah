import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Car, 
  Building, 
  ShieldCheck, 
  RefreshCw, 
  Layers, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Settings,
  BarChart3,
  FileCheck2,
  FileText,
  ArrowRight,
  Sparkles,
  Info,
  Clock,
  Award,
  LandPlot,
  Ruler
} from 'lucide-react';
import { motion } from 'motion/react';
import { Asset, AsetTanah } from '../types';
import PondokLogo from './PondokLogo';
import MenuHeroBanner from './MenuHeroBanner';

interface DashboardProps {
  assets: Asset[];
  onNavigateToTab: (tab: string) => void;
  syncStatus: 'synced' | 'pending' | 'offline';
  onSyncManual: () => void;
  googleUser: any;
  googleToken: string | null;
  onSignInGoogle: () => void;
  onLogoutGoogle: () => void;
  spreadsheetId: string;
  onUpdateSpreadsheetId: (newId: string) => Promise<void>;
  sheetsConnected: boolean;
  sheetsError: string | null;
}

export default function Dashboard({ 
  assets, 
  onNavigateToTab, 
  syncStatus, 
  onSyncManual,
  googleUser,
  googleToken,
  onSignInGoogle,
  onLogoutGoogle,
  spreadsheetId,
  onUpdateSpreadsheetId,
  sheetsConnected,
  sheetsError,
}: DashboardProps) {
  const [chartView, setChartView] = useState<'bar' | 'horizontal'>('bar');
  const [selectedBarId, setSelectedBarId] = useState<string | null>(null);

  const tanahAssets = assets.filter(a => a.type === 'tanah') as AsetTanah[];
  const tanahCount = tanahAssets.length;
  const kendaraanCount = assets.filter(a => a.type === 'kendaraan').length;
  const bangunanCount = assets.filter(a => a.type === 'bangunan').length;

  // Helper to verify if atasNama matches Yayasan Pondok Pesantren Muttaqin Josenan
  const isAtasNamaYayasan = (name?: string) => {
    if (!name) return false;
    const n = name.toLowerCase().trim();
    return (
      n.includes('muttaqin') || 
      n.includes('mutaqin') || 
      n.includes('josenan') ||
      (n.includes('yayasan') && (n.includes('pesantren') || n.includes('pondok') || n.includes('pp')))
    );
  };

  // Helper to safely parse land area
  const parseLuas = (val: any): number => {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const str = String(val).trim();
    if (str.includes(',') && str.includes('.')) {
      if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
        const clean = str.replace(/\./g, '').replace(',', '.');
        const num = parseFloat(clean);
        return isNaN(num) ? 0 : num;
      } else {
        const clean = str.replace(/,/g, '');
        const num = parseFloat(clean);
        return isNaN(num) ? 0 : num;
      }
    } else if (str.includes(',')) {
      const clean = str.replace(',', '.');
      const num = parseFloat(clean);
      return isNaN(num) ? 0 : num;
    }
    const clean = str.replace(/[^0-9.-]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  // Helper to format land area
  const formatLuas = (luas: number) => {
    if (!luas || isNaN(luas)) return '0 m²';
    const hasDecimal = luas % 1 !== 0;
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: hasDecimal ? 1 : 0,
      maximumFractionDigits: 2,
    }).format(luas) + ' m²';
  };

  const formatHektar = (luasInM2: number) => {
    if (!luasInM2 || isNaN(luasInM2) || luasInM2 < 100) return null;
    const ha = luasInM2 / 10000;
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
    }).format(ha) + ' Hektar (Ha)';
  };

  // Luas Tanah Aggregations
  const tanahWithLuasCount = tanahAssets.filter(a => parseLuas(a.luasTanah) > 0).length;
  const totalLuasTanah = tanahAssets.reduce((sum, a) => sum + parseLuas(a.luasTanah), 0);
  const avgLuasTanah = tanahWithLuasCount > 0 ? totalLuasTanah / tanahWithLuasCount : 0;

  // 1. Total Semua Sertifikat Tanah
  const countSemua = tanahCount;

  // 2. SHM a.n. Yayasan Pondok Pesantren Muttaqin Josenan
  const shmAssetsYayasan = tanahAssets.filter(a => {
    const jenis = (a.jenisSertifikat || '').toUpperCase().trim();
    return (jenis === 'SHM' || jenis.includes('MILIK')) && isAtasNamaYayasan(a.atasNamaSertifikat);
  });
  const countSHMYayasan = shmAssetsYayasan.length;
  const luasSHMYayasan = shmAssetsYayasan.reduce((sum, a) => sum + parseLuas(a.luasTanah), 0);

  // 3. SHGB a.n. Yayasan Pondok Pesantren Muttaqin Josenan
  const shgbAssetsYayasan = tanahAssets.filter(a => {
    const jenis = (a.jenisSertifikat || '').toUpperCase().trim();
    return (jenis === 'SHGB' || jenis === 'HGB' || jenis.includes('BANGUNAN')) && isAtasNamaYayasan(a.atasNamaSertifikat);
  });
  const countSHGBYayasan = shgbAssetsYayasan.length;
  const luasSHGBYayasan = shgbAssetsYayasan.reduce((sum, a) => sum + parseLuas(a.luasTanah), 0);

  // 4. SERTIFIKAT WAQAF a.n. Yayasan Pondok Pesantren Muttaqin Josenan
  const wakafAssetsYayasan = tanahAssets.filter(a => {
    const jenis = (a.jenisSertifikat || '').toUpperCase().trim();
    return (
      jenis.includes('WAKAF') || 
      jenis.includes('WAQAF') || 
      jenis.includes('AIW') || 
      jenis.includes('APAIW')
    ) && isAtasNamaYayasan(a.atasNamaSertifikat);
  });
  const countWakafYayasan = wakafAssetsYayasan.length;
  const luasWakafYayasan = wakafAssetsYayasan.reduce((sum, a) => sum + parseLuas(a.luasTanah), 0);

  // 5. Sertifikat yang belum atas nama yayasan (misal masih perorangan, pemilik lama, letter C)
  const belumYayasanAssets = tanahAssets.filter(a => !isAtasNamaYayasan(a.atasNamaSertifikat));
  const countBelumYayasan = belumYayasanAssets.length;
  const luasBelumYayasan = belumYayasanAssets.reduce((sum, a) => sum + parseLuas(a.luasTanah), 0);

  // Total sertifikat resmi atas nama Yayasan PP Muttaqin Josenan
  const totalSertifikatYayasan = countSHMYayasan + countSHGBYayasan + countWakafYayasan;
  const totalLuasYayasan = luasSHMYayasan + luasSHGBYayasan + luasWakafYayasan;
  const persentaseYayasan = countSemua > 0 ? Math.round((totalSertifikatYayasan / countSemua) * 100) : 0;
  const persentaseLuasYayasan = totalLuasTanah > 0 ? Math.round((totalLuasYayasan / totalLuasTanah) * 100) : 0;
  const maxChartVal = Math.max(countSemua, 1);

  const certChartItems = [
    {
      id: 'semua',
      title: 'Semua Sertifikat',
      shortTitle: 'Semua',
      category: 'Total Database',
      count: countSemua,
      luas: totalLuasTanah,
      percentOfTotal: 100,
      gradient: 'from-sky-600 to-sky-800',
      barColor: 'bg-sky-600',
      badgeBg: 'bg-sky-50 text-sky-800 border-sky-200',
      iconText: '📜',
      desc: 'Seluruh bidang tanah yang tercatat di database'
    },
    {
      id: 'shm',
      title: 'SHM a.n. Yayasan',
      shortTitle: 'SHM Yayasan',
      category: 'Hak Milik Yayasan',
      count: countSHMYayasan,
      luas: luasSHMYayasan,
      percentOfTotal: countSemua > 0 ? Math.round((countSHMYayasan / countSemua) * 100) : 0,
      gradient: 'from-emerald-500 to-emerald-700',
      barColor: 'bg-emerald-600',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      iconText: '📗',
      desc: 'SHM a.n. Yayasan Pondok Pesantren Muttaqin Josenan'
    },
    {
      id: 'shgb',
      title: 'SHGB a.n. Yayasan',
      shortTitle: 'SHGB Yayasan',
      category: 'Guna Bangunan Yayasan',
      count: countSHGBYayasan,
      luas: luasSHGBYayasan,
      percentOfTotal: countSemua > 0 ? Math.round((countSHGBYayasan / countSemua) * 100) : 0,
      gradient: 'from-blue-600 to-indigo-700',
      barColor: 'bg-indigo-600',
      badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      iconText: '📘',
      desc: 'SHGB a.n. Yayasan Pondok Pesantren Muttaqin Josenan'
    },
    {
      id: 'wakaf',
      title: 'Sertifikat Waqaf',
      shortTitle: 'Waqaf Yayasan',
      category: 'Waqaf a.n. Yayasan',
      count: countWakafYayasan,
      luas: luasWakafYayasan,
      percentOfTotal: countSemua > 0 ? Math.round((countWakafYayasan / countSemua) * 100) : 0,
      gradient: 'from-teal-500 to-teal-700',
      barColor: 'bg-teal-600',
      badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
      iconText: '🕌',
      desc: 'Sertifikat Waqaf a.n. Yayasan Pondok Pesantren Muttaqin Josenan'
    },
    {
      id: 'belum',
      title: 'Belum a.n. Yayasan',
      shortTitle: 'Belum Balik Nama',
      category: 'Perlu Balik Nama',
      count: countBelumYayasan,
      luas: luasBelumYayasan,
      percentOfTotal: countSemua > 0 ? Math.round((countBelumYayasan / countSemua) * 100) : 0,
      gradient: 'from-amber-500 to-rose-600',
      barColor: 'bg-rose-500',
      badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
      iconText: '⏳',
      desc: 'Sertifikat belum atas nama Yayasan (masih perorangan/wakif)'
    }
  ];

  // Filter land assets matching "Yayasan Pondok Pesantren Muttaqin Josenan"
  const yayasanLandAssets = tanahAssets.filter(a => isAtasNamaYayasan(a.atasNamaSertifikat));

  // Group vehicles by jenisKendaraan dynamically from the database
  const kendaraanJenis = assets
    .filter(a => a.type === 'kendaraan')
    .reduce(
      (acc, curr: any) => {
        const jenis = String(curr.jenisKendaraan || 'MOTOR').toUpperCase();
        acc[jenis] = (acc[jenis] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

  const getJenisColor = (jenis: string) => {
    switch (jenis) {
      case 'MOTOR': return { bg: 'bg-indigo-500', text: 'text-indigo-700' };
      case 'MOBIL': return { bg: 'bg-amber-500', text: 'text-amber-700' };
      case 'ELF': return { bg: 'bg-sky-500', text: 'text-sky-700' };
      case 'BUS': return { bg: 'bg-rose-500', text: 'text-rose-700' };
      default: return { bg: 'bg-sky-500', text: 'text-sky-700' };
    }
  };

  const bangunanKondisi = assets
    .filter(a => a.type === 'bangunan')
    .reduce(
      (acc, curr: any) => {
        const cond = curr.kondisi;
        if (cond === 'BAIK') acc.baik++;
        else if (cond === 'RUSAK RINGAN') acc.ringan++;
        else if (cond === 'RUSAK BERAT') acc.berat++;
        return acc;
      },
      { baik: 0, ringan: 0, berat: 0 }
    );

  // Recent Inputs
  const recentAssets = [...assets].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);

  return (
    <div className="space-y-6 pb-20">
      {/* Header Hero */}
      <MenuHeroBanner
        title="DAFTAR ASET SB DAERAH MADIUN"
        subtitle="Sistem Informasi Manajemen Terpadu untuk Tanah, Kendaraan Mobilisasi, dan Bangunan Gedung Madiun."
        badgeText="TIM PENGHIMPUN BENDA SABILILLAH"
        rightElement={
          <button 
            onClick={onSyncManual}
            className={`p-2 rounded-xl transition-all duration-300 touch-manipulation focus:outline-none flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
              syncStatus === 'synced' 
                ? 'bg-sky-700/40 text-sky-300 border border-sky-600/30' 
                : 'bg-amber-500 text-sky-950 font-bold'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'pending' ? 'animate-spin' : ''}`} />
            <span>{syncStatus === 'synced' ? 'Tersinkron' : 'Sinkronkan'}</span>
          </button>
        }
      />

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Card Tanah */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08 }}
          onClick={() => onNavigateToTab('database')}
          className="bg-white p-3.5 rounded-2xl shadow-sm border-2 border-slate-200 flex flex-col justify-between cursor-pointer hover:border-sky-300 hover:shadow-md transition-all duration-200 active:scale-95"
        >
          <div className="p-2 bg-sky-100 text-sky-700 rounded-xl w-9 h-9 flex items-center justify-center">
            <span className="text-lg">🏘️</span>
          </div>
          <div className="mt-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase leading-tight">Tanah</p>
            <p className="text-lg font-black text-slate-900 mt-1">{tanahCount} <span className="text-[10px] font-normal text-slate-400">Unit</span></p>
          </div>
        </motion.div>

        {/* Card Kendaraan */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.12 }}
          onClick={() => onNavigateToTab('database')}
          className="bg-white p-3.5 rounded-2xl shadow-sm border-2 border-slate-200 flex flex-col justify-between cursor-pointer hover:border-amber-300 hover:shadow-md transition-all duration-200 active:scale-95"
        >
          <div className="p-2 bg-amber-100 text-amber-600 rounded-xl w-9 h-9 flex items-center justify-center">
            <span className="text-lg">🚐</span>
          </div>
          <div className="mt-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase leading-tight">Kendaraan</p>
            <p className="text-lg font-black text-slate-900 mt-1">{kendaraanCount} <span className="text-[10px] font-normal text-slate-400">Unit</span></p>
          </div>
        </motion.div>

        {/* Card Bangunan */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.16 }}
          onClick={() => onNavigateToTab('database')}
          className="bg-white p-3.5 rounded-2xl shadow-sm border-2 border-slate-200 flex flex-col justify-between cursor-pointer hover:border-purple-300 hover:shadow-md transition-all duration-200 active:scale-95"
        >
          <div className="p-2 bg-purple-100 text-purple-600 rounded-xl w-9 h-9 flex items-center justify-center">
            <span className="text-lg">🏢</span>
          </div>
          <div className="mt-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase leading-tight">Bangunan</p>
            <p className="text-lg font-black text-slate-900 mt-1">{bangunanCount} <span className="text-[10px] font-normal text-slate-400">Unit</span></p>
          </div>
        </motion.div>
      </div>

      {/* CARD UTAMA: REKAPITULASI TOTAL LUAS TANAH */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onClick={() => onNavigateToTab('database')}
        className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border-2 border-slate-200 hover:border-sky-300 hover:shadow-md transition-all duration-200 cursor-pointer space-y-4"
      >
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-800 border border-sky-100 flex items-center justify-center shadow-2xs shrink-0">
              <LandPlot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-800 uppercase tracking-wide">
                  Total Luas Tanah Terinput
                </h3>
                <span className="bg-sky-100 text-sky-800 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                  {tanahCount} Bidang
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Akumulasi seluruh bidang tanah yang tercatat di database Madiun
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl border border-sky-100 transition-colors">
            <span>Buka Database</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Main Number & Quick Stats */}
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-baseline gap-2.5">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {formatLuas(totalLuasTanah)}
            </span>
            {formatHektar(totalLuasTanah) && (
              <span className="text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
                ≈ {formatHektar(totalLuasTanah)}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            {tanahWithLuasCount < tanahCount ? (
              <span>
                <strong className="text-slate-700">{tanahWithLuasCount}</strong> dari {tanahCount} bidang terisi luas
                {tanahWithLuasCount > 0 && ` • Rata-rata ${formatLuas(avgLuasTanah)} / bidang`}
              </span>
            ) : (
              <span>
                Rata-rata <strong className="text-slate-700">{formatLuas(avgLuasTanah)}</strong> per bidang tanah
              </span>
            )}
          </div>
        </div>

        {/* 4 Clean Metric Blocks Matching App Theme */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 hover:bg-slate-100/60 transition-colors">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
              <span className="flex items-center gap-1">
                <span>📗</span>
                <span>SHM Yayasan</span>
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">{countSHMYayasan} unit</span>
            </div>
            <p className="text-sm sm:text-base font-black text-slate-900 mt-1.5">
              {formatLuas(luasSHMYayasan)}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 hover:bg-slate-100/60 transition-colors">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
              <span className="flex items-center gap-1">
                <span>🕌</span>
                <span>Wakaf Yayasan</span>
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">{countWakafYayasan} unit</span>
            </div>
            <p className="text-sm sm:text-base font-black text-slate-900 mt-1.5">
              {formatLuas(luasWakafYayasan)}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 hover:bg-slate-100/60 transition-colors">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
              <span className="flex items-center gap-1">
                <span>📘</span>
                <span>SHGB Yayasan</span>
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">{countSHGBYayasan} unit</span>
            </div>
            <p className="text-sm sm:text-base font-black text-slate-900 mt-1.5">
              {formatLuas(luasSHGBYayasan)}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 hover:bg-slate-100/60 transition-colors">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
              <span className="flex items-center gap-1">
                <span>⏳</span>
                <span>Belum Yayasan</span>
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">{countBelumYayasan} unit</span>
            </div>
            <p className="text-sm sm:text-base font-black text-slate-900 mt-1.5">
              {formatLuas(luasBelumYayasan)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* DIAGRAM BATANG STATUS SERTIFIKAT TANAH */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border-2 border-slate-200/90 space-y-6"
      >
        {/* Card Header with View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-800 border border-sky-100 flex items-center justify-center shadow-2xs shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-800 uppercase tracking-wide">
                  Status Sertifikat Tanah
                </h3>
                <span className="bg-sky-100 text-sky-800 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                  Total {countSemua} Bidang
                </span>
              </div>
            </div>
          </div>

          {/* Toggle View Mode */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setChartView('bar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartView === 'bar'
                  ? 'bg-white text-sky-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📊 Batang Tegak
            </button>
            <button
              type="button"
              onClick={() => setChartView('horizontal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartView === 'horizontal'
                  ? 'bg-white text-sky-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📑 Rincian Mendatar
            </button>
          </div>
        </div>

        {/* VIEW 1: VERTICAL BAR CHART */}
        {chartView === 'bar' && (
          <div className="relative pt-6 pb-2">
            {/* Chart Background Grid Lines */}
            <div className="absolute inset-0 top-6 bottom-20 flex flex-col justify-between pointer-events-none opacity-40">
              <div className="border-b border-dashed border-slate-200 w-full flex justify-between">
                <span className="text-[9px] font-mono text-slate-400 -mt-2 bg-white pr-1">100% ({maxChartVal})</span>
              </div>
              <div className="border-b border-dashed border-slate-200 w-full flex justify-between">
                <span className="text-[9px] font-mono text-slate-400 -mt-2 bg-white pr-1">75%</span>
              </div>
              <div className="border-b border-dashed border-slate-200 w-full flex justify-between">
                <span className="text-[9px] font-mono text-slate-400 -mt-2 bg-white pr-1">50%</span>
              </div>
              <div className="border-b border-dashed border-slate-200 w-full flex justify-between">
                <span className="text-[9px] font-mono text-slate-400 -mt-2 bg-white pr-1">25%</span>
              </div>
              <div className="border-b border-slate-200 w-full flex justify-between">
                <span className="text-[9px] font-mono text-slate-400 -mt-2 bg-white pr-1">0</span>
              </div>
            </div>

            {/* Bars Columns Container */}
            <div className="relative z-10 grid grid-cols-5 gap-2 sm:gap-4 h-64 sm:h-72 items-end pt-8 px-1 sm:px-6">
              {certChartItems.map((item) => {
                const heightPct = maxChartVal > 0 ? (item.count / maxChartVal) * 100 : 0;
                const isSelected = selectedBarId === item.id;

                return (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedBarId(isSelected ? null : item.id)}
                    className="flex flex-col items-center h-full justify-end group cursor-pointer"
                  >
                    {/* Floating Value Pill */}
                    <div className={`mb-2 transition-all duration-200 text-center ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`}>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-black shadow-2xs border ${item.badgeBg}`}>
                        <span>{item.count}</span>
                        <span className="text-[9px] font-medium hidden sm:inline">unit</span>
                      </span>
                    </div>

                    {/* The Vertical Bar */}
                    <div className="w-full max-w-[56px] bg-slate-100/90 rounded-t-2xl p-1 flex items-end h-full">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${item.count === 0 ? 6 : Math.max(heightPct, 12)}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className={`w-full rounded-t-xl bg-gradient-to-t ${item.gradient} shadow-sm transition-all duration-300 relative overflow-hidden group-hover:brightness-110 ${
                          isSelected ? 'ring-4 ring-sky-300' : ''
                        } ${item.count === 0 ? 'opacity-30' : 'opacity-100'}`}
                      >
                        {/* Subtle Glass Highlight */}
                        <div className="absolute inset-x-0 top-0 h-1/3 bg-white/20 rounded-t-xl pointer-events-none" />
                        {item.count > 0 && (
                          <div className="absolute bottom-1 inset-x-0 text-center text-white/95 text-[10px] font-black hidden sm:block">
                            {item.percentOfTotal}%
                          </div>
                        )}
                      </motion.div>
                    </div>

                    {/* Bottom Labels */}
                    <div className="mt-3 text-center w-full px-0.5">
                      <span className="text-base sm:text-lg block leading-none mb-1">
                        {item.iconText}
                      </span>
                      <h4 className="text-[10px] sm:text-xs font-black text-slate-800 line-clamp-2 leading-tight">
                        {item.shortTitle}
                      </h4>
                      <span className="text-[9px] text-slate-400 font-bold block mt-0.5">
                        {item.percentOfTotal}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: HORIZONTAL BARS VIEW */}
        {chartView === 'horizontal' && (
          <div className="space-y-3 pt-1">
            {certChartItems.map((item) => {
              const widthPct = maxChartVal > 0 ? (item.count / maxChartVal) * 100 : 0;
              return (
                <div 
                  key={item.id}
                  className="p-3.5 bg-slate-50/80 border border-slate-200/90 rounded-2xl space-y-2 hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{item.iconText}</span>
                      <span className="font-extrabold text-slate-800">{item.title}</span>
                      <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">({item.category})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${item.badgeBg}`}>
                        {item.count} Unit ({item.percentOfTotal}%)
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Progress Bar */}
                  <div className="w-full bg-slate-200/80 rounded-full h-3 overflow-hidden p-0.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.count === 0 ? 0 : Math.max(widthPct, 4)}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={`h-full rounded-full bg-gradient-to-r ${item.gradient} shadow-2xs`}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Progress Rekapitulasi Yayasan */}
        <div className="bg-sky-50/60 border border-sky-200/80 rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🛡️</span>
              <div>
                <h4 className="text-xs font-black text-sky-950 uppercase tracking-wide">
                  Progres Sertifikasi Yayasan PP Muttaqin Josenan
                </h4>
                <p className="text-[11px] text-sky-700">
                  {totalSertifikatYayasan} dari {countSemua} sertifikat tanah resmi a.n. Yayasan ({persentaseYayasan}%)
                </p>
              </div>
            </div>

            {countBelumYayasan > 0 ? (
              <button
                type="button"
                onClick={() => onNavigateToTab('balik-nama')}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs self-start sm:self-auto cursor-pointer"
              >
                <span>Proses Balik Nama ({countBelumYayasan} Aset)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Selesai Balik Nama</span>
              </span>
            )}
          </div>

          <div className="w-full bg-slate-200/80 rounded-full h-3 overflow-hidden p-0.5">
            <div 
              className="bg-sky-600 h-full rounded-full transition-all duration-600 shadow-inner" 
              style={{ width: `${countSemua ? (totalSertifikatYayasan / countSemua) * 100 : 0}%` }}
            />
          </div>

          {countBelumYayasan > 0 ? (
            <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
              ⚠️ Masih ada <strong>{countBelumYayasan} sertifikat</strong> yang belum atas nama Yayasan Pondok Pesantren Muttaqin Josenan (masih atas nama perorangan atau wakif terdahulu). Anda dapat memantau atau memperbarui tahapannya di menu <strong>Balik Nama</strong>.
            </p>
          ) : (
            <p className="text-[11px] text-emerald-900 leading-relaxed font-medium">
              ✅ Seluruh sertifikat tanah saat ini telah resmi tercatat atas nama <strong>Yayasan Pondok Pesantren Muttaqin Josenan Madiun</strong>.
            </p>
          )}
        </div>
      </motion.div>

      {/* Conditions Monitor */}
      <div className="grid grid-cols-1 gap-4">
        {/* Jenis Kendaraan */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border-2 border-slate-200 space-y-3.5 hover:border-slate-300 transition-all duration-200">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">📊 Jenis Kendaraan di Database</span>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">({kendaraanCount} Unit)</span>
          </h3>
          <div className="space-y-3">
            {kendaraanCount === 0 ? (
              <p className="text-slate-400 text-xs font-medium text-center py-4">Belum ada data kendaraan.</p>
            ) : (
              Object.entries(kendaraanJenis).map(([jenis, count]) => {
                const colors = getJenisColor(jenis);
                const percent = (count / kendaraanCount) * 100;
                return (
                  <div key={jenis}>
                    <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1.5">
                      <span>{jenis}</span>
                      <span className={colors.text}>{count} unit ({Math.round(percent)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`${colors.bg} h-full rounded-full transition-all duration-500`} 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Kondisi Bangunan */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border-2 border-slate-200 space-y-3.5 hover:border-slate-300 transition-all duration-200">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">🏢 Kondisi Bangunan Gedung</span>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">({bangunanCount} Gedung)</span>
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1.5">
                <span>Baik</span>
                <span className="text-sky-700">{bangunanKondisi.baik} unit</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-sky-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${bangunanCount ? (bangunanKondisi.baik / bangunanCount) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1.5">
                <span>Rusak Ringan</span>
                <span className="text-amber-700">{bangunanKondisi.ringan} unit</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${bangunanCount ? (bangunanKondisi.ringan / bangunanCount) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1.5">
                <span>Rusak Berat</span>
                <span className="text-rose-700">{bangunanKondisi.berat} unit</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${bangunanCount ? (bangunanKondisi.berat / bangunanCount) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border-2 border-slate-200 hover:border-slate-300 transition-all duration-200 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <span>📝 Aktivitas Input Terakhir</span>
            <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">Terbaru</span>
          </h3>
          <button 
            type="button"
            onClick={() => onNavigateToTab('database')}
            className="text-xs text-sky-800 font-bold hover:underline bg-sky-50 px-2.5 py-1 rounded-lg hover:bg-sky-100 transition-colors"
          >
            Lihat Semua
          </button>
        </div>
        
        {recentAssets.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs font-medium">
            Belum ada aset terdaftar. Silakan masukkan data di Tab "Input Aset".
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentAssets.map((asset) => (
              <div key={asset.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl text-lg ${
                    asset.type === 'tanah' ? 'bg-sky-50 text-sky-700' :
                    asset.type === 'kendaraan' ? 'bg-amber-50 text-amber-700' : 'bg-purple-50 text-purple-700'
                  }`}>
                    {asset.type === 'tanah' && '🏘️'}
                    {asset.type === 'kendaraan' && '🚐'}
                    {asset.type === 'bangunan' && '🏢'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 leading-snug">
                      {asset.type === 'tanah' && `${asset.jenisSertifikat} - No. ${asset.nomerSertifikat}`}
                      {asset.type === 'kendaraan' && `${asset.merk} (${asset.nomorPolisi})`}
                      {asset.type === 'bangunan' && asset.namaBangunan}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Lokasi: {asset.type === 'kendaraan' ? (asset as any).atasNama : asset.lokasi}
                      {asset.type === 'tanah' && (asset as any).luasTanah ? ` • Luas: ${Number((asset as any).luasTanah).toLocaleString('id-ID')} m²` : ''}
                      {asset.type === 'bangunan' && (asset as any).luasBangunan ? ` • Luas: ${Number((asset as any).luasBangunan).toLocaleString('id-ID')} m²` : ''}
                    </span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                    asset.type === 'tanah' ? 'bg-sky-100 text-sky-700' :
                    asset.type === 'kendaraan' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {asset.type}
                  </span>
                  <div className="text-[9px] text-slate-400 mt-1 font-mono">
                    {new Date(asset.createdAt).toLocaleDateString('id-ID')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Input Guide */}
      <div className="bg-amber-50/70 border-2 border-amber-200/50 p-5 rounded-2xl text-slate-800 text-xs leading-relaxed space-y-1.5 shadow-sm">
        <h4 className="font-extrabold text-amber-800 flex items-center gap-1 text-sm">💡 Petunjuk Input Ponsel:</h4>
        <p className="text-slate-600 font-medium">Aplikasi didesain khusus agar ringan & mudah diisi langsung dari lokasi lapangan (menggunakan Handphone). Anda bisa langsung mencatat ketika survei:</p>
        <ol className="list-decimal pl-4 mt-2 space-y-1 font-semibold text-slate-700">
          <li>Pilih tab <span className="text-amber-850 font-bold">"Input Aset"</span> untuk mencatat.</li>
          <li>Data tersimpan aman di <span className="text-amber-850 font-bold">Cloud Server</span> &amp; <span className="text-amber-850 font-bold">Local Storage</span> browser Anda.</li>
          <li>Ekspor data ke <span className="text-amber-850 font-bold">Google Sheets / Excel (CSV)</span> di tab <span className="text-amber-850 font-bold">"Ekspor"</span>.</li>
        </ol>
      </div>
    </div>
  );
}
