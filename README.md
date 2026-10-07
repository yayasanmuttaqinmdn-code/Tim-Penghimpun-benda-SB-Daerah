# Daftar Aset Daerah Madiun

Aplikasi sistem informasi inventarisasi dan pendataan aset daerah Madiun (Tanah, Kendaraan, Bangunan, Riwayat SPPT PBB, dan Mutasi Balik Nama / Peminjaman Dokumen).

---

## 🚀 Panduan Deploy ke Vercel via GitHub

### 1. Buat Repositori Baru di GitHub
1. Buka [GitHub](https://github.com/) dan login ke akun Anda.
2. Klik tombol **New Repository**.
3. Beri nama repositori (contoh: `daftar-aset-madiun`).
4. Pilih **Public** atau **Private**, lalu klik **Create repository**.

### 2. Push Kode ke Repositori GitHub
Jalankan perintah berikut di terminal Anda:
```bash
git init
git add .
git commit -m "Initial commit - Sistem Aset Daerah Madiun"
git branch -M main
git remote add origin https://github.com/USERNAME_ANDA/daftar-aset-madiun.git
git push -u origin main
```
*(Ganti `USERNAME_ANDA` dan `daftar-aset-madiun` dengan URL repositori GitHub Anda)*

---

### 3. Deploy ke Vercel
1. Buka [Vercel Dashboard](https://vercel.com/dashboard) dan login dengan akun GitHub Anda.
2. Klik **Add New...** > **Project**.
3. Pilih repositori **daftar-aset-madiun** yang baru Anda buat, lalu klik **Import**.
4. Konfigurasi Proyek di Vercel:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./`
   - **Build Command**: `vite build` *(atau bawaan: `npm run build`)*
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Konfigurasi `vercel.json` sudah tersedia otomatis di dalam proyek untuk menangani Single Page Application (SPA) routing.
6. Klik tombol **Deploy**.

---

### 4. Fitur & Integrasi Google Sheets / Apps Script
- Database aplikasi didesain bekerja secara fleksibel dengan penyimpanan lokal, Google Sheets API, ataupun Google Apps Script Web App.
- Masukkan URL Web App Google Apps Script atau ID Spreadsheet Anda melalui menu **Pengaturan** di aplikasi setelah aplikasi live.

---

### 5. Menjalankan di Lokal (Development)
```bash
# Install dependensi
npm install

# Jalankan development server
npm run dev

# Build untuk produksi
npm run build
```
