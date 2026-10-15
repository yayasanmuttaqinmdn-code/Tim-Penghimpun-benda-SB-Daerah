import { useState, useEffect, useRef } from 'react';
import { 
  Car, 
  Building, 
  RefreshCw, 
  CheckCircle2, 
  BarChart3,
  ArrowRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  FolderOpen,
  ArrowUpRight,
  Eye,
  Pause,
  Play,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Asset, AsetTanah, AsetKendaraan, AsetBangunan } from '../types';
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

interface DetailDrawerData {
  id: string;
  title: string;
  category: string;
  iconText: string;
  count: number;
  luas?: number;
  assets: Asset[];
  badgeBg: string;
  desc?: string;
}

export default function Dashboard({ 
  assets, 
  onNavigateToTab, 
  syncStatus, 
  onSyncManual,
}: DashboardProps) {
  // Carousel Slide State (Executive Highlights - 3 Clean Slides)
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [slideDirection, setSlideDirection] = useState<number>(1);
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(true);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Interactive Detail Drawer State
  const [detailDrawer, setDetailDrawer] = useState<DetailDrawerData | null>(null);
  const [drawerSearch, setDrawerSearch] = useState<string>('');

  // Asset counts & helpers
  const tanahAssets = assets.filter(a => a.type === 'tanah') as AsetTanah[];
  const kendaraanAssets = assets.filter(a => a.type === 'kendaraan') as AsetKendaraan[];
  const bangunanAssets = assets.filter(a => a.type === 'bangunan') as AsetBangunan[];

  const tanahCount = tanahAssets.length;
  const kendaraanCount = kendaraanAssets.length;
  const bangunanCount = bangunanAssets.length;
  const totalAssetsCount = assets.length;

  // Helper to verify if atasNama matches Yayasan PP Muttaqin Josenan
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
  const formatLuas = (luas?: number) => {
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

  // Aggregations
  const totalLuasTanah = tanahAssets.reduce((sum, a) => sum + parseLuas(a.luasTanah), 0);

  const shmAssetsYayasan = tanahAssets.filter(a => {
    const jenis = (a.jenisSertifikat || '').toUpperCase().trim();
    return (jenis === 'SHM' || jenis.includes('MILIK')) && isAtasNamaYayasan(a.atasNamaSertifikat);
  });
  const countSHMYayasan = shmAssetsYayasan.length;
  const luasSHMYayasan = shmAssetsYayasan.reduce((sum, a) => sum + parseLuas(a.luasTanah), 0);

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

  const shgbAssetsYayasan = tanahAssets.filter(a => {
    const jenis = (a.jenisSertifikat || '').toUpperCase().trim();
    return (jenis === 'SHGB' || jenis === 'HGB' || jenis.includes('BANGUNAN')) && isAtasNamaYayasan(a.atasNamaSertifikat);
  });
  const countSHGBYayasan = shgbAssetsYayasan.length;
  const luasSHGBYayasan = shgbAssetsYayasan.reduce((sum, a) => sum + parseLuas(a.luasTanah), 0);

  const belumYayasanAssets = tanahAssets.filter(a => !isAtasNamaYayasan(a.atasNamaSertifikat));
  const countBelumYayasan = belumYayasanAssets.length;
  const luasBelumYayasan = belumYayasanAssets.reduce((sum, a) => sum + parseLuas(a.luasTanah), 0);

  const totalSertifikatYayasan = countSHMYayasan + countSHGBYayasan + countWakafYayasan;
  const persentaseYayasan = tanahCount > 0 ? Math.round((totalSertifikatYayasan / tanahCount) * 100) : 0;
  const maxChartVal = Math.max(tanahCount, 1);

  const sedangBalikNamaCount = assets.filter(a => a.sedangBalikNama).length;
  const sedangDipinjamCount = assets.filter(a => a.sedangDipinjam).length;

  const kendaraanJenis = kendaraanAssets.reduce(
    (acc, curr: any) => {
      const jenis = String(curr.jenisKendaraan || 'MOTOR').toUpperCase();
      acc[jenis] = (acc[jenis] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const bangunanKondisi = bangunanAssets.reduce(
    (acc, curr: any) => {
      const cond = curr.kondisi;
      if (cond === 'BAIK') acc.baik++;
      else if (cond === 'RUSAK RINGAN') acc.ringan++;
      else if (cond === 'RUSAK BERAT') acc.berat++;
      return acc;
    },
    { baik: 0, ringan: 0, berat: 0 }
  );

  // Auto-play timer for Carousel (4 slides)
  const TOTAL_SLIDES = 4;
  useEffect(() => {
    if (!isAutoPlay) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    autoPlayTimerRef.current = setInterval(() => {
      setSlideDirection(1);
      setActiveSlide(prev => (prev + 1) % TOTAL_SLIDES);
    }, 6500);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isAutoPlay]);

  const handlePrevSlide = () => {
    setIsAutoPlay(false);
    setSlideDirection(-1);
    setActiveSlide(prev => (prev - 1 + TOTAL_SLIDES) % TOTAL_SLIDES);
  };

  const handleNextSlide = () => {
    setIsAutoPlay(false);
    setSlideDirection(1);
    setActiveSlide(prev => (prev + 1) % TOTAL_SLIDES);
  };

  const handleSelectSlide = (idx: number) => {
    setIsAutoPlay(false);
    setSlideDirection(idx > activeSlide ? 1 : -1);
    setActiveSlide(idx);
  };

  const handleSlideDragEnd = (_: any, info: any) => {
    const swipeThreshold = 45;
    if (info.offset.x < -swipeThreshold) {
      handleNextSlide();
    } else if (info.offset.x > swipeThreshold) {
      handlePrevSlide();
    }
  };

  // Open Drawer for a category
  const handleOpenDrawer = (item: {
    id: string;
    title: string;
    category: string;
    iconText: string;
    count: number;
    luas?: number;
    matchingAssets: Asset[];
    badgeBg?: string;
    desc?: string;
  }) => {
    setDrawerSearch('');
    setDetailDrawer({
      id: item.id,
      title: item.title,
      category: item.category,
      iconText: item.iconText,
      count: item.count,
      luas: item.luas,
      assets: item.matchingAssets,
      badgeBg: item.badgeBg || 'bg-sky-50 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300',
      desc: item.desc
    });
  };

  // Filtered Assets inside detail drawer
  const filteredDrawerAssets = (detailDrawer?.assets || []).filter(a => {
    if (!drawerSearch.trim()) return true;
    const q = drawerSearch.toLowerCase();
    if (a.type === 'tanah') {
      return (
        (a.nomerSertifikat || '').toLowerCase().includes(q) ||
        (a.atasNamaSertifikat || '').toLowerCase().includes(q) ||
        (a.lokasi || '').toLowerCase().includes(q)
      );
    } else if (a.type === 'kendaraan') {
      return (
        (a.nomorPolisi || '').toLowerCase().includes(q) ||
        (a.merk || '').toLowerCase().includes(q) ||
        (a.atasNama || '').toLowerCase().includes(q)
      );
    } else if (a.type === 'bangunan') {
      return (
        (a.namaBangunan || '').toLowerCase().includes(q) ||
        (a.lokasi || '').toLowerCase().includes(q)
      );
    }
    return false;
  });

  // Recent 4 Assets
  const recentAssets = [...assets]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 4);

  // Slide Animation Variants (Smooth Tactile Spring)
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 180 : -180,
      opacity: 0,
      scale: 0.98
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring', stiffness: 320, damping: 28 },
        opacity: { duration: 0.22 }
      }
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -180 : 180,
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: 'spring', stiffness: 320, damping: 28 },
        opacity: { duration: 0.18 }
      }
    })
  };

  // Certificate Status Chart Items
  const certChartItems = [
    {
      id: 'shm',
      title: 'SHM Yayasan',
      category: 'Hak Milik Yayasan',
      count: countSHMYayasan,
      luas: luasSHMYayasan,
      percentOfTotal: tanahCount > 0 ? Math.round((countSHMYayasan / tanahCount) * 100) : 0,
      gradient: 'from-emerald-500 to-emerald-700',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      iconText: '📗',
      desc: 'Sertifikat Hak Milik resmi atas nama Yayasan PP Muttaqin Josenan',
      matchingAssets: shmAssetsYayasan
    },
    {
      id: 'wakaf',
      title: 'Sertifikat Waqaf',
      category: 'Waqaf Yayasan',
      count: countWakafYayasan,
      luas: luasWakafYayasan,
      percentOfTotal: tanahCount > 0 ? Math.round((countWakafYayasan / tanahCount) * 100) : 0,
      gradient: 'from-teal-500 to-teal-700',
      badgeBg: 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800',
      iconText: '🕌',
      desc: 'Sertifikat Waqaf & Akta Ikrar Wakaf resmi kelolaan Yayasan',
      matchingAssets: wakafAssetsYayasan
    },
    {
      id: 'shgb',
      title: 'SHGB Yayasan',
      category: 'Hak Guna Bangunan',
      count: countSHGBYayasan,
      luas: luasSHGBYayasan,
      percentOfTotal: tanahCount > 0 ? Math.round((countSHGBYayasan / tanahCount) * 100) : 0,
      gradient: 'from-sky-600 to-indigo-700',
      badgeBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      iconText: '📘',
      desc: 'Sertifikat Hak Guna Bangunan terdaftar atas nama Yayasan',
      matchingAssets: shgbAssetsYayasan
    },
    {
      id: 'belum',
      title: 'Perlu Balik Nama',
      category: 'Proses Mutasi',
      count: countBelumYayasan,
      luas: luasBelumYayasan,
      percentOfTotal: tanahCount > 0 ? Math.round((countBelumYayasan / tanahCount) * 100) : 0,
      gradient: 'from-amber-500 to-rose-600',
      badgeBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      iconText: '⏳',
      desc: 'Sertifikat masih atas nama wakif lama / perorangan (perlu balik nama)',
      matchingAssets: belumYayasanAssets
    }
  ];

  return (
    <div className="space-y-6 pb-20 font-sans">
      {/* 1. Header Banner */}
      <MenuHeroBanner
        title="DAFTAR ASET SB DAERAH MADIUN"
        subtitle="Sistem Manajemen Aset Terpadu Yayasan Pondok Pesantren Muttaqin Josenan Madiun."
        badgeText="TIM PENGHIMPUN BENDA SABILILLAH"
        rightElement={
          <button 
            type="button"
            onClick={onSyncManual}
            className={`px-3 py-1.5 rounded-xl transition-all touch-manipulation focus:outline-none flex items-center gap-1.5 text-xs font-bold cursor-pointer active:scale-95 shadow-xs ${
              syncStatus === 'synced' 
                ? 'bg-sky-700/50 text-sky-200 border border-sky-600/40 hover:bg-sky-700/70' 
                : 'bg-amber-400 text-sky-950 hover:bg-amber-300'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'pending' ? 'animate-spin' : ''}`} />
            <span>{syncStatus === 'synced' ? 'Tersinkron' : 'Sinkronkan'}</span>
          </button>
        }
      />

      {/* 2. Executive Featured Carousel (Kartu Sorotan Geser Ringkas & Interaktif) */}
      <div className="relative bg-gradient-to-br from-sky-900 via-sky-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-sky-800/40 overflow-hidden select-none">
        {/* Glow Accents */}
        <div className="absolute -top-16 -right-16 w-60 h-60 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Auto-play Timer Indicator Line */}
        {isAutoPlay && (
          <div className="absolute top-0 inset-x-0 h-1 bg-white/10 overflow-hidden z-20 pointer-events-none">
            <motion.div
              key={`slide-progress-${activeSlide}`}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 6.5, ease: 'linear' }}
              className="h-full bg-gradient-to-r from-amber-400 to-amber-300"
            />
          </div>
        )}

        {/* Carousel Header & Controls Bar */}
        <div className="relative z-10 flex items-center justify-between pb-3.5 mb-2 border-b border-sky-800/60">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 rounded-lg bg-amber-400 text-sky-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs">
              <Sparkles className="w-3 h-3" />
              <span>SOROTAN UTAMA</span>
            </span>
            <span className="text-[11px] text-sky-300/90 font-medium hidden sm:inline">
              Geser kartu atau pilih tab untuk melihat rincian kategori
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-play toggle */}
            <button
              type="button"
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              className="p-1.5 rounded-lg text-sky-300 hover:text-white hover:bg-sky-800/60 transition-colors cursor-pointer"
              title={isAutoPlay ? 'Jeda geser otomatis' : 'Mulai geser otomatis'}
            >
              {isAutoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            {/* Prev & Next Arrows */}
            <div className="flex items-center gap-1 bg-sky-800/60 p-0.5 rounded-xl border border-sky-700/50">
              <button
                type="button"
                onClick={handlePrevSlide}
                className="p-1.5 rounded-lg text-sky-200 hover:text-white hover:bg-sky-700 transition-colors cursor-pointer active:scale-95"
                title="Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-mono font-bold px-1.5 text-amber-300 min-w-[32px] text-center">
                {activeSlide + 1} / {TOTAL_SLIDES}
              </span>
              <button
                type="button"
                onClick={handleNextSlide}
                className="p-1.5 rounded-lg text-sky-200 hover:text-white hover:bg-sky-700 transition-colors cursor-pointer active:scale-95"
                title="Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Swipeable Container */}
        <div 
          className="relative min-h-[185px] overflow-hidden cursor-grab active:cursor-grabbing touch-pan-y"
          onMouseEnter={() => setIsAutoPlay(false)}
        >
          <AnimatePresence initial={false} custom={slideDirection} mode="wait">
            {/* SLIDE 0: REKAPITULASI SELURUH DATA ASET TERPADU */}
            {activeSlide === 0 && (
              <motion.div
                key="slide-0"
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.25}
                onDragEnd={handleSlideDragEnd}
                className="w-full flex flex-col justify-between space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span>🌐 Rekapitulasi Menyeluruh Aplikasi</span>
                      <span>·</span>
                      <span className="text-white font-extrabold">{totalAssetsCount} Total Aset Terdata</span>
                    </span>
                    <div className="flex flex-wrap items-baseline gap-2.5 mt-1">
                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        {totalAssetsCount} Aset Terpadu
                      </h2>
                      <span className="text-xs sm:text-sm font-bold text-sky-200 bg-sky-800/60 border border-sky-700/60 px-2.5 py-0.5 rounded-xl">
                        {tanahCount} Tanah · {kendaraanCount} Kendaraan · {bangunanCount} Gedung
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateToTab('database')}
                    className="self-start sm:self-auto px-4 py-2 bg-amber-400 hover:bg-amber-300 text-sky-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <span>Buka Semua Data</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>

                {/* 4 Pillars of Data in App */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div 
                    onClick={() => handleOpenDrawer({
                      id: 'all-tanah',
                      title: 'Data Seluruh Bidang Tanah',
                      category: 'Tanah & Lahan',
                      iconText: '🏘️',
                      count: tanahCount,
                      luas: totalLuasTanah,
                      matchingAssets: tanahAssets,
                      desc: 'Seluruh bidang tanah milik atau kelolaan Yayasan PP Muttaqin Josenan Madiun'
                    })}
                    className="p-2.5 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 transition-colors cursor-pointer group"
                  >
                    <div className="text-[10px] text-sky-200 flex items-center justify-between">
                      <span className="font-semibold">🏘️ Tanah ({tanahCount})</span>
                      <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-sm sm:text-base font-black text-emerald-300 mt-0.5 truncate">
                      {formatLuas(totalLuasTanah)}
                    </p>
                    <p className="text-[10px] text-sky-200/80 mt-0.5">
                      {persentaseYayasan}% a.n. Yayasan
                    </p>
                  </div>

                  <div 
                    onClick={() => handleOpenDrawer({
                      id: 'all-kendaraan',
                      title: 'Data Seluruh Armada Kendaraan',
                      category: 'Armada & Mobilisasi',
                      iconText: '🚐',
                      count: kendaraanCount,
                      matchingAssets: kendaraanAssets,
                      desc: 'Inventaris kendaraan mobil, bus, elf, dan sepeda motor operasional'
                    })}
                    className="p-2.5 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 transition-colors cursor-pointer group"
                  >
                    <div className="text-[10px] text-sky-200 flex items-center justify-between">
                      <span className="font-semibold">🚐 Kendaraan ({kendaraanCount})</span>
                      <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-sm sm:text-base font-black text-amber-300 mt-0.5">
                      {kendaraanCount} <span className="text-[10px] font-medium text-slate-300">Unit</span>
                    </p>
                    <p className="text-[10px] text-sky-200/80 mt-0.5 truncate">
                      {(kendaraanJenis['MOBIL'] || 0) + (kendaraanJenis['ELF'] || 0) + (kendaraanJenis['BUS'] || 0)} Mobil · {kendaraanJenis['MOTOR'] || 0} Motor
                    </p>
                  </div>

                  <div 
                    onClick={() => handleOpenDrawer({
                      id: 'all-bangunan',
                      title: 'Data Seluruh Fasilitas Gedung',
                      category: 'Fasilitas & Bangunan',
                      iconText: '🏢',
                      count: bangunanCount,
                      matchingAssets: bangunanAssets,
                      desc: 'Fasilitas gedung pondok, asrama, sekolah, dan aula pertemuan'
                    })}
                    className="p-2.5 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 transition-colors cursor-pointer group"
                  >
                    <div className="text-[10px] text-sky-200 flex items-center justify-between">
                      <span className="font-semibold">🏢 Gedung ({bangunanCount})</span>
                      <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-sm sm:text-base font-black text-purple-300 mt-0.5">
                      {bangunanCount} <span className="text-[10px] font-medium text-slate-300">Unit</span>
                    </p>
                    <p className="text-[10px] text-sky-200/80 mt-0.5 truncate">
                      {bangunanKondisi.baik} Baik · {bangunanKondisi.ringan + bangunanKondisi.berat} Rawat
                    </p>
                  </div>

                  <div 
                    onClick={() => handleOpenDrawer({
                      id: 'all-berkas',
                      title: 'Data Brankas & Arsip Dokumen',
                      category: 'Brankas & Peminjaman Berkas',
                      iconText: '📁',
                      count: totalAssetsCount,
                      matchingAssets: assets,
                      desc: 'Status penyimpanan berkas fisik sertifikat dan BPKB di brankas'
                    })}
                    className="p-2.5 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 transition-colors cursor-pointer group"
                  >
                    <div className="text-[10px] text-sky-200 flex items-center justify-between">
                      <span className="font-semibold">📁 Brankas & Berkas</span>
                      <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-sm sm:text-base font-black text-sky-300 mt-0.5">
                      {totalAssetsCount - sedangDipinjamCount} <span className="text-[10px] font-medium text-slate-300">Aman</span>
                    </p>
                    <p className="text-[10px] text-amber-300 font-semibold mt-0.5 truncate">
                      {sedangDipinjamCount} Sedang Dipinjam
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SLIDE 1: PORTOFOLIO TANAH & LEGALITAS */}
            {activeSlide === 1 && (
              <motion.div
                key="slide-1"
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.25}
                onDragEnd={handleSlideDragEnd}
                className="w-full flex flex-col justify-between space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span>🏘️ Portofolio Lahan Tanah Madiun</span>
                      <span>·</span>
                      <span className="text-amber-300 font-extrabold">{persentaseYayasan}% Bersertifikat Yayasan</span>
                    </span>
                    <div className="flex flex-wrap items-baseline gap-2.5 mt-1">
                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        {formatLuas(totalLuasTanah)}
                      </h2>
                      {formatHektar(totalLuasTanah) && (
                        <span className="text-xs sm:text-sm font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2.5 py-0.5 rounded-xl">
                          ≈ {formatHektar(totalLuasTanah)}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateToTab('database')}
                    className="self-start sm:self-auto px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-sky-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <span>Lihat {tanahCount} Bidang</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>

                {/* 4 Metric Pills for Tanah */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div 
                    onClick={() => handleOpenDrawer({
                      id: 'shm',
                      title: 'SHM Yayasan',
                      category: 'Hak Milik Yayasan',
                      iconText: '📗',
                      count: countSHMYayasan,
                      luas: luasSHMYayasan,
                      matchingAssets: shmAssetsYayasan,
                      desc: 'Bidang tanah berstatus Sertifikat Hak Milik atas nama Yayasan'
                    })}
                    className="p-2.5 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 transition-colors cursor-pointer group"
                  >
                    <div className="text-[10px] text-sky-200 flex items-center justify-between">
                      <span className="font-semibold">SHM Yayasan</span>
                      <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-sm sm:text-base font-black text-emerald-300 mt-0.5">
                      {countSHMYayasan} <span className="text-[10px] font-medium text-slate-300">Unit</span>
                    </p>
                    <p className="text-[10px] text-sky-200/80 truncate">{formatLuas(luasSHMYayasan)}</p>
                  </div>

                  <div 
                    onClick={() => handleOpenDrawer({
                      id: 'wakaf',
                      title: 'Sertifikat Waqaf',
                      category: 'Waqaf Yayasan',
                      iconText: '🕌',
                      count: countWakafYayasan,
                      luas: luasWakafYayasan,
                      matchingAssets: wakafAssetsYayasan,
                      desc: 'Bidang tanah wakaf resmi yang dikelola Yayasan'
                    })}
                    className="p-2.5 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 transition-colors cursor-pointer group"
                  >
                    <div className="text-[10px] text-sky-200 flex items-center justify-between">
                      <span className="font-semibold">Waqaf</span>
                      <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-sm sm:text-base font-black text-teal-300 mt-0.5">
                      {countWakafYayasan} <span className="text-[10px] font-medium text-slate-300">Unit</span>
                    </p>
                    <p className="text-[10px] text-sky-200/80 truncate">{formatLuas(luasWakafYayasan)}</p>
                  </div>

                  <div 
                    onClick={() => handleOpenDrawer({
                      id: 'shgb',
                      title: 'SHGB Yayasan',
                      category: 'Hak Guna Bangunan',
                      iconText: '📘',
                      count: countSHGBYayasan,
                      luas: luasSHGBYayasan,
                      matchingAssets: shgbAssetsYayasan,
                      desc: 'Sertifikat Hak Guna Bangunan resmi atas nama Yayasan'
                    })}
                    className="p-2.5 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 transition-colors cursor-pointer group"
                  >
                    <div className="text-[10px] text-sky-200 flex items-center justify-between">
                      <span className="font-semibold">SHGB</span>
                      <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-sm sm:text-base font-black text-indigo-300 mt-0.5">
                      {countSHGBYayasan} <span className="text-[10px] font-medium text-slate-300">Unit</span>
                    </p>
                    <p className="text-[10px] text-sky-200/80 truncate">{formatLuas(luasSHGBYayasan)}</p>
                  </div>

                  <div 
                    onClick={() => handleOpenDrawer({
                      id: 'belum',
                      title: 'Perlu Balik Nama',
                      category: 'Perlu Balik Nama',
                      iconText: '⏳',
                      count: countBelumYayasan,
                      luas: luasBelumYayasan,
                      matchingAssets: belumYayasanAssets,
                      desc: 'Bidang tanah yang perlu proses mutasi balik nama ke Yayasan'
                    })}
                    className="p-2.5 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 transition-colors cursor-pointer group"
                  >
                    <div className="text-[10px] text-sky-200 flex items-center justify-between">
                      <span className="font-semibold">Perlu Mutasi</span>
                      <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-sm sm:text-base font-black text-rose-300 mt-0.5">
                      {countBelumYayasan} <span className="text-[10px] font-medium text-slate-300">Unit</span>
                    </p>
                    <p className="text-[10px] text-sky-200/80 truncate">{formatLuas(luasBelumYayasan)}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SLIDE 2: ARMADA KENDARAAN & FISIK GEDUNG */}
            {activeSlide === 2 && (
              <motion.div
                key="slide-2"
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.25}
                onDragEnd={handleSlideDragEnd}
                className="w-full flex flex-col justify-between space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span>🚐 Armada Mobilisasi &amp; 🏢 Fisik Gedung</span>
                    </span>
                    <div className="flex items-baseline gap-3 mt-1">
                      <h2 className="text-2xl sm:text-3xl font-black text-white">
                        {kendaraanCount} <span className="text-sm font-semibold text-sky-300">Kendaraan</span>
                      </h2>
                      <span className="text-sky-400 font-bold">·</span>
                      <h2 className="text-2xl sm:text-3xl font-black text-white">
                        {bangunanCount} <span className="text-sm font-semibold text-sky-300">Gedung</span>
                      </h2>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateToTab('database')}
                    className="self-start sm:self-auto px-3.5 py-2 bg-purple-500 hover:bg-purple-400 text-white font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <span>Buka Data Fisik</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                  <div 
                    onClick={() => handleOpenDrawer({
                      id: 'mobil-bus',
                      title: 'Mobil, Bus & Elf',
                      category: 'Kendaraan Roda 4+',
                      iconText: '🚐',
                      count: (kendaraanJenis['MOBIL'] || 0) + (kendaraanJenis['ELF'] || 0) + (kendaraanJenis['BUS'] || 0),
                      matchingAssets: kendaraanAssets.filter(k => k.jenisKendaraan === 'MOBIL' || k.jenisKendaraan === 'ELF' || k.jenisKendaraan === 'BUS'),
                      desc: 'Kendaraan roda 4 atau lebih untuk operasional yayasan dan pondok'
                    })}
                    className="p-2.5 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-amber-300 font-bold uppercase">Mobil / Bus / Elf</span>
                      <Car className="w-4 h-4 text-amber-300 opacity-80" />
                    </div>
                    <p className="font-extrabold text-white text-sm sm:text-base mt-1">
                      {(kendaraanJenis['MOBIL'] || 0) + (kendaraanJenis['ELF'] || 0) + (kendaraanJenis['BUS'] || 0)} Unit
                    </p>
                    <span className="text-[10px] text-sky-200/80">Operasional Madiun</span>
                  </div>

                  <div 
                    onClick={() => handleOpenDrawer({
                      id: 'motor',
                      title: 'Sepeda Motor',
                      category: 'Kendaraan Roda 2',
                      iconText: '🏍️',
                      count: kendaraanJenis['MOTOR'] || 0,
                      matchingAssets: kendaraanAssets.filter(k => k.jenisKendaraan === 'MOTOR'),
                      desc: 'Sepeda motor dinas untuk mobilitas harian pengurus dan santri'
                    })}
                    className="p-2.5 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-sky-300 font-bold uppercase">Sepeda Motor</span>
                      <span className="text-xs">🏍️</span>
                    </div>
                    <p className="font-extrabold text-white text-sm sm:text-base mt-1">
                      {kendaraanJenis['MOTOR'] || 0} Unit
                    </p>
                    <span className="text-[10px] text-sky-200/80">Mobilisasi Rutin</span>
                  </div>

                  <div 
                    onClick={() => handleOpenDrawer({
                      id: 'gedung-baik',
                      title: 'Gedung Kondisi Baik',
                      category: 'Kondisi Bangunan Prima',
                      iconText: '🏢',
                      count: bangunanKondisi.baik,
                      matchingAssets: bangunanAssets.filter(b => b.kondisi === 'BAIK'),
                      desc: 'Fasilitas gedung dalam kondisi prima dan siap digunakan sepenuhnya'
                    })}
                    className="p-2.5 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-emerald-300 font-bold uppercase">Kondisi Prima</span>
                      <Building className="w-4 h-4 text-emerald-300 opacity-80" />
                    </div>
                    <p className="font-extrabold text-white text-sm sm:text-base mt-1">
                      {bangunanKondisi.baik} Gedung
                    </p>
                    <span className="text-[10px] text-sky-200/80">Siap Operasional</span>
                  </div>

                  <div 
                    onClick={() => handleOpenDrawer({
                      id: 'gedung-rawat',
                      title: 'Gedung Butuh Pemeliharaan',
                      category: 'Pemeliharaan Fasilitas',
                      iconText: '🛠️',
                      count: bangunanKondisi.ringan + bangunanKondisi.berat,
                      matchingAssets: bangunanAssets.filter(b => b.kondisi === 'RUSAK RINGAN' || b.kondisi === 'RUSAK BERAT'),
                      desc: 'Fasilitas gedung dengan catatan perbaikan atau renovasi'
                    })}
                    className="p-2.5 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-rose-300 font-bold uppercase">Perlu Rawat</span>
                      <span className="text-xs">🛠️</span>
                    </div>
                    <p className="font-extrabold text-white text-sm sm:text-base mt-1">
                      {bangunanKondisi.ringan + bangunanKondisi.berat} Gedung
                    </p>
                    <span className="text-[10px] text-rose-200/80">Dalam Agenda</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SLIDE 3: MUTASI BALIK NAMA & BRANKAS BERKAS */}
            {activeSlide === 3 && (
              <motion.div
                key="slide-3"
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.25}
                onDragEnd={handleSlideDragEnd}
                className="w-full flex flex-col justify-between space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span>🛡️ Legalitas Mutasi &amp; 📁 Brankas Dokumen Fisik</span>
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                      {persentaseYayasan}% Sertifikat Resmi Yayasan
                    </h2>
                    <p className="text-xs text-sky-200/80 mt-0.5">
                      {countBelumYayasan > 0 
                        ? `${countBelumYayasan} sertifikat tanah masih proses mutasi ke Yayasan` 
                        : 'Seluruh aset tanah telah bersertifikat resmi Yayasan'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateToTab('baliknama')}
                    className="self-start sm:self-auto px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <span>Status Mutasi</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                  <div 
                    onClick={() => onNavigateToTab('baliknama')}
                    className="p-2.5 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 transition-colors cursor-pointer"
                  >
                    <span className="text-[10px] text-emerald-300 font-bold uppercase block">Tuntas Yayasan</span>
                    <span className="font-extrabold text-white text-sm sm:text-base mt-0.5 block">
                      {countSHMYayasan + countWakafYayasan + countSHGBYayasan} Unit
                    </span>
                    <span className="text-[10px] text-sky-200/80">Sah Hukum</span>
                  </div>

                  <div 
                    onClick={() => onNavigateToTab('baliknama')}
                    className="p-2.5 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 transition-colors cursor-pointer"
                  >
                    <span className="text-[10px] text-amber-300 font-bold uppercase block">Proses Mutasi</span>
                    <span className="font-extrabold text-white text-sm sm:text-base mt-0.5 block">
                      {sedangBalikNamaCount > 0 ? sedangBalikNamaCount : countBelumYayasan} Unit
                    </span>
                    <span className="text-[10px] text-amber-200/80">Dalam Agenda</span>
                  </div>

                  <div 
                    onClick={() => onNavigateToTab('pinjamberkas')}
                    className="p-2.5 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-sky-300 font-bold uppercase">Di Brankas</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="font-extrabold text-white text-sm sm:text-base mt-0.5 block">
                      {totalAssetsCount - sedangDipinjamCount} Berkas
                    </span>
                    <span className="text-[10px] text-sky-200/80">Tersimpan Aman</span>
                  </div>

                  <div 
                    onClick={() => onNavigateToTab('pinjamberkas')}
                    className="p-2.5 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-rose-300 font-bold uppercase">Dipinjam</span>
                      <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <span className="font-extrabold text-white text-sm sm:text-base mt-0.5 block">
                      {sedangDipinjamCount} Dokumen
                    </span>
                    <span className="text-[10px] text-rose-200/80">Peminjaman Aktif</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Carousel Pagination Scrubber Dots */}
        <div className="flex flex-wrap justify-center items-center gap-2 pt-3">
          {[
            { label: 'Semua Data', icon: '🌐' },
            { label: 'Tanah & Lahan', icon: '🏘️' },
            { label: 'Armada & Gedung', icon: '🚐' },
            { label: 'Mutasi & Brankas', icon: '🛡️' }
          ].map((item, idx) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleSelectSlide(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                activeSlide === idx 
                  ? 'bg-amber-400 text-sky-950 shadow-md font-black scale-102' 
                  : 'bg-white/10 hover:bg-white/15 text-sky-200 hover:text-white'
              }`}
              title={item.label}
            >
              <span className="text-sm leading-none">{item.icon}</span>
              <span className="text-[11px] font-semibold">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Core Metric Grid (4 Bento Cards - Bersih & Fungsional) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Tanah */}
        <div 
          onClick={() => onNavigateToTab('database')}
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-sky-400 dark:hover:border-sky-600 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 text-lg">
              🏘️
            </span>
            <span className="text-[10px] font-mono font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/70 px-2 py-0.5 rounded-full border border-sky-200/60 dark:border-sky-800">
              Tanah
            </span>
          </div>
          <div className="my-2">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {tanahCount} <span className="text-xs font-normal text-slate-400">Bidang</span>
            </h3>
            <p className="text-xs font-bold text-sky-700 dark:text-sky-400 font-mono mt-0.5">
              {formatLuas(totalLuasTanah)}
            </p>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>{countSHMYayasan + countWakafYayasan} Resmi Yayasan</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>

        {/* Card 2: Kendaraan */}
        <div 
          onClick={() => onNavigateToTab('database')}
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 text-lg">
              🚐
            </span>
            <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 px-2 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800">
              Armada
            </span>
          </div>
          <div className="my-2">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {kendaraanCount} <span className="text-xs font-normal text-slate-400">Unit</span>
            </h3>
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mt-0.5">
              Mobil, Elf &amp; Sepeda Motor
            </p>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Operasional Daerah</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>

        {/* Card 3: Bangunan */}
        <div 
          onClick={() => onNavigateToTab('database')}
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 text-lg">
              🏢
            </span>
            <span className="text-[10px] font-mono font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/70 px-2 py-0.5 rounded-full border border-purple-200/60 dark:border-purple-800">
              Gedung
            </span>
          </div>
          <div className="my-2">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {bangunanCount} <span className="text-xs font-normal text-slate-400">Unit</span>
            </h3>
            <p className="text-xs font-bold text-purple-700 dark:text-purple-400 mt-0.5">
              {bangunanKondisi.baik} Unit Kondisi Prima
            </p>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Fasilitas Pesantren</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>

        {/* Card 4: Dokumen & Mutasi */}
        <div 
          onClick={() => onNavigateToTab('pinjamberkas')}
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-lg">
              📁
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800">
              Arsip
            </span>
          </div>
          <div className="my-2">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {sedangDipinjamCount} <span className="text-xs font-normal text-slate-400">Dipinjam</span>
            </h3>
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
              {totalAssetsCount - sedangDipinjamCount} Berkas di Brankas
            </p>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Monitoring Fisik</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>

      {/* 4. Visual Diagram Status Sertifikat Tanah (Bersih, Rapi & Elegan) */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-5">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-wide">
                Status Kepemilikan Sertifikat Tanah
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Klik salah satu batang untuk melihat daftar bidang tanah dalam kategori tersebut
              </p>
            </div>
          </div>

          <span className="hidden sm:inline-flex px-3 py-1 bg-sky-50 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-xl text-xs font-black">
            Total {tanahCount} Bidang
          </span>
        </div>

        {/* Vertical Chart Columns */}
        <div className="relative pt-6 pb-2">
          {/* Background Reference Lines */}
          <div className="absolute inset-0 top-6 bottom-16 flex flex-col justify-between pointer-events-none opacity-40">
            <div className="border-b border-dashed border-slate-200 dark:border-slate-800 w-full" />
            <div className="border-b border-dashed border-slate-200 dark:border-slate-800 w-full" />
            <div className="border-b border-slate-200 dark:border-slate-800 w-full" />
          </div>

          <div className="relative z-10 grid grid-cols-4 gap-2 sm:gap-6 h-56 sm:h-64 items-end pt-4 px-2 sm:px-8">
            {certChartItems.map((item) => {
              const heightPct = maxChartVal > 0 ? (item.count / maxChartVal) * 100 : 0;

              return (
                <div 
                  key={item.id}
                  onClick={() => handleOpenDrawer(item)}
                  className="flex flex-col items-center h-full justify-end group cursor-pointer"
                >
                  {/* Floating Pill */}
                  <div className="mb-2 transition-transform duration-200 text-center group-hover:scale-105">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black shadow-2xs border ${item.badgeBg}`}>
                      <span>{item.count}</span>
                      <span className="text-[10px] font-normal hidden sm:inline">unit</span>
                    </span>
                  </div>

                  {/* Vertical Bar */}
                  <div className="w-full max-w-[56px] bg-slate-100/90 dark:bg-slate-800/90 rounded-t-2xl p-1 flex items-end h-full">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${item.count === 0 ? 8 : Math.max(heightPct, 15)}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={`w-full rounded-t-xl bg-gradient-to-t ${item.gradient} shadow-2xs transition-all duration-300 relative overflow-hidden group-hover:brightness-110 ${
                        item.count === 0 ? 'opacity-30' : 'opacity-100'
                      }`}
                    >
                      {/* Glass Highlight */}
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
                    <span className="text-base block leading-none mb-1">
                      {item.iconText}
                    </span>
                    <h4 className="text-[11px] sm:text-xs font-black text-slate-800 dark:text-slate-100 line-clamp-1">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono font-medium block mt-0.5">
                      {item.percentOfTotal}% ({formatLuas(item.luas)})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Aktivitas Input Terakhir (Recent Activity) */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-lg">📝</span>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                Aktivitas Data Terakhir
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Aset yang baru dicatat atau diperbarui dalam sistem
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToTab('database')}
            className="text-xs font-bold text-sky-700 dark:text-sky-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Semua Data ({totalAssetsCount})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentAssets.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs font-medium">
            Belum ada aktivitas aset terdata.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentAssets.map((asset) => (
              <div 
                key={asset.id} 
                onClick={() => onNavigateToTab('database')}
                className="py-3 flex items-center justify-between first:pt-0 last:pb-0 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-xl text-lg shrink-0 ${
                    asset.type === 'tanah' ? 'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300' :
                    asset.type === 'kendaraan' ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300' : 
                    'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                  }`}>
                    {asset.type === 'tanah' && '🏘️'}
                    {asset.type === 'kendaraan' && '🚐'}
                    {asset.type === 'bangunan' && '🏢'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-snug truncate">
                      {asset.type === 'tanah' && `${asset.jenisSertifikat} - No. ${asset.nomerSertifikat}`}
                      {asset.type === 'kendaraan' && `${asset.merk} (${asset.nomorPolisi})`}
                      {asset.type === 'bangunan' && asset.namaBangunan}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono block truncate mt-0.5">
                      Lokasi: {asset.type === 'kendaraan' ? (asset as any).atasNama : asset.lokasi}
                      {asset.type === 'tanah' && (asset as any).luasTanah ? ` • Luas: ${Number((asset as any).luasTanah).toLocaleString('id-ID')} m²` : ''}
                    </span>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end shrink-0 pl-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                    asset.type === 'tanah' ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300' :
                    asset.type === 'kendaraan' ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' : 
                    'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
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

      {/* 6. Detail Drawer (Laci Rincian Aset) */}
      <AnimatePresence>
        {detailDrawer && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailDrawer(null)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs cursor-pointer"
            />

            {/* Slide-Up Drawer Container */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 z-10 max-h-[85vh] flex flex-col space-y-4 border border-slate-200 dark:border-slate-800"
            >
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto sm:hidden shrink-0" />

              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{detailDrawer.iconText}</span>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                      {detailDrawer.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      <span>{detailDrawer.category}</span>
                      <span>·</span>
                      <strong className="text-sky-700 dark:text-sky-300 font-bold">{detailDrawer.count} Unit Terdata</strong>
                      {detailDrawer.luas !== undefined && detailDrawer.luas > 0 && (
                        <>
                          <span>·</span>
                          <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{formatLuas(detailDrawer.luas)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDetailDrawer(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Search */}
              <div className="relative shrink-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari dalam daftar ini (nama, sertifikat, nopol, lokasi)..."
                  value={drawerSearch}
                  onChange={(e) => setDrawerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-sky-600"
                />
              </div>

              {/* Asset List */}
              <div className="overflow-y-auto space-y-2 pr-1 flex-1">
                {filteredDrawerAssets.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    {drawerSearch ? 'Tidak ada hasil yang sesuai dengan kata kunci pencarian.' : 'Belum ada aset dalam kategori ini.'}
                  </div>
                ) : (
                  filteredDrawerAssets.map((asset, idx) => (
                    <div
                      key={asset.id}
                      onClick={() => {
                        setDetailDrawer(null);
                        onNavigateToTab('database');
                      }}
                      className="p-3 bg-slate-50/80 dark:bg-slate-800/60 hover:bg-sky-50/60 dark:hover:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <h5 className="text-xs font-black text-slate-900 dark:text-white truncate">
                            {asset.type === 'tanah' && `${asset.jenisSertifikat} - No. ${asset.nomerSertifikat}`}
                            {asset.type === 'kendaraan' && `${asset.merk} (${asset.nomorPolisi})`}
                            {asset.type === 'bangunan' && asset.namaBangunan}
                          </h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {asset.type === 'tanah' && `a.n. ${asset.atasNamaSertifikat} · ${asset.lokasi}`}
                            {asset.type === 'kendaraan' && `a.n. ${(asset as any).atasNama} · ${(asset as any).penanggungJawabDaerah || 'Daerah Madiun'}`}
                            {asset.type === 'bangunan' && `${asset.lokasi} · Kondisi: ${asset.kondisi}`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-2">
                        {asset.type === 'tanah' && (asset as any).luasTanah && (
                          <span className="font-mono text-xs font-bold text-sky-800 dark:text-sky-300">
                            {formatLuas(Number((asset as any).luasTanah))}
                          </span>
                        )}
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
                <span className="text-[11px] text-slate-400 font-medium">
                  Menampilkan {filteredDrawerAssets.length} dari {detailDrawer.count} aset
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setDetailDrawer(null);
                    onNavigateToTab('database');
                  }}
                  className="px-4 py-2 bg-sky-800 hover:bg-sky-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>Buka di Database</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
