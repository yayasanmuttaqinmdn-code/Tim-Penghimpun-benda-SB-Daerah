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
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
  Sparkles,
  Clock,
  SlidersHorizontal,
  Percent,
  Copy,
  Info,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SpptPbbRecord, PembayaranTahunPbb } from '../types';
import MenuHeroBanner from './MenuHeroBanner';
import { fetchSpptRecords, saveSpptRecord, deleteSpptRecord, syncSpptRecords } from '../utils/api';

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
export const formatNop = (input: string, isDeleting: boolean = false): string => {
  const digits = input.replace(/\D/g, '').slice(0, 18);
  if (!digits) return '';

  let res = digits.slice(0, 2);

  // Segmen 1 (2 angka) -> titik
  if (digits.length >= 2) {
    if (digits.length === 2 && !isDeleting) {
      return res + '.';
    }
    if (digits.length > 2) {
      res += '.' + digits.slice(2, 4);
    }
  }

  // Segmen 2 (2 angka) -> titik
  if (digits.length >= 4) {
    if (digits.length === 4 && !isDeleting) {
      return res + '.';
    }
    if (digits.length > 4) {
      res += '.' + digits.slice(4, 7);
    }
  }

  // Segmen 3 (3 angka) -> titik
  if (digits.length >= 7) {
    if (digits.length === 7 && !isDeleting) {
      return res + '.';
    }
    if (digits.length > 7) {
      res += '.' + digits.slice(7, 10);
    }
  }

  // Segmen 4 (3 angka) -> titik
  if (digits.length >= 10) {
    if (digits.length === 10 && !isDeleting) {
      return res + '.';
    }
    if (digits.length > 10) {
      res += '.' + digits.slice(10, 13);
    }
  }

  // Segmen 5 (3 angka) -> strip (-)
  if (digits.length >= 13) {
    if (digits.length === 13 && !isDeleting) {
      return res + '-';
    }
    if (digits.length > 13) {
      res += '-' + digits.slice(13, 17);
    }
  }

  // Segmen 6 (4 angka) -> titik
  if (digits.length >= 17) {
    if (digits.length === 17 && !isDeleting) {
      return res + '.';
    }
    if (digits.length > 17) {
      res += '.' + digits.slice(17, 18);
    }
  }

  return res;
};

// Default tracking years: 2025 - 2035
const DEFAULT_YEARS = [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035];
const CURRENT_YEAR = 2026;

/**
 * Helper mendapatkan nilai beban ketetapan SPPT suatu NOP pada tahun tertentu.
 * Nilai beban tiap tahun dapat berbeda tergantung kebijakan pemerintah (stimulus, kenaikan NJOP, dll).
 */
export const getBebanItemTahun = (item: SpptPbbRecord, yr: number): number => {
  const p = item.riwayatPembayaran?.[yr];
  if (p?.nominalKetetapan !== undefined && p.nominalKetetapan > 0) {
    return p.nominalKetetapan;
  }
  if (p?.nominalBayar !== undefined && p.nominalBayar > 0) {
    return p.nominalBayar;
  }
  return item.totalBayarYayasanTahunan || item.pajakTerutang || 0;
};

/**
 * Helper mendapatkan nominal yang sudah terbayar pada tahun tertentu.
 */
export const getTerbayarItemTahun = (item: SpptPbbRecord, yr: number): number => {
  const p = item.riwayatPembayaran?.[yr];
  if (!p?.lunas) return 0;
  if (p?.nominalBayar !== undefined && p.nominalBayar > 0) {
    return p.nominalBayar;
  }
  return getBebanItemTahun(item, yr);
};

/**
 * Helper mendapatkan sisa beban yang belum dibayar pada tahun tertentu.
 * Selalu berlaku: Beban = Sudah Terbayar + Belum Dibayar
 */
export const getSisaItemTahun = (item: SpptPbbRecord, yr: number): number => {
  const p = item.riwayatPembayaran?.[yr];
  if (p?.lunas) return 0;
  return getBebanItemTahun(item, yr);
};

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

