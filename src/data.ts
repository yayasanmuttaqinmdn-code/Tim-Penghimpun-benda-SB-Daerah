export const DESA_KELURAHAN_MADIUN: Record<string, string[]> = {
  // KOTA MADIUN
  'Kartoharjo': ['Kartoharjo', 'Kanigoro', 'Kelun', 'Klegen', 'Oro-oro Ombo', 'Pilangbango', 'Rejomulyo', 'Sukosari', 'Tawangrejo'],
  'Manguharjo': ['Manguharjo', 'Madiun Lor', 'Nambangan Kidul', 'Nambangan Lor', 'Ngegong', 'Pangongangan', 'Patihan', 'Sogaten', 'Winongo'],
  'Taman': ['Taman', 'Banjarejo', 'Demangan', 'Josenan', 'Kejuron', 'Kuncen', 'Manisrejo', 'Mojorejo', 'Pandean'],

  // KABUPATEN MADIUN
  'Balerejo': ['Balerejo', 'Babadan', 'Bulu', 'Gading', 'Garon', 'Jerukgulung', 'Kedungjati', 'Kedungrejo', 'Kuwu', 'Pacetan', 'Simo', 'Sogo', 'Sumberbening', 'Gembong', 'Tapelan'],
  'Dagangan': ['Dagangan', 'Banjarejo', 'Banjarsari Kulon', 'Banjarsari Wetan', 'Blorong', 'Durenan', 'Jetis', 'Joho', 'Kepet', 'Ketandan', 'Mendak', 'Mruwak', 'Ngranget', 'Nongko', 'Prampelan', 'Segulung', 'Sewulan', 'Sukosari', 'Tileng'],
  'Dolopo': ['Dolopo', 'Bangunsari', 'Blimbing', 'Bader', 'Candimulyo', 'Doho', 'Glonggong', 'Ketawang', 'Kradinan', 'Lembah', 'Suluk'],
  'Geger': ['Geger', 'Banaran', 'Campurasri', 'Jogodayuh', 'Jatisari', 'Kaibon', 'Kertosari', 'Klorogan', 'Krabak', 'Nglandung', 'Pagotan', 'Purworejo', 'Putat', 'Sareng', 'Slambur', 'Sumberejo', 'Uteran'],
  'Gemarang': ['Gemarang', 'Batok', 'Durenan', 'Ngelang', 'Sebayi', 'Tawangrejo', 'Winong'],
  'Jiwan': ['Jiwan', 'Bedoho', 'Bibrik', 'Bukir', 'Grobogan', 'Klagen Serut', 'Kwangsen', 'Meteh', 'Ngetrep', 'Sambirejo', 'Teguhan', 'Tiron', 'Wayut'],
  'Kare': ['Kare', 'Bolo', 'Cermo', 'Kepel', 'Kuwiran', 'Morang', 'Randi', 'Bodag'],
  'Kebonsari': ['Kebonsari', 'Balerejo', 'Gantrung', 'Kedondong', 'Kranggan', 'Mojorejo', 'Palur', 'Pucuk', 'Rejosari', 'Sidorejo', 'Singgahan', 'Sukorejo', 'Tambakmas'],
  'Mejayan': ['Mejayan', 'Bangsri', 'Blaran', 'Darmorejo', 'Glonggong', 'Kaligunting', 'Kaliabu', 'Klecorejo', 'Klitik', 'Krapyak', 'Pangsen', 'Pecel', 'Sidodadi', 'Wonorejo'],
  'Madiun': ['Madiun', 'Bagi', 'Banjarsari', 'Betek', 'Dempel', 'Dimong', 'Gunungsari', 'Nglames', 'Sendangrejo', 'Sirapan', 'Sumberejo', 'Tanjungrejo', 'Tlogoagung'],
  'Pilangkenceng': ['Pilangkenceng', 'Bulurejo', 'Dawuhan', 'Duren', 'Gandul', 'Kenyong', 'Kedungmaron', 'Kraton', 'Luoro', 'Muneng', 'Ngale', 'Ngasem', 'Ngengor', 'Pulerejo', 'Purworejo', 'Sumbergandu', 'Wonoayu'],
  'Saradan': ['Saradan', 'Bajaran', 'Bongsopotro', 'Bandungan', 'Glanggang', 'Klangon', 'Klampisan', 'Ngepeh', 'Pajaran', 'Sambirejo', 'Sugihwaras', 'Sukorejo', 'Sumberejo', 'Tulung'],
  'Sawahan': ['Sawahan', 'Bakur', 'Cabean', 'Garon', 'Golantepus', 'Kajang', 'Klangonan', 'Klumpit', 'Lebak Ayu', 'Pucangrejo', 'Rejosari', 'Sidomulyo'],
  'Wonoasri': ['Wonoasri', 'Banyukuning', 'Banaran', 'Buduran', 'Jatirejo', 'Klitik', 'Ngadirejo', 'Plumpungrejo', 'Purwosari', 'Sidomulyo'],
  'Wungu': ['Wungu', 'Bantengan', 'Brumbun', 'Karangrejo', 'Kresek', 'Madiun Lor', 'Mojopurno', 'Mojorayung', 'Nglambangan', 'Nglanduk', 'Pilangrejo', 'Sidorejo', 'Tempel']
};

