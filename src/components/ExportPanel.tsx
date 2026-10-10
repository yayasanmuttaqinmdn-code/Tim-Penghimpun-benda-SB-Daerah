import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Check, 
  HelpCircle,
  ExternalLink,
  RefreshCw,
  Settings
} from 'lucide-react';
import { Asset } from '../types';
import { exportToCSV, downloadCSVFile } from '../utils/csvExport';
import { motion } from 'motion/react';

interface ExportPanelProps {
  assets: Asset[];
  onImportBackup: (importedAssets: Asset[]) => boolean;
  userRole?: 'admin' | 'viewer';
}

export default function ExportPanel({ 
  assets, 
  onImportBackup,
  userRole = 'viewer'
}: ExportPanelProps) {
  const [copyAck, setCopyAck] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tanahAssets = assets.filter(a => a.type === 'tanah');
  const kendaraanAssets = assets.filter(a => a.type === 'kendaraan');
  const bangunanAssets = assets.filter(a => a.type === 'bangunan');

  const handleDownloadCSV = (type: 'tanah' | 'kendaraan' | 'bangunan') => {
    const csvContent = exportToCSV(assets, type);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Aset_${type.toUpperCase()}_Madiun_${dateStr}.csv`;
    downloadCSVFile(csvContent, filename);
  };

  const handleDownloadFullJSONBackup = () => {
    const backupStr = JSON.stringify(assets, null, 2);
    const blob = new Blob([backupStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `Backup_Aset_Madiun_Lengkap_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          // simple check
          const isValid = json.every(item => item && item.id && item.type);
          if (isValid) {
            const success = onImportBackup(json);
            if (success) {
              setImportSuccess(true);
              if (fileInputRef.current) fileInputRef.current.value = '';
            } else {
              setImportError('Gagal mengimpor ke database. Format salah.');
            }
          } else {
            setImportError('Satu atau lebih baris aset tidak memiliki pengenal ID atau Tipe yang sah.');
          }
        } else {
          setImportError('Berkas cadangan harus berupa representasi array JSON yang valid.');
        }
      } catch (err) {
        setImportError('Berkas gagal diparsing. Pastikan format JSON bersih.');
      }
    };
    reader.readAsText(file);
  };

  const handleCopyToClipboard = (type: 'tanah' | 'kendaraan' | 'bangunan') => {
    const csvContent = exportToCSV(assets, type);
    navigator.clipboard.writeText(csvContent);
    setCopyAck(type);
    setTimeout(() => setCopyAck(null), 3000);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-sky-800" /> Ekspor &amp; Penyelarasan Dokumen
        </h2>
        <p className="text-gray-500 text-xs">
          Keluarkan database aset Anda dalam format Excel / CSV, atau lakukan pencadangan data antar perangkat.
        </p>
      </div>

      {/* CSV Category Cards */}
      <div className="grid grid-cols-1 gap-4">
        {/* 1. Tanah CSV */}
        <div className="bg-white p-4.5 rounded-2xl border-2 border-slate-200 shadow-sm flex flex-col justify-between space-y-3 hover:border-sky-400 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-sky-50">
                🏘️
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-800 leading-none">Format Aset Tanah</h3>
                <span className="text-[10px] text-slate-400 font-mono mt-1.5 block">{tanahAssets.length} data tanah terdaftar</span>
              </div>
            </div>
            <span className="text-[10px] font-black bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded uppercase tracking-wider">CSV</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleDownloadCSV('tanah')}
              disabled={tanahAssets.length === 0}
              className="flex-1 py-2.5 bg-sky-600 active:scale-98 hover:bg-sky-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer border border-sky-700"
            >
              <Download className="w-3.5 h-3.5" /> Unduh CSV
            </button>
            <button
              onClick={() => handleCopyToClipboard('tanah')}
              disabled={tanahAssets.length === 0}
              className="flex-shrink-0 px-3.5 py-2.5 bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-40 border border-slate-200 rounded-xl text-xs font-bold transition-all focus:outline-none cursor-pointer"
            >
              {copyAck === 'tanah' ? <Check className="w-4 h-4 text-sky-600" /> : 'Salin Tabel'}
            </button>
          </div>
        </div>

        {/* 2. Kendaraan CSV */}
        <div className="bg-white p-4.5 rounded-2xl border-2 border-slate-200 shadow-sm flex flex-col justify-between space-y-3 hover:border-amber-450 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-amber-50">
                🚐
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-800 leading-none">Format Aset Kendaraan</h3>
                <span className="text-[10px] text-slate-400 font-mono mt-1.5 block">{kendaraanAssets.length} unit kendaraan</span>
              </div>
            </div>
            <span className="text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-350 px-2.5 py-0.5 rounded uppercase tracking-wider">CSV</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleDownloadCSV('kendaraan')}
              disabled={kendaraanAssets.length === 0}
              className="flex-1 py-2.5 bg-amber-500 active:scale-98 hover:bg-amber-600 disabled:opacity-40 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer border border-amber-600 font-extrabold"
            >
              <Download className="w-3.5 h-3.5" /> Unduh CSV
            </button>
            <button
              onClick={() => handleCopyToClipboard('kendaraan')}
              disabled={kendaraanAssets.length === 0}
              className="flex-shrink-0 px-3.5 py-2.5 bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-40 border border-slate-200 rounded-xl text-xs font-bold transition-all focus:outline-none cursor-pointer"
            >
              {copyAck === 'kendaraan' ? <Check className="w-4 h-4 text-sky-600" /> : 'Salin Tabel'}
            </button>
          </div>
        </div>

        {/* 3. Bangunan CSV */}
        <div className="bg-white p-4.5 rounded-2xl border-2 border-slate-200 shadow-sm flex flex-col justify-between space-y-3 hover:border-purple-400 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-purple-50">
                🏢
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-800 leading-none">Format Aset Bangunan</h3>
                <span className="text-[10px] text-slate-400 font-mono mt-1.5 block">{bangunanAssets.length} bangunan terdaftar</span>
              </div>
            </div>
            <span className="text-[10px] font-black bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded uppercase tracking-wider">CSV</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleDownloadCSV('bangunan')}
              disabled={bangunanAssets.length === 0}
              className="flex-1 py-2.5 bg-purple-600 active:scale-98 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer border border-purple-700"
            >
              <Download className="w-3.5 h-3.5" /> Unduh CSV
            </button>
            <button
              onClick={() => handleCopyToClipboard('bangunan')}
              disabled={bangunanAssets.length === 0}
              className="flex-shrink-0 px-3.5 py-2.5 bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-40 border border-slate-200 rounded-xl text-xs font-bold transition-all focus:outline-none cursor-pointer"
            >
              {copyAck === 'bangunan' ? <Check className="w-4 h-4 text-sky-600" /> : 'Salin Tabel'}
            </button>
          </div>
        </div>
      </div>

      {/* Integration Guide */}
      <div className="bg-sky-900 p-5 rounded-2xl text-sky-100 shadow-sm relative overflow-hidden border-2 border-sky-950 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-sky-800/40 text-amber-400 rounded-xl flex-shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-black tracking-wider text-amber-400 uppercase">Integrasi ke Google Sheets</h3>
            <p className="text-[11px] text-sky-200 leading-relaxed font-sans">
              Kolom di atas telah kami sesuaikan agar pas dengan kebutuhan pencatatan inventaris daerah.
            </p>
          </div>
        </div>

        <div className="text-[11px] bg-sky-950/60 p-3.5 rounded-xl border border-sky-800/50 space-y-2 font-medium">
          <span className="font-extrabold text-amber-300">Langkah Memasukkan ke Google Sheets Anda:</span>
          <ol className="list-decimal pl-4 space-y-1.5 text-sky-100/90 leading-relaxed">
            <li>Buka lembar sebar atau tautan spreadsheet Anda: <a href="https://docs.google.com/spreadsheets/d/1TABYBj6rdO--FUbHbelQG7SG4j-gttvR25mSpurAU2Y/edit" target="_blank" rel="noreferrer" className="underline text-amber-400 hover:text-amber-300 font-bold inline-flex items-center gap-0.5">Tautan Madiun Sheet <ExternalLink className="w-2.5 h-2.5" /></a></li>
            <li>Unduh CSV di atas, lalu di Google Sheets klik <strong>File &gt; Import &gt; Upload</strong>.</li>
            <li>Alternatif cepat: Klik <strong>"Salin Tabel"</strong> di aplikasi ini, lalu langsung letakka kursor Anda di baris kosong spreadsheet dan tekan <strong>Ctrl + V</strong> (Paste)!</li>
          </ol>
        </div>
      </div>

      {/* JSON Backup & Device Sync */}
      <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider">Device Sync / Pencadangan (.json)</h3>
          <p className="text-[10px] text-slate-400 mt-1 leading-normal">
            Pindahkan atau gabungkan seluruh data survei surveior lapangan secara instan antar perangkat tanpa perlu server internet.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleDownloadFullJSONBackup}
            className="w-full py-2.5 border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none"
          >
            <Download className="w-4 h-4 text-slate-500" /> Ekspor Berkas Cadangan (.json)
          </button>

          {userRole === 'admin' ? (
            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                id="json-file-input"
              />
              <label
                htmlFor="json-file-input"
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none border-b-2 border-slate-950 block text-center"
              >
                <Upload className="w-4 h-4 text-amber-400 inline-block mr-1" /> Impor &amp; Gabungkan Cadangan
              </label>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-center text-[10px] text-slate-500 font-bold border border-slate-200 dark:border-slate-700">
              🔒 Impor &amp; pemulihan basis data dibatasi khusus untuk Akun Admin.
            </div>
          )}
          
          {importSuccess && (
            <span className="text-[11px] font-medium text-sky-700 bg-sky-50 px-3 py-2 rounded-xl border border-sky-100 text-center block">
              ✅ Pemulihan sukses! Seluruh data cadangan berhasil disatukan ke dalam database.
            </span>
          )}

          {importError && (
            <span className="text-[11px] font-medium text-rose-700 bg-rose-50 px-3 py-2 rounded-xl border border-rose-100 text-center block">
              ❌ {importError}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
