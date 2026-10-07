-- Jalankan SQL di bawah ini pada SQL Editor di dashboard Supabase Anda.

ALTER TABLE assets 
ADD COLUMN IF NOT EXISTS sedang_balik_nama BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS nama_pemilik_baru TEXT,
ADD COLUMN IF NOT EXISTS catatan_balik_nama TEXT,
ADD COLUMN IF NOT EXISTS tanggal_mulai_balik_nama TEXT,
ADD COLUMN IF NOT EXISTS progres_balik_nama JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS riwayat_balik_nama JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS sedang_dipinjam BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS peminjaman_aktif JSONB,
ADD COLUMN IF NOT EXISTS riwayat_peminjaman JSONB DEFAULT '[]'::jsonb;