export default function SpptPbbManager({ userRole = 'viewer', googleToken, googleUser }: SpptPbbManagerProps) {
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

  // Recap Filter & View Mode
  const [recapScopeFilter, setRecapScopeFilter] = useState<'all' | 'active' | 'current' | 'history' | 'projection'>('active');
  const [recapViewMode, setRecapViewMode] = useState<'table' | 'cards'>('table');
  const [focusRecapYear, setFocusRecapYear] = useState<number>(CURRENT_YEAR);

  // Policy / Tariff Adjustment Modal (Kebijakan Pemerintah per Tahun)
  const [policyModalYear, setPolicyModalYear] = useState<number | null>(null);
  const [policyAdjustPercent, setPolicyAdjustPercent] = useState<string>('');
  const [policyPerNopEdits, setPolicyPerNopEdits] = useState<Record<string, number | ''>>({});
  const [policyNote, setPolicyNote] = useState<string>('');
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);

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

  // Handle NOP input changes with real-time auto formatting
  const handleNopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    const prevVal = formNop;
    const isDeleting = inputVal.length < prevVal.length;

    let cleanInput = inputVal;
    if (isDeleting && (prevVal.endsWith('.') || prevVal.endsWith('-')) && !inputVal.endsWith('.') && !inputVal.endsWith('-')) {
      const prevDigits = prevVal.replace(/\D/g, '');
      cleanInput = prevDigits.slice(0, -1);
    }

    const formatted = formatNop(cleanInput, isDeleting);
    setFormNop(formatted);
  };

  // Quick payment & year adjustment modal from table
  const [quickPayRecord, setQuickPayRecord] = useState<{
    record: SpptPbbRecord;
    tahun: number;
    currentLunas: boolean;
  } | null>(null);
  const [quickPayKetetapan, setQuickPayKetetapan] = useState<number | ''>('');
  const [quickPayNominal, setQuickPayNominal] = useState<number | ''>('');
  const [quickPayIsLunas, setQuickPayIsLunas] = useState(false);
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
    if (userRole === 'viewer') {
      alert('Mode Tamu hanya memiliki hak akses untuk melihat data SPPT PBB. Pendaftaran SPPT baru khusus untuk Admin.');
      return;
    }
    resetForm();
    setActiveSubTab('input');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Switch to Input Tab for Editing Existing Record
  const handleEditRecord = (rec: SpptPbbRecord) => {
    if (userRole === 'viewer') {
      alert('Mode Tamu hanya bisa melihat data SPPT PBB. Penyuntingan data khusus untuk Admin.');
      return;
    }
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

  // Quick toggle year status & open detail modal from table
  const handleQuickTogglePayment = (record: SpptPbbRecord, tahun: number) => {
    if (userRole === 'viewer') {
      alert('Mode Tamu hanya bisa melihat. Pembaharuan status pelunasan SPPT PBB memerlukan Mode Admin.');
      return;
    }
    const currentYearData = record.riwayatPembayaran?.[tahun];
    const isCurrentlyLunas = currentYearData?.lunas ?? false;
    const currentBeban = getBebanItemTahun(record, tahun);
    const defaultPaid = (currentYearData?.nominalBayar !== undefined && currentYearData.nominalBayar > 0)
      ? currentYearData.nominalBayar
      : currentBeban;

    setQuickPayRecord({
      record,
      tahun,
      currentLunas: isCurrentlyLunas
    });
    setQuickPayKetetapan(currentBeban);
    setQuickPayNominal(defaultPaid);
    setQuickPayIsLunas(!isCurrentlyLunas);
    setQuickPayTanggal(currentYearData?.tanggalBayar || new Date().toISOString().split('T')[0]);
    setQuickPayKeterangan(currentYearData?.keterangan || '');
  };

  // Confirm Quick Pay / Update determination for single year
  const handleConfirmQuickPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPayRecord) return;

    const { record, tahun } = quickPayRecord;
    const numBeban = typeof quickPayKetetapan === 'number' && quickPayKetetapan >= 0
      ? quickPayKetetapan
      : getBebanItemTahun(record, tahun);

    const numNominal = typeof quickPayNominal === 'number' && quickPayNominal >= 0
      ? quickPayNominal
      : numBeban;

    let updatedTargetRecord: SpptPbbRecord | null = null;
    const updatedList = spptList.map(item => {
      if (item.id === record.id) {
        const updatedPayments = { ...item.riwayatPembayaran };
        updatedPayments[tahun] = {
          tahun,
          lunas: quickPayIsLunas,
          nominalKetetapan: numBeban,
          nominalBayar: quickPayIsLunas ? numNominal : numBeban,
          tanggalBayar: quickPayIsLunas ? quickPayTanggal : undefined,
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
    const numBeban = typeof quickPayKetetapan === 'number' && quickPayKetetapan >= 0
      ? quickPayKetetapan
      : getBebanItemTahun(record, tahun);

    let updatedTargetRecord: SpptPbbRecord | null = null;
    const updatedList = spptList.map(item => {
      if (item.id === record.id) {
        const updatedPayments = { ...item.riwayatPembayaran };
        updatedPayments[tahun] = {
          tahun,
          lunas: false,
          nominalKetetapan: numBeban,
          nominalBayar: numBeban
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

  // --------------------------------------------------------------------------
  // KEBIJAKAN PEMERINTAH (PENYESUAIAN TARIF & BEBAN SPPT PER TAHUN)
  // --------------------------------------------------------------------------
  // Buka modal penyesuaian kebijakan pemerintah untuk tahun tertentu
  const handleOpenPolicyModal = (year: number) => {
    if (userRole === 'viewer') {
      alert('Mode Tamu hanya bisa melihat. Penyesuaian kebijakan tarif/beban SPPT tahunan memerlukan Mode Admin.');
      return;
    }
    setPolicyModalYear(year);
    setPolicyAdjustPercent('');
    setPolicyNote('');
    const initialEdits: Record<string, number | ''> = {};
    spptList.forEach(item => {
      initialEdits[item.id] = getBebanItemTahun(item, year);
    });
    setPolicyPerNopEdits(initialEdits);
  };

  // Terapkan penyesuaian persentase kenaikan/penurunan massal
  const handleApplyPercentageAdjustment = (percent: number) => {
    if (!policyModalYear) return;
    const factor = 1 + (percent / 100);
    const updatedEdits: Record<string, number | ''> = {};
    spptList.forEach(item => {
      const base = item.totalBayarYayasanTahunan || item.pajakTerutang || 0;
      updatedEdits[item.id] = Math.round(base * factor);
    });
    setPolicyPerNopEdits(updatedEdits);
    setPolicyNote(percent >= 0 
      ? `Penyesuaian Ketetapan Pemda: Kenaikan ${percent}%` 
      : `Kebijakan Stimulus/Diskon Pemda: Potongan ${Math.abs(percent)}%`
    );
  };

  // Salin beban ketetapan dari tahun lain
  const handleCopyFromYear = (sourceYear: number) => {
    if (!policyModalYear) return;
    const updatedEdits: Record<string, number | ''> = {};
    spptList.forEach(item => {
      updatedEdits[item.id] = getBebanItemTahun(item, sourceYear);
    });
    setPolicyPerNopEdits(updatedEdits);
    setPolicyNote(`Ketetapan diselaraskan dengan tahun ${sourceYear}`);
  };

  // Reset ketetapan kembali ke nilai standar yayasan
  const handleResetToBaseline = () => {
    if (!policyModalYear) return;
    const updatedEdits: Record<string, number | ''> = {};
    spptList.forEach(item => {
      updatedEdits[item.id] = item.totalBayarYayasanTahunan || item.pajakTerutang || 0;
    });
    setPolicyPerNopEdits(updatedEdits);
    setPolicyNote('Menggunakan nilai ketetapan standar yayasan');
  };

  // Simpan penyesuaian kebijakan pemerintah ke database & sinkronkan
  const handleSavePolicyModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyModalYear) return;
    setIsSavingPolicy(true);

    try {
      const year = policyModalYear;
      const updatedList = spptList.map(item => {
        const customBeban = policyPerNopEdits[item.id];
        const numBeban = (typeof customBeban === 'number' && customBeban >= 0)
          ? customBeban
          : getBebanItemTahun(item, year);

        const currentPayment = item.riwayatPembayaran?.[year] || { tahun: year, lunas: false };
        const updatedPayment: PembayaranTahunPbb = {
          ...currentPayment,
          tahun: year,
          nominalKetetapan: numBeban,
          nominalBayar: currentPayment.lunas 
            ? (currentPayment.nominalBayar || numBeban) 
            : numBeban,
          keterangan: policyNote.trim() ? policyNote.trim() : currentPayment.keterangan
        };

        return {
          ...item,
          riwayatPembayaran: {
            ...item.riwayatPembayaran,
            [year]: updatedPayment
          },
          updatedAt: Date.now()
        };
      });

      setSpptList(updatedList);
      await syncSpptRecords(updatedList, googleToken);
      setSaveSuccessMsg(`Ketetapan beban SPPT Tahun ${year} berhasil disesuaikan dengan kebijakan pemerintah.`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
      setPolicyModalYear(null);
    } catch (err) {
      console.error('Error saving policy adjustment:', err);
      alert('Terjadi kesalahan saat menyimpan penyesuaian.');
    } finally {
      setIsSavingPolicy(false);
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

  // Status for selected year (in checklist tab)
  const lunasCountSelectedYear = spptList.filter(
    item => item.riwayatPembayaran?.[selectedYearFilter]?.lunas
  ).length;
  const belumLunasCountSelectedYear = totalObjek - lunasCountSelectedYear;

  const targetNominalSelectedYear = spptList.reduce((acc, curr) => acc + getBebanItemTahun(curr, selectedYearFilter), 0);
  const lunasNominalSelectedYear = spptList.reduce((acc, curr) => acc + getTerbayarItemTahun(curr, selectedYearFilter), 0);
  const belumLunasNominalSelectedYear = spptList.reduce((acc, curr) => acc + getSisaItemTahun(curr, selectedYearFilter), 0);

  // 4. Yearly Recap Aggregate Calculations (Total Bayar Setiap Tahun)
  const yearlyRecapData = useMemo(() => {
    return availableYears.map(yr => {
      let targetNominal = 0;
      let terbayarNominal = 0;
      let sisaNominal = 0;
      let lunasCount = 0;
      const totalCount = spptList.length;

      spptList.forEach(item => {
        const b = getBebanItemTahun(item, yr);
        const t = getTerbayarItemTahun(item, yr);
        const s = getSisaItemTahun(item, yr);

        targetNominal += b;
        terbayarNominal += t;
        sisaNominal += s;
        if (item.riwayatPembayaran?.[yr]?.lunas) {
          lunasCount += 1;
        }
      });

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

  // Active current year data for executive spotlight
  const currentYearRecap = useMemo(() => {
    return yearlyRecapData.find(r => r.tahun === CURRENT_YEAR) || {
      tahun: CURRENT_YEAR,
      totalObjek: totalObjek,
      targetNominal: totalBebanYayasan,
      terbayarNominal: 0,
      sisaNominal: totalBebanYayasan,
      persentase: 0,
      lunasCount: 0,
      belumCount: totalObjek,
      isFullyPaid: false,
      isPartiallyPaid: false,
      isUnpaid: true
    };
  }, [yearlyRecapData, totalObjek, totalBebanYayasan]);

  // Focused year recap for executive top cards in the Recap tab
  const focusYearRecap = useMemo(() => {
    return yearlyRecapData.find(r => r.tahun === focusRecapYear) || {
      tahun: focusRecapYear,
      totalObjek: totalObjek,
      targetNominal: targetNominalSelectedYear,
      terbayarNominal: lunasNominalSelectedYear,
      sisaNominal: belumLunasNominalSelectedYear,
      persentase: targetNominalSelectedYear > 0 ? Math.round((lunasNominalSelectedYear / targetNominalSelectedYear) * 100) : 0,
      lunasCount: lunasCountSelectedYear,
      belumCount: belumLunasCountSelectedYear,
      isFullyPaid: totalObjek > 0 && lunasCountSelectedYear === totalObjek,
      isPartiallyPaid: lunasCountSelectedYear > 0 && lunasCountSelectedYear < totalObjek,
      isUnpaid: lunasCountSelectedYear === 0
    };
  }, [yearlyRecapData, focusRecapYear, totalObjek, targetNominalSelectedYear, lunasNominalSelectedYear, belumLunasNominalSelectedYear, lunasCountSelectedYear, belumLunasCountSelectedYear]);

  // Filtered recap list by scope
  const filteredYearlyRecap = useMemo(() => {
    if (recapScopeFilter === 'active') {
      return yearlyRecapData.filter(r => r.tahun <= CURRENT_YEAR);
    } else if (recapScopeFilter === 'current') {
      return yearlyRecapData.filter(r => r.tahun === CURRENT_YEAR);
    } else if (recapScopeFilter === 'history') {
      return yearlyRecapData.filter(r => r.tahun < CURRENT_YEAR);
    } else if (recapScopeFilter === 'projection') {
      return yearlyRecapData.filter(r => r.tahun > CURRENT_YEAR);
    }
    return yearlyRecapData;
  }, [yearlyRecapData, recapScopeFilter]);

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

      {/* 2. SUB-MENU NAVIGATION TABS: Clean, Executive Segmented Style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-wrap bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl w-full sm:w-auto gap-1">
          {/* Menu 1: Daftar & Status Bayar */}
          <button
            type="button"
            onClick={() => setActiveSubTab('list')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSubTab === 'list'
                ? 'bg-sky-800 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
            }`}
          >
            <CheckSquare className="w-4 h-4 stroke-[2.5]" />
            <span>Daftar SPPT &amp; Status Bayar</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              activeSubTab === 'list' ? 'bg-sky-950 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {spptList.length}
            </span>
          </button>

          {/* Menu 2: Rekapan Tahunan */}
          <button
            type="button"
            onClick={() => setActiveSubTab('recap')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSubTab === 'recap'
                ? 'bg-sky-800 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
            }`}
          >
            <BarChart3 className="w-4 h-4 stroke-[2.5]" />
            <span>Rekapitulasi Tahunan</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              activeSubTab === 'recap' ? 'bg-emerald-500 text-slate-950 font-extrabold' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
            }`}>
              2025–{availableYears[availableYears.length - 1]}
            </span>
          </button>

          {/* Menu 3: Input SPPT Baru */}
          <button
            type="button"
            onClick={handleOpenNewInput}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSubTab === 'input'
                ? 'bg-sky-800 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
            }`}
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>{editingRecord ? 'Edit SPPT' : 'Input SPPT Baru'}</span>
            {userRole === 'viewer' && (
              <span className="text-xs" title="Terkunci (Khusus Admin)">🔒</span>
            )}
            {editingRecord && (
              <span className="bg-amber-400 text-sky-950 text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                Edit
              </span>
            )}
          </button>
        </div>

        {/* Status / Active Info Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-500 dark:text-slate-400 font-semibold border border-slate-200/60 dark:border-slate-700">
          {activeSubTab === 'input' ? (
            <span className="text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1.5">
              <span>✍️</span>
              <span>{editingRecord ? `Mengedit: ${editingRecord.namaWajibPajak} (${editingRecord.nop})` : 'Masukkan data objek pajak baru'}</span>
            </span>
          ) : activeSubTab === 'recap' ? (
            <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Rekap Keuangan {availableYears.length} Tahun Periode</span>
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-slate-700 dark:text-slate-300 font-bold">Tahun Aktif: <span className="font-mono text-sky-800 dark:text-sky-300 font-black">{selectedYearFilter}</span></span>
              <span>•</span>
              <span>{totalObjek} Objek Pajak</span>
            </div>
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
          className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden"
        >
          {/* Form Header */}
          <div className="bg-slate-50 dark:bg-slate-800/80 px-5 sm:px-6 py-4 border-b border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-sky-950 flex items-center justify-center font-black">
                📝
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                  {editingRecord ? 'Edit Data SPPT PBB' : 'Form Input SPPT PBB Baru'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Isi 6 kolom data utama di bawah ini untuk mencatat objek pajak yayasan.
                </p>
              </div>
            </div>

            {editingRecord && (
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
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
              <label className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 flex items-center justify-center text-[10px] font-black">1</span>
                <span>Nama Wajib Pajak *</span>
              </label>
              <input
                type="text"
                required
                value={formNamaWajibPajak}
                onChange={(e) => setFormNamaWajibPajak(e.target.value)}
                placeholder="Contoh: YAYASAN MUTTAQIN JOSENAN / H. BUKHORI"
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-3 font-semibold text-slate-900 dark:text-slate-100 text-sm focus:bg-white dark:focus:bg-slate-900 focus:border-sky-700 focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-400 pl-1">Nama wajib pajak sesuai yang tertera pada lembar SPPT fisik.</p>
            </div>

            {/* 2. LOKASI OBJEK PAJAK */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-750 dark:text-rose-300 flex items-center justify-center text-[10px] font-black">2</span>
                <span>Lokasi Objek Pajak *</span>
              </label>
              <textarea
                required
                rows={2}
                value={formLokasi}
                onChange={(e) => setFormLokasi(e.target.value)}
                placeholder="Contoh: Jl. Nogososro No. 26, Kel. Josenan, Kec. Taman, Kota Madiun"
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-3 font-semibold text-slate-900 dark:text-slate-100 text-sm focus:bg-white dark:focus:bg-slate-900 focus:border-sky-700 focus:outline-none transition-colors resize-none"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-400 pl-1">Alamat lengkap letak tanah/bangunan objek pajak.</p>
            </div>

            {/* 3. NOP (NOMOR OBJEK PAJAK) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-850 dark:text-amber-300 flex items-center justify-center text-[10px] font-black">3</span>
                  <span>NOP (Nomor Objek Pajak) *</span>
                </label>
                {formNop && (
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                    formNop.replace(/\D/g, '').length === 18 
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' 
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
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
                onChange={handleNopChange}
                placeholder="Contoh: 35.77.010.001.005-0023.0"
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-3 font-mono font-bold text-sky-900 dark:text-sky-300 text-sm focus:bg-white dark:focus:bg-slate-900 focus:border-sky-700 focus:outline-none transition-colors tracking-wide"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-400 pl-1 flex items-center justify-between">
                <span>Format otomatis: <strong>2.2.3.3.3-4.1</strong> (18 digit NOP SPPT)</span>
                <span className="font-mono text-[10px] text-slate-400">XX.XX.XXX.XXX.XXX-XXXX.X</span>
              </p>
            </div>

            {/* 4 & 5: PAJAK TERUTANG & TOTAL BAYAR YAYASAN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* 4. Pajak Terutang */}
              <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <label className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center text-[10px] font-black">4</span>
                  <span>Pajak Terutang (Rp) *</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 dark:text-slate-400 text-sm">Rp</span>
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
                    className="w-full pl-11 pr-3 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 text-sm focus:border-sky-700 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Nominal ketetapan PBB pokok yang tercantum di SPPT.</p>
              </div>

              {/* 5. Total Dibayar Yayasan Tiap Tahun */}
              <div className="space-y-1.5 bg-emerald-50/60 dark:bg-emerald-950/20 p-4 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-emerald-900 dark:text-emerald-200 tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 flex items-center justify-center text-[10px] font-black">5</span>
                    <span>Total Bayar Yayasan Tiap Tahun (Rp) *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormTotalBayarYayasan(formPajakTerutang)}
                    className="text-[10px] font-extrabold bg-emerald-200 dark:bg-emerald-800 hover:bg-emerald-300 dark:hover:bg-emerald-700 text-emerald-900 dark:text-emerald-100 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    Samakan
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-emerald-700 dark:text-emerald-400 text-sm">Rp</span>
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
                    className="w-full pl-11 pr-3 py-2.5 bg-white dark:bg-slate-800 border-2 border-emerald-300 dark:border-emerald-700 rounded-xl font-black text-emerald-900 dark:text-emerald-200 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">Total nominal riil yang menjadi kewajiban yayasan per tahun.</p>
              </div>
            </div>

            {/* 6. CEK LIS & NILAI PEMBAYARAN TIAP TAHUN */}
            <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-sky-200 dark:bg-sky-800 text-sky-900 dark:text-sky-100 flex items-center justify-center text-[10px] font-black">6</span>
                    <span>Nilai &amp; Ceklis Pembayaran Tiap Tahun</span>
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Nominal dapat disesuaikan per tahun jika ada perubahan tarif/ketetapan pajak SPPT.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  {/* Batch set nominal */}
                  <button
                    type="button"
                    onClick={handleApplyDefaultNominalToAllYears}
                    className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-emerald-900 dark:text-emerald-300 font-bold rounded-lg text-xs cursor-pointer transition-colors"
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
                      className="w-32 px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleAddYear}
                      className="px-2.5 py-1 bg-sky-100 dark:bg-sky-900/60 hover:bg-sky-200 dark:hover:bg-sky-800 text-sky-900 dark:text-sky-200 font-bold rounded-lg text-xs cursor-pointer"
                    >
                      + Tambah
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
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
                          ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 shadow-2xs' 
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {/* Year Header & Toggle */}
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm font-mono text-slate-900 dark:text-slate-100">{yr}</span>
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
                            isLunas ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                          }`}>
                            {isLunas ? '✓ LUNAS' : 'BELUM'}
                          </span>
                        </label>
                      </div>

                      {/* Input Nominal Per Tahun */}
                      <div className="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-700">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[9px] font-bold uppercase text-slate-500 dark:text-slate-400">
                            Nilai Bayar Tahun {yr} (Rp):
                          </span>
                          {customNominal !== undefined && customNominal > 0 && (
                            <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 font-mono">
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
                          className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 font-mono font-bold text-slate-800 dark:text-slate-100 focus:border-sky-600 focus:outline-none"
                        />
                      </div>

                      {/* Inputs if Lunas */}
                      {isLunas && (
                        <div className="mt-2 space-y-1.5 pt-2 border-t border-emerald-200 dark:border-emerald-800 animate-fadeIn">
                          <div>
                            <span className="text-[9px] font-bold text-emerald-800 dark:text-emerald-300 uppercase block mb-0.5">Tgl Bayar:</span>
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
                              className="w-full text-xs bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-slate-900 dark:text-slate-100 rounded-lg p-1.5 font-medium"
                            />
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-emerald-800 dark:text-emerald-300 uppercase block mb-0.5">Catatan / Bukti:</span>
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
                              className="w-full text-xs bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-slate-900 dark:text-slate-100 rounded-lg p-1.5 font-medium placeholder:text-emerald-400 dark:placeholder:text-emerald-600"
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
              <label className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 tracking-wider">
                Catatan / Keterangan Tambahan (Opsional):
              </label>
              <input
                type="text"
                value={formKeterangan}
                onChange={(e) => setFormKeterangan(e.target.value)}
                placeholder="Contoh: Tanah Kompleks Pesantren & Kantor Utama"
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl p-2.5 font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 focus:outline-none transition-colors"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
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
                  className="w-full sm:w-auto px-5 py-3 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold rounded-2xl transition-colors cursor-pointer text-sm flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Hapus SPPT</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setActiveSubTab('list');
                }}
                className="w-full sm:w-auto px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl transition-colors cursor-pointer text-sm"
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
          {/* 1. Top Executive 3-Card Summary for Selected Year */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Card 1: Ketetapan Beban */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  <span>Ketetapan Beban {selectedYearFilter}</span>
                </span>
                {userRole === 'admin' ? (
                  <button
                    type="button"
                    onClick={() => handleOpenPolicyModal(selectedYearFilter)}
                    className="px-2.5 py-1 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer border border-sky-200 dark:border-sky-800"
                    title={`Sesuaikan Kebijakan Tarif / Kenaikan Pemda Tahun ${selectedYearFilter}`}
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>Kebijakan Pemda</span>
                  </button>
                ) : (
                  <span className="text-xs text-slate-400">🏛️</span>
                )}
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                  {formatRupiah(targetNominalSelectedYear)}
                </p>
                <div className="flex items-center justify-between mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span>{totalObjek} Objek Pajak (NOP)</span>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-medium text-slate-600 dark:text-slate-300">
                    Ketetapan SPPT
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Sudah Terbayar */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border-2 border-emerald-200/90 dark:border-emerald-800/60 shadow-2xs flex flex-col justify-between space-y-3 bg-gradient-to-br from-emerald-50/20 to-transparent">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Sudah Terbayar ({selectedYearFilter})</span>
                </span>
                <span className="p-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-md text-xs font-bold px-2 py-0.5">
                  {targetNominalSelectedYear > 0 ? Math.round((lunasNominalSelectedYear / targetNominalSelectedYear) * 100) : 0}% Lunas
                </span>
              </div>
              <div>
                <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono tracking-tight">
                  {formatRupiah(lunasNominalSelectedYear)}
                </p>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <span>{lunasCountSelectedYear} dari {totalObjek} NOP Lunas</span>
                  </div>
                  <div className="w-full h-1.5 bg-emerald-100 dark:bg-emerald-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300" 
                      style={{ width: `${targetNominalSelectedYear > 0 ? Math.min(100, Math.round((lunasNominalSelectedYear / targetNominalSelectedYear) * 100)) : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Sisa Belum Bayar */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${belumLunasNominalSelectedYear === 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span>Sisa Belum Bayar ({selectedYearFilter})</span>
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                  belumLunasNominalSelectedYear === 0 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                }`}>
                  {belumLunasNominalSelectedYear === 0 ? 'LUNAS SEMUA' : `${belumLunasCountSelectedYear} TERTUNDA`}
                </span>
              </div>
              <div>
                <p className={`text-2xl font-black font-mono tracking-tight ${belumLunasNominalSelectedYear > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {formatRupiah(belumLunasNominalSelectedYear)}
                </p>
                <div className="flex items-center justify-between mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span>{belumLunasCountSelectedYear === 0 ? '✓ Semua tagihan lunas' : `${belumLunasCountSelectedYear} NOP belum melunasi`}</span>
                  <span className="text-[10px] font-medium text-slate-400">Tahun {selectedYearFilter}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Interactive Year Pills Bar */}
          <div className="bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-black uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Pilih Tahun Pajak:</span>
              </span>
              <span className="text-[11px] font-medium">
                Tahun Aktif: <strong className="text-slate-800 dark:text-slate-200">{selectedYearFilter}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-thin">
              {availableYears.map(yr => {
                const yrData = yearlyRecapData.find(r => r.tahun === yr);
                const isSelected = yr === selectedYearFilter;
                const isCurrent = yr === CURRENT_YEAR;
                const isFullyPaid = yrData?.isFullyPaid;
                const isPartial = yrData?.isPartiallyPaid;

                return (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setSelectedYearFilter(yr)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-sky-800 text-white shadow-xs ring-2 ring-sky-500'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${
                      isFullyPaid 
                        ? 'bg-emerald-500' 
                        : isPartial 
                        ? 'bg-amber-400' 
                        : yr > CURRENT_YEAR 
                        ? 'bg-sky-400' 
                        : 'bg-rose-500'
                    }`} />
                    <span>{yr}</span>
                    {isCurrent && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                        isSelected ? 'bg-amber-400 text-sky-950' : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                      }`}>
                        Aktif
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Search & Status Filter Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Wajib Pajak, NOP, atau Lokasi..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-sky-600 transition-colors placeholder:text-slate-400"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'all' 
                      ? 'bg-white dark:bg-slate-700 text-sky-950 dark:text-white shadow-2xs' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Semua ({spptList.length})
                </button>
                <button
                  onClick={() => setStatusFilter('lunas')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    statusFilter === 'lunas' 
                      ? 'bg-emerald-600 text-white shadow-2xs' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400'
                  }`}
                >
                  <span>✓ Lunas</span>
                  <span className="text-[10px] opacity-90">({lunasCountSelectedYear})</span>
                </button>
                <button
                  onClick={() => setStatusFilter('belum')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    statusFilter === 'belum' 
                      ? 'bg-rose-600 text-white shadow-2xs' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-400'
                  }`}
                >
                  <span>⏳ Belum</span>
                  <span className="text-[10px] opacity-90">({belumLunasCountSelectedYear})</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleExportCSV}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                title="Unduh data NOP ke format CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* 4. Table List Container (Clean & Professional Financial Ledger) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
            {filteredList.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-300 flex items-center justify-center mb-3">
                  <Receipt className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Tidak ada data SPPT PBB</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {searchQuery ? 'Tidak ada hasil yang sesuai dengan filter pencarian.' : 'Belum ada data SPPT PBB yang tersimpan.'}
                </p>
                <button
                  onClick={handleOpenNewInput}
                  className="mt-4 px-4 py-2 bg-sky-800 text-white rounded-xl text-xs font-bold hover:bg-sky-900 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Input SPPT Baru</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    <tr>
                      <th className="py-3 px-3 text-center w-10">No</th>
                      <th className="py-3 px-4">Objek Pajak &amp; NOP</th>
                      <th className="py-3 px-4">Lokasi Objek</th>
                      <th className="py-3 px-4">Beban Tahun {selectedYearFilter}</th>
                      <th className="py-3 px-4">Status Bayar ({selectedYearFilter})</th>
                      <th className="py-3 px-4">Riwayat Multi-Tahun</th>
                      <th className="py-3 px-3 text-center w-16">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredList.map((item, idx) => {
                      const isLunas = item.riwayatPembayaran?.[selectedYearFilter]?.lunas ?? false;
                      const bebanTahun = getBebanItemTahun(item, selectedYearFilter);
                      const paymentData = item.riwayatPembayaran?.[selectedYearFilter];
                      const terbayarTahun = getTerbayarItemTahun(item, selectedYearFilter);

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                          {/* 1. No */}
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                            {idx + 1}
                          </td>

                          {/* 2. Objek Pajak & NOP */}
                          <td className="py-3 px-4 min-w-[190px]">
                            <div className="font-black text-slate-900 dark:text-slate-100 leading-tight">
                              {item.namaWajibPajak}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5">
                              <span className="font-mono text-[11px] font-bold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 px-2 py-0.5 rounded border border-sky-200/80 dark:border-sky-800">
                                {item.nop}
                              </span>
                            </div>
                            {item.keteranganTambahan && (
                              <p className="text-[10px] text-slate-400 mt-0.5 italic line-clamp-1">
                                {item.keteranganTambahan}
                              </p>
                            )}
                          </td>

                          {/* 3. Lokasi */}
                          <td className="py-3 px-4 max-w-[200px]">
                            <div className="flex items-start gap-1 text-slate-700 dark:text-slate-300 text-xs">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                              <span className="leading-snug line-clamp-2">{item.lokasi}</span>
                            </div>
                          </td>

                          {/* 4. Beban Tahun Terpilih */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-sm text-slate-900 dark:text-slate-100">
                                {formatRupiah(bebanTahun)}
                              </span>
                              {userRole === 'admin' && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickTogglePayment(item, selectedYearFilter)}
                                  className="text-slate-400 hover:text-sky-600 dark:hover:text-sky-300 p-0.5 rounded transition-colors cursor-pointer"
                                  title={`Sesuaikan beban tahun ${selectedYearFilter} untuk NOP ini`}
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Pokok: {formatRupiah(item.totalBayarYayasanTahunan || item.pajakTerutang)}
                            </span>
                          </td>

                          {/* 5. Status Bayar Tahun Terpilih (Clear, Clickable Badge) */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleQuickTogglePayment(item, selectedYearFilter)}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer border ${
                                isLunas
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
                                  : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
                              }`}
                              title={isLunas ? `LUNAS (${paymentData?.tanggalBayar || 'Tgl tdk tercatat'}). Klik untuk ubah / rincian.` : `BELUM BAYAR. Klik untuk mencatat pelunasan.`}
                            >
                              {isLunas ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  <span>LUNAS</span>
                                  {paymentData?.tanggalBayar && (
                                    <span className="text-[10px] font-mono opacity-80 pl-1 border-l border-emerald-300 dark:border-emerald-700">
                                      {paymentData.tanggalBayar}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                  <span>BELUM BAYAR</span>
                                  <span className="text-[10px] opacity-80 underline underline-offset-2 ml-1">
                                    Bayar
                                  </span>
                                </>
                              )}
                            </button>
                          </td>

                          {/* 6. Riwayat Multi-Tahun (Sleek Compact Micro-chips) */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              {availableYears.map(yr => {
                                const yrPayment = item.riwayatPembayaran?.[yr];
                                const yrLunas = yrPayment?.lunas ?? false;
                                const isCurrentSelected = yr === selectedYearFilter;
                                const shortYear = `'${String(yr).slice(2)}`;

                                return (
                                  <button
                                    key={yr}
                                    type="button"
                                    onClick={() => handleQuickTogglePayment(item, yr)}
                                    className={`w-6 h-6 rounded-md text-[10px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer select-none ${
                                      isCurrentSelected ? 'ring-2 ring-sky-600 font-black' : ''
                                    } ${
                                      yrLunas
                                        ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-200'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 hover:text-slate-700'
                                    }`}
                                    title={`Tahun ${yr}: ${yrLunas ? `LUNAS (${formatRupiah(yrPayment?.nominalBayar || getBebanItemTahun(item, yr))})` : 'BELUM BAYAR'}. Klik untuk kelola.`}
                                  >
                                    {shortYear}
                                  </button>
                                );
                              })}
                            </div>
                          </td>

                          {/* 7. Aksi */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              {userRole === 'admin' ? (
                                <>
                                  <button
                                    onClick={() => handleEditRecord(item)}
                                    className="p-1.5 hover:bg-sky-50 dark:hover:bg-sky-950/60 text-sky-700 dark:text-sky-300 rounded-lg transition-colors cursor-pointer"
                                    title="Edit data SPPT"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRecord(item)}
                                    className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-lg transition-colors cursor-pointer"
                                    title="Hapus data SPPT"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <span className="text-xs text-slate-400" title="Mode Tamu">🔒</span>
                              )}
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
          {/* 1. Executive Snapshot Strip (Grand Total Multi-Tahun 2025-2035) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Card 1: Total Beban Kewajiban */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  <span>Total Beban Ketetapan</span>
                </span>
                <span className="font-mono font-bold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">
                  {availableYears.length} Periode Tahun
                </span>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                  {formatRupiah(grandTotalTarget)}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  {totalObjek} Objek Pajak (2025–{availableYears[availableYears.length - 1]})
                </p>
              </div>
            </div>

            {/* Card 2: Sudah Terbayar */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border-2 border-emerald-200/90 dark:border-emerald-800/60 shadow-2xs flex flex-col justify-between space-y-2 bg-gradient-to-br from-emerald-50/20 to-transparent">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-[10px] uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Realisasi Sudah Terbayar</span>
                </span>
                <span className="font-mono font-black text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                  {grandTotalPersen}% Lunas
                </span>
              </div>
              <div>
                <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono tracking-tight">
                  {formatRupiah(grandTotalTerbayar)}
                </p>
                <div className="w-full h-1.5 bg-emerald-100 dark:bg-emerald-950 rounded-full overflow-hidden mt-2">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(100, grandTotalPersen)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Card 3: Sisa Belum Bayar */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${grandTotalSisa === 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span>Sisa Belum Dibayar</span>
                </span>
                <span className={`font-black text-[10px] px-2 py-0.5 rounded-md ${
                  grandTotalSisa === 0 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                }`}>
                  {grandTotalSisa === 0 ? 'LUNAS SEMUA' : 'SISA TAGIHAN'}
                </span>
              </div>
              <div>
                <p className={`text-2xl font-black font-mono tracking-tight ${grandTotalSisa > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {formatRupiah(grandTotalSisa)}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  {grandTotalSisa === 0 ? '✓ Tidak ada tunggakan kas' : 'Akumulasi seluruh tahun anggaran'}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Unified Ledger & Table Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
            {/* Single Clean Filter Toolbar */}
            <div className="p-3 sm:p-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-850/60">
              {/* Scope Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setRecapScopeFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    recapScopeFilter === 'all'
                      ? 'bg-sky-800 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Semua Tahun ({yearlyRecapData.length})
                </button>

                <button
                  type="button"
                  onClick={() => setRecapScopeFilter('current')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    recapScopeFilter === 'current'
                      ? 'bg-amber-400 text-sky-950 font-black shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-900 animate-pulse" />
                  <span>Tahun Berjalan ({CURRENT_YEAR})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRecapScopeFilter('history')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    recapScopeFilter === 'history'
                      ? 'bg-sky-800 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Riwayat ({yearlyRecapData.filter(r => r.tahun < CURRENT_YEAR).length})
                </button>

                <button
                  type="button"
                  onClick={() => setRecapScopeFilter('projection')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    recapScopeFilter === 'projection'
                      ? 'bg-sky-800 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Proyeksi ({yearlyRecapData.filter(r => r.tahun > CURRENT_YEAR).length})
                </button>
              </div>

              {/* View Toggle & CSV Export */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setRecapViewMode('table')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      recapViewMode === 'table'
                        ? 'bg-white dark:bg-slate-700 text-sky-950 dark:text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                    title="Tampilan Tabel Buku Kas"
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                    <span>Tabel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecapViewMode('cards')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      recapViewMode === 'cards'
                        ? 'bg-white dark:bg-slate-700 text-sky-950 dark:text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                    title="Tampilan Kartu Ringkas"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Kartu</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleExportYearlyRecapCSV}
                  className="px-3 py-1.5 bg-sky-800 hover:bg-sky-900 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Unduh laporan rekapan ke file CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ekspor CSV</span>
                </button>
              </div>
            </div>

            {/* TABEL VIEW: Super Clean, Financial Ledger with Distinct Columns */}
            {recapViewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Tahun Pajak</th>
                      <th className="py-3 px-4">Beban Ketetapan (Rp)</th>
                      <th className="py-3 px-4">Sudah Terbayar (Rp)</th>
                      <th className="py-3 px-4">Belum Bayar (Rp)</th>
                      <th className="py-3 px-4 text-center">Status Pelunasan</th>
                      <th className="py-3 px-4 text-center w-36">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredYearlyRecap.map((item) => {
                      const isCurrentYear = item.tahun === CURRENT_YEAR;
                      const isFuture = item.tahun > CURRENT_YEAR;

                      return (
                        <tr 
                          key={item.tahun} 
                          className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${
                            isCurrentYear ? 'bg-sky-50/40 dark:bg-sky-950/20' : ''
                          }`}
                        >
                          {/* 1. Tahun Pajak */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className={`font-mono text-xs font-black px-2.5 py-1 rounded-xl border ${
                                isCurrentYear 
                                  ? 'bg-sky-800 text-white border-sky-900 shadow-2xs'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                              }`}>
                                {item.tahun}
                              </span>

                              {isCurrentYear && (
                                <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400 text-sky-950 px-2 py-0.5 rounded-md shadow-2xs">
                                  Tahun Ini
                                </span>
                              )}
                              {isFuture && (
                                <span className="text-[9px] font-semibold text-slate-400">
                                  Proyeksi
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 2. Beban Ketetapan (Rp) */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-mono font-black text-sm text-slate-900 dark:text-white">
                              {formatRupiah(item.targetNominal)}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {item.totalObjek} NOP
                            </span>
                          </td>

                          {/* 3. Sudah Terbayar (Rp) */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-sm text-emerald-700 dark:text-emerald-400">
                                {formatRupiah(item.terbayarNominal)}
                              </span>
                              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                item.persentase === 100
                                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                                  : item.persentase > 0
                                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                              }`}>
                                {item.persentase}%
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {item.lunasCount} dari {item.totalObjek} NOP Lunas
                            </span>
                          </td>

                          {/* 4. Belum Bayar (Rp) */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className={`font-mono font-black text-sm ${
                              item.sisaNominal === 0 
                                ? 'text-emerald-600 dark:text-emerald-400' 
                                : isFuture 
                                ? 'text-slate-600 dark:text-slate-300' 
                                : 'text-rose-600 dark:text-rose-400'
                            }`}>
                              {formatRupiah(item.sisaNominal)}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {item.sisaNominal === 0 ? '✓ Lunas' : `${item.belumCount} NOP Tertunda`}
                            </span>
                          </td>

                          {/* 5. Status Pelunasan */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {item.isFullyPaid ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>100% LUNAS</span>
                              </span>
                            ) : item.isPartiallyPaid ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                <span>⚡ SEBAGIAN</span>
                              </span>
                            ) : isFuture ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                <span>○ Belum Masuk</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                <span>○ BELUM BAYAR</span>
                              </span>
                            )}
                          </td>

                          {/* 6. Aksi */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {userRole === 'admin' && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenPolicyModal(item.tahun)}
                                  className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                                  title={`Sesuaikan Kebijakan Tarif Pemerintah Tahun ${item.tahun}`}
                                >
                                  <SlidersHorizontal className="w-3.5 h-3.5" />
                                  <span>Kebijakan</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedYearFilter(item.tahun);
                                  setActiveSubTab('list');
                                }}
                                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-sky-800 hover:text-white dark:hover:bg-sky-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                                title={`Buka Rincian NOP Tahun ${item.tahun}`}
                              >
                                <span>Buka NOP</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Grand Total Footer */}
                  <tfoot className="bg-slate-900 dark:bg-slate-950 text-white font-mono text-xs border-t-2 border-slate-950">
                    <tr>
                      <td className="py-3.5 px-4 font-black uppercase text-amber-400">
                        TOTAL REKAPITULASI
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-100 whitespace-nowrap">
                        {formatRupiah(filteredYearlyRecap.reduce((acc, c) => acc + c.targetNominal, 0))}
                      </td>
                      <td className="py-3.5 px-4 font-black text-emerald-400 whitespace-nowrap">
                        {formatRupiah(filteredYearlyRecap.reduce((acc, c) => acc + c.terbayarNominal, 0))}
                      </td>
                      <td className="py-3.5 px-4 font-black text-rose-300 whitespace-nowrap">
                        {formatRupiah(filteredYearlyRecap.reduce((acc, c) => acc + c.sisaNominal, 0))}
                      </td>
                      <td className="py-3.5 px-4 text-center font-sans font-black text-emerald-400 text-xs">
                        {filteredYearlyRecap.reduce((acc, c) => acc + c.targetNominal, 0) > 0 
                          ? `${Math.round((filteredYearlyRecap.reduce((acc, c) => acc + c.terbayarNominal, 0) / filteredYearlyRecap.reduce((acc, c) => acc + c.targetNominal, 0)) * 100)}% Terbayar` 
                          : '0%'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-sans text-[11px] text-slate-400">
                        {filteredYearlyRecap.length} Tahun
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              /* KARTU VIEW: Clean Bento Cards */
              <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredYearlyRecap.map((item) => {
                  const isCurrentYear = item.tahun === CURRENT_YEAR;
                  const isFuture = item.tahun > CURRENT_YEAR;

                  return (
                    <div
                      key={item.tahun}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-3 ${
                        isCurrentYear
                          ? 'bg-sky-50/40 dark:bg-sky-950/30 border-sky-500 shadow-xs'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200/90 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-base font-black font-mono px-2.5 py-0.5 rounded-lg border ${
                          isCurrentYear
                            ? 'bg-sky-800 text-white border-sky-900 shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-600'
                        }`}>
                          {item.tahun}
                        </span>

                        {isCurrentYear ? (
                          <span className="text-[10px] font-black uppercase bg-amber-400 text-sky-950 px-2 py-0.5 rounded-md shadow-2xs">
                            Tahun Ini
                          </span>
                        ) : isFuture ? (
                          <span className="text-[10px] font-semibold text-slate-400">
                            Proyeksi
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                            Riwayat
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Beban:</span>
                          <span className="font-mono font-black text-slate-900 dark:text-white">
                            {formatRupiah(item.targetNominal)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Terbayar:</span>
                          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            {formatRupiah(item.terbayarNominal)} ({item.persentase}%)
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Sisa:</span>
                          <span className={`font-mono font-bold ${item.sisaNominal === 0 ? 'text-emerald-600' : 'text-rose-600 dark:text-rose-400'}`}>
                            {formatRupiah(item.sisaNominal)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700">
                        {userRole === 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleOpenPolicyModal(item.tahun)}
                            className="p-2 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 rounded-xl text-xs font-bold transition-colors border border-sky-200 dark:border-sky-800"
                            title={`Kebijakan Pemda ${item.tahun}`}
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedYearFilter(item.tahun);
                            setActiveSubTab('list');
                          }}
                          className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-sky-800 hover:text-white dark:hover:bg-sky-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <span>Rincian NOP {item.tahun}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 z-10 space-y-4 border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-slate-100">
                      Hapus Data SPPT PBB?
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Konfirmasi penghapusan data objek pajak
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmRecord(null)}
                  disabled={isDeleting}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Record Summary Card */}
              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-4 space-y-2.5 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Wajib Pajak:</span>
                  <span className="font-black text-slate-900 dark:text-slate-100 text-sm">{deleteConfirmRecord.namaWajibPajak}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">NOP:</span>
                    <span className="font-mono font-bold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800 inline-block mt-0.5">
                      {deleteConfirmRecord.nop}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Beban Tahunan:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 block mt-0.5">
                      {formatRupiah(deleteConfirmRecord.totalBayarYayasanTahunan || deleteConfirmRecord.pajakTerutang)}
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Lokasi:</span>
                  <span className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{deleteConfirmRecord.lokasi}</span>
                </div>
              </div>

              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/90 dark:border-rose-800 rounded-2xl text-[11px] text-rose-900 dark:text-rose-200 leading-relaxed font-medium">
                ⚠️ <strong>Perhatian:</strong> Data objek SPPT ini serta seluruh catatan riwayat pembayarannya akan dihapus secara permanen dari sistem dan Google Sheets.
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmRecord(null)}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs transition-colors cursor-pointer disabled:opacity-50"
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
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-5 z-10 space-y-4 border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                    quickPayRecord.currentLunas 
                      ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300' 
                      : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {quickPayRecord.currentLunas ? '✏️' : '✓'}
                  </span>
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100">
                      {quickPayRecord.currentLunas ? `Ubah Pembayaran Tahun ${quickPayRecord.tahun}` : `Tandai Lunas Tahun ${quickPayRecord.tahun}`}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {quickPayRecord.record.nop}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setQuickPayRecord(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmQuickPay} className="space-y-3.5 text-xs">
                {/* Wajib Pajak & NOP info */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Objek Pajak:</span>
                  <div className="font-black text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                    {quickPayRecord.record.namaWajibPajak}
                  </div>
                  <div className="font-mono text-[11px] text-sky-700 dark:text-sky-300 mt-0.5">
                    NOP: {quickPayRecord.record.nop}
                  </div>
                </div>

                {/* 1. Beban Ketetapan SPPT Tahun Ini (Kebijakan Pemerintah) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <span>Beban Ketetapan Tahun {quickPayRecord.tahun} (Rp): *</span>
                      <span className="text-[9px] bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-bold px-1.5 py-0.2 rounded">
                        Kebijakan Pemda
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const base = quickPayRecord.record.totalBayarYayasanTahunan || quickPayRecord.record.pajakTerutang;
                        setQuickPayKetetapan(base);
                        if (quickPayIsLunas) {
                          setQuickPayNominal(base);
                        }
                      }}
                      className="text-[9px] text-sky-700 dark:text-sky-300 hover:underline cursor-pointer font-semibold"
                    >
                      Gunakan Standar ({formatRupiah(quickPayRecord.record.totalBayarYayasanTahunan || quickPayRecord.record.pajakTerutang)})
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-sky-800 dark:text-sky-300 text-xs">Rp</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={quickPayKetetapan}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const val = raw === '' ? '' : (isNaN(Number(raw)) ? raw : Number(raw)) as any;
                        setQuickPayKetetapan(val);
                        // If paid matches previous ketetapan, offer keeping in sync
                        if (quickPayIsLunas && (quickPayNominal === '' || quickPayNominal === quickPayKetetapan)) {
                          setQuickPayNominal(val);
                        }
                      }}
                      placeholder="Nominal ketetapan SPPT tahun ini..."
                      className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border-2 border-sky-300 dark:border-sky-700 rounded-xl font-black font-mono text-slate-900 dark:text-white text-sm focus:border-sky-600 focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Beban SPPT tahun ini dapat disesuaikan jika ada kenaikan tarif atau stimulus potongan dari pemerintah.
                  </span>
                </div>

                {/* 2. Status Pelunasan */}
                <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block">
                    Status Pelunasan Tahun {quickPayRecord.tahun}:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setQuickPayIsLunas(true);
                        if (quickPayNominal === '' || quickPayNominal === 0) {
                          setQuickPayNominal(quickPayKetetapan || getBebanItemTahun(quickPayRecord.record, quickPayRecord.tahun));
                        }
                      }}
                      className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                        quickPayIsLunas
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs font-black'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>✓ Lunas</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickPayIsLunas(false)}
                      className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                        !quickPayIsLunas
                          ? 'bg-rose-600 text-white border-rose-700 shadow-2xs font-black'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>✕ Belum Bayar</span>
                    </button>
                  </div>
                </div>

                {/* 3. Input Realisasi Bayar jika Lunas */}
                {quickPayIsLunas ? (
                  <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800 animate-fadeIn">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block">
                          Nominal Realisasi Terbayar (Rp): *
                        </label>
                        <button
                          type="button"
                          onClick={() => setQuickPayNominal(quickPayKetetapan)}
                          className="text-[9px] text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer font-semibold"
                        >
                          Samakan Beban ({formatRupiah(typeof quickPayKetetapan === 'number' ? quickPayKetetapan : 0)})
                        </button>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-emerald-700 dark:text-emerald-400 text-xs">Rp</span>
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
                          className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border-2 border-emerald-300 dark:border-emerald-700 rounded-xl font-black font-mono text-emerald-900 dark:text-emerald-200 text-sm focus:border-emerald-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block">
                        Tanggal Pembayaran:
                      </label>
                      <input
                        type="date"
                        required
                        value={quickPayTanggal}
                        onChange={(e) => setQuickPayTanggal(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl p-2 font-medium"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-[11px] text-amber-900 dark:text-amber-200">
                    <p className="font-bold">Kewajiban Belum Dibayar:</p>
                    <p className="mt-0.5">
                      Beban sebesar <strong>{formatRupiah(typeof quickPayKetetapan === 'number' ? quickPayKetetapan : 0)}</strong> akan tercatat sebagai sisa tanggungan yayasan untuk tahun {quickPayRecord.tahun}.
                    </p>
                  </div>
                )}

                {/* Keterangan */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block">
                    Keterangan / Bukti Bayar:
                  </label>
                  <input
                    type="text"
                    value={quickPayKeterangan}
                    onChange={(e) => setQuickPayKeterangan(e.target.value)}
                    placeholder="Contoh: Bank Jatim / Bapenda / Stimulus Pemda"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl p-2 font-medium"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setQuickPayRecord(null)}
                    className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-2.5 text-white font-black rounded-xl shadow-xs cursor-pointer transition-all ${
                      quickPayIsLunas
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-sky-800 hover:bg-sky-900'
                    }`}
                  >
                    {quickPayIsLunas ? 'Simpan Pelunasan' : 'Simpan Ketetapan Beban'}
                  </button>
                </div>

                {quickPayRecord.currentLunas && quickPayIsLunas && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handleCancelPaymentStatus}
                      className="w-full py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
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

        {/* MODAL PENYESUAIAN KEBIJAKAN PEMERINTAH (TARIF & KETETAPAN TAHUNAN) */}
        {policyModalYear !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSavingPolicy && setPolicyModalYear(null)}
              className="fixed inset-0 bg-slate-900"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-5 sm:p-6 z-10 space-y-4 border border-slate-100 dark:border-slate-800 max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 rounded-2xl">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-slate-100">
                        Penyesuaian Kebijakan Beban Pajak Tahun {policyModalYear}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                        Kebijakan Pemda
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      Beban pembayaran SPPT tiap tahun dapat berbeda sesuai penyesuaian tarif, NJOP, atau stimulus Pemda.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPolicyModalYear(null)}
                  disabled={isSavingPolicy}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content Body */}
              <form onSubmit={handleSavePolicyModal} className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
                {/* 1. Quick Adjustment Tools */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Alat Penyesuaian Kenaikan / Stimulus Massal</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Terapkan ke seluruh {spptList.length} NOP</span>
                  </div>

                  {/* Quick percentage buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleApplyPercentageAdjustment(5)}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-700 hover:bg-sky-50 dark:hover:bg-sky-950/50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                    >
                      📈 +5% (Kenaikan NJOP)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPercentageAdjustment(10)}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-700 hover:bg-sky-50 dark:hover:bg-sky-950/50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                    >
                      📈 +10% (Ketetapan Baru)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPercentageAdjustment(-10)}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                    >
                      🏷️ -10% (Diskon Stimulus)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPercentageAdjustment(-20)}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                    >
                      🏷️ -20% (Diskon HUT Kota)
                    </button>
                    <button
                      type="button"
                      onClick={handleResetToBaseline}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-slate-200 dark:border-slate-600 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                    >
                      ↺ Reset ke Standar
                    </button>
                    {policyModalYear > 2025 && (
                      <button
                        type="button"
                        onClick={() => handleCopyFromYear(policyModalYear - 1)}
                        className="px-2.5 py-1.5 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Salin dari Thn {policyModalYear - 1}</span>
                      </button>
                    )}
                  </div>

                  {/* Custom percentage input */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-500">Persentase Kustom:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="any"
                        value={policyAdjustPercent}
                        onChange={(e) => setPolicyAdjustPercent(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Contoh: 7.5 atau -5"
                        className="w-28 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                      />
                      <span className="text-xs font-bold text-slate-500">%</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof policyAdjustPercent === 'number') {
                            handleApplyPercentageAdjustment(policyAdjustPercent);
                          }
                        }}
                        disabled={typeof policyAdjustPercent !== 'number'}
                        className="px-2.5 py-1 bg-sky-800 hover:bg-sky-900 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Terapkan
                      </button>
                    </div>
                  </div>
                </div>

                {/* Catatan Kebijakan */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block">
                    Keterangan Dasar Kebijakan / Surat Edaran Pemda:
                  </label>
                  <input
                    type="text"
                    value={policyNote}
                    onChange={(e) => setPolicyNote(e.target.value)}
                    placeholder="Contoh: Kenaikan NJOP Pemkab Madiun / Diskon Stimulus Pembayaran Awal Tahun"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl p-2.5 font-medium"
                  />
                </div>

                {/* 2. Rincian Objek Pajak (NOP) & Input Ketetapan Baru */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300">
                      Rincian Beban Per NOP Tahun {policyModalYear}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Anda dapat mengubah nominal tiap NOP secara spesifik di bawah
                    </span>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800/90 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3 w-8 text-center">No</th>
                          <th className="py-2.5 px-3">Wajib Pajak &amp; NOP</th>
                          <th className="py-2.5 px-3 text-right">Standar Pokok</th>
                          <th className="py-2.5 px-3 w-40 text-right">Ketetapan Thn {policyModalYear}</th>
                          <th className="py-2.5 px-3 text-right">Selisih</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {spptList.map((item, idx) => {
                          const base = item.totalBayarYayasanTahunan || item.pajakTerutang || 0;
                          const currentVal = policyPerNopEdits[item.id];
                          const numVal = typeof currentVal === 'number' ? currentVal : base;
                          const diff = numVal - base;

                          return (
                            <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                              <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                                {idx + 1}
                              </td>
                              <td className="py-2 px-3">
                                <div className="font-bold text-slate-800 dark:text-slate-200 leading-tight">
                                  {item.namaWajibPajak}
                                </div>
                                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                  {item.nop}
                                </div>
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                {formatRupiah(base)}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <span className="text-[10px] font-bold text-slate-400">Rp</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={currentVal !== undefined ? currentVal : base}
                                    onChange={(e) => {
                                      const raw = e.target.value;
                                      const parsed = raw === '' ? '' : Number(raw);
                                      setPolicyPerNopEdits(prev => ({ ...prev, [item.id]: parsed }));
                                    }}
                                    className="w-28 px-2 py-1 bg-white dark:bg-slate-800 border border-sky-300 dark:border-sky-700 rounded-lg text-right font-mono font-black text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                                  />
                                </div>
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-[11px] whitespace-nowrap">
                                {diff === 0 ? (
                                  <span className="text-slate-400">0</span>
                                ) : diff > 0 ? (
                                  <span className="text-rose-600 dark:text-rose-400 font-bold">+{formatRupiah(diff)}</span>
                                ) : (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">-{formatRupiah(Math.abs(diff))}</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Summary Banner */}
                {(() => {
                  const totalBase = spptList.reduce((acc, curr) => acc + (curr.totalBayarYayasanTahunan || curr.pajakTerutang || 0), 0);
                  const totalNew = spptList.reduce((acc, curr) => {
                    const custom = policyPerNopEdits[curr.id];
                    const num = typeof custom === 'number' && custom >= 0 ? custom : (curr.totalBayarYayasanTahunan || curr.pajakTerutang || 0);
                    return acc + num;
                  }, 0);
                  const selisihTotal = totalNew - totalBase;

                  return (
                    <div className="p-3 bg-gradient-to-r from-sky-900 to-slate-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
                      <div>
                        <span className="text-[10px] uppercase text-sky-300 font-bold block">
                          Total Beban Pajak Tahun {policyModalYear}:
                        </span>
                        <div className="font-mono text-base font-black text-amber-300">
                          {formatRupiah(totalNew)}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-[11px]">
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase">Standar Pokok:</span>
                          <span className="font-mono">{formatRupiah(totalBase)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase">Selisih Kebijakan:</span>
                          <span className={`font-mono font-bold ${
                            selisihTotal > 0 ? 'text-rose-300' : selisihTotal < 0 ? 'text-emerald-300' : 'text-slate-300'
                          }`}>
                            {selisihTotal > 0 ? `+${formatRupiah(selisihTotal)}` : selisihTotal < 0 ? `-${formatRupiah(Math.abs(selisihTotal))}` : 'Rp 0'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Actions Footer */}
                <div className="flex gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPolicyModalYear(null)}
                    disabled={isSavingPolicy}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingPolicy}
                    className="flex-1 py-3 bg-sky-800 hover:bg-sky-900 text-white font-black rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-sky-300" />
                    <span>{isSavingPolicy ? 'Menyimpan Kebijakan...' : `Simpan Kebijakan Tahun ${policyModalYear}`}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
