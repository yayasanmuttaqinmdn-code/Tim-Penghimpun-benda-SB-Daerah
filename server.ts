import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { Asset, SpptPbbRecord } from "./src/types";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));

  const DATA_DIR = path.join(process.cwd(), "data");
  const DATA_FILE = path.join(DATA_DIR, "assets.json");
  const SPPT_DATA_FILE = path.join(DATA_DIR, "sppt.json");
  const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

  // Ensure data folder exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Load app settings
  let appSettings: { spreadsheetId: string; adminPassword?: string } = { 
    spreadsheetId: "https://script.google.com/macros/s/AKfycbxes0-aBJxFQPFeybB9ZfFpBHVioFgMtrPOSngWuY4A53nTeTqaJvbH9hhTfEmTbMFG/exec",
    adminPassword: "muttaqin"
  };
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const loaded = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"));
      appSettings = { ...appSettings, ...loaded };
      console.log(`Loaded settings: spreadsheetId = ${appSettings.spreadsheetId}`);
    } else {
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(appSettings, null, 2), "utf-8");
      console.log("Initialized default app settings file.");
    }
  } catch (err) {
    console.error("Error reading settings file, using default values", err);
  }

  const saveSettings = () => {
    try {
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(appSettings, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to persist settings file:", err);
    }
  };

  // Load initial assets
  let assetsDb: Asset[] = [];
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      assetsDb = JSON.parse(data);
      console.log(`Loaded ${assetsDb.length} assets from persistent storage.`);
    } else {
      // Default sample assets to make the database look rich immediately on first launch
      const sampleAssets: Asset[] = [
        {
          id: "samp-1",
          type: "tanah",
          jenisSertifikat: "SHM",
          nomerSertifikat: "Madiun/10.05/2021",
          atasNamaSertifikat: "Pemerintah Daerah Madiun",
          lokasi: 'Saradan',
          penggunaan: "Kantor Kecamatan Saradan",
          tempatSimpanBerkas: "Brankas Kantor Bupati Madiun (Lemari A)",
          createdAt: Date.now() - 86400000 * 5
        },
        {
          id: "samp-2",
          type: "kendaraan",
          jenisKendaraan: "MOBIL",
          nomorPolisi: "AE 1045 AP",
          merk: "Toyota Avanza Veloz",
          atasNama: "Dinas Perhubungan Kabupaten Madiun",
          tahunPembuatan: 2021,
          kondisiKendaraan: "BAIK",
          createdAt: Date.now() - 86400000 * 3
        },
        {
          id: "samp-3",
          type: "bangunan",
          namaBangunan: "Gedung Diklat Madiun",
          lokasi: "Taman",
          luasBangunan: 540,
          penggunaanBangunan: "Pendidikan dan Pelatihan Pegawai",
          nomerPBG: "PBG-357701-20230214-01",
          nomerSLF: "SLF-357701-15032023-001",
          kondisi: "BAIK",
          keteranganKerusakan: "-",
          createdAt: Date.now() - 86400000 * 2
        }
      ];
      fs.writeFileSync(DATA_FILE, JSON.stringify(sampleAssets, null, 2), "utf-8");
      assetsDb = sampleAssets;
      console.log("Initialized persistent storage with sample assets.");
    }
  } catch (err) {
    console.error("Error reading data file, using empty memory array", err);
  }

  // Save utility for assets
  const saveAssets = () => {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(assetsDb, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to persist data file:", err);
    }
  };

  // Load initial SPPT PBB database
  let spptDb: SpptPbbRecord[] = [];
  try {
    if (fs.existsSync(SPPT_DATA_FILE)) {
      const spptData = fs.readFileSync(SPPT_DATA_FILE, "utf-8");
      spptDb = JSON.parse(spptData);
      console.log(`Loaded ${spptDb.length} SPPT PBB records from persistent storage.`);
    } else {
      const sampleSppt: SpptPbbRecord[] = [
        {
          id: "sppt_sample_1",
          namaWajibPajak: "YAYASAN MUTTAQIN JOSENAN",
          lokasi: "Jl. Nogososro No. 26, Kel. Josenan, Kec. Taman, Kota Madiun",
          nop: "35.77.010.001.005-0023.0",
          pajakTerutang: 385000,
          totalBayarYayasanTahunan: 385000,
          riwayatPembayaran: {
            2025: { tahun: 2025, lunas: true, nominalBayar: 350000, tanggalBayar: "2025-06-20", keterangan: "Lunas via Mobile Banking" },
            2026: { tahun: 2026, lunas: false, nominalBayar: 385000, keterangan: "Ketetapan SPPT 2026" },
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
          keteranganTambahan: "Tanah Kompleks Pesantren & Kantor Utama",
          createdAt: Date.now() - 86400000 * 30,
          updatedAt: Date.now()
        }
      ];
      fs.writeFileSync(SPPT_DATA_FILE, JSON.stringify(sampleSppt, null, 2), "utf-8");
      spptDb = sampleSppt;
      console.log("Initialized persistent storage with sample SPPT PBB records.");
    }
  } catch (err) {
    console.error("Error reading SPPT data file, using empty array", err);
  }

  const saveSppt = () => {
    try {
      fs.writeFileSync(SPPT_DATA_FILE, JSON.stringify(spptDb, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to persist SPPT data file:", err);
    }
  };

  let activeAssetsSheetName = "Database_Aset_Wakaf";
  let lastSheetsError: string | null = null;

  function translateSheetsError(errText: string | null): string | null {
    if (!errText) return null;
    try {
      const parsed = JSON.parse(errText);
      const msg = parsed?.error?.message || "";
      const status = parsed?.error?.status || "";
      const code = parsed?.error?.code;

      if (code === 403 || status === "PERMISSION_DENIED" || msg.toLowerCase().includes("permission")) {
        return "Akses Ditolak (403): Sesi login Anda tidak memiliki izin menulis/mengedit Spreadsheet ini. Silakan pastikan Spreadsheet ini dibagikan dengan hak akses 'Editor' ke akun Google yang Anda hubungkan (yayasanmuttaqinmdn@gmail.com).";
      }
      if (code === 404 || status === "NOT_FOUND" || msg.toLowerCase().includes("not found")) {
        return "Tidak Ditemukan (404): Spreadsheet ID tidak valid atau tidak ditemukan. Silakan periksa kembali Spreadsheet ID di menu pengaturan.";
      }
      if (code === 400 || status === "INVALID_ARGUMENT") {
        return `Format Salah (400): ID Spreadsheet atau range data tidak valid. Hubungi admin. Detail: ${msg}`;
      }
      if (code === 401 || status === "UNAUTHENTICATED") {
        return "Sesi Kedaluwarsa (401): Sesi Google lama tidak valid. Silakan putuskan sambungan (Logout) lalu sambungkan kembali.";
      }
      return `Kesalahan Google Sheets (${code || status || 'Error'}): ${msg || errText}`;
    } catch (e) {
      if (errText.includes("403") || errText.includes("permission") || errText.includes("Permission")) {
        return "Akses Ditolak (403): Silakan pastikan kepemilikian atau hak edit 'Editor' file Google Sheets ini diberikan kepada akun Google Anda.";
      }
      if (errText.includes("404")) {
        return "Tidak Ditemukan (404): Spreadsheet ID tidak valid atau tidak ditemukan.";
      }
      return errText;
    }
  }

  async function ensureSheetTabExists(spreadsheetId: string, accessToken: string): Promise<boolean> {
    try {
      lastSheetsError = null;
      const getRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!getRes.ok) {
        const errText = await getRes.text();
        console.error("Failed to fetch spreadsheet structure:", errText);
        lastSheetsError = errText;
        return false;
      }
      const metadata = (await getRes.json()) as any;
      const sheetTitles: string[] = (metadata.sheets || []).map((s: any) => s.properties?.title);

      if (sheetTitles.includes("Database_Aset_Wakaf")) {
        activeAssetsSheetName = "Database_Aset_Wakaf";
        return true;
      } else if (sheetTitles.includes("Aset_All")) {
        activeAssetsSheetName = "Aset_All";
        return true;
      }

      // If neither exists, create Database_Aset_Wakaf
      activeAssetsSheetName = "Database_Aset_Wakaf";
      console.log(`Sheet "${activeAssetsSheetName}" not found. Creating it...`);
      const createRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: activeAssetsSheetName,
                  gridProperties: {
                    rowCount: 1000,
                    columnCount: 15
                  }
                }
              }
            }
          ]
        })
      });

      if (!createRes.ok) {
        const errText = await createRes.text();
        console.error("Failed to create sheet tab:", errText);
        lastSheetsError = errText;
        return false;
      }

      const headers = [
        "ID Aset", "Kode Aset", "Nama / Identitas Aset", "Kategori", "Lokasi", 
        "Tahun Perolehan", "Nilai Aset (Rp)", "Kondisi", "Status Sertifikat", 
        "Luas", "Keterangan / Tempat Simpan", "Pemberi Wakaf / Pemilik", "Peruntukan", 
        "Terakhir Diperbarui", "Raw JSON Data"
      ];
      const putHeaderRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${activeAssetsSheetName}!A1:O1?valueInputOption=USER_ENTERED`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ values: [headers] })
      });
      if (!putHeaderRes.ok) {
        const errText = await putHeaderRes.text();
        console.error("Failed to write headers to the new sheet tab:", errText);
        lastSheetsError = errText;
        return false;
      }
      console.log(`Sheet "${activeAssetsSheetName}" created with headers.`);
      return true;
    } catch (err: any) {
      console.error("Error ensuring sheet tab exists:", err);
      lastSheetsError = String(err.message || err);
      return false;
    }
  }

  async function fetchAssetsFromSheets(spreadsheetId: string, accessToken: string): Promise<Asset[] | null> {
    const check = await ensureSheetTabExists(spreadsheetId, accessToken);
    if (!check) return null;

    try {
      lastSheetsError = null;
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${activeAssetsSheetName}!A2:O2000?valueRenderOption=UNFORMATTED_VALUE`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error("Failed to fetch values from sheet:", errText);
        lastSheetsError = errText;
        return null;
      }
      const data = (await res.json()) as any;
      if (!data.values || data.values.length === 0) {
        return [];
      }

      const loadedAssets: Asset[] = [];
      for (const row of data.values) {
        // Look for raw JSON in last columns (index 14 or 8)
        const rawJson = row[14] || row[8];
        if (rawJson) {
          try {
            const parsed = JSON.parse(rawJson) as Asset;
            if (parsed && parsed.id) {
              loadedAssets.push(parsed);
              continue;
            }
          } catch (e) {}
        }
        if (row[0]) {
          loadedAssets.push({
            id: String(row[0]),
            type: (String(row[3] || row[1]).toLowerCase().includes('kendaraan') ? 'kendaraan' : String(row[3] || row[1]).toLowerCase().includes('bangunan') ? 'bangunan' : 'tanah') as any,
            jenisSertifikat: String(row[8] || 'SHM'),
            nomerSertifikat: String(row[2] || row[0]),
            atasNamaSertifikat: String(row[11] || ''),
            lokasi: String(row[4] || ''),
            penggunaan: String(row[12] || ''),
            tempatSimpanBerkas: String(row[10] || ''),
            createdAt: Date.now()
          } as any);
        }
      }
      return loadedAssets;
    } catch (err) {
      console.error("Error fetching assets from Google Sheets:", err);
      return null;
    }
  }

  async function writeAssetsToSheets(spreadsheetId: string, accessToken: string, assets: Asset[]): Promise<boolean> {
    const check = await ensureSheetTabExists(spreadsheetId, accessToken);
    if (!check) return false;

    try {
      lastSheetsError = null;
      const clearRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${activeAssetsSheetName}!A2:O2000:clear`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });

      if (!clearRes.ok) {
        const errText = await clearRes.text();
        console.error("Failed to clear sheet ranges:", errText);
        lastSheetsError = errText;
        return false;
      }

      if (assets.length === 0) {
        return true;
      }

      const values = assets.map(asset => {
        let identitas = "";
        let kategori = asset.type.toUpperCase();
        let lokasi = (asset as any).lokasi || "-";
        let statusSertifikat = "-";
        let luas = "";
        let ketSimpan = "";
        let pemilik = "";
        let peruntukan = "";
        let tahun = 2024;
        let kondisi = "BAIK";

        if (asset.type === "tanah") {
          identitas = `${asset.jenisSertifikat} ${asset.nomerSertifikat}`;
          statusSertifikat = asset.jenisSertifikat;
          luas = asset.luasTanah ? `${asset.luasTanah} m²` : "-";
          ketSimpan = asset.tempatSimpanBerkas || "-";
          pemilik = asset.atasNamaSertifikat || "-";
          peruntukan = asset.penggunaan || "-";
        } else if (asset.type === "kendaraan") {
          identitas = `${asset.merk} (${asset.nomorPolisi})`;
          kondisi = asset.kondisiKendaraan || "BAIK";
          tahun = asset.tahunPembuatan || 2024;
          pemilik = asset.atasNama || "-";
          ketSimpan = asset.penanggungJawabDaerah || "-";
        } else if (asset.type === "bangunan") {
          identitas = asset.namaBangunan;
          luas = asset.luasBangunan ? `${asset.luasBangunan} m²` : "-";
          peruntukan = asset.penggunaanBangunan || "-";
          ketSimpan = `PBG: ${asset.nomerPBG || "-"} | SLF: ${asset.nomerSLF || "-"}`;
          kondisi = asset.kondisi || "BAIK";
        }

        return [
          asset.id,
          asset.id,
          identitas,
          kategori,
          lokasi,
          tahun,
          0,
          kondisi,
          statusSertifikat,
          luas,
          ketSimpan,
          pemilik,
          peruntukan,
          new Date().toISOString(),
          JSON.stringify(asset)
        ];
      });

      const putRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${activeAssetsSheetName}!A2:O${assets.length + 1}?valueInputOption=USER_ENTERED`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ values })
      });

      if (!putRes.ok) {
        const errText = await putRes.text();
        console.error("Failed to write values to sheet:", errText);
        lastSheetsError = errText;
        return false;
      }
      return true;
    } catch (err: any) {
      console.error("Error writing assets to Google Sheets:", err);
      lastSheetsError = String(err.message || err);
      return false;
    }
  }

  function isAppsScriptUrl(target: string | undefined): boolean {
    if (!target) return false;
    return target.startsWith("http") && target.includes("script.google.com");
  }

  function extractLoansData(assets: Asset[]) {
    const rows: any[] = [];
    assets.forEach(a => {
      let namaAset = "";
      if (a.type === 'tanah') namaAset = `${a.jenisSertifikat} ${a.nomerSertifikat} (${a.lokasi || '-'})`;
      else if (a.type === 'kendaraan') namaAset = `${a.merk} (${a.nomorPolisi})`;
      else if (a.type === 'bangunan') namaAset = `${a.namaBangunan} (${a.lokasi || '-'})`;

      if (a.sedangDipinjam && a.peminjamanAktif) {
        const p = a.peminjamanAktif;
        rows.push({
          idLoan: p.id || `loan-${a.id}`,
          idAset: a.id,
          kategori: a.type.toUpperCase(),
          namaAset,
          peminjamName: p.peminjamName || '',
          peminjamJabatan: p.peminjamJabatan || '',
          peminjamKontak: p.peminjamKontak || '',
          tanggalPinjam: p.tanggalPinjam || '',
          keperluan: p.keperluan || '',
          tanggalKembaliRencana: p.tanggalKembaliRencana || '',
          tanggalKembaliRiil: p.tanggalKembaliRiil || '-',
          status: 'SEDANG DIPINJAM',
          namaPetugas: p.namaPetugas || '-'
        });
      }

      if (a.riwayatPeminjaman && Array.isArray(a.riwayatPeminjaman)) {
        a.riwayatPeminjaman.forEach(p => {
          rows.push({
            idLoan: p.id || `hist-${a.id}`,
            idAset: a.id,
            kategori: a.type.toUpperCase(),
            namaAset,
            peminjamName: p.peminjamName || '',
            peminjamJabatan: p.peminjamJabatan || '',
            peminjamKontak: p.peminjamKontak || '',
            tanggalPinjam: p.tanggalPinjam || '',
            keperluan: p.keperluan || '',
            tanggalKembaliRencana: p.tanggalKembaliRencana || '',
            tanggalKembaliRiil: p.tanggalKembaliRiil || '-',
            status: 'TELAH DIKEMBALIKAN',
            namaPetugas: p.namaPetugas || '-'
          });
        });
      }
    });
    return rows;
  }

  function extractNameTransfersData(assets: Asset[]) {
    const rows: any[] = [];
    assets.forEach(a => {
      let identitas = "";
      if (a.type === 'tanah') identitas = `${a.jenisSertifikat} ${a.nomerSertifikat}`;
      else if (a.type === 'kendaraan') identitas = `${a.merk} - ${a.nomorPolisi}`;
      else if (a.type === 'bangunan') identitas = a.namaBangunan;

      if (a.sedangBalikNama) {
        const totalBiaya = (a.progresBalikNama || []).reduce((sum, p) => sum + (Number(p.biaya) || 0), 0);
        const tahapan = (a.progresBalikNama || []).map(p => `[${p.tanggal}] ${p.keterangan} (Rp ${Number(p.biaya).toLocaleString('id-ID')})`).join(' | ');

        rows.push({
          idAset: a.id,
          kategori: a.type.toUpperCase(),
          identitasAset: identitas,
          status: 'DALAM PROSES',
          pemilikBaru: a.namaPemilikBaru || '-',
          pemilikLama: (a as any).atasNamaSertifikat || (a as any).atasNama || '-',
          tanggalMulai: a.tanggalMulaiBalikNama || '-',
          tanggalSelesai: '-',
          totalBiaya: totalBiaya,
          tahapanProgres: tahapan || '-',
          catatan: a.catatanBalikNama || '-'
        });
      }

      if (a.riwayatBalikNama && Array.isArray(a.riwayatBalikNama)) {
        a.riwayatBalikNama.forEach(r => {
          const totalBiaya = (r.progresDetail || []).reduce((sum, p) => sum + (Number(p.biaya) || 0), 0);
          const tahapan = (r.progresDetail || []).map(p => `[${p.tanggal}] ${p.keterangan} (Rp ${Number(p.biaya).toLocaleString('id-ID')})`).join(' | ');

          rows.push({
            idAset: a.id,
            kategori: a.type.toUpperCase(),
            identitasAset: identitas,
            status: 'SELESAI (SUDAH BALIK NAMA)',
            pemilikBaru: '-',
            pemilikLama: r.atasNamaLama || '-',
            tanggalMulai: '-',
            tanggalSelesai: r.tanggalSelesai || '-',
            totalBiaya: totalBiaya,
            tahapanProgres: tahapan || '-',
            catatan: r.catatanLama || `Sertifikat Baru: ${r.nomorSertifikatBaru || '-'}`
          });
        });
      }
    });
    return rows;
  }

  function extractSummaryData(assets: Asset[]) {
    const total = assets.length;
    const tanah = assets.filter(a => a.type === 'tanah').length;
    const kendaraan = assets.filter(a => a.type === 'kendaraan').length;
    const bangunan = assets.filter(a => a.type === 'bangunan').length;
    const dipinjam = assets.filter(a => a.sedangDipinjam).length;
    const balikNama = assets.filter(a => a.sedangBalikNama).length;

    return [
      { parameter: 'Total Semua Aset', jumlah: total, keterangan: 'Tanah, Kendaraan, Bangunan' },
      { parameter: 'Aset Bidang Tanah', jumlah: tanah, keterangan: 'Sertifikat SHM / Waqaf / SHGB / Letter C' },
      { parameter: 'Aset Unit Kendaraan', jumlah: kendaraan, keterangan: 'Motor, Mobil, Elf, Bus' },
      { parameter: 'Aset Gedung / Bangunan', jumlah: bangunan, keterangan: 'Bangunan Fisik & PBG/SLF' },
      { parameter: 'Berkas Dokumen Sedang Dipinjam', jumlah: dipinjam, keterangan: 'Wajib dipantau pengembaliannya' },
      { parameter: 'Aset Sedang Proses Balik Nama', jumlah: balikNama, keterangan: 'Sedang berjalan di BPN / Notaris' },
      { parameter: 'Objek SPPT PBB Terdaftar', jumlah: spptDb.length, keterangan: 'Data PBB dan riwayat pembayaran 2025-2035' },
      { parameter: 'Sinkronisasi Terakhir', jumlah: new Date().toLocaleString('id-ID'), keterangan: 'Pembaruan otomatis dari sistem' }
    ];
  }

  function extractSpptData(records: SpptPbbRecord[]) {
    return records.map(r => {
      const p2025 = r.riwayatPembayaran?.[2025]?.lunas ? `LUNAS (${r.riwayatPembayaran?.[2025]?.nominalBayar || 0})` : 'BELUM';
      const p2026 = r.riwayatPembayaran?.[2026]?.lunas ? `LUNAS (${r.riwayatPembayaran?.[2026]?.nominalBayar || 0})` : 'BELUM';
      const p2027 = r.riwayatPembayaran?.[2027]?.lunas ? `LUNAS (${r.riwayatPembayaran?.[2027]?.nominalBayar || 0})` : 'BELUM';
      const p2028 = r.riwayatPembayaran?.[2028]?.lunas ? `LUNAS (${r.riwayatPembayaran?.[2028]?.nominalBayar || 0})` : 'BELUM';
      const p2029 = r.riwayatPembayaran?.[2029]?.lunas ? `LUNAS (${r.riwayatPembayaran?.[2029]?.nominalBayar || 0})` : 'BELUM';
      const p2030 = r.riwayatPembayaran?.[2030]?.lunas ? `LUNAS (${r.riwayatPembayaran?.[2030]?.nominalBayar || 0})` : 'BELUM';
      const p2031 = r.riwayatPembayaran?.[2031]?.lunas ? `LUNAS (${r.riwayatPembayaran?.[2031]?.nominalBayar || 0})` : 'BELUM';
      const p2032 = r.riwayatPembayaran?.[2032]?.lunas ? `LUNAS (${r.riwayatPembayaran?.[2032]?.nominalBayar || 0})` : 'BELUM';
      const p2033 = r.riwayatPembayaran?.[2033]?.lunas ? `LUNAS (${r.riwayatPembayaran?.[2033]?.nominalBayar || 0})` : 'BELUM';
      const p2034 = r.riwayatPembayaran?.[2034]?.lunas ? `LUNAS (${r.riwayatPembayaran?.[2034]?.nominalBayar || 0})` : 'BELUM';
      const p2035 = r.riwayatPembayaran?.[2035]?.lunas ? `LUNAS (${r.riwayatPembayaran?.[2035]?.nominalBayar || 0})` : 'BELUM';

      return {
        id: r.id,
        nop: r.nop,
        namaWajibPajak: r.namaWajibPajak,
        lokasi: r.lokasi,
        pajakTerutang: r.pajakTerutang,
        totalBayarYayasan: r.totalBayarYayasanTahunan,
        p2025, p2026, p2027, p2028, p2029, p2030, p2031, p2032, p2033, p2034, p2035,
        keterangan: r.keteranganTambahan || '',
        rawJson: JSON.stringify(r)
      };
    });
  }

  async function writeAssetsToAppsScript(scriptUrl: string, assets: Asset[], spptRecords: SpptPbbRecord[] = spptDb): Promise<boolean> {
    try {
      const mapped = assets.map(a => {
        let identitas = "";
        let lokasi = (a as any).lokasi || "";
        let kategori = a.type || "";
        let keterangan = "";
        let luas = "";
        let statusSertifikat = "";
        let tahun = 2024;
        let pemberiWakaf = "";
        let peruntukan = "";

        if (a.type === "tanah") {
          kategori = "Tanah";
          identitas = `${a.jenisSertifikat || ""} ${a.nomerSertifikat || ""}`.trim();
          luas = a.luasTanah ? `${a.luasTanah} m²` : "";
          statusSertifikat = a.jenisSertifikat || "";
          keterangan = `a.n. ${a.atasNamaSertifikat || "-"} | Simpan: ${a.tempatSimpanBerkas || "-"}`;
          peruntukan = a.penggunaan || "";
          pemberiWakaf = a.atasNamaSertifikat || "";
        } else if (a.type === "kendaraan") {
          kategori = "Kendaraan";
          identitas = a.nomorPolisi || "";
          keterangan = `${a.merk || ""} | a.n. ${a.atasNama || "-"}`;
          tahun = a.tahunPembuatan || tahun;
        } else if (a.type === "bangunan") {
          kategori = "Bangunan";
          identitas = a.namaBangunan || "";
          luas = a.luasBangunan ? `${a.luasBangunan} m²` : "";
          keterangan = `PBG: ${a.nomerPBG || "-"} | SLF: ${a.nomerSLF || "-"}`;
          peruntukan = a.penggunaanBangunan || "";
        }

        return {
          id: a.id,
          kode: a.id,
          nama: identitas,
          kategori: kategori,
          lokasi: lokasi,
          tahunPerolehan: tahun,
          nilaiAset: 0,
          kondisi: (a as any).kondisiKendaraan || (a as any).kondisi || "Baik",
          statusSertifikat: statusSertifikat,
          luas: luas,
          keterangan: keterangan,
          pemberiWakaf: pemberiWakaf,
          peruntukan: peruntukan,
          rawJson: JSON.stringify(a)
        };
      });

      const payload = {
        action: "syncAll",
        assets: mapped,
        loans: extractLoansData(assets),
        nameTransfers: extractNameTransfersData(assets),
        summary: extractSummaryData(assets),
        sppt: extractSpptData(spptRecords)
      };

      const res = await fetch(scriptUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        redirect: "follow"
      });
      return res.ok;
    } catch (err) {
      console.error("Error writing assets and SPPT to Apps Script:", err);
      return false;
    }
  }

  async function fetchAssetsFromAppsScript(scriptUrl: string): Promise<Asset[] | null> {
    try {
      const res = await fetch(`${scriptUrl}?action=getAssets`, { redirect: "follow" });
      if (!res.ok) return null;
      const data = await res.json() as any;
      if (!data || !Array.isArray(data.assets)) return null;

      const assets: Asset[] = [];
      for (const item of data.assets) {
        if (item.rawJson) {
          try {
            const parsed = JSON.parse(item.rawJson);
            if (parsed && parsed.id) {
              assets.push(parsed);
              continue;
            }
          } catch (e) {}
        }
        if (item.id) {
          assets.push({
            id: item.id,
            type: (item.kategori?.toLowerCase() === 'kendaraan' ? 'kendaraan' : item.kategori?.toLowerCase() === 'bangunan' ? 'bangunan' : 'tanah') as any,
            jenisSertifikat: item.statusSertifikat || 'SHM',
            nomerSertifikat: item.nama || item.kode || '',
            atasNamaSertifikat: item.pemberiWakaf || '',
            lokasi: item.lokasi || '',
            penggunaan: item.peruntukan || '',
            tempatSimpanBerkas: '',
            createdAt: Date.now()
          } as any);
        }
      }
      return assets;
    } catch (err) {
      console.error("Error fetching from Apps Script:", err);
      return null;
    }
  }

  async function fetchSpptFromAppsScript(scriptUrl: string): Promise<SpptPbbRecord[] | null> {
    try {
      const res = await fetch(`${scriptUrl}?action=getSppt`, { redirect: "follow" });
      if (!res.ok) return null;
      const data = await res.json() as any;
      if (!data || !Array.isArray(data.sppt)) return null;

      const records: SpptPbbRecord[] = [];
      for (const item of data.sppt) {
        if (item.rawJson) {
          try {
            const parsed = JSON.parse(item.rawJson);
            if (parsed && (parsed.id || parsed.nop)) {
              records.push(parsed);
              continue;
            }
          } catch (e) {}
        }
        if (item.id || item.nop) {
          records.push({
            id: item.id || `sppt_${Date.now()}`,
            nop: item.nop || '',
            namaWajibPajak: item.namaWajibPajak || '',
            lokasi: item.lokasi || '',
            pajakTerutang: Number(item.pajakTerutang) || 0,
            totalBayarYayasanTahunan: Number(item.totalBayarYayasan) || Number(item.pajakTerutang) || 0,
            riwayatPembayaran: {},
            keteranganTambahan: item.keterangan || '',
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
        }
      }
      return records;
    } catch (err) {
      console.error("Error fetching SPPT from Apps Script:", err);
      return null;
    }
  }

  async function syncDatabaseToDestination(assets: Asset[], googleToken?: string): Promise<boolean> {
    if (!appSettings.spreadsheetId) return false;
    if (isAppsScriptUrl(appSettings.spreadsheetId)) {
      return await writeAssetsToAppsScript(appSettings.spreadsheetId, assets, spptDb);
    } else if (googleToken) {
      return await writeAssetsToSheets(appSettings.spreadsheetId, googleToken, assets);
    }
    return false;
  }

  // ==========================================================
  // SPPT PBB GOOGLE SHEETS SYNCHRONIZATION HELPERS
  // ==========================================================
  const spptSheetName = "SPPT_PBB";

  async function ensureSpptSheetTabExists(spreadsheetId: string, accessToken: string) {
    try {
      lastSheetsError = null;
      const getRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!getRes.ok) {
        const errText = await getRes.text();
        console.error("Failed to fetch spreadsheet structure for SPPT:", errText);
        lastSheetsError = errText;
        return false;
      }
      const metadata = (await getRes.json()) as any;
      const sheetExists = metadata.sheets?.some(
        (s: any) => s.properties?.title === spptSheetName
      );

      if (!sheetExists) {
        console.log(`Sheet "${spptSheetName}" not found. Creating it...`);
        const createRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            requests: [
              {
                addSheet: {
                  properties: {
                    title: spptSheetName,
                    gridProperties: {
                      rowCount: 1000,
                      columnCount: 10
                    }
                  }
                }
              }
            ]
          })
        });

        if (!createRes.ok) {
          const errText = await createRes.text();
          console.error("Failed to create SPPT sheet tab:", errText);
          lastSheetsError = errText;
          return false;
        }

        const headers = ["ID", "NOP", "Nama Wajib Pajak", "Lokasi Objek Pajak", "Pajak Terutang (Rp)", "Total Bayar Yayasan/Th (Rp)", "Riwayat Pembayaran Ringkas", "Keterangan Tambahan", "Last Updated", "Raw JSON Data"];
        const putHeaderRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${spptSheetName}!A1:J1?valueInputOption=USER_ENTERED`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ values: [headers] })
        });
        if (!putHeaderRes.ok) {
          const errText = await putHeaderRes.text();
          console.error("Failed to write headers to SPPT sheet tab:", errText);
          lastSheetsError = errText;
          return false;
        }
        console.log(`Sheet "${spptSheetName}" created with headers.`);
      }
      return true;
    } catch (err: any) {
      console.error("Error ensuring SPPT sheet tab exists:", err);
      lastSheetsError = String(err.message || err);
      return false;
    }
  }

  async function fetchSpptFromSheets(spreadsheetId: string, accessToken: string): Promise<SpptPbbRecord[] | null> {
    const check = await ensureSpptSheetTabExists(spreadsheetId, accessToken);
    if (!check) return null;

    try {
      lastSheetsError = null;
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${spptSheetName}!A2:J1000?valueRenderOption=UNFORMATTED_VALUE`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error("Failed to fetch values from SPPT sheet:", errText);
        lastSheetsError = errText;
        return null;
      }
      const data = (await res.json()) as any;
      if (!data.values || data.values.length === 0) {
        return [];
      }

      const loadedSppt: SpptPbbRecord[] = [];
      for (const row of data.values) {
        const rawJson = row[9];
        if (rawJson) {
          try {
            const parsed = JSON.parse(rawJson) as SpptPbbRecord;
            if (parsed && (parsed.id || parsed.nop)) {
              loadedSppt.push(parsed);
            }
          } catch (e) {
            console.warn("Skipping individual SPPT row JSON error:", e);
          }
        }
      }
      return loadedSppt;
    } catch (err) {
      console.error("Error fetching SPPT from Google Sheets:", err);
      return null;
    }
  }

  async function writeSpptToSheets(spreadsheetId: string, accessToken: string, records: SpptPbbRecord[]): Promise<boolean> {
    const check = await ensureSpptSheetTabExists(spreadsheetId, accessToken);
    if (!check) return false;

    try {
      lastSheetsError = null;
      const clearRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${spptSheetName}!A2:J2000:clear`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });

      if (!clearRes.ok) {
        const errText = await clearRes.text();
        console.error("Failed to clear SPPT sheet ranges:", errText);
        lastSheetsError = errText;
        return false;
      }

      if (records.length === 0) {
        return true;
      }

      const values = records.map(rec => {
        const paymentSummary = Object.entries(rec.riwayatPembayaran || {})
          .map(([yr, p]) => `${yr}: ${p.lunas ? `LUNAS (${p.nominalBayar ? 'Rp ' + Number(p.nominalBayar).toLocaleString('id-ID') : 'OK'})` : 'BELUM'}`)
          .join(' | ');

        return [
          rec.id,
          `'${rec.nop}`,
          rec.namaWajibPajak,
          rec.lokasi,
          rec.pajakTerutang,
          rec.totalBayarYayasanTahunan,
          paymentSummary,
          rec.keteranganTambahan || "",
          new Date(rec.updatedAt || Date.now()).toISOString(),
          JSON.stringify(rec)
        ];
      });

      const putRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${spptSheetName}!A2:J${records.length + 1}?valueInputOption=USER_ENTERED`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ values })
      });

      if (!putRes.ok) {
        const errText = await putRes.text();
        console.error("Failed to write values to SPPT sheet:", errText);
        lastSheetsError = errText;
        return false;
      }
      return true;
    } catch (err: any) {
      console.error("Error writing SPPT to Google Sheets:", err);
      lastSheetsError = String(err.message || err);
      return false;
    }
  }

  async function syncSpptToDestination(records: SpptPbbRecord[], googleToken?: string): Promise<boolean> {
    if (!appSettings.spreadsheetId) return false;
    if (isAppsScriptUrl(appSettings.spreadsheetId)) {
      return await writeAssetsToAppsScript(appSettings.spreadsheetId, assetsDb, records);
    } else if (googleToken) {
      return await writeSpptToSheets(appSettings.spreadsheetId, googleToken, records);
    }
    return false;
  }

  // 1. GET ALL ASSETS (TWO-WAY SYNC: DELETIONS IN SHEETS DELETE IN APP, AND VICE VERSA)
  app.get("/api/assets", async (req, res) => {
    try {
      const googleToken = req.headers["x-google-token"] as string | undefined;

      if (appSettings.spreadsheetId) {
        if (isAppsScriptUrl(appSettings.spreadsheetId)) {
          // Mode Apps Script Web App
          console.log("Pulling live assets from Google Apps Script Web App...");
          const remoteAssets = await fetchAssetsFromAppsScript(appSettings.spreadsheetId);
          if (remoteAssets !== null) {
            if (remoteAssets.length === 0 && assetsDb.length > 0) {
              // First time initialization: populate empty sheet with local seed data
              await writeAssetsToAppsScript(appSettings.spreadsheetId, assetsDb);
            } else {
              // Two-way synchronization with deletion propagation:
              // Google Spreadsheet is the master source of truth.
              // Any item removed from the spreadsheet will be removed from local database!
              const localMap = new Map(assetsDb.map(a => [a.id, a]));
              const updatedDb: Asset[] = [];

              for (const remote of remoteAssets) {
                if (localMap.has(remote.id)) {
                  const local = localMap.get(remote.id)!;
                  updatedDb.push({
                    ...local,
                    ...remote,
                    progresBalikNama: local.progresBalikNama || remote.progresBalikNama,
                    riwayatBalikNama: local.riwayatBalikNama || remote.riwayatBalikNama,
                    peminjamanAktif: local.peminjamanAktif || remote.peminjamanAktif,
                    riwayatPeminjaman: local.riwayatPeminjaman || remote.riwayatPeminjaman
                  });
                } else {
                  updatedDb.push(remote);
                }
              }

              assetsDb = updatedDb;
              saveAssets();
            }
          }
        } else if (googleToken) {
          // Mode Google Sheets API v4
          console.log("Pulling live assets from Google Sheets...");
          const sheetsAssets = await fetchAssetsFromSheets(appSettings.spreadsheetId, googleToken);
          if (sheetsAssets !== null) {
            if (sheetsAssets.length === 0 && assetsDb.length > 0) {
              console.log("Google Sheets is empty. Initializing with server assets...");
              await writeAssetsToSheets(appSettings.spreadsheetId, googleToken, assetsDb);
            } else {
              const localMap = new Map(assetsDb.map(a => [a.id, a]));
              const updatedDb: Asset[] = [];

              for (const remote of sheetsAssets) {
                if (localMap.has(remote.id)) {
                  const local = localMap.get(remote.id)!;
                  updatedDb.push({
                    ...local,
                    ...remote,
                    progresBalikNama: local.progresBalikNama || remote.progresBalikNama,
                    riwayatBalikNama: local.riwayatBalikNama || remote.riwayatBalikNama,
                    peminjamanAktif: local.peminjamanAktif || remote.peminjamanAktif,
                    riwayatPeminjaman: local.riwayatPeminjaman || remote.riwayatPeminjaman
                  });
                } else {
                  updatedDb.push(remote);
                }
              }

              assetsDb = updatedDb;
              saveAssets();
            }
          }
        }
      }
      return res.json(assetsDb);
    } catch (err) {
      console.error("Error in /api/assets, serving local assetsDb:", err);
      return res.json(assetsDb || []);
    }
  });

  // 2. BULK SYNC / MERGE
  app.post("/api/assets/sync", async (req, res) => {
    try {
      const clientAssets = req.body.assets as Asset[];
      const googleToken = req.headers["x-google-token"] as string | undefined;

      if (!Array.isArray(clientAssets)) {
        return res.status(400).json({ error: "Invalid payload. 'assets' must be an array." });
      }

      assetsDb = clientAssets;
      saveAssets();
      await syncDatabaseToDestination(assetsDb, googleToken);

      res.json({ success: true, count: assetsDb.length, assets: assetsDb });
    } catch (err) {
      console.error("Sync payload error:", err);
      res.status(500).json({ error: "External server error in sync" });
    }
  });

  // 3. CREATE NEW ASSET
  app.post("/api/assets", async (req, res) => {
    try {
      const newAsset = req.body as Asset;
      const googleToken = req.headers["x-google-token"] as string | undefined;

      if (!newAsset || !newAsset.id || !newAsset.type) {
        return res.status(400).json({ error: "Missing asset fields." });
      }

      const index = assetsDb.findIndex(a => a.id === newAsset.id);
      if (index !== -1) {
        assetsDb[index] = newAsset;
      } else {
        assetsDb.push(newAsset);
      }

      saveAssets();
      const syncedWithSheets = await syncDatabaseToDestination(assetsDb, googleToken);

      res.json({ success: true, asset: newAsset, syncedWithSheets });
    } catch (err) {
      res.status(500).json({ error: "Failed to create asset" });
    }
  });

  // 4. UPDATE ASSET
  app.put("/api/assets/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedAsset = req.body as Asset;
      const googleToken = req.headers["x-google-token"] as string | undefined;

      const index = assetsDb.findIndex(a => a.id === id);
      if (index === -1) {
        assetsDb.push(updatedAsset);
      } else {
        assetsDb[index] = updatedAsset;
      }

      saveAssets();
      const syncedWithSheets = await syncDatabaseToDestination(assetsDb, googleToken);

      res.json({ success: true, asset: updatedAsset, syncedWithSheets });
    } catch (err) {
      res.status(500).json({ error: "Failed to update asset" });
    }
  });

  // 5. DELETE ASSET (SYNCS DELETION TO GOOGLE SHEETS & CENTRAL STORAGE)
  app.delete("/api/assets/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const decodedId = decodeURIComponent(id).trim();
      const googleToken = req.headers["x-google-token"] as string | undefined;

      const index = assetsDb.findIndex(a => 
        a.id === id || 
        a.id === decodedId ||
        (a.type === 'tanah' && a.nomerSertifikat === decodedId) ||
        (a.type === 'kendaraan' && a.nomorPolisi === decodedId) ||
        (a.type === 'bangunan' && a.namaBangunan === decodedId)
      );

      if (index !== -1) {
        const deletedAsset = assetsDb[index];
        assetsDb.splice(index, 1);
        saveAssets();

        // Send explicit delete request to Apps Script if configured
        if (appSettings.spreadsheetId && isAppsScriptUrl(appSettings.spreadsheetId)) {
          fetch(appSettings.spreadsheetId, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action: "deleteAsset", id: deletedAsset.id }),
            redirect: "follow"
          }).catch(console.error);
        }

        const syncedWithSheets = await syncDatabaseToDestination(assetsDb, googleToken);
        console.log(`[DELETE] Asset ${deletedAsset.id} removed. Remaining: ${assetsDb.length}`);

        res.json({ success: true, id: deletedAsset.id, remaining: assetsDb.length, syncedWithSheets });
      } else {
        // If not found in memory but exists in database, still ensure sheets is synced
        await syncDatabaseToDestination(assetsDb, googleToken);
        res.json({ success: true, id, remaining: assetsDb.length, message: "Aset telah diselaraskan." });
      }
    } catch (err) {
      console.error("Error in delete asset:", err);
      res.status(500).json({ error: "Failed to delete asset" });
    }
  });

  // 6. CLEAR DATABASE (Helper for migration or master resets)
  app.post("/api/assets/reset", (req, res) => {
    assetsDb = [];
    saveAssets();
    res.json({ success: true, count: 0 });
  });

  // 7. GET SETTINGS
  app.get("/api/settings", (req, res) => {
    res.json(appSettings);
  });

  // GET SHEETS STATUS & ERROR DETAILS
  app.get("/api/sheets/status", async (req, res) => {
    try {
      if (!appSettings.spreadsheetId) {
        return res.json({ connected: false, error: "ID Spreadsheet atau URL Apps Script belum diatur." });
      }

      // Check if Apps Script Web App
      if (isAppsScriptUrl(appSettings.spreadsheetId)) {
        try {
          const testRes = await fetch(`${appSettings.spreadsheetId}?action=getAssets`, { redirect: "follow" });
          if (testRes.ok) {
            return res.json({ connected: true, isAppsScript: true, spreadsheetId: appSettings.spreadsheetId, error: null });
          } else {
            return res.json({ connected: false, isAppsScript: true, spreadsheetId: appSettings.spreadsheetId, error: `Apps Script status HTTP ${testRes.status}` });
          }
        } catch (e: any) {
          return res.json({ connected: false, isAppsScript: true, spreadsheetId: appSettings.spreadsheetId, error: "Tidak dapat terhubung ke URL Apps Script." });
        }
      }

      // Standard Google Sheets API check
      const googleToken = req.headers["x-google-token"] as string | undefined;
      if (!googleToken) {
        return res.json({ connected: false, error: "Sesi Google belum terhubung. Silakan hubungkan akun Google Anda." });
      }

      const check = await ensureSheetTabExists(appSettings.spreadsheetId, googleToken);
      if (check) {
        return res.json({ connected: true, spreadsheetId: appSettings.spreadsheetId, error: null });
      } else {
        const translated = translateSheetsError(lastSheetsError);
        return res.json({ connected: false, spreadsheetId: appSettings.spreadsheetId, error: translated || "Gagal memverifikasi spreadsheet." });
      }
    } catch (err: any) {
      res.json({ connected: false, error: `Kesalahan server: ${err.message || err}` });
    }
  });

  // ==========================================================
  // SPPT PBB API ENDPOINTS (CENTRALIZED DATABASE & SHEETS SYNC)
  // ==========================================================
  // GET ALL SPPT RECORDS
  app.get("/api/sppt", async (req, res) => {
    try {
      const googleToken = req.headers["x-google-token"] as string | undefined;

      if (appSettings.spreadsheetId) {
        if (isAppsScriptUrl(appSettings.spreadsheetId)) {
          const remoteSppt = await fetchSpptFromAppsScript(appSettings.spreadsheetId);
          if (remoteSppt !== null && remoteSppt.length > 0) {
            const localMap = new Map(spptDb.map(s => [s.id, s]));
            const updatedDb: SpptPbbRecord[] = [];

            for (const remote of remoteSppt) {
              if (localMap.has(remote.id)) {
                const local = localMap.get(remote.id)!;
                updatedDb.push({
                  ...local,
                  ...remote,
                  riwayatPembayaran: {
                    ...(local.riwayatPembayaran || {}),
                    ...(remote.riwayatPembayaran || {})
                  }
                });
              } else {
                updatedDb.push(remote);
              }
            }
            spptDb = updatedDb;
            saveSppt();
          }
        } else if (googleToken) {
          console.log("Pulling live SPPT records from Google Sheets...");
          const sheetsSppt = await fetchSpptFromSheets(appSettings.spreadsheetId, googleToken);
          if (sheetsSppt !== null) {
            if (sheetsSppt.length === 0 && spptDb.length > 0) {
              console.log("Google Sheets SPPT tab is empty. Initializing with server data...");
              await writeSpptToSheets(appSettings.spreadsheetId, googleToken, spptDb);
            } else if (sheetsSppt.length > 0) {
              const localMap = new Map(spptDb.map(s => [s.id, s]));
              const updatedDb: SpptPbbRecord[] = [];

              for (const remote of sheetsSppt) {
                if (localMap.has(remote.id)) {
                  const local = localMap.get(remote.id)!;
                  updatedDb.push({
                    ...local,
                    ...remote,
                    riwayatPembayaran: {
                      ...(local.riwayatPembayaran || {}),
                      ...(remote.riwayatPembayaran || {})
                    }
                  });
                } else {
                  updatedDb.push(remote);
                }
              }
              spptDb = updatedDb;
              saveSppt();
            }
          }
        }
      }
      return res.json(spptDb);
    } catch (err) {
      console.error("Error in /api/sppt:", err);
      return res.json(spptDb || []);
    }
  });

  // CREATE OR UPDATE SPPT RECORD
  app.post("/api/sppt", async (req, res) => {
    try {
      const record = req.body as SpptPbbRecord;
      const googleToken = req.headers["x-google-token"] as string | undefined;

      if (!record || !record.nop) {
        return res.status(400).json({ error: "Data SPPT tidak valid. NOP wajib diisi." });
      }

      const existingIndex = spptDb.findIndex(s => s.id === record.id || s.nop === record.nop);
      if (existingIndex !== -1) {
        spptDb[existingIndex] = {
          ...spptDb[existingIndex],
          ...record,
          updatedAt: Date.now()
        };
      } else {
        const newRecord: SpptPbbRecord = {
          ...record,
          id: record.id || `sppt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          createdAt: record.createdAt || Date.now(),
          updatedAt: Date.now()
        };
        spptDb = [newRecord, ...spptDb];
      }

      saveSppt();
      await syncSpptToDestination(spptDb, googleToken);
      res.json({ success: true, record, records: spptDb });
    } catch (err) {
      console.error("Error creating/updating SPPT:", err);
      res.status(500).json({ error: "Failed to save SPPT record" });
    }
  });

  // BATCH SYNC SPPT RECORDS
  app.post("/api/sppt/sync", async (req, res) => {
    try {
      const { records } = req.body as { records: SpptPbbRecord[] };
      const googleToken = req.headers["x-google-token"] as string | undefined;

      if (Array.isArray(records)) {
        const idMap = new Map<string, SpptPbbRecord>();
        spptDb.forEach(s => idMap.set(s.id, s));
        records.forEach(r => {
          if (r.id) {
            idMap.set(r.id, {
              ...(idMap.get(r.id) || {}),
              ...r,
              updatedAt: Date.now()
            } as SpptPbbRecord);
          }
        });
        spptDb = Array.from(idMap.values());
        saveSppt();
        await syncSpptToDestination(spptDb, googleToken);
      }
      res.json({ success: true, records: spptDb });
    } catch (err) {
      console.error("Error syncing SPPT records:", err);
      res.status(500).json({ error: "Failed to sync SPPT records" });
    }
  });

  // DELETE SPPT RECORD
  app.delete("/api/sppt/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const googleToken = req.headers["x-google-token"] as string | undefined;

      spptDb = spptDb.filter(s => s.id !== id);
      saveSppt();
      await syncSpptToDestination(spptDb, googleToken);
      res.json({ success: true, records: spptDb });
    } catch (err) {
      console.error("Error deleting SPPT record:", err);
      res.status(500).json({ error: "Failed to delete SPPT record" });
    }
  });

  // 8. UPDATE SETTINGS (CENTRAL PERSISTENCE FOR ALL CONNECTED DEVICES)
  app.post("/api/settings", (req, res) => {
    try {
      const { spreadsheetId } = req.body;
      if (spreadsheetId !== undefined) {
        let cleaned = String(spreadsheetId).trim();
        // If user pasted a full Google Sheets web URL, extract just the spreadsheet ID
        if (cleaned.startsWith("http") && !cleaned.includes("script.google.com")) {
          const match = cleaned.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
          if (match && match[1]) {
            cleaned = match[1];
          }
        }
        appSettings.spreadsheetId = cleaned;
        saveSettings();
        console.log(`[SETTINGS] Updated central spreadsheet configuration: ${appSettings.spreadsheetId}`);
        if (isAppsScriptUrl(appSettings.spreadsheetId)) {
          writeAssetsToAppsScript(appSettings.spreadsheetId, assetsDb, spptDb).catch(console.error);
        }
      }
      res.json({ success: true, settings: appSettings });
    } catch (err) {
      res.status(500).json({ error: "Failed to save settings" });
    }
  });

  // 9. ADMIN PASSWORD ROUTES
  app.get("/api/admin/password", (req, res) => {
    res.json({ password: appSettings.adminPassword || "muttaqin" });
  });

  app.post("/api/admin/password", (req, res) => {
    try {
      const { password } = req.body;
      if (password && typeof password === "string" && password.trim()) {
        appSettings.adminPassword = password.trim();
        saveSettings();
        return res.json({ success: true, password: appSettings.adminPassword });
      }
      return res.status(400).json({ error: "Password cannot be empty" });
    } catch (err) {
      res.status(500).json({ error: "Failed to update admin password" });
    }
  });

  app.post("/api/admin/password/reset", (req, res) => {
    try {
      const defaultPassword = "muttaqin";
      appSettings.adminPassword = defaultPassword;
      saveSettings();
      return res.json({ success: true, password: defaultPassword, message: "Kata sandi admin berhasil direset ke bawaan (muttaqin)" });
    } catch (err) {
      res.status(500).json({ error: "Failed to reset admin password" });
    }
  });

  // Ensure API 404s always return JSON, not index.html from Vite
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
  });

  // Ensure any uncaught API error returns JSON, not HTML error pages
  app.use("/api", (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("API error handler:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  });

  // Handle Static files & Vite Client
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
