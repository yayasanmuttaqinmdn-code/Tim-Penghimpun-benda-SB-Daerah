import React from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Database, 
  FileSpreadsheet, 
  RefreshCw,
  FolderOpen,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Users,
  Settings,
  Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PondokLogo from './PondokLogo';

interface SidebarNavProps {
  currentTab: string;
  onChangeTab: (tab: string) => void;
  syncStatus: 'synced' | 'pending' | 'offline';
  totalCount: number;
  isOpen: boolean; // Mobile open state OR Desktop visible state
  setIsOpen: (isOpen: boolean) => void;
  isCollapsed: boolean; // Desktop collapsed state (icon-only rail)
  setIsCollapsed: (isCollapsed: boolean) => void;
  userRole?: 'admin' | 'viewer';
  onSwitchToAdmin?: () => void;
  onSwitchToViewer?: () => void;
}

export default function SidebarNav({
  currentTab,
  onChangeTab,
  totalCount,
  isOpen,
  setIsOpen,
  isCollapsed,
  setIsCollapsed,
  userRole = 'viewer',
  onSwitchToAdmin,
  onSwitchToViewer
}: SidebarNavProps) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'input', label: 'Input Aset', icon: PlusCircle },
    { id: 'database', label: 'Lihat & Cari', icon: Database },
    { id: 'sppt-pbb', label: 'SPPT PBB', icon: Receipt },
    { id: 'baliknama', label: 'Balik Nama', icon: RefreshCw },
    { id: 'pinjamberkas', label: 'Pinjam Berkas', icon: FolderOpen },
    { id: 'export', label: 'Ekspor', icon: FileSpreadsheet },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  const handleTabClick = (tabId: string) => {
    onChangeTab(tabId);
    // Auto-close on mobile when tab is clicked
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between bg-sky-800 dark:bg-slate-900 text-white select-none transition-colors duration-200">
      {/* UPPER PART */}
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden pt-4 px-3 space-y-4">
        {/* Header & Logo */}
        <div className="flex items-center justify-between pb-3 border-b border-sky-700/60 dark:border-slate-800 min-h-[48px]">
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-8 h-8 flex-shrink-0 bg-white dark:bg-slate-100 rounded-lg flex items-center justify-center font-black text-md shadow-md text-sky-800 dark:text-sky-900">
              T
            </div>
            <div className="leading-tight">
              <h2 className="text-[11px] font-black tracking-wide text-white uppercase">TIM BENDA SB</h2>
              <p className="text-[8px] text-sky-300 dark:text-sky-400 font-black tracking-wider leading-none mt-0.5 uppercase">DAERAH MADIUN</p>
            </div>
          </div>

          {/* Mobile close button (X) */}
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-sky-700 dark:hover:bg-slate-800 rounded-lg text-sky-200 hover:text-white transition-all cursor-pointer lg:hidden"
            title="Tutup Menu"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Navigation Items list */}
        <nav className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`relative w-full flex items-center py-2.5 px-3 rounded-xl transition-all duration-150 cursor-pointer text-left focus:outline-none ${
                  isActive 
                    ? 'bg-amber-400 dark:bg-sky-600 text-sky-950 dark:text-white font-black shadow-md border-r-4 border-amber-600 dark:border-sky-400' 
                    : 'text-sky-100 dark:text-slate-300 hover:bg-sky-700 dark:hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
                
                <span className="text-xs tracking-wide whitespace-nowrap ml-3 font-semibold">
                  {tab.label}
                </span>
                
                {/* Badge count for database records */}
                {tab.id === 'database' && totalCount > 0 && (
                  <span className="absolute right-3 bg-rose-600 text-white font-extrabold text-[9px] rounded-full h-4 min-w-[18px] px-1 flex items-center justify-center border border-sky-800 dark:border-slate-800">
                    {totalCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* LOWER PART / FOOTER SECTION */}
      <div className="p-3 border-t border-sky-700/40 dark:border-slate-800 bg-sky-900/40 dark:bg-slate-950/60 space-y-2.5">
        {/* Role Status and Quick Switch */}
        <div className="p-2 rounded-xl bg-sky-950/60 dark:bg-slate-900/80 border border-sky-700/50 dark:border-slate-800 flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className={`w-2 h-2 rounded-full shrink-0 ${userRole === 'admin' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
            <div className="truncate">
              <span className="block text-[9px] font-black uppercase text-sky-200 dark:text-slate-400 leading-none">
                {userRole === 'admin' ? 'Mode Admin' : 'Mode Tamu'}
              </span>
              <span className="text-[8px] text-sky-300/70 dark:text-slate-500 font-medium">
                {userRole === 'admin' ? 'Akses Penuh' : 'Input Kendaraan & Lihat'}
              </span>
            </div>
          </div>

          {userRole === 'admin' ? (
            <button
              type="button"
              onClick={onSwitchToViewer}
              className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer shrink-0"
              title="Kembali ke Mode Tamu"
            >
              Keluar
            </button>
          ) : (
            <button
              type="button"
              onClick={onSwitchToAdmin}
              className="px-2 py-1 bg-amber-400 hover:bg-amber-500 text-sky-950 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer shadow-xs shrink-0"
              title="Masuk sebagai Administrator"
            >
              Masuk PIN
            </button>
          )}
        </div>

        <div className="space-y-1 w-full">
          <div className="flex items-center justify-between text-[10px] text-sky-300 dark:text-sky-400 leading-tight">
            <span className="font-semibold">Sistem Status</span>
            <span className="font-mono text-[9px] bg-sky-900/80 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-sky-800/50 dark:border-slate-700 text-white font-bold">v2.0</span>
          </div>
          <p className="text-[9px] text-sky-200/80 dark:text-slate-400 leading-normal font-medium">
            Sistem Informasi Manajemen data aset Daerah Madiun
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. MOBILE BACKDROP & DRAWER */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-55 w-64 shadow-2xl lg:hidden flex flex-col border-r-4 border-sky-950"
            >
              {navContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* 2. DESKTOP PERMANENT / TOGGLEABLE IN-FLOW SIDEBAR (NEVER OVERLAPS CONTENT) */}
      <aside
        className={`hidden lg:flex flex-col flex-shrink-0 h-screen transition-all duration-250 ease-in-out border-r-4 border-sky-950 dark:border-slate-800 z-20 ${
          isOpen ? 'w-64' : 'w-0 overflow-hidden border-r-0'
        }`}
      >
        <div className="w-64 h-full flex flex-col">
          {navContent}
        </div>
      </aside>
    </>
  );
}
