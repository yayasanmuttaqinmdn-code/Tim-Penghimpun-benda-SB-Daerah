import { useState, useEffect, FormEvent } from 'react';
import { 
  Settings, 
  FileSpreadsheet, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Save, 
  Lock, 
  ShieldCheck, 
  KeyRound, 
  Link as LinkIcon, 
  LogOut, 
  LogIn, 
  Copy, 
  Check,
  Info,
  RotateCcw,
  Code2,
  ChevronDown,
  ChevronUp,
  Layers,
  Sun,
  Moon,
  Palette
} from 'lucide-react';
import { motion } from 'motion/react';
import MenuHeroBanner from './MenuHeroBanner';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../utils/themeContext';

const FULL_APPS_SCRIPT_CODE = `// ============================================================================
// GOOGLE APPS SCRIPT: SINKRONISASI 2 ARAH LENGKAP KE GOOGLE SPREADSHEET
// Sistem Informasi Inventaris Aset & SPPT PBB Terpusat
// Tim Penghimpun Benda Sabilillah Daerah Madiun
// ============================================================================

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'getAssets';
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. GET ASSETS (BACA DATA ASET DARI CELL GOOGLE SHEETS)
  if (action === 'getAssets') {
    var sheet = ss.getSheetByName('Database_Aset_Wakaf');
    if (!sheet) return jsonResponse({ assets: [] });
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return jsonResponse({ assets: [] });
    var assets = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      // Lewati jika baris kosong
      if (!row[0] && !row[1] && !row[2]) continue;

      var parsed = null;
      var rawJson = row[14];
      if (rawJson) {
        try {
          parsed = JSON.parse(rawJson);
        } catch(err) {}
      }

      var rowId = String(row[0] || (parsed && parsed.id) || ('asset_' + i + '_' + new Date().getTime()));
      var rowKode = String(row[1] || (parsed && (parsed.kode || parsed.id)) || rowId);
      var rowNama = String(row[2] || (parsed && (parsed.nomerSertifikat || parsed.nomorPolisi || parsed.namaBangunan || parsed.nama)) || '');
      var rowKategori = String(row[3] || (parsed && parsed.type) || 'TANAH').toUpperCase();
      var rowLokasi = String(row[4] || (parsed && parsed.lokasi) || '');
      var rowTahun = Number(row[5]) || (parsed && (parsed.tahunPembuatan || parsed.tahunPerolehan)) || new Date().getFullYear();
      var rowNilai = Number(row[6]) || (parsed && parsed.nilaiAset) || 0;
      var rowKondisi = String(row[7] || (parsed && (parsed.kondisiKendaraan || parsed.kondisi)) || 'BAIK');
      var rowStatusSertifikat = String(row[8] || (parsed && parsed.jenisSertifikat) || 'SHM');
      var rowLuas = String(row[9] || (parsed && (parsed.luasTanah || parsed.luasBangunan)) || '');
      var rowKeterangan = String(row[10] || (parsed && (parsed.tempatSimpanBerkas || parsed.keterangan)) || '');
      var rowPemberiWakaf = String(row[11] || (parsed && (parsed.atasNamaSertifikat || parsed.atasNama || parsed.pemberiWakaf)) || '');
      var rowPeruntukan = String(row[12] || (parsed && (parsed.penggunaan || parsed.penggunaanBangunan || parsed.peruntukan)) || '');

      // Tentukan type internal aplikasi: 'tanah' | 'kendaraan' | 'bangunan'
      var itemType = 'tanah';
      if (rowKategori.indexOf('KENDARAAN') !== -1 || rowKategori.indexOf('MOBIL') !== -1 || rowKategori.indexOf('MOTOR') !== -1) {
        itemType = 'kendaraan';
      } else if (rowKategori.indexOf('BANGUNAN') !== -1 || rowKategori.indexOf('GEDUNG') !== -1) {
        itemType = 'bangunan';
      }

      var assetItem = {
        id: rowId,
        type: itemType,
        kode: rowKode,
        nama: rowNama,
        kategori: rowKategori,
        lokasi: rowLokasi,
        tahunPerolehan: rowTahun,
        nilaiAset: rowNilai,
        kondisi: rowKondisi,
        statusSertifikat: rowStatusSertifikat,
        luas: rowLuas,
        keterangan: rowKeterangan,
        pemberiWakaf: rowPemberiWakaf,
        peruntukan: rowPeruntukan,
        terakhirDiperbarui: String(row[13] || new Date().toISOString())
      };

      // Set property spesifik sesuai tipe
      if (itemType === 'tanah') {
        assetItem.jenisSertifikat = rowStatusSertifikat;
        assetItem.nomerSertifikat = rowNama;
        assetItem.atasNamaSertifikat = rowPemberiWakaf;
        assetItem.luasTanah = Number(rowLuas.toString().replace(/[^0-9]/g, '')) || (parsed && parsed.luasTanah) || 0;
        assetItem.penggunaan = rowPeruntukan;
        assetItem.tempatSimpanBerkas = rowKeterangan;
      } else if (itemType === 'kendaraan') {
        assetItem.jenisKendaraan = (rowKategori.indexOf('MOTOR') !== -1 ? 'MOTOR' : (rowKategori.indexOf('BUS') !== -1 ? 'BUS' : 'MOBIL'));
        assetItem.nomorPolisi = rowNama;
        assetItem.merk = rowKeterangan.split('|')[0].trim() || (parsed && parsed.merk) || 'Kendaraan Operasional';
        assetItem.atasNama = rowPemberiWakaf;
        assetItem.tahunPembuatan = rowTahun;
        assetItem.kondisiKendaraan = rowKondisi.toUpperCase();
      } else if (itemType === 'bangunan') {
        assetItem.namaBangunan = rowNama;
        assetItem.luasBangunan = Number(rowLuas.toString().replace(/[^0-9]/g, '')) || (parsed && parsed.luasBangunan) || 0;
        assetItem.penggunaanBangunan = rowPeruntukan;
        assetItem.kondisi = rowKondisi.toUpperCase();
        assetItem.nomerPBG = (parsed && parsed.nomerPBG) || '-';
        assetItem.nomerSLF = (parsed && parsed.nomerSLF) || '-';
      }

      // Pertahankan riwayat peminjaman / balik nama jika ada
      if (parsed) {
        if (parsed.sedangDipinjam) assetItem.sedangDipinjam = parsed.sedangDipinjam;
        if (parsed.peminjamanAktif) assetItem.peminjamanAktif = parsed.peminjamanAktif;
        if (parsed.riwayatPeminjaman) assetItem.riwayatPeminjaman = parsed.riwayatPeminjaman;
        if (parsed.sedangBalikNama) assetItem.sedangBalikNama = parsed.sedangBalikNama;
        if (parsed.progresBalikNama) assetItem.progresBalikNama = parsed.progresBalikNama;
        if (parsed.riwayatBalikNama) assetItem.riwayatBalikNama = parsed.riwayatBalikNama;
        if (parsed.createdAt) assetItem.createdAt = parsed.createdAt;
      }

      assets.push(assetItem);
    }
    return jsonResponse({ assets: assets });
  }

  // 2. GET SPPT PBB RECORDS (BACA DATA SPPT DARI CELL GOOGLE SHEETS)
  if (action === 'getSppt') {
    var sheetSppt = ss.getSheetByName('SPPT_PBB');
    if (!sheetSppt) return jsonResponse({ sppt: [] });
    var dataSppt = sheetSppt.getDataRange().getValues();
    if (dataSppt.length <= 1) return jsonResponse({ sppt: [] });
    var spptList = [];
    for (var j = 1; j < dataSppt.length; j++) {
      var sRow = dataSppt[j];
      if (!sRow[0] && !sRow[1] && !sRow[2]) continue;

      var parsedSppt = null;
      var rawJsonSppt = sRow[20];
      if (rawJsonSppt) {
        try {
          parsedSppt = JSON.parse(rawJsonSppt);
        } catch(err) {}
      }

      var spptId = String(sRow[0] || (parsedSppt && parsedSppt.id) || ('sppt_' + j + '_' + new Date().getTime()));
      var nopVal = String(sRow[1] || (parsedSppt && parsedSppt.nop) || '').replace(/^'/, '').trim();
      var wpVal = String(sRow[2] || (parsedSppt && parsedSppt.namaWajibPajak) || '').trim();
      var lokasiVal = String(sRow[3] || (parsedSppt && parsedSppt.lokasi) || '').trim();
      var pajakNum = Number(sRow[4]) || (parsedSppt && parsedSppt.pajakTerutang) || 0;
      var totalBayarNum = Number(sRow[5]) || (parsedSppt && parsedSppt.totalBayarYayasanTahunan) || pajakNum;
      var ketVal = String(sRow[18] || (parsedSppt && parsedSppt.keteranganTambahan) || '').trim();

      // Baca status per tahun 2025 - 2035 dari cell sheet (kolom index 6 s.d 16)
      var riwayat = (parsedSppt && parsedSppt.riwayatPembayaran) ? JSON.parse(JSON.stringify(parsedSppt.riwayatPembayaran)) : {};
      var years = [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035];
      for (var yIdx = 0; yIdx < years.length; yIdx++) {
        var yr = years[yIdx];
        var colIdx = 6 + yIdx;
        var cellVal = sRow[colIdx] !== undefined ? String(sRow[colIdx]).trim() : '';
        var isLunas = cellVal.toUpperCase().indexOf('LUNAS') !== -1 || cellVal.toUpperCase() === 'YA' || cellVal.toUpperCase() === 'TRUE';
        
        var existingYearData = riwayat[yr] || { tahun: yr, lunas: false };
        if (cellVal) {
          existingYearData.lunas = isLunas;
          if (isLunas && !existingYearData.nominalBayar) {
            existingYearData.nominalBayar = totalBayarNum;
          }
        }
        riwayat[yr] = existingYearData;
      }

      spptList.push({
        id: spptId,
        nop: nopVal,
        namaWajibPajak: wpVal,
        lokasi: lokasiVal,
        pajakTerutang: pajakNum,
        totalBayarYayasanTahunan: totalBayarNum,
        riwayatPembayaran: riwayat,
        keteranganTambahan: ketVal,
        createdAt: (parsedSppt && parsedSppt.createdAt) || (new Date().getTime() - 86400000 * 30),
        updatedAt: new Date().getTime()
      });
    }
    return jsonResponse({ sppt: spptList });
  }

  return jsonResponse({ error: 'Aksi tidak dikenal (action: ' + action + ')' });
}

function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var action = contents.action || 'syncAll';
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'syncAll') {
      // 1. MENU 1: DATABASE ASET WAKAF / DAERAH
      if (contents.assets) {
        var sheetAssets = getOrCreateSheet(ss, 'Database_Aset_Wakaf', [
          'ID Aset', 'Kode Aset', 'Nama / Identitas Aset', 'Kategori', 'Lokasi', 
          'Tahun Perolehan', 'Nilai Aset (Rp)', 'Kondisi', 'Status Sertifikat', 
          'Luas', 'Keterangan / Tempat Simpan', 'Pemberi Wakaf / Pemilik', 'Peruntukan', 
          'Terakhir Diperbarui', 'Raw JSON Data'
        ], '#1E293B');
        var lastRow = sheetAssets.getLastRow();
        if (lastRow > 1) {
          sheetAssets.getRange(2, 1, lastRow - 1, 15).clearContent();
        }
        if (contents.assets.length > 0) {
          var rows = contents.assets.map(function(a) {
            return [
              a.id || '',
              a.kode || '',
              a.nama || '',
              a.kategori || '',
              a.lokasi || '',
              a.tahunPerolehan || '',
              a.nilaiAset || 0,
              a.kondisi || '',
              a.statusSertifikat || '',
              a.luas || '',
              a.keterangan || '',
              a.pemberiWakaf || '',
              a.peruntukan || '',
              new Date().toISOString(),
              a.rawJson || JSON.stringify(a)
            ];
          });
          sheetAssets.getRange(2, 1, rows.length, 15).setValues(rows);
        }
      }

      // 2. MENU 2: PEMINJAMAN BERKAS & SERTIFIKAT
      if (contents.loans) {
        var sheetLoans = getOrCreateSheet(ss, 'Peminjaman_Berkas', [
          'ID Peminjaman', 'ID Aset', 'Kategori', 'Nama / Identitas Aset', 
          'Nama Peminjam', 'Jabatan Peminjam', 'No. WhatsApp / Kontak', 
          'Tanggal Pinjam', 'Keperluan', 'Rencana Kembali', 'Tanggal Riil Kembali', 
          'Status Berkas', 'Nama Petugas', 'Terakhir Diperbarui'
        ], '#B45309');
        var lastLoanRow = sheetLoans.getLastRow();
        if (lastLoanRow > 1) {
          sheetLoans.getRange(2, 1, lastLoanRow - 1, 14).clearContent();
        }
        if (contents.loans.length > 0) {
          var loanRows = contents.loans.map(function(l) {
            return [
              l.idLoan || '',
              l.idAset || '',
              l.kategori || '',
              l.namaAset || '',
              l.peminjamName || '',
              l.peminjamJabatan || '',
              l.peminjamKontak || '',
              l.tanggalPinjam || '',
              l.keperluan || '',
              l.tanggalKembaliRencana || '',
              l.tanggalKembaliRiil || '-',
              l.status || 'SEDANG DIPINJAM',
              l.namaPetugas || '',
              new Date().toISOString()
            ];
          });
          sheetLoans.getRange(2, 1, loanRows.length, 14).setValues(loanRows);
        }
      }

      // 3. MENU 3: PROGRES & RIWAYAT BALIK NAMA
      if (contents.nameTransfers) {
        var sheetBN = getOrCreateSheet(ss, 'Progres_Balik_Nama', [
          'ID Aset', 'Kategori', 'Identitas Aset', 'Status Balik Nama', 
          'Calon / Pemilik Baru', 'Pemilik Lama', 'Tanggal Mulai', 'Tanggal Selesai', 
          'Total Biaya (Rp)', 'Rincian Tahapan & Biaya', 'Catatan', 'Terakhir Diperbarui'
        ], '#4338CA');
        var lastBNRow = sheetBN.getLastRow();
        if (lastBNRow > 1) {
          sheetBN.getRange(2, 1, lastBNRow - 1, 12).clearContent();
        }
        if (contents.nameTransfers.length > 0) {
          var bnRows = contents.nameTransfers.map(function(b) {
            return [
              b.idAset || '',
              b.kategori || '',
              b.identitasAset || '',
              b.status || '',
              b.pemilikBaru || '-',
              b.pemilikLama || '-',
              b.tanggalMulai || '-',
              b.tanggalSelesai || '-',
              b.totalBiaya || 0,
              b.tahapanProgres || '-',
              b.catatan || '-',
              new Date().toISOString()
            ];
          });
          sheetBN.getRange(2, 1, bnRows.length, 12).setValues(bnRows);
        }
      }

      // 4. MENU 4: RINGKASAN & STATISTIK DASHBOARD
      if (contents.summary) {
        var sheetSummary = getOrCreateSheet(ss, 'Ringkasan_Dashboard', [
          'Menu / Indikator', 'Jumlah / Nilai', 'Keterangan', 'Terakhir Diperbarui'
        ], '#047857');
        var lastSumRow = sheetSummary.getLastRow();
        if (lastSumRow > 1) {
          sheetSummary.getRange(2, 1, lastSumRow - 1, 4).clearContent();
        }
        if (contents.summary.length > 0) {
          var sumRows = contents.summary.map(function(s) {
            return [
              s.parameter || '',
              s.jumlah !== undefined ? String(s.jumlah) : '',
              s.keterangan || '',
              new Date().toLocaleString('id-ID')
            ];
          });
          sheetSummary.getRange(2, 1, sumRows.length, 4).setValues(sumRows);
        }
      }

      // 5. MENU 5: SPPT PBB & REKAPITULASI PEMBAYARAN 2025-2035
      if (contents.sppt) {
        var sheetSppt = getOrCreateSheet(ss, 'SPPT_PBB', [
          'ID SPPT', 'NOP', 'Nama Wajib Pajak', 'Lokasi Objek Pajak', 
          'Pajak Terutang (Rp)', 'Total Bayar Yayasan/Th (Rp)', 
          '2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034', '2035',
          'Ringkasan Pembayaran', 'Keterangan Tambahan', 'Terakhir Diperbarui', 'Raw JSON Data'
        ], '#0F766E');
        var lastSpptRow = sheetSppt.getLastRow();
        if (lastSpptRow > 1) {
          sheetSppt.getRange(2, 1, lastSpptRow - 1, 21).clearContent();
        }
        if (contents.sppt.length > 0) {
          var spptRows = contents.sppt.map(function(p) {
            return [
              p.id || '',
              "'" + (p.nop || ''),
              p.namaWajibPajak || '',
              p.lokasi || '',
              p.pajakTerutang || 0,
              p.totalBayarYayasan || 0,
              p.p2025 || 'BELUM',
              p.p2026 || 'BELUM',
              p.p2027 || 'BELUM',
              p.p2028 || 'BELUM',
              p.p2029 || 'BELUM',
              p.p2030 || 'BELUM',
              p.p2031 || 'BELUM',
              p.p2032 || 'BELUM',
              p.p2033 || 'BELUM',
              p.p2034 || 'BELUM',
              p.p2035 || 'BELUM',
              p.ringkasan || '',
              p.keterangan || '',
              new Date().toISOString(),
              p.rawJson || JSON.stringify(p)
            ];
          });
          sheetSppt.getRange(2, 1, spptRows.length, 21).setValues(spptRows);
        }
      }

      return jsonResponse({ success: true, message: 'Seluruh data berhasil disinkronkan ke Spreadsheet!' });
    }

    // DELETE ASSET INDIVIDU
    if (action === 'deleteAsset' && contents.id) {
      var targetId = String(contents.id);
      var sheetAssets = ss.getSheetByName('Database_Aset_Wakaf');
      if (sheetAssets) {
        var data = sheetAssets.getDataRange().getValues();
        for (var i = 1; i < data.length; i++) {
          if (String(data[i][0]) === targetId || String(data[i][1]) === targetId) {
            sheetAssets.deleteRow(i + 1);
            break;
          }
        }
      }
      return jsonResponse({ success: true, message: 'Aset berhasil dihapus dari Spreadsheet!' });
    }

    // DELETE SPPT RECORD INDIVIDU
    if (action === 'deleteSppt' && contents.id) {
      var targetSpptId = String(contents.id);
      var sheetS = ss.getSheetByName('SPPT_PBB');
      if (sheetS) {
        var sData = sheetS.getDataRange().getValues();
        for (var k = 1; k < sData.length; k++) {
          if (String(sData[k][0]) === targetSpptId || String(sData[k][1]).replace(/^'/, '') === targetSpptId) {
            sheetS.deleteRow(k + 1);
            break;
          }
        }
      }
      return jsonResponse({ success: true, message: 'Data SPPT berhasil dihapus dari Spreadsheet!' });
    }

    return jsonResponse({ error: 'Aksi post tidak valid' });
  } catch (err) {
    return jsonResponse({ error: err.toString() });
  }
}

function getOrCreateSheet(ss, sheetTitle, headers, headerColor) {
  var color = headerColor || '#1E293B';
  var sheet = ss.getSheetByName(sheetTitle);
  if (!sheet) {
    sheet = ss.insertSheet(sheetTitle);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground(color)
      .setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}`;

