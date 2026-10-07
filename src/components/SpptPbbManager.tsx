import React, { useState, useEffect, useMemo } from 'react';
import { 
  Receipt, 
  PlusCircle, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Edit3, 
  Trash2, 
  Download, 
  X, 
  DollarSign, 
  MapPin, 
  User, 
  FileText, 
  Check,
  Building,
  Save,
  RotateCcw,
  ListFilter,
  CheckSquare,
  BarChart3,
  TrendingUp,
  PieChart,
  ArrowRight,
  Coins,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SpptPbbRecord, PembayaranTahunPbb } from '../types';
import MenuHeroBanner from './MenuHeroBanner';
import { fetchSpptRecords, saveSpptRecord, deleteSpptRecord } from '../utils/api';

interface SpptPbbManagerProps {
  userRole?: 'admin' | 'viewer';
  googleToken?: string | null;
  googleUser?: any;
  syncStatus?: 'synced' | 'pending' | 'offline';
}

const STORAGE_KEY = 'madiun_sppt_pbb_records';

/**
 * Auto-format string ke standar 18-digit NOP PBB Indonesia:
 * Pola: 2 angka . 2 angka . 3 angka . 3 angka . 3 angka - 4 angka . 1 angka/0
 * Contoh: 35.77.010.001.005-0023.0
 */
export const formatNop = (input: string): string => {
  const digits = input.replace(/\D/g, '').slice(0, 18);
  if (!digits) return '';

  let res = digits.slice(0, 2);
  if (digits.length > 2) {
    res += '.' + digits.slice(2, 4);
  }
  if (digits.length > 4) {
    res += '.' + digits.slice(4, 7);
  }
  if (digits.length > 7) {
    res += '.' + digits.slice(7, 10);
  }
  if (digits.length > 10) {
    res += '.' + digits.slice(10, 13);
  }
  if (digits.length > 13) {
    res += '-' + digits.slice(13, 17);
  }
  if (digits.length > 17) {
    res += '.' + digits.slice(17, 18);
  }
  return res;
};

// Default tracking years: 2025 - 2035
const DEFAULT_YEARS = [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035];
const CURRENT_YEAR = 2026;

// Initial sample data if storage is empty
const INITIAL_SAMPLE_SPPT: SpptPbbRecord[] = [
  {
    id: 'sppt_sample_1',
    namaWajibPajak: 'YAYASAN MUTTAQIN JOSENAN',
    lokasi: 'Jl. Nogososro No. 26, Kel. Josenan, Kec. Taman, Kota Madiun',
    nop: '35.77.010.001.005-0023.0',
    pajakTerutang: 385000,
    totalBayarYayasanTahunan: 385000,
    riwayatPembayaran: {
      2025: { tahun: 2025, lunas: true, nominalBayar: 350000, tanggalBayar: '2025-06-20', keterangan: 'Lunas via Mobile Banking' },
      2026: { tahun: 2026, lunas: false, nominalBayar: 385000, keterangan: 'Ketetapan SPPT 2026' },
      2027: { tahun: 2027, lunas: false, nominalBayar: 385000 },
      2028: { tahun: 2028, lunas: false, nominalBayar: 385000 },
      2029: { tahun: 2029, lunas: false, nominalBayar: 385000 },
      2030: { tahun: 2030, lunas: false, nominalBayar: 385000 },
      2031: { tahun: 2031, lunas: false, nominalBayar: 385000 },
      2032: { tahun: 2032, lunas: false, nominalBayar: 385000 },
      2033: { tahun: 2033, lunas: false, nominalBayar: 385000 },
      2034: { tahun: 2034, lunas: false, nominalBayar: 385000 },
      2035: { tahun: 2035, lunas: false, nominalBayar: 385000 }
    },
    keteranganTambahan: 'Tanah Kompleks Pesantren & Kantor Utama',
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now()
  }
];

