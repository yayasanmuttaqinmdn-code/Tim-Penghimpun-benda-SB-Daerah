-- SQL Schema untuk Aplikasi Manajemen Aset Yayasan
-- Jalankan script SQL ini di menu "SQL Editor" pada dashboard Supabase Anda.

-- 1. Buat tabel assets
CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    nomor_identitas TEXT,
    nama_aset TEXT,
    lokasi TEXT,
    created_at TEXT,
    
    -- Field Khusus Tanah
    luas_tanah NUMERIC,
    penggunaan TEXT,
    tempat_simpan_berkas TEXT,
    
    -- Field Khusus Kendaraan
    atas_nama TEXT,
    merk TEXT,
    kondisi TEXT,
    tanggal_bulan_pajak TEXT,
    penanggung_jawab_daerah TEXT,
    
    -- Field Khusus Bangunan
    nomer_slf TEXT,
    keterangan_kerusakan TEXT,
    
    -- Field Balik Nama & Peminjaman (Log Progres, Riwayat, dll.)
    sedang_balik_nama BOOLEAN DEFAULT FALSE,
    nama_pemilik_baru TEXT,
    catatan_balik_nama TEXT,
    tanggal_mulai_balik_nama TEXT,
    progres_balik_nama JSONB DEFAULT '[]'::jsonb,
    riwayat_balik_nama JSONB DEFAULT '[]'::jsonb,
    
    sedang_dipinjam BOOLEAN DEFAULT FALSE,
    peminjaman_aktif JSONB,
    riwayat_peminjaman JSONB DEFAULT '[]'::jsonb
);

-- 2. Aktifkan Row Level Security (RLS) jika dibutuhkan
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- 3. Buat Policy agar aplikasi dapat membaca dan menulis data
-- Perhatian: Policy dasar ini mengizinkan semua operasi (Select, Insert, Update, Delete) secara public.
-- Jika aplikasi kedepannya memiliki fitur login Auth Supabase sendiri, policy ini perlu disesuaikan.

-- Mengizinkan Read (SELECT)
CREATE POLICY "Allow public read access" ON assets
    FOR SELECT USING (true);

-- Mengizinkan Insert (INSERT)
CREATE POLICY "Allow public insert access" ON assets
    FOR INSERT WITH CHECK (true);

-- Mengizinkan Update (UPDATE)
CREATE POLICY "Allow public update access" ON assets
    FOR UPDATE USING (true);

-- Mengizinkan Delete (DELETE)
CREATE POLICY "Allow public delete access" ON assets
    FOR DELETE USING (true);