interface SettingsPanelProps {
  spreadsheetId: string;
  onUpdateSpreadsheetId: (newId: string) => Promise<void>;
  sheetsConnected: boolean;
  sheetsError: string | null;
  googleUser: any;
  googleToken: string | null;
  onSignInGoogle: () => void;
  onLogoutGoogle: () => void;
  onSyncManual: () => void;
  syncStatus: 'synced' | 'pending' | 'offline';
  userRole?: 'admin' | 'viewer';
  onSwitchToAdmin?: () => void;
  onSwitchToViewer?: () => void;
  adminPassword?: string;
  onUpdateAdminPassword?: (newPassword: string) => Promise<void>;
  onResetAdminPassword?: () => Promise<string>;
}

// Helper to extract spreadsheet ID from full URL or return the raw ID/Apps Script URL
export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  // If it's a Google Apps Script Web App URL, preserve the complete URL
  if (trimmed.startsWith('http') && trimmed.includes('script.google.com')) {
    return trimmed;
  }
  // Match standard Google Sheets URL format: /spreadsheets/d/{id}
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

export default function SettingsPanel({
  spreadsheetId,
  onUpdateSpreadsheetId,
  sheetsConnected,
  sheetsError,
  googleUser,
  googleToken,
  onSignInGoogle,
  onLogoutGoogle,
  onSyncManual,
  syncStatus,
  userRole,
  onSwitchToAdmin,
  onSwitchToViewer,
  onUpdateAdminPassword,
  onResetAdminPassword,
}: SettingsPanelProps) {
  // Input state can hold either full URL or ID
  const [inputUrlOrId, setInputUrlOrId] = useState<string>(spreadsheetId);
  const [extractedId, setExtractedId] = useState<string>(spreadsheetId);
  const [isSavingSheet, setIsSavingSheet] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [sheetSaveSuccess, setSheetSaveSuccess] = useState(false);
  const [showScriptCode, setShowScriptCode] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const handleCopyScript = () => {
    navigator.clipboard.writeText(FULL_APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  // Admin password states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Update inputs whenever spreadsheetId prop changes
  useEffect(() => {
    setInputUrlOrId(spreadsheetId);
    setExtractedId(spreadsheetId);
  }, [spreadsheetId]);

  // Live extraction as user types
  const handleInputChange = (val: string) => {
    setInputUrlOrId(val);
    const cleaned = extractSpreadsheetId(val);
    setExtractedId(cleaned);
  };

  const handleSaveSpreadsheetLink = async (e: FormEvent) => {
    e.preventDefault();
    const idToSave = extractSpreadsheetId(inputUrlOrId);
    if (!idToSave) {
      alert('Tautan atau ID Spreadsheet tidak boleh kosong.');
      return;
    }
    setIsSavingSheet(true);
    setSheetSaveSuccess(false);
    try {
      await onUpdateSpreadsheetId(idToSave);
      setSheetSaveSuccess(true);
      setTimeout(() => setSheetSaveSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingSheet(false);
    }
  };

  const handleCopyId = () => {
    if (!extractedId) return;
    navigator.clipboard.writeText(extractedId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!newPassword.trim()) {
      setPasswordError('Sandi baru tidak boleh kosong.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi sandi baru tidak cocok.');
      return;
    }

    setIsSavingPassword(true);
    try {
      await onUpdateAdminPassword(newPassword.trim());
      setPasswordSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err: any) {
      setPasswordError(err?.message || 'Gagal memperbarui kata sandi admin.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleResetPassword = async () => {
    if (!window.confirm('Reset kata sandi admin kembali ke kata sandi bawaan ("muttaqin")?')) {
      return;
    }
    setIsResettingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(false);
    try {
      if (onResetAdminPassword) {
        await onResetAdminPassword();
      }
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 5000);
    } catch (err: any) {
      setPasswordError(err?.message || 'Gagal mereset kata sandi admin.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const fullSheetUrl = extractedId 
    ? (extractedId.startsWith('http') ? extractedId : `https://docs.google.com/spreadsheets/d/${extractedId}`) 
    : '';

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">
      {/* Top Header Banner */}
      <MenuHeroBanner
        title="MENU PENGATURAN & TAUTAN SPREADSHEET"
        subtitle="Hubungkan lembar kerja Google Sheets sebagai database utama dan atur preferensi sistem."
        badgeText="TIM PENGHIMPUN BENDA SABILILLAH"
        rightElement={
          <span className={`text-xs font-bold px-3 py-1 rounded-xl border ${
            sheetsConnected 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
          }`}>
            {sheetsConnected ? '● Sheets Terhubung' : '○ Belum Terhubung'}
          </span>
        }
      />

      {/* SECTION: TEMA TAMPILAN (MODE GELAP & MODE TERANG) */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 border-2 border-sky-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5 transition-colors duration-200"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wide">
                Tema Pilihan Tampilan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih kenyamanan visual antara Mode Terang (Light), Mode Gelap (Dark), atau Otomatis mengikuti sistem perangkat.
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <ThemeToggle variant="segmented" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-xl shrink-0 mt-0.5">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wide">Mode Terang (Light Mode)</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed font-medium">
                Tampilan bernuansa biru institusional dan putih bersih, optimal untuk pencahayaan ruangan kantor terang di siang hari.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start gap-3">
            <div className="p-2 bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 rounded-xl shrink-0 mt-0.5">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wide">Mode Gelap (Dark Mode)</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed font-medium">
                Kontras gelap lembut yang nyaman di mata pada malam hari dan menghemat konsumsi baterai perangkat smartphone &amp; laptop.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* SECTION: MODE HAK AKSES PENGGUNA (TAMU VS ADMIN) */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 border-2 border-sky-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5 transition-colors duration-200"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wide">
                Hak Akses Pengguna: {userRole === 'admin' ? 'Mode Admin (Penuh)' : 'Mode Tamu (Terbatas)'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Atur peran sistem antara Mode Tamu (hanya input kendaraan &amp; melihat data) dan Mode Admin (akses penuh kelola semua data).
              </p>
            </div>
          </div>

          <div>
            {userRole === 'admin' ? (
              <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 text-xs font-black px-3.5 py-1.5 rounded-full flex items-center gap-1.5 border border-amber-300 dark:border-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Admin Aktif</span>
              </span>
            ) : (
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black px-3.5 py-1.5 rounded-full flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Mode Tamu</span>
              </span>
            )}
          </div>
        </div>

        {/* Status description boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className={`p-4 rounded-2xl border transition-all ${
            userRole === 'viewer' 
              ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/40 shadow-xs' 
              : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">👤</span>
                <span className="text-xs font-black uppercase text-slate-800 dark:text-white">Mode Tamu (Viewer)</span>
              </div>
              {userRole === 'viewer' && (
                <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  Peran Saat Ini
                </span>
              )}
            </div>
            <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 mt-2.5 font-medium list-disc pl-4">
              <li>Melihat seluruh dashboard statistik, database, SPPT PBB, &amp; berkas.</li>
              <li><strong>Hanya bisa menginput aset Kendaraan</strong> (Mobil/Motor).</li>
              <li>Input Tanah, Bangunan, Edit &amp; Hapus data <strong>terkunci aman</strong>.</li>
            </ul>
          </div>

          <div className={`p-4 rounded-2xl border transition-all ${
            userRole === 'admin' 
              ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 shadow-xs' 
              : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🔑</span>
                <span className="text-xs font-black uppercase text-slate-800 dark:text-white">Mode Admin</span>
              </div>
              {userRole === 'admin' && (
                <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  Peran Saat Ini
                </span>
              )}
            </div>
            <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 mt-2.5 font-medium list-disc pl-4">
              <li>Akses tak terbatas untuk menginput aset Tanah, Bangunan, &amp; Kendaraan.</li>
              <li>Bisa mengedit dan menghapus data yang salah input.</li>
              <li>Mengatur ceklis SPPT PBB, peminjaman berkas, &amp; tautan Sheets.</li>
            </ul>
          </div>
        </div>

        {/* Switch Button */}
        <div className="pt-1 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {userRole === 'admin'
              ? 'Selesai bertugas? Anda dapat kembali ke Mode Tamu kapan saja.'
              : 'Perlu mengedit data atau mendaftarkan aset tanah? Masukkan PIN/Sandi Admin.'}
          </div>

          <div>
            {userRole === 'admin' ? (
              <button
                type="button"
                onClick={onSwitchToViewer ? () => onSwitchToViewer() : undefined}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar dari Mode Admin</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onSwitchToAdmin}
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-98 text-slate-950 text-xs font-black rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Masuk sebagai Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Change Admin Password (Only visible in admin mode) */}
        {userRole === 'admin' && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-sky-700 dark:text-sky-300" />
              <h4 className="text-xs font-black uppercase text-slate-800 dark:text-white">
                Ubah Kata Sandi Admin (PIN Pengaman)
              </h4>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Sandi Baru:
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Sandi baru..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Ulangi Sandi:
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Konfirmasi..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {passwordError && (
                <div className="text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sandi admin berhasil diperbarui!</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="px-4 py-2 bg-sky-800 hover:bg-sky-900 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  {isSavingPassword ? 'Menyimpan...' : 'Simpan Sandi Baru'}
                </button>

                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={isResettingPassword}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  title="Kembalikan ke kata sandi bawaan: muttaqin"
                >
                  {isResettingPassword ? 'Mereset...' : 'Reset Bawaan (muttaqin)'}
                </button>
              </div>
            </form>
          </div>
        )}
      </motion.div>

      {/* SECTION 1: Google Spreadsheet Linking (MAIN USER FEATURE) */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 border-2 border-sky-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 transition-colors duration-200"
      >
        {/* Section Title & Status Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                Tautkan Link Google Spreadsheet
              </h3>
              <p className="text-xs text-slate-500">
                Data aset Anda akan tersimpan langsung ke lembar kerja ini secara otomatis.
              </p>
            </div>
          </div>

          <div>
            {sheetsConnected && (
              <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Terhubung &amp; Aktif</span>
              </span>
            )}
            {!sheetsConnected && googleUser && (
              <span className="bg-amber-100 text-amber-800 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Perlu Izin Akses Editor</span>
              </span>
            )}
            {!sheetsConnected && !googleUser && (
              <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">
                ⚪ Belum Terhubung
              </span>
            )}
          </div>
        </div>

        {/* One-Time Central Setup Info Banner */}
        <div className="bg-linear-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
          <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5 shadow-xs">
            <Layers className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
              <span>Cukup Masukkan URL / ID 1 Kali Saja</span>
              <span className="bg-emerald-200 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded-md">Otomatis Semua Perangkat</span>
            </h4>
            <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
              URL Spreadsheet yang Anda masukkan di sini disimpan langsung di server pusat. <strong>Seluruh perangkat lain (HP, Smartphone, Tablet, Laptop)</strong> yang membuka aplikasi ini akan <strong>otomatis langsung terhubung ke database spreadsheet yang sama</strong> tanpa perlu mengetik ulang link!
            </p>
          </div>
        </div>

        {/* Google Account Connection Status Bar */}
        <div className="bg-sky-50/60 border border-sky-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-sky-200 text-sky-800 flex items-center justify-center font-black shadow-2xs">
              {googleUser ? (googleUser.email?.[0]?.toUpperCase() || 'G') : 'G'}
            </div>
            <div>
              <p className="text-xs font-black text-slate-800">
                {googleUser ? (googleUser.displayName || googleUser.email) : 'Akun Google Belum Masuk'}
              </p>
              <p className="text-[11px] text-slate-500">
                {googleUser 
                  ? `Sesi aktif: ${googleUser.email} (Izin baca & tulis Spreadsheet)`
                  : 'Masuk dengan Google agar aplikasi memiliki izin mengedit spreadsheet Anda.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {googleUser ? (
              <button
                type="button"
                onClick={onLogoutGoogle}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Putuskan Akun</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onSignInGoogle}
                className="px-4 py-2 bg-sky-700 hover:bg-sky-800 active:scale-98 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-emerald-300" />
                <span>Masuk Akun Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Input Form for Link / ID */}
        <form onSubmit={handleSaveSpreadsheetLink} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-sky-700" />
              <span>Link Tautan Google Spreadsheet / Spreadsheet ID</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={inputUrlOrId}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Tempel (paste) link Google Spreadsheet di sini..."
                className="w-full pl-3.5 pr-24 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-mono text-slate-800 focus:outline-none focus:border-sky-600 focus:bg-white transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.readText().then(text => {
                    if (text) handleInputChange(text);
                  }).catch(() => {
                    alert('Gunakan Ctrl+V atau klik kanan untuk menempel tautan.');
                  });
                }}
                className="absolute right-2 top-2 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold rounded-xl transition-colors cursor-pointer"
                title="Tempel dari Clipboard"
              >
                Paste
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              💡 <strong>Tips:</strong> Anda cukup menyalin seluruh URL dari browser saat membuka file Google Sheets Anda (misalnya: <code className="bg-slate-100 px-1 py-0.5 rounded text-sky-800 font-mono">https://docs.google.com/spreadsheets/d/1TABYBj6rdO.../edit</code>), sistem akan otomatis mendeteksi ID uniknya.
            </p>
          </div>

          {/* Real-time Extracted ID Preview Box */}
          {extractedId && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">ID Terdeteksi:</span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="text-[10px] font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer"
                >
                  {copiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedId ? 'Tersalin' : 'Salin ID'}
                </button>
              </div>
              <div className="font-mono text-xs text-sky-900 bg-white p-2 rounded-xl border border-slate-200 break-all select-all font-semibold">
                {extractedId}
              </div>

              {fullSheetUrl && (
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Tautan Langsung:</span>
                  <a
                    href={fullSheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-900 hover:underline"
                  >
                    <span>Buka File Spreadsheet di Google</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            {userRole === 'admin' ? (
              <button
                type="submit"
                disabled={isSavingSheet}
                className="w-full sm:w-auto px-5 py-3 bg-sky-800 hover:bg-sky-900 active:scale-98 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                {isSavingSheet ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{isSavingSheet ? 'Menyimpan Tautan...' : 'Simpan Tautan Spreadsheet'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  alert('Pengubahan tautan Google Spreadsheet khusus untuk Administrator.');
                  if (onSwitchToAdmin) onSwitchToAdmin();
                }}
                className="w-full sm:w-auto px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Lock className="w-4 h-4 text-amber-500" />
                <span>Simpan Tautan (Khusus Admin)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onSyncManual}
              disabled={syncStatus === 'pending'}
              className="w-full sm:w-auto px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-98 disabled:opacity-50 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'pending' ? 'animate-spin' : ''}`} />
              <span>Uji &amp; Sinkronkan Sekarang</span>
            </button>
          </div>

          {sheetSaveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Tautan Spreadsheet berhasil diperbarui dan diselaraskan!</span>
            </div>
          )}

          {/* Error Notice if any */}
          {sheetsError && (
            <div className="p-4 bg-amber-50 border-2 border-amber-200 text-amber-900 rounded-2xl text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-black uppercase tracking-wider text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Pemberitahuan Izin Akses Spreadsheet:</span>
              </div>
              <p className="leading-relaxed font-medium">
                {sheetsError}
              </p>
              <p className="text-[11px] text-amber-800 leading-normal pt-1">
                <strong>Cara Mengatasi:</strong> Buka file Google Spreadsheet Anda, klik tombol <strong>"Bagikan" (Share)</strong> di pojok kanan atas, lalu tambahkan akun Google yang Anda hubungkan dengan hak akses <strong>"Editor"</strong>.
              </p>
            </div>
          )}
        </form>

        {/* Five Connected Menus Overview */}
        <div className="bg-slate-50 border-2 border-slate-200/90 rounded-2xl p-4.5 space-y-3">
          <div className="flex items-center gap-2 text-slate-800">
            <Layers className="w-4 h-4 text-sky-700" />
            <h4 className="text-xs font-black uppercase tracking-wider">
              5 Lembar Kerja (Sheet Tabs) yang Otomatis Terhubung:
            </h4>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Semua menu di aplikasi ini secara otomatis mengirimkan dan memperbarui datanya ke lembar kerja terpisah di Google Spreadsheet Anda:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-sky-900">
                <span className="w-2 h-2 rounded-full bg-sky-600"></span>
                <span>1. Database_Aset_Wakaf</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Terhubung ke menu <strong>Input Aset</strong> dan <strong>Lihat &amp; Cari Database</strong> (Tanah, Kendaraan, Bangunan).
              </p>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
                <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                <span>2. Peminjaman_Berkas</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Terhubung ke menu <strong>Pinjam Berkas</strong> (Peminjaman berkas aktif, kontak peminjam, &amp; riwayat pengembalian).
              </p>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-900">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                <span>3. Progres_Balik_Nama</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Terhubung ke menu <strong>Balik Nama</strong> (Tahapan proses, rincian biaya notaris/BPN, &amp; riwayat balik nama).
              </p>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-900">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>4. Ringkasan_Dashboard</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Terhubung ke menu <strong>Dashboard</strong> (Total nilai, rekapitulasi jumlah aset, &amp; status peminjaman).
              </p>
            </div>

            <div className="p-3 bg-white border border-teal-200 rounded-xl space-y-1 sm:col-span-2 lg:col-span-1 bg-teal-50/40">
              <div className="flex items-center gap-1.5 font-bold text-xs text-teal-900">
                <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                <span>5. SPPT_PBB</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Terhubung ke menu <strong>SPPT PBB</strong> (NOP, Nilai Pajak Terutang, Beban Yayasan, &amp; Ceklis Pembayaran 2025–2035).
              </p>
            </div>
          </div>
        </div>

        {/* Expandable Apps Script Code Section */}
        <div className="bg-sky-50/50 border border-sky-200 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowScriptCode(!showScriptCode)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-sky-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-sky-100 text-sky-800 rounded-xl">
                <Code2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                  Kode Google Apps Script untuk Menghubungkan 5 Menu Lengkap
                </h4>
                <p className="text-[11px] text-slate-500">
                  Perbarui skrip di Google Sheets Anda agar otomatis membuat dan menyinkronkan 5 tab lembar kerja di atas.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-sky-700">
                {showScriptCode ? 'Tutup Kode' : 'Lihat & Salin Kode'}
              </span>
              {showScriptCode ? (
                <ChevronUp className="w-4 h-4 text-sky-700" />
              ) : (
                <ChevronDown className="w-4 h-4 text-sky-700" />
              )}
            </div>
          </button>

          {showScriptCode && (
            <div className="p-4 border-t border-sky-100 space-y-3 bg-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-600 font-medium">
                  Klik tombol di samping untuk menyalin seluruh kode skrip:
                </div>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="px-3.5 py-2 bg-sky-800 hover:bg-sky-900 active:scale-98 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Kode Berhasil Disalin!' : 'Salin Kode Skrip Lengkap'}</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-slate-700">Cara memperbarui di Google Spreadsheet Anda:</p>
                <ol className="list-decimal pl-4 space-y-1 leading-relaxed">
                  <li>Buka Google Spreadsheet Anda, lalu klik menu <strong>Ekstensi (Extensions) &gt; Apps Script</strong>.</li>
                  <li>Hapus kode lama di file <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">Code.gs</code>, lalu tempelkan (paste) kode baru ini.</li>
                  <li>Klik tombol <strong>Simpan (ikon disket)</strong>.</li>
                  <li>Klik tombol biru <strong>Terapkan (Deploy) &gt; Kelola Penerapan (Manage deployments)</strong>.</li>
                  <li>Klik <strong>ikon pensil (Edit)</strong>, lalu pada bagian Versi pilih <strong>"Versi baru" (New version)</strong>, lalu klik <strong>Terapkan (Deploy)</strong>.</li>
                </ol>
              </div>

              <div className="relative">
                <pre className="p-3.5 bg-slate-900 text-sky-200 rounded-xl text-[10px] font-mono overflow-x-auto max-h-60 leading-relaxed">
                  {FULL_APPS_SCRIPT_CODE}
                </pre>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