export default function SpptPbbManager({ googleToken, googleUser }: SpptPbbManagerProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. Centralized Storage State (with localStorage cache fallback)
  const [spptList, setSpptList] = useState<SpptPbbRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((item: SpptPbbRecord) => {
            const payments = { ...(item.riwayatPembayaran || {}) };
            DEFAULT_YEARS.forEach(y => {
              if (!payments[y]) {
                payments[y] = { tahun: y, lunas: false };
              }
            });
            return { ...item, riwayatPembayaran: payments };
          });
        }
      }
    } catch (e) {
      console.error('Error loading SPPT PBB records:', e);
    }
    return INITIAL_SAMPLE_SPPT;
  });

  // Pull latest data from centralized server / Google Sheets
  const loadSpptData = async (token?: string | null) => {
    setIsSyncing(true);
    try {
      const serverRecords = await fetchSpptRecords(token !== undefined ? token : googleToken);
      if (Array.isArray(serverRecords)) {
        setSpptList(serverRecords);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(serverRecords));
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Could not load SPPT from server, using local cache:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Load from server on mount or when Google token is updated, with periodic multi-device live sync
  useEffect(() => {
    loadSpptData(googleToken);

    const handleFocus = () => {
      loadSpptData(googleToken);
    };
    window.addEventListener('focus', handleFocus);

    // Auto sync across all mobile and personal devices every 8s
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadSpptData(googleToken);
      }
    }, 8000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [googleToken]);

  // Save to localStorage as resilient offline cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(spptList));
    } catch (e) {
      console.error('Error saving SPPT PBB records to cache:', e);
    }
  }, [spptList]);

  // 2. Sub-tab Navigation: 'input' (Form Input) vs 'list' (Daftar & Ceklis) vs 'recap' (Rekapan Total Bayar Tahunan)
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'input' | 'recap'>('list');

  // 3. UI & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYearFilter, setSelectedYearFilter] = useState<number>(CURRENT_YEAR);
  const [statusFilter, setStatusFilter] = useState<'all' | 'lunas' | 'belum'>('all');
  const [editingRecord, setEditingRecord] = useState<SpptPbbRecord | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Delete confirmation modal state
  const [deleteConfirmRecord, setDeleteConfirmRecord] = useState<SpptPbbRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formNamaWajibPajak, setFormNamaWajibPajak] = useState('');
  const [formLokasi, setFormLokasi] = useState('');
  const [formNop, setFormNop] = useState('');
  const [formPajakTerutang, setFormPajakTerutang] = useState<number | ''>('');
  const [formTotalBayarYayasan, setFormTotalBayarYayasan] = useState<number | ''>('');
  const [formRiwayatPembayaran, setFormRiwayatPembayaran] = useState<Record<number, PembayaranTahunPbb>>({});
  const [formKeterangan, setFormKeterangan] = useState('');
  const [availableYears, setAvailableYears] = useState<number[]>(DEFAULT_YEARS);
  const [newYearInput, setNewYearInput] = useState('');

  // Quick payment detail modal from table
  const [quickPayRecord, setQuickPayRecord] = useState<{
    record: SpptPbbRecord;
    tahun: number;
    currentLunas: boolean;
  } | null>(null);
  const [quickPayNominal, setQuickPayNominal] = useState<number | ''>('');
  const [quickPayTanggal, setQuickPayTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [quickPayKeterangan, setQuickPayKeterangan] = useState('');

  // Apply default base nominal to all years in form
  const handleApplyDefaultNominalToAllYears = () => {
    const baseVal = Number(formTotalBayarYayasan) || Number(formPajakTerutang) || 0;
    if (baseVal <= 0) {
      alert('Silakan isi "Total Beban Bayar Yayasan Tiap Tahun" atau "Ketetapan Pajak Terutang" terlebih dahulu.');
      return;
    }
    const updated: Record<number, PembayaranTahunPbb> = { ...formRiwayatPembayaran };
    availableYears.forEach(y => {
      updated[y] = {
        ...(updated[y] || { tahun: y, lunas: false }),
        nominalBayar: baseVal
      };
    });
    setFormRiwayatPembayaran(updated);
  };

  // Reset Form
  const resetForm = () => {
    setEditingRecord(null);
    setFormNamaWajibPajak('');
    setFormLokasi('');
    setFormNop('');
    setFormPajakTerutang('');
    setFormTotalBayarYayasan('');
    setFormKeterangan('');
    
    // Initialize payments for default years
    const initPayments: Record<number, PembayaranTahunPbb> = {};
    availableYears.forEach(y => {
      initPayments[y] = { tahun: y, lunas: false };
    });
    setFormRiwayatPembayaran(initPayments);
  };

  // Switch to Input Tab for New Record
  const handleOpenNewInput = () => {
    resetForm();
    setActiveSubTab('input');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Switch to Input Tab for Editing Existing Record
  const handleEditRecord = (rec: SpptPbbRecord) => {
    setEditingRecord(rec);
    setFormNamaWajibPajak(rec.namaWajibPajak);
    setFormLokasi(rec.lokasi);
    setFormNop(rec.nop);
    setFormPajakTerutang(rec.pajakTerutang);
    setFormTotalBayarYayasan(rec.totalBayarYayasanTahunan);
    setFormKeterangan(rec.keteranganTambahan || '');
    
    // Merge existing payments with available years
    const payments = { ...rec.riwayatPembayaran };
    availableYears.forEach(y => {
      if (!payments[y]) {
        payments[y] = { tahun: y, lunas: false };
      }
    });
    setFormRiwayatPembayaran(payments);
    setActiveSubTab('input');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save Form (Create or Update)
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNamaWajibPajak.trim()) {
      alert('Nama Wajib Pajak wajib diisi.');
      return;
    }
    if (!formLokasi.trim()) {
      alert('Lokasi Objek Pajak wajib diisi.');
      return;
    }
    if (!formNop.trim()) {
      alert('NOP wajib diisi.');
      return;
    }

    const pajakNum = Number(formPajakTerutang) || 0;
    const totalBayarNum = Number(formTotalBayarYayasan) || pajakNum;

    if (editingRecord) {
      // Update
      const recordToSave: SpptPbbRecord = {
        ...editingRecord,
        namaWajibPajak: formNamaWajibPajak.trim(),
        lokasi: formLokasi.trim(),
        nop: formNop.trim(),
        pajakTerutang: pajakNum,
        totalBayarYayasanTahunan: totalBayarNum,
        riwayatPembayaran: formRiwayatPembayaran,
        keteranganTambahan: formKeterangan.trim(),
        updatedAt: Date.now()
      };

      const updatedList = spptList.map(item => item.id === editingRecord.id ? recordToSave : item);
      setSpptList(updatedList);
      setSaveSuccessMsg(`Data SPPT NOP ${formNop} berhasil diperbarui.`);
      saveSpptRecord(recordToSave, googleToken).catch(err => console.error("Server save error:", err));
    } else {
      // Create new
      const newRecord: SpptPbbRecord = {
        id: `sppt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        namaWajibPajak: formNamaWajibPajak.trim(),
        lokasi: formLokasi.trim(),
        nop: formNop.trim(),
        pajakTerutang: pajakNum,
        totalBayarYayasanTahunan: totalBayarNum,
        riwayatPembayaran: formRiwayatPembayaran,
        keteranganTambahan: formKeterangan.trim(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      setSpptList([newRecord, ...spptList]);
      setSaveSuccessMsg(`Data SPPT NOP ${formNop} berhasil disimpan.`);
      saveSpptRecord(newRecord, googleToken).catch(err => console.error("Server save error:", err));
    }

    // Reset and switch to list view
    resetForm();
    setActiveSubTab('list');

    // Auto-clear success message after 4s
    setTimeout(() => {
      setSaveSuccessMsg(null);
    }, 4000);
  };

  // Delete Record Trigger
  const handleDeleteRecord = (rec: SpptPbbRecord) => {
    setDeleteConfirmRecord(rec);
  };

  // Execute Deletion
  const handleExecuteDelete = async () => {
    if (!deleteConfirmRecord) return;
    const target = deleteConfirmRecord;
    setIsDeleting(true);
    try {
      const updatedList = spptList.filter(item => item.id !== target.id);
      setSpptList(updatedList);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
      } catch (e) {}

      await deleteSpptRecord(target.id, googleToken);

      if (editingRecord?.id === target.id) {
        resetForm();
        setActiveSubTab('list');
      }

      setSaveSuccessMsg(`Data SPPT NOP: ${target.nop} (${target.namaWajibPajak}) berhasil dihapus.`);
      setTimeout(() => {
        setSaveSuccessMsg(null);
      }, 4000);
    } catch (err) {
      console.error("Server delete error:", err);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmRecord(null);
    }
  };

  // Quick toggle year status directly from table
  const handleQuickTogglePayment = (record: SpptPbbRecord, tahun: number) => {
    const currentYearData = record.riwayatPembayaran?.[tahun];
    const isCurrentlyLunas = currentYearData?.lunas ?? false;
    const defaultNominal = (currentYearData?.nominalBayar !== undefined && currentYearData.nominalBayar > 0)
      ? currentYearData.nominalBayar
      : (record.totalBayarYayasanTahunan || record.pajakTerutang || 0);

    setQuickPayRecord({
      record,
      tahun,
      currentLunas: isCurrentlyLunas
    });
    setQuickPayNominal(defaultNominal);
    setQuickPayTanggal(currentYearData?.tanggalBayar || new Date().toISOString().split('T')[0]);
    setQuickPayKeterangan(currentYearData?.keterangan || '');
  };

  // Confirm Quick Pay
  const handleConfirmQuickPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPayRecord) return;

    const { record, tahun } = quickPayRecord;
    const numNominal = typeof quickPayNominal === 'number' && quickPayNominal > 0
      ? quickPayNominal
      : (record.totalBayarYayasanTahunan || record.pajakTerutang || 0);

    let updatedTargetRecord: SpptPbbRecord | null = null;
    const updatedList = spptList.map(item => {
      if (item.id === record.id) {
        const updatedPayments = { ...item.riwayatPembayaran };
        updatedPayments[tahun] = {
          tahun,
          lunas: true,
          tanggalBayar: quickPayTanggal,
          nominalBayar: numNominal,
          keterangan: quickPayKeterangan.trim() || undefined
        };
        const updated = {
          ...item,
          riwayatPembayaran: updatedPayments,
          updatedAt: Date.now()
        };
        updatedTargetRecord = updated;
        return updated;
      }
      return item;
    });

    setSpptList(updatedList);
    setQuickPayRecord(null);
    if (updatedTargetRecord) {
      saveSpptRecord(updatedTargetRecord, googleToken).catch(err => console.error("Server save error:", err));
    }
  };

  // Cancel Payment Status (set back to unpaid)
  const handleCancelPaymentStatus = () => {
    if (!quickPayRecord) return;
    const { record, tahun } = quickPayRecord;
    const numNominal = typeof quickPayNominal === 'number' && quickPayNominal > 0
      ? quickPayNominal
      : (record.totalBayarYayasanTahunan || record.pajakTerutang || 0);

    let updatedTargetRecord: SpptPbbRecord | null = null;
    const updatedList = spptList.map(item => {
      if (item.id === record.id) {
        const updatedPayments = { ...item.riwayatPembayaran };
        updatedPayments[tahun] = {
          tahun,
          lunas: false,
          nominalBayar: numNominal
        };
        const updated = {
          ...item,
          riwayatPembayaran: updatedPayments,
          updatedAt: Date.now()
        };
        updatedTargetRecord = updated;
        return updated;
      }
      return item;
    });

    setSpptList(updatedList);
    setQuickPayRecord(null);
    if (updatedTargetRecord) {
      saveSpptRecord(updatedTargetRecord, googleToken).catch(err => console.error("Server save error:", err));
    }
  };

  // Add custom year to tracking
  const handleAddYear = () => {
    const yr = parseInt(newYearInput.trim(), 10);
    if (!yr || yr < 2000 || yr > 2050) {
      alert('Masukkan tahun yang valid (2000 - 2050).');
      return;
    }
    if (availableYears.includes(yr)) {
      alert(`Tahun ${yr} sudah ada.`);
      return;
    }
    const newYrs = [...availableYears, yr].sort((a, b) => a - b);
    setAvailableYears(newYrs);
    setNewYearInput('');
  };

  // Filtered List
  const filteredList = useMemo(() => {
    const queryTrimmed = searchQuery.trim().toLowerCase();
    const queryDigits = queryTrimmed.replace(/\D/g, '');

    return spptList.filter(item => {
      const itemNopDigits = item.nop.replace(/\D/g, '');
      const matchesSearch = 
        item.namaWajibPajak.toLowerCase().includes(queryTrimmed) ||
        item.nop.toLowerCase().includes(queryTrimmed) ||
        (queryDigits.length >= 2 && itemNopDigits.includes(queryDigits)) ||
        item.lokasi.toLowerCase().includes(queryTrimmed);

      if (!matchesSearch) return false;

      if (statusFilter !== 'all') {
        const isLunas = item.riwayatPembayaran?.[selectedYearFilter]?.lunas ?? false;
        if (statusFilter === 'lunas' && !isLunas) return false;
        if (statusFilter === 'belum' && isLunas) return false;
      }

      return true;
    });
  }, [spptList, searchQuery, statusFilter, selectedYearFilter]);

  // Aggregate Metrics
  const totalObjek = spptList.length;
  const totalPajakTerutang = spptList.reduce((acc, curr) => acc + (curr.pajakTerutang || 0), 0);
  const totalBebanYayasan = spptList.reduce((acc, curr) => acc + (curr.totalBayarYayasanTahunan || 0), 0);

  // Status for selected year
  const lunasCountSelectedYear = spptList.filter(
    item => item.riwayatPembayaran?.[selectedYearFilter]?.lunas
  ).length;
  const belumLunasCountSelectedYear = totalObjek - lunasCountSelectedYear;

  const targetNominalSelectedYear = spptList.reduce((acc, curr) => {
    const p = curr.riwayatPembayaran?.[selectedYearFilter];
    const nom = (p?.nominalBayar !== undefined && p.nominalBayar > 0)
      ? p.nominalBayar
      : (curr.totalBayarYayasanTahunan || curr.pajakTerutang || 0);
    return acc + nom;
  }, 0);

  const lunasNominalSelectedYear = spptList
    .filter(item => item.riwayatPembayaran?.[selectedYearFilter]?.lunas)
    .reduce((acc, curr) => {
      const p = curr.riwayatPembayaran?.[selectedYearFilter];
      const nom = (p?.nominalBayar !== undefined && p.nominalBayar > 0)
        ? p.nominalBayar
        : (curr.totalBayarYayasanTahunan || curr.pajakTerutang || 0);
      return acc + nom;
    }, 0);
  const belumLunasNominalSelectedYear = Math.max(0, targetNominalSelectedYear - lunasNominalSelectedYear);

  // 4. Yearly Recap Aggregate Calculations (Total Bayar Setiap Tahun)
  const yearlyRecapData = useMemo(() => {
    return availableYears.map(yr => {
      let targetNominal = 0;
      let terbayarNominal = 0;
      let lunasCount = 0;
      const totalCount = spptList.length;

      spptList.forEach(item => {
        const payment = item.riwayatPembayaran?.[yr];
        const bebanTahunIni = (payment?.nominalBayar !== undefined && payment.nominalBayar > 0)
          ? payment.nominalBayar
          : (item.totalBayarYayasanTahunan || item.pajakTerutang || 0);

        targetNominal += bebanTahunIni;
        if (payment?.lunas) {
          terbayarNominal += bebanTahunIni;
          lunasCount += 1;
        }
      });

      const sisaNominal = Math.max(0, targetNominal - terbayarNominal);
      const persentase = targetNominal > 0 ? Math.round((terbayarNominal / targetNominal) * 100) : 0;
      const belumCount = totalCount - lunasCount;

      return {
        tahun: yr,
        totalObjek: totalCount,
        targetNominal,
        terbayarNominal,
        sisaNominal,
        persentase,
        lunasCount,
        belumCount,
        isFullyPaid: totalCount > 0 && lunasCount === totalCount,
        isPartiallyPaid: lunasCount > 0 && lunasCount < totalCount,
        isUnpaid: lunasCount === 0
      };
    });
  }, [spptList, availableYears]);

  // Overall totals across all years
  const grandTotalTarget = useMemo(() => {
    return yearlyRecapData.reduce((acc, curr) => acc + curr.targetNominal, 0);
  }, [yearlyRecapData]);

  const grandTotalTerbayar = useMemo(() => {
    return yearlyRecapData.reduce((acc, curr) => acc + curr.terbayarNominal, 0);
  }, [yearlyRecapData]);

  const grandTotalSisa = Math.max(0, grandTotalTarget - grandTotalTerbayar);
  const grandTotalPersen = grandTotalTarget > 0 ? Math.round((grandTotalTerbayar / grandTotalTarget) * 100) : 0;

  // Format currency (mendukung desimal / bilangan berapapun)
  const formatRupiah = (val?: number) => {
    if (val === undefined || isNaN(val)) return 'Rp 0';
    const hasDecimal = val % 1 !== 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: hasDecimal ? 2 : 0,
      maximumFractionDigits: hasDecimal ? 2 : 0
    }).format(val);
  };

  // Export CSV (Detailed NOP Records)
  const handleExportCSV = () => {
    if (spptList.length === 0) {
      alert('Belum ada data untuk diekspor.');
      return;
    }

    const headers = [
      'No',
      'Nama Wajib Pajak',
      'Lokasi Objek Pajak',
      'NOP',
      'Pajak Terutang (Rp)',
      'Total Bayar Yayasan Tiap Tahun (Rp)',
      ...availableYears.map(y => `Status ${y}`),
      'Keterangan'
    ];

    const rows = spptList.map((item, idx) => {
      const yearStatuses = availableYears.map(y => {
        const p = item.riwayatPembayaran?.[y];
        return p?.lunas ? `LUNAS (${p.tanggalBayar || '-'})` : 'BELUM';
      });

      return [
        idx + 1,
        `"${item.namaWajibPajak.replace(/"/g, '""')}"`,
        `"${item.lokasi.replace(/"/g, '""')}"`,
        `'${item.nop}`,
        item.pajakTerutang,
        item.totalBayarYayasanTahunan,
        ...yearStatuses,
        `"${(item.keteranganTambahan || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SPPT_PBB_Madiun_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export CSV (Yearly Recap Breakdown)
  const handleExportYearlyRecapCSV = () => {
    if (yearlyRecapData.length === 0) {
      alert('Belum ada data rekapan untuk diekspor.');
      return;
    }

    const headers = [
      'Tahun Pajak',
      'Total Objek NOP',
      'Target Beban Yayasan (Rp)',
      'Realisasi Terbayar (Rp)',
      'Sisa Belum Bayar (Rp)',
      'NOP Lunas',
      'NOP Belum',
      'Persentase Pelunasan (%)',
      'Status Pelunasan'
    ];

    const rows: (string | number)[][] = yearlyRecapData.map(r => [
      r.tahun,
      r.totalObjek,
      r.targetNominal,
      r.terbayarNominal,
      r.sisaNominal,
      r.lunasCount,
      r.belumCount,
      `${r.persentase}%`,
      r.isFullyPaid ? '100% LUNAS' : r.isPartiallyPaid ? 'SEBAGIAN TERBAYAR' : 'BELUM BAYAR'
    ]);

    // Grand total row
    rows.push([
      'TOTAL KESELURUHAN (2025-2035)',
      totalObjek,
      grandTotalTarget,
      grandTotalTerbayar,
      grandTotalSisa,
      '-',
      '-',
      `${grandTotalPersen}%`,
      grandTotalPersen === 100 ? 'LUNAS SEMUA' : 'PROSES'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `REKAPITULASI_PEMBAYARAN_PBB_TAHUNAN_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 1. Header Banner */}
      <MenuHeroBanner
        title="SPPT PBB YAYASAN"
        subtitle="Pengelolaan NOP, ketetapan pajak terutang, dan rekapitulasi ceklis pembayaran tahunan."
        badgeText="TIM PENGHIMPUN BENDA SABILILLAH"
        rightElement={
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadSpptData(googleToken)}
              disabled={isSyncing}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-sm ${
                isSyncing 
                  ? 'bg-amber-500/30 text-amber-200 border border-amber-500/40 animate-pulse' 
                  : 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
              }`}
              title="Perbarui & sinkronkan data SPPT dengan server & Google Spreadsheet"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-300 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan'}</span>
            </button>
            <button
              onClick={activeSubTab === 'recap' ? handleExportYearlyRecapCSV : handleExportCSV}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-sm"
              title={activeSubTab === 'recap' ? 'Unduh Rekapitulasi Tahunan ke CSV' : 'Unduh Daftar SPPT NOP ke CSV'}
            >
              <Download className="w-3.5 h-3.5 text-sky-300" />
              <span>{activeSubTab === 'recap' ? 'Ekspor Rekap CSV' : 'Ekspor CSV'}</span>
            </button>
          </div>
        }
      />

      {/* 2. SUB-MENU NAVIGATION TABS: [📝 Input SPPT PBB], [📋 Daftar & Ceklis], [📊 Rekapan Bayar Tahunan] */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-2 rounded-2xl border-2 border-slate-200/90 shadow-2xs">
        <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl w-full sm:w-auto gap-1">
          {/* Menu 1: Form Input */}
          <button
            type="button"
            onClick={handleOpenNewInput}
            className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'input'
                ? 'bg-sky-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Form Input</span>
            {editingRecord && (
              <span className="bg-amber-400 text-sky-950 text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                Edit
              </span>
            )}
          </button>

          {/* Menu 2: Daftar & Ceklis */}
          <button
            type="button"
            onClick={() => setActiveSubTab('list')}
            className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'list'
                ? 'bg-sky-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Daftar &amp; Ceklis</span>
            <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
              activeSubTab === 'list' ? 'bg-sky-950 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {spptList.length}
            </span>
          </button>

          {/* Menu 3: Rekapan Total Bayar Tahunan */}
          <button
            type="button"
            onClick={() => setActiveSubTab('recap')}
            className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'recap'
                ? 'bg-sky-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Rekapan Total Bayar Tiap Tahun</span>
            <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
              activeSubTab === 'recap' ? 'bg-emerald-500 text-slate-950 font-extrabold' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {availableYears.length} Th
            </span>
          </button>
        </div>

        {/* Quick info or active view badge */}
        <div className="hidden lg:flex items-center gap-2 px-2 text-xs text-slate-500 font-medium">
          {activeSubTab === 'input' ? (
            <span className="text-amber-700 font-bold flex items-center gap-1">
              <span>✍️</span>
              <span>{editingRecord ? `Sedang mengedit NOP: ${editingRecord.nop}` : 'Silakan masukkan data objek pajak baru'}</span>
            </span>
          ) : activeSubTab === 'recap' ? (
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <span>📊</span>
              <span>Rekapitulasi {availableYears.length} Tahun (2025 - {availableYears[availableYears.length - 1]})</span>
            </span>
          ) : (
            <span>Total {totalObjek} Objek Pajak terdaftar</span>
          )}
        </div>
      </div>

      {/* 3. Notification Toast if Saved */}
      <AnimatePresence>
        {saveSuccessMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3 bg-emerald-50 border-2 border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center justify-between shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
            <button
              onClick={() => setSaveSuccessMsg(null)}
              className="text-emerald-700 hover:text-emerald-950 text-sm p-1"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* VIEW A: DEDICATED FORM INPUT SPPT PBB                     */}
      {/* ========================================================= */}
      {activeSubTab === 'input' && (
        <motion.div
          key="input-form-tab"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="bg-white rounded-3xl border-2 border-slate-200/90 shadow-2xs overflow-hidden"
        >
          {/* Form Header */}
          <div className="bg-slate-50 px-5 sm:px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-sky-950 flex items-center justify-center font-black">
                📝
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-800 uppercase tracking-wide">
                  {editingRecord ? 'Edit Data SPPT PBB' : 'Form Input SPPT PBB Baru'}
                </h2>
                <p className="text-xs text-slate-500">
                  Isi 6 kolom data utama di bawah ini untuk mencatat objek pajak yayasan.
                </p>
              </div>
            </div>

            {editingRecord && (
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Batal Edit</span>
              </button>
            )}
          </div>

          {/* Main Form Body */}
          <form onSubmit={handleSaveForm} className="p-5 sm:p-7 space-y-5 text-xs">
            {/* 1. NAMA WAJIB PAJAK */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center text-[10px] font-black">1</span>
                <span>Nama Wajib Pajak *</span>
              </label>
              <input
                type="text"
                required
                value={formNamaWajibPajak}
                onChange={(e) => setFormNamaWajibPajak(e.target.value)}
                placeholder="Contoh: YAYASAN MUTTAQIN JOSENAN / H. BUKHORI"
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-3 font-semibold text-slate-900 text-sm focus:bg-white focus:border-sky-700 focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-slate-400 pl-1">Nama wajib pajak sesuai yang tertera pada lembar SPPT fisik.</p>
            </div>

            {/* 2. LOKASI OBJEK PAJAK */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-750 flex items-center justify-center text-[10px] font-black">2</span>
                <span>Lokasi Objek Pajak *</span>
              </label>
              <textarea
                required
                rows={2}
                value={formLokasi}
                onChange={(e) => setFormLokasi(e.target.value)}
                placeholder="Contoh: Jl. Nogososro No. 26, Kel. Josenan, Kec. Taman, Kota Madiun"
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-3 font-semibold text-slate-900 text-sm focus:bg-white focus:border-sky-700 focus:outline-none transition-colors resize-none"
              />
              <p className="text-[11px] text-slate-400 pl-1">Alamat lengkap letak tanah/bangunan objek pajak.</p>
            </div>

            {/* 3. NOP (NOMOR OBJEK PAJAK) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-850 flex items-center justify-center text-[10px] font-black">3</span>
                  <span>NOP (Nomor Objek Pajak) *</span>
                </label>
                {formNop && (
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                    formNop.replace(/\D/g, '').length === 18 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {formNop.replace(/\D/g, '').length} / 18 Digit
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                maxLength={24}
                value={formNop}
                onChange={(e) => setFormNop(formatNop(e.target.value))}
                placeholder="Contoh: 35.77.010.001.005-0023.0"
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-3 font-mono font-bold text-sky-900 text-sm focus:bg-white focus:border-sky-700 focus:outline-none transition-colors tracking-wide"
              />
              <p className="text-[11px] text-slate-400 pl-1 flex items-center justify-between">
                <span>Format otomatis: <strong>2.2.3.3.3-4.1</strong> (18 digit NOP SPPT)</span>
                <span className="font-mono text-[10px] text-slate-400">XX.XX.XXX.XXX.XXX-XXXX.X</span>
              </p>
            </div>

            {/* 4 & 5: PAJAK TERUTANG & TOTAL BAYAR YAYASAN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* 4. Pajak Terutang */}
              <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[10px] font-black">4</span>
                  <span>Pajak Terutang (Rp) *</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formPajakTerutang}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const val = raw === '' ? '' : (isNaN(Number(raw)) ? raw : Number(raw));
                      setFormPajakTerutang(val as any);
                      // Auto-sync if total bayar yayasan is empty
                      if (formTotalBayarYayasan === '') {
                        setFormTotalBayarYayasan(val as any);
                      }
                    }}
                    placeholder="Contoh: 385000 atau 385000.50"
                    className="w-full pl-11 pr-3 py-2.5 bg-white border-2 border-slate-300 rounded-xl font-bold text-slate-900 text-sm focus:border-sky-700 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500">Nominal ketetapan PBB pokok yang tercantum di SPPT.</p>
              </div>

              {/* 5. Total Dibayar Yayasan Tiap Tahun */}
              <div className="space-y-1.5 bg-emerald-50/60 p-4 rounded-2xl border-2 border-emerald-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-emerald-900 tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-900 flex items-center justify-center text-[10px] font-black">5</span>
                    <span>Total Bayar Yayasan Tiap Tahun (Rp) *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormTotalBayarYayasan(formPajakTerutang)}
                    className="text-[10px] font-extrabold bg-emerald-200 hover:bg-emerald-300 text-emerald-900 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    Samakan
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-emerald-700 text-sm">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formTotalBayarYayasan}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setFormTotalBayarYayasan(raw === '' ? '' : (isNaN(Number(raw)) ? raw : Number(raw)) as any);
                    }}
                    placeholder="Contoh: 385000 atau 385000.50"
                    className="w-full pl-11 pr-3 py-2.5 bg-white border-2 border-emerald-300 rounded-xl font-black text-emerald-900 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-emerald-700">Total nominal riil yang menjadi kewajiban yayasan per tahun.</p>
              </div>
            </div>

            {/* 6. CEK LIS & NILAI PEMBAYARAN TIAP TAHUN */}
            <div className="space-y-2.5 pt-2 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-sky-200 text-sky-900 flex items-center justify-center text-[10px] font-black">6</span>
                    <span>Nilai &amp; Ceklis Pembayaran Tiap Tahun</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Nominal dapat disesuaikan per tahun jika ada perubahan tarif/ketetapan pajak SPPT.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  {/* Batch set nominal */}
                  <button
                    type="button"
                    onClick={handleApplyDefaultNominalToAllYears}
                    className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold rounded-lg text-xs cursor-pointer transition-colors"
                    title="Isi nominal seluruh tahun dengan nilai bawaan"
                  >
                    ⚡ Terapkan Nominal Bawaan ke Semua Tahun
                  </button>

                  {/* Add Custom Year */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      placeholder="Tambah Tahun (mis: 2028)"
                      value={newYearInput}
                      onChange={(e) => setNewYearInput(e.target.value)}
                      className="w-32 px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleAddYear}
                      className="px-2.5 py-1 bg-sky-100 hover:bg-sky-200 text-sky-900 font-bold rounded-lg text-xs cursor-pointer"
                    >
                      + Tambah
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                {availableYears.map(yr => {
                  const currentYearObj = formRiwayatPembayaran[yr];
                  const isLunas = currentYearObj?.lunas ?? false;
                  const customNominal = currentYearObj?.nominalBayar;
                  const tgl = currentYearObj?.tanggalBayar || '';
                  const ket = currentYearObj?.keterangan || '';
                  const fallbackNominal = Number(formTotalBayarYayasan) || Number(formPajakTerutang) || 0;

                  return (
                    <div 
                      key={yr}
                      className={`p-3 rounded-xl border transition-all ${
                        isLunas 
                          ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-2xs' 
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      {/* Year Header & Toggle */}
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm font-mono text-slate-900">{yr}</span>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isLunas}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFormRiwayatPembayaran({
                                ...formRiwayatPembayaran,
                                [yr]: {
                                  ...formRiwayatPembayaran[yr],
                                  tahun: yr,
                                  lunas: checked,
                                  nominalBayar: customNominal !== undefined ? customNominal : (fallbackNominal > 0 ? fallbackNominal : undefined),
                                  tanggalBayar: checked ? (tgl || new Date().toISOString().split('T')[0]) : undefined,
                                  keterangan: checked ? ket : undefined
                                }
                              });
                            }}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                            isLunas ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {isLunas ? '✓ LUNAS' : 'BELUM'}
                          </span>
                        </label>
                      </div>

                      {/* Input Nominal Per Tahun */}
                      <div className="mt-2.5 pt-2 border-t border-slate-200/80">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[9px] font-bold uppercase text-slate-500">
                            Nilai Bayar Tahun {yr} (Rp):
                          </span>
                          {customNominal !== undefined && customNominal > 0 && (
                            <span className="text-[9px] font-black text-emerald-700 font-mono">
                              {formatRupiah(customNominal)}
                            </span>
                          )}
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder={fallbackNominal > 0 ? `Bawaan: ${formatRupiah(fallbackNominal)}` : 'Nominal tahunan...'}
                          value={customNominal !== undefined ? customNominal : ''}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const val = raw === '' ? undefined : (isNaN(Number(raw)) ? undefined : Number(raw));
                            setFormRiwayatPembayaran({
                              ...formRiwayatPembayaran,
                              [yr]: {
                                ...(formRiwayatPembayaran[yr] || { tahun: yr, lunas: isLunas }),
                                nominalBayar: val
                              }
                            });
                          }}
                          className="w-full text-xs bg-white border border-slate-300 rounded-lg p-1.5 font-mono font-bold text-slate-800 focus:border-sky-600 focus:outline-none"
                        />
                      </div>

                      {/* Inputs if Lunas */}
                      {isLunas && (
                        <div className="mt-2 space-y-1.5 pt-2 border-t border-emerald-200 animate-fadeIn">
                          <div>
                            <span className="text-[9px] font-bold text-emerald-800 uppercase block mb-0.5">Tgl Bayar:</span>
                            <input
                              type="date"
                              value={tgl}
                              onChange={(e) => {
                                setFormRiwayatPembayaran({
                                  ...formRiwayatPembayaran,
                                  [yr]: {
                                    ...formRiwayatPembayaran[yr],
                                    tanggalBayar: e.target.value
                                  }
                                });
                              }}
                              className="w-full text-xs bg-white border border-emerald-300 rounded-lg p-1.5 font-medium"
                            />
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-emerald-800 uppercase block mb-0.5">Catatan / Bukti:</span>
                            <input
                              type="text"
                              placeholder="No. Bukti / Bank / Lokasi Bayar"
                              value={ket}
                              onChange={(e) => {
                                setFormRiwayatPembayaran({
                                  ...formRiwayatPembayaran,
                                  [yr]: {
                                    ...formRiwayatPembayaran[yr],
                                    keterangan: e.target.value
                                  }
                                });
                              }}
                              className="w-full text-xs bg-white border border-emerald-300 rounded-lg p-1.5 font-medium placeholder:text-emerald-400"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Catatan Tambahan (Opsional) */}
            <div className="space-y-1 pt-1">
              <label className="text-[11px] font-bold uppercase text-slate-600 tracking-wider">
                Catatan / Keterangan Tambahan (Opsional):
              </label>
              <input
                type="text"
                value={formKeterangan}
                onChange={(e) => setFormKeterangan(e.target.value)}
                placeholder="Contoh: Tanah Kompleks Pesantren & Kantor Utama"
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-2.5 font-medium focus:bg-white focus:border-sky-600 focus:outline-none transition-colors"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-slate-200">
              <button
                type="submit"
                className="w-full sm:flex-1 py-3 bg-sky-800 hover:bg-sky-900 active:bg-sky-950 focus:bg-sky-800 text-white font-black rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <Save className="w-4 h-4 text-white" />
                <span className="text-white">{editingRecord ? 'Simpan Perubahan SPPT PBB' : 'Simpan Data SPPT PBB'}</span>
              </button>

              {editingRecord && (
                <button
                  type="button"
                  onClick={() => handleDeleteRecord(editingRecord)}
                  className="w-full sm:w-auto px-5 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-2xl transition-colors cursor-pointer text-sm flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Hapus SPPT</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setActiveSubTab('list');
                }}
                className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-colors cursor-pointer text-sm"
              >
                Lihat Daftar SPPT
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* ========================================================= */}
      {/* VIEW B: DAFTAR & CEKLIS PEMBAYARAN SPPT PBB              */}
      {/* ========================================================= */}
      {activeSubTab === 'list' && (
        <motion.div
          key="list-view-tab"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="space-y-4"
        >
          {/* Stats Bento Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Total Objek NOP */}
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Total Objek NOP</span>
                <span className="p-1.5 bg-sky-50 text-sky-700 rounded-lg text-xs">🏢</span>
              </div>
              <div className="mt-2">
                <p className="text-2xl font-black text-slate-800">{totalObjek} <span className="text-xs font-bold text-slate-400">Bidang</span></p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Terdaftar di sistem yayasan</p>
              </div>
            </div>

            {/* Ketetapan Pajak Terutang */}
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Ketetapan Pajak Terutang</span>
                <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs">📑</span>
              </div>
              <div className="mt-2">
                <p className="text-lg font-black text-slate-800">{formatRupiah(totalPajakTerutang)}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Nominal ketetapan per tahun</p>
              </div>
            </div>

            {/* Total Beban Yayasan */}
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Beban Bayar Yayasan</span>
                <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs">💰</span>
              </div>
              <div className="mt-2">
                <p className="text-lg font-black text-emerald-700">{formatRupiah(totalBebanYayasan)}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Total kewajiban tiap tahun</p>
              </div>
            </div>

            {/* Status Tahun Berjalan */}
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Status Tahun {selectedYearFilter}</span>
                <span className="p-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs">📅</span>
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                    ✓ {lunasCountSelectedYear} Lunas
                  </span>
                  <span className="text-emerald-700 font-mono">{formatRupiah(lunasNominalSelectedYear)}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200 flex items-center gap-1">
                    ✕ {belumLunasCountSelectedYear} Belum
                  </span>
                  <span className="text-rose-700 font-mono">{formatRupiah(belumLunasNominalSelectedYear)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Recap Shortcut Banner */}
          <div className="bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200/80 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-sky-600 text-white rounded-xl shadow-xs">
                <BarChart3 className="w-4 h-4" />
              </span>
              <div>
                <p className="text-xs font-black text-slate-800">Rekapitulasi Pembayaran Seluruh Tahun (2025 - {availableYears[availableYears.length - 1]})</p>
                <p className="text-[10px] text-slate-500 font-medium">Lihat rincian total target, realisasi lunas, dan sisa kewajiban untuk setiap tahun.</p>
              </div>
            </div>
            <button
              onClick={() => setActiveSubTab('recap')}
              className="px-3 py-1.5 bg-sky-800 hover:bg-sky-900 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
            >
              <span>Buka Rekapan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Filter Bar & Search */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border-2 border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari NOP, Nama Wajib Pajak, atau Lokasi..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-sky-600 transition-colors"
              />
            </div>

            {/* Year & Status Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Year selector */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                <span className="text-[10px] font-black uppercase text-slate-500 pl-1.5">Tahun:</span>
                <select
                  value={selectedYearFilter}
                  onChange={(e) => setSelectedYearFilter(Number(e.target.value))}
                  className="bg-white border border-slate-200 text-xs font-bold text-slate-800 rounded-lg py-1 px-2 focus:outline-none cursor-pointer"
                >
                  {availableYears.map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>

              {/* Status filter buttons */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'all' ? 'bg-white text-sky-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setStatusFilter('lunas')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'lunas' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Lunas
                </button>
                <button
                  onClick={() => setStatusFilter('belum')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'belum' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Belum
                </button>
              </div>
            </div>
          </div>

          {/* Table / List Container */}
          <div className="bg-white rounded-3xl border-2 border-slate-200/90 shadow-2xs overflow-hidden">
            {filteredList.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
                  <Receipt className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Tidak ada data SPPT PBB</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {searchQuery ? 'Tidak ada hasil yang sesuai dengan pencarian.' : 'Belum ada data SPPT PBB yang diinput. Klik "Form Input SPPT PBB" di atas untuk memasukkan data.'}
                </p>
                <button
                  onClick={handleOpenNewInput}
                  className="mt-4 px-4 py-2 bg-sky-800 text-white rounded-xl text-xs font-bold hover:bg-sky-900 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Buka Form Input SPPT</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <tr>
                      <th className="py-3 px-3 sm:px-4 text-center w-12">No</th>
                      <th className="py-3 px-3 sm:px-4">Wajib Pajak & NOP</th>
                      <th className="py-3 px-3 sm:px-4">Lokasi Objek Pajak</th>
                      <th className="py-3 px-3 sm:px-4">Pajak Terutang & Beban</th>
                      <th className="py-3 px-3 sm:px-4">
                        <div className="flex items-center gap-1">
                          <span>Ceklis Pembayaran Tiap Tahun</span>
                          <span className="text-[8px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.5 rounded">Klik utk Ubah</span>
                        </div>
                      </th>
                      <th className="py-3 px-3 sm:px-4 text-center w-20">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredList.map((item, idx) => {
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* No */}
                          <td className="py-3.5 px-3 sm:px-4 text-center font-mono font-bold text-slate-400">
                            {idx + 1}
                          </td>

                          {/* 1. Nama Wajib Pajak & 3. NOP */}
                          <td className="py-3.5 px-3 sm:px-4">
                            <div className="font-black text-slate-900 leading-tight">
                              {item.namaWajibPajak}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5">
                              <span className="font-mono text-[11px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                                NOP: {item.nop}
                              </span>
                            </div>
                            {item.keteranganTambahan && (
                              <p className="text-[10px] text-slate-400 mt-1 italic">
                                {item.keteranganTambahan}
                              </p>
                            )}
                          </td>

                          {/* 2. Lokasi */}
                          <td className="py-3.5 px-3 sm:px-4 max-w-xs">
                            <div className="flex items-start gap-1.5 text-slate-700">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                              <span className="leading-snug">{item.lokasi}</span>
                            </div>
                          </td>

                          {/* 4. Pajak Terutang & 5. Total Dibayar Yayasan */}
                          <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase block">Pajak Terutang:</span>
                              <span className="font-extrabold text-slate-800">{formatRupiah(item.pajakTerutang)}</span>
                            </div>
                            <div className="mt-1 pt-1 border-t border-slate-100">
                              <span className="text-[9px] font-bold text-emerald-600 uppercase block">Total Bayar Yayasan/Th:</span>
                              <span className="font-black text-emerald-700">{formatRupiah(item.totalBayarYayasanTahunan)}</span>
                            </div>
                          </td>

                          {/* 6. Ceklis Pembayaran Tiap Tahun */}
                          <td className="py-3.5 px-3 sm:px-4">
                            <div className="flex flex-wrap gap-1 max-w-[290px]">
                              {availableYears.map(yr => {
                                const paymentData = item.riwayatPembayaran?.[yr];
                                const isLunas = paymentData?.lunas ?? false;

                                return (
                                  <button
                                    key={yr}
                                    type="button"
                                    onClick={() => handleQuickTogglePayment(item, yr)}
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono tracking-tight transition-all duration-150 cursor-pointer active:scale-95 select-none ${
                                      isLunas
                                        ? 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/40 hover:bg-emerald-500/25 shadow-2xs font-extrabold'
                                        : 'bg-slate-100/90 text-slate-500 border border-slate-200/90 hover:bg-slate-200/80 hover:text-slate-800 font-semibold'
                                    }`}
                                    title={
                                      isLunas 
                                        ? `Tahun ${yr}: LUNAS (${paymentData?.tanggalBayar || 'Tgl tdk tercatat'})${paymentData?.keterangan ? ' - ' + paymentData.keterangan : ''}. Klik utk batalkan / ubah.`
                                        : `Tahun ${yr}: BELUM LUNAS. Klik utk tandai lunas.`
                                    }
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isLunas ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                                    <span>{yr}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-3 sm:px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleEditRecord(item)}
                                className="p-1.5 hover:bg-sky-50 text-sky-700 rounded-lg transition-colors cursor-pointer"
                                title="Edit data di Form Input"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRecord(item)}
                                className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                                title="Hapus SPPT PBB"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ========================================================= */}
      {/* VIEW C: REKAPITULASI TOTAL BAYAR TIAP TAHUN (2025 - 2035) */}
      {/* ========================================================= */}
      {activeSubTab === 'recap' && (
        <motion.div
          key="recap-view-tab"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="space-y-4"
        >
          {/* Summary Bento Grid for All Years */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Beban Tahunan Tetap */}
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Beban Pajak Tahunan</span>
                <span className="p-1.5 bg-sky-50 text-sky-700 rounded-lg text-xs">🏛️</span>
              </div>
              <div className="mt-2">
                <p className="text-xl font-black text-slate-900">{formatRupiah(totalBebanYayasan)}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Beban tahunan untuk {totalObjek} NOP terdaftar</p>
              </div>
            </div>

            {/* 2. Total Akumulasi Terbayar (Lunas) */}
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Total Lunas Terbayar</span>
                <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs">💰</span>
              </div>
              <div className="mt-2">
                <p className="text-xl font-black text-emerald-700">{formatRupiah(grandTotalTerbayar)}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded font-mono">
                    {grandTotalPersen}% Lunas
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">dari total kewajiban</span>
                </div>
              </div>
            </div>

            {/* 3. Total Sisa Belum Bayar */}
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Sisa Belum Terbayar</span>
                <span className="p-1.5 bg-rose-50 text-rose-700 rounded-lg text-xs">⏳</span>
              </div>
              <div className="mt-2">
                <p className="text-xl font-black text-rose-700">{formatRupiah(grandTotalSisa)}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Akumulasi sisa tahun 2025–{availableYears[availableYears.length - 1]}</p>
              </div>
            </div>

            {/* 4. Total Periode Pelacakan */}
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Periode Rekapitulasi</span>
                <span className="p-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs">📅</span>
              </div>
              <div className="mt-2">
                <p className="text-xl font-black text-purple-900">{availableYears.length} <span className="text-xs font-bold text-slate-400">Tahun</span></p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Total Proyeksi: {formatRupiah(grandTotalTarget)}</p>
              </div>
            </div>
          </div>

          {/* Detailed Yearly Recap Table Card */}
          <div className="bg-white rounded-3xl border-2 border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                    Rekapan Total Bayar Tiap Tahun Pajak
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Rincian beban yayasan, realisasi terbayar, dan sisa tunggakan untuk periode tahun 2025 – {availableYears[availableYears.length - 1]}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleExportYearlyRecapCSV}
                  className="px-3.5 py-2 bg-sky-800 hover:bg-sky-900 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Rekap CSV</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="py-3.5 px-3 sm:px-4 text-center w-12">No</th>
                    <th className="py-3.5 px-3 sm:px-4">Tahun Pajak</th>
                    <th className="py-3.5 px-3 sm:px-4 text-center">Jumlah NOP</th>
                    <th className="py-3.5 px-3 sm:px-4">Target Beban Yayasan</th>
                    <th className="py-3.5 px-3 sm:px-4">Realisasi Terbayar (Lunas)</th>
                    <th className="py-3.5 px-3 sm:px-4">Sisa Belum Bayar</th>
                    <th className="py-3.5 px-3 sm:px-4">Rasio Lunas</th>
                    <th className="py-3.5 px-3 sm:px-4 text-center">Status Pelunasan</th>
                    <th className="py-3.5 px-3 sm:px-4 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {yearlyRecapData.map((item, idx) => {
                    const isCurrentYear = item.tahun === CURRENT_YEAR;

                    return (
                      <tr 
                        key={item.tahun} 
                        className={`transition-colors hover:bg-slate-50/80 ${
                          isCurrentYear ? 'bg-sky-50/40' : ''
                        }`}
                      >
                        {/* No */}
                        <td className="py-3.5 px-3 sm:px-4 text-center font-mono font-bold text-slate-400">
                          {idx + 1}
                        </td>

                        {/* Tahun Pajak */}
                        <td className="py-3.5 px-3 sm:px-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`font-mono text-sm font-black px-2 py-0.5 rounded-lg border ${
                              isCurrentYear 
                                ? 'bg-sky-800 text-white border-sky-900 shadow-2xs'
                                : 'bg-slate-100 text-slate-800 border-slate-200'
                            }`}>
                              {item.tahun}
                            </span>
                            {isCurrentYear && (
                              <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-sans">
                                Tahun Berjalan
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Jumlah NOP */}
                        <td className="py-3.5 px-3 sm:px-4 text-center font-bold text-slate-700">
                          {item.totalObjek} <span className="text-[10px] text-slate-400 font-normal">Bidang</span>
                        </td>

                        {/* Target Beban Yayasan */}
                        <td className="py-3.5 px-3 sm:px-4 font-extrabold text-slate-800 font-mono whitespace-nowrap">
                          {formatRupiah(item.targetNominal)}
                        </td>

                        {/* Realisasi Terbayar (Lunas) */}
                        <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className={`font-mono font-black ${
                                item.terbayarNominal > 0 ? 'text-emerald-700' : 'text-slate-400'
                              }`}>
                                {formatRupiah(item.terbayarNominal)}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                                item.persentase === 100 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : item.persentase > 0 
                                  ? 'bg-amber-100 text-amber-900' 
                                  : 'bg-slate-100 text-slate-500'
                              }`}>
                                {item.persentase}%
                              </span>
                            </div>
                            {/* Mini Progress Bar */}
                            <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ${
                                  item.persentase === 100 ? 'bg-emerald-500' : item.persentase > 0 ? 'bg-amber-500' : 'bg-transparent'
                                }`}
                                style={{ width: `${item.persentase}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Sisa Belum Bayar */}
                        <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
                          <span className={`font-mono font-bold ${
                            item.sisaNominal === 0 ? 'text-slate-400' : 'text-rose-600'
                          }`}>
                            {formatRupiah(item.sisaNominal)}
                          </span>
                        </td>

                        {/* Rasio NOP */}
                        <td className="py-3.5 px-3 sm:px-4">
                          <div className="flex items-center gap-1.5 text-xs font-bold font-mono">
                            <span className="text-emerald-700">{item.lunasCount} Lunas</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-rose-600">{item.belumCount} Belum</span>
                          </div>
                        </td>

                        {/* Status Pelunasan */}
                        <td className="py-3.5 px-3 sm:px-4 text-center whitespace-nowrap">
                          {item.isFullyPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>100% LUNAS</span>
                            </span>
                          ) : item.isPartiallyPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
                              <span>⚡ SEBAGIAN</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">
                              <span>○ BELUM BAYAR</span>
                            </span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-3 sm:px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedYearFilter(item.tahun);
                              setActiveSubTab('list');
                            }}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-800 border border-slate-200 hover:border-sky-300 rounded-lg text-[11px] font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title={`Buka Ceklis NOP Tahun ${item.tahun}`}
                          >
                            <span>Buka Ceklis</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Grand Total Footer */}
                <tfoot className="bg-slate-900 text-white font-mono text-xs border-t-2 border-slate-950">
                  <tr>
                    <td colSpan={2} className="py-4 px-3 sm:px-4 font-black uppercase text-amber-400">
                      TOTAL KESELURUHAN (2025 – {availableYears[availableYears.length - 1]})
                    </td>
                    <td className="py-4 px-3 sm:px-4 text-center font-bold text-slate-300">
                      {totalObjek} NOP
                    </td>
                    <td className="py-4 px-3 sm:px-4 font-black text-slate-100 whitespace-nowrap">
                      {formatRupiah(grandTotalTarget)}
                    </td>
                    <td className="py-4 px-3 sm:px-4 font-black text-emerald-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{formatRupiah(grandTotalTerbayar)}</span>
                        <span className="text-[10px] bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-sans font-bold">
                          {grandTotalPersen}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-3 sm:px-4 font-black text-rose-300 whitespace-nowrap">
                      {formatRupiah(grandTotalSisa)}
                    </td>
                    <td colSpan={3} className="py-4 px-3 sm:px-4 text-right font-sans text-xs font-bold text-slate-300">
                      <span>Proyeksi Kewajiban {availableYears.length} Tahun</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* QUICK PAY & DELETE CONFIRMATION MODALS */}
      <AnimatePresence>
        {/* MODAL KONFIRMASI HAPUS DATA SPPT PBB */}
        {deleteConfirmRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setDeleteConfirmRecord(null)}
              className="fixed inset-0 bg-slate-900"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 z-10 space-y-4 border border-slate-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-rose-100 text-rose-600 rounded-2xl">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wide text-slate-900">
                      Hapus Data SPPT PBB?
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Konfirmasi penghapusan data objek pajak
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmRecord(null)}
                  disabled={isDeleting}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Record Summary Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Wajib Pajak:</span>
                  <span className="font-black text-slate-900 text-sm">{deleteConfirmRecord.namaWajibPajak}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">NOP:</span>
                    <span className="font-mono font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 inline-block mt-0.5">
                      {deleteConfirmRecord.nop}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Beban Tahunan:</span>
                    <span className="font-bold text-emerald-700 block mt-0.5">
                      {formatRupiah(deleteConfirmRecord.totalBayarYayasanTahunan || deleteConfirmRecord.pajakTerutang)}
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Lokasi:</span>
                  <span className="text-slate-600 font-medium leading-relaxed">{deleteConfirmRecord.lokasi}</span>
                </div>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200/90 rounded-2xl text-[11px] text-rose-900 leading-relaxed font-medium">
                ⚠️ <strong>Perhatian:</strong> Data objek SPPT ini serta seluruh catatan riwayat pembayarannya akan dihapus secara permanen dari sistem dan Google Sheets.
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmRecord(null)}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-black rounded-2xl text-xs transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Sekarang'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {quickPayRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setQuickPayRecord(null)}
              className="fixed inset-0 bg-slate-900"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-xl p-5 z-10 space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                    quickPayRecord.currentLunas 
                      ? 'bg-sky-100 text-sky-800' 
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {quickPayRecord.currentLunas ? '✏️' : '✓'}
                  </span>
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-800">
                      {quickPayRecord.currentLunas ? `Ubah Pembayaran Tahun ${quickPayRecord.tahun}` : `Tandai Lunas Tahun ${quickPayRecord.tahun}`}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {quickPayRecord.record.nop}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setQuickPayRecord(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmQuickPay} className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">Wajib Pajak:</span>
                  <span className="font-bold text-slate-800">{quickPayRecord.record.namaWajibPajak}</span>
                </div>

                {/* Input Nilai Yang Dibayar Tahun Terkait */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-600 block">
                      Nilai Bayar Tahun {quickPayRecord.tahun} (Rp): *
                    </label>
                    <span className="text-[9px] text-slate-400">
                      Bawaan: {formatRupiah(quickPayRecord.record.totalBayarYayasanTahunan || quickPayRecord.record.pajakTerutang)}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-emerald-700 text-xs">Rp</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={quickPayNominal}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setQuickPayNominal(raw === '' ? '' : (isNaN(Number(raw)) ? raw : Number(raw)) as any);
                      }}
                      placeholder="Nominal rupiah yang dibayarkan..."
                      className="w-full pl-9 pr-3 py-2 bg-white border-2 border-emerald-300 rounded-xl font-black font-mono text-emerald-900 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">
                    Tanggal Pembayaran:
                  </label>
                  <input
                    type="date"
                    required
                    value={quickPayTanggal}
                    onChange={(e) => setQuickPayTanggal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">
                    Keterangan / Bukti Bayar:
                  </label>
                  <input
                    type="text"
                    value={quickPayKeterangan}
                    onChange={(e) => setQuickPayKeterangan(e.target.value)}
                    placeholder="Contoh: Bank Jatim / Bapenda / Transfer"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setQuickPayRecord(null)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-xs cursor-pointer"
                  >
                    {quickPayRecord.currentLunas ? 'Simpan Perubahan' : 'Konfirmasi Lunas'}
                  </button>
                </div>

                {quickPayRecord.currentLunas && (
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleCancelPaymentStatus}
                      className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Batalkan Status Lunas (Tandai Belum Bayar)</span>
                    </button>
                  </div>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