import { Asset } from './types';

export const INITIAL_SAMPLE_ASSETS: Asset[] = [
  {
    id: "tanah-01",
    type: "tanah",
    jenisSertifikat: "SHM",
    nomerSertifikat: "SHM-357701/JOSENAN/2020",
    atasNamaSertifikat: "Yayasan Pondok Pesantren Muttaqin Josenan",
    lokasi: "Taman",
    penggunaan: "Kompleks Pondok Pesantren & Masjid Utama",
    tempatSimpanBerkas: "Brankas Kantor Utama (Lemari A1)",
    luasTanah: 1250,
    createdAt: Date.now() - 86400000 * 30
  },
  {
    id: "tanah-02",
    type: "tanah",
    jenisSertifikat: "WAQAF",
    nomerSertifikat: "W-357702/DEMANGAN/2018",
    atasNamaSertifikat: "Yayasan Pondok Pesantren Muttaqin Josenan",
    lokasi: "Taman",
    penggunaan: "Asrama Santri Putra & Aula Pengajian",
    tempatSimpanBerkas: "Brankas Kantor Utama (Lemari A2)",
    luasTanah: 850,
    createdAt: Date.now() - 86400000 * 20
  },
  {
    id: "tanah-03",
    type: "tanah",
    jenisSertifikat: "SHGB",
    nomerSertifikat: "SHGB-351904/SARADAN/2022",
    atasNamaSertifikat: "H. Abdullah (Proses Balik Nama)",
    lokasi: "Saradan",
    penggunaan: "Lahan Produktif & Kebun Yayasan",
    tempatSimpanBerkas: "Kantor Notaris / BPN",
    luasTanah: 3200,
    sedangBalikNama: true,
    namaPemilikBaru: "Yayasan Pondok Pesantren Muttaqin Josenan",
    tanggalMulaiBalikNama: "2026-01-15",
    catatanBalikNama: "Dalam pengurusan berkas di kantor Notaris/BPN",
    progresBalikNama: [
      { id: "prog-1", tanggal: "2026-01-15", keterangan: "Pendaftaran Berkas Akta Hibah/Waqaf", biaya: 1500000 },
      { id: "prog-2", tanggal: "2026-02-10", keterangan: "Pengukuran & Pemetaan Lokasi oleh Petugas BPN", biaya: 750000 }
    ],
    createdAt: Date.now() - 86400000 * 15
  },
  {
    id: "kdr-01",
    type: "kendaraan",
    jenisKendaraan: "MOBIL",
    nomorPolisi: "AE 1928 YM",
    merk: "Toyota Avanza 1.3 G M/T",
    atasNama: "Yayasan Muttaqin Josenan Madiun",
    tahunPembuatan: 2021,
    kondisiKendaraan: "BAIK",
    penanggungJawabDaerah: "Daerah Madiun",
    tanggalBulanPajak: "18 Mei",
    createdAt: Date.now() - 86400000 * 25
  },
  {
    id: "kdr-02",
    type: "kendaraan",
    jenisKendaraan: "MOTOR",
    nomorPolisi: "AE 4582 BC",
    merk: "Honda Vario 125 CBS",
    atasNama: "Yayasan Pondok Pesantren Muttaqin",
    tahunPembuatan: 2022,
    kondisiKendaraan: "BAIK",
    penanggungJawabDaerah: "Pondok Mini",
    tanggalBulanPajak: "05 November",
    sedangDipinjam: true,
    peminjamanAktif: {
      id: "loan-01",
      peminjamName: "Ustadz Mansur",
      peminjamJabatan: "Pengurus Harian Pondok",
      peminjamKontak: "081234567890",
      tanggalPinjam: "2026-03-01",
      keperluan: "Operasional pendataan aset & safari dakwah santri",
      tanggalKembaliRencana: "2026-03-10",
      status: "DIPINJAM",
      namaPetugas: "Admin Inventaris"
    },
    createdAt: Date.now() - 86400000 * 10
  },
  {
    id: "bgn-01",
    type: "bangunan",
    namaBangunan: "Gedung Utama Pondok Pesantren Muttaqin",
    lokasi: "Taman",
    luasBangunan: 960,
    penggunaanBangunan: "Kantor Administrasi, Ruang Kelas & Asrama Santri",
    nomerPBG: "PBG-357701-20220412-001",
    nomerSLF: "SLF-357701-20220815-003",
    kondisi: "BAIK",
    keteranganKerusakan: "-",
    createdAt: Date.now() - 86400000 * 40
  },
  {
    id: "bgn-02",
    type: "bangunan",
    namaBangunan: "Gedung Aula Pertemuan & Serbaguna",
    lokasi: "Taman",
    luasBangunan: 480,
    penggunaanBangunan: "Pertemuan Wali Santri, Pengajian Akbar & Kegiatan Yayasan",
    nomerPBG: "PBG-357701-20230620-004",
    nomerSLF: "SLF-357701-20231105-002",
    kondisi: "BAIK",
    keteranganKerusakan: "-",
    createdAt: Date.now() - 86400000 * 18
  }
];
