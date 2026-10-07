export type AssetType = 'tanah' | 'kendaraan' | 'bangunan';

export type SertifikatTanahType = 'SHM' | 'WAQAF' | 'SHGB' | 'LETER C';

export interface ProgresBalikNama {
  id: string;
  tanggal: string;
  keterangan: string;
  biaya: number;
}

export interface RiwayatBalikNama {
  tanggalSelesai: string;
  atasNamaLama: string;
  nomerSertifikatLama: string;
  catatanLama?: string;
  nomorSertifikatBaru: string;
  progresDetail?: ProgresBalikNama[];
}

export interface PeminjamanBerkas {
  id?: string;
  peminjamName: string;
  peminjamJabatan: string;
  peminjamKontak: string;
  tanggalPinjam: string;
  keperluan: string;
  tanggalKembaliRencana?: string;
  tanggalKembaliRiil?: string;
  status: 'DIPINJAM' | 'DIKEMBALIKAN';
  namaPetugas: string;
  fotoPinjam?: string;
  fotoKembali?: string;
}

export interface AsetTanah {
  id: string;
  type: 'tanah';
  jenisSertifikat: SertifikatTanahType;
  nomerSertifikat: string;
  atasNamaSertifikat: string;
  lokasi: string;
  penggunaan: string;
  tempatSimpanBerkas: string;
  koordinatGoogleMaps?: string;
  luasTanah?: number; // luas tanah dlm m2
  createdAt: number;
  sedangBalikNama?: boolean;
  namaPemilikBaru?: string;
  catatanBalikNama?: string;
  tanggalMulaiBalikNama?: string;
  progresBalikNama?: ProgresBalikNama[];
  riwayatBalikNama?: RiwayatBalikNama[];
  sedangDipinjam?: boolean;
  peminjamanAktif?: PeminjamanBerkas;
  riwayatPeminjaman?: PeminjamanBerkas[];
}

export type JenisKendaraanType = 'MOTOR' | 'MOBIL' | 'ELF' | 'BUS';

export type KondisiType = 'BAIK' | 'RUSAK RINGAN' | 'RUSAK BERAT';

export interface AsetKendaraan {
  id: string;
  type: 'kendaraan';
  jenisKendaraan: JenisKendaraanType;
  nomorPolisi: string;
  merk: string;
  atasNama: string;
  tahunPembuatan: number;
  kondisiKendaraan: KondisiType;
  tanggalBulanPajak?: string; // Tanggal & Bulan Pajak
  penanggungJawabDaerah?: string; // Penanggung Jawab Daerah Dropdown (Desa / Kelompok)
  createdAt: number;
  sedangBalikNama?: boolean;
  namaPemilikBaru?: string;
  catatanBalikNama?: string;
  tanggalMulaiBalikNama?: string;
  progresBalikNama?: ProgresBalikNama[];
  riwayatBalikNama?: RiwayatBalikNama[];
  sedangDipinjam?: boolean;
  peminjamanAktif?: PeminjamanBerkas;
  riwayatPeminjaman?: PeminjamanBerkas[];
}

export const DAERAH_LIST = [
  'Daerah Madiun',
  'Pondok Mini',
  'Desa Taman',
  'Desa Mentawai',
  'Desa Caruban',
  'Desa Gilis',
  'Desa Manisrejo',
  'Kelompok Taman',
  'Kelompok Josenan',
  'Kelompok Sawojajar',
  'Kelompok Dolopo',
  'Kelompok Kertosari',
  'Kelompok Sambirejo',
  'Kelompok Meteseh',
  'Kelompok Segulung',
  'Kelompok Blimbing',
  'Kelompok Mentawai',
  'Kelompok Kebonagung',
  'Kelompok Ngampel',
  'Kelompok Syarekah',
  'Kelompok Winongo',
  'Kelompok Jiwan',
  'Kelompok Karanganyar',
  'Kelompok Manding',
  'Kelompok Maroon',
  'Kelompok Wonoasri',
  'Kelompok Kuwu',
  'Kelompok Sekar Petak',
  'Kelompok Kedung Rejo',
  'Kelompok Pajaran',
  'Kelompok Sumber Bendo',
  'Kelompok Gablokan',
  'Kelompok Winong',
  'Kelompok Mbadur',
  'Kelompok Sukorejo',
  'Kelompok Gilis Barat',
  'Kelompok Gilis Timur',
  'Kelompok Mranggen',
  'Kelompok Manisrejo',
  'Kelompok Kartoharjo',
  'Kelompok Munggut',
  'Kelompok Ngrowo',
  'Kelompok Randu Alas'
];

export interface AsetBangunan {
  id: string;
  type: 'bangunan';
  namaBangunan: string;
  lokasi: string;
  luasBangunan: number; // in m2
  koordinatGoogleMaps?: string;
  penggunaanBangunan: string;
  nomerPBG: string;
  nomerSLF: string;
  kondisi: KondisiType;
  keteranganKerusakan: string;
  createdAt: number;
  sedangBalikNama?: boolean;
  namaPemilikBaru?: string;
  catatanBalikNama?: string;
  tanggalMulaiBalikNama?: string;
  progresBalikNama?: ProgresBalikNama[];
  riwayatBalikNama?: RiwayatBalikNama[];
  sedangDipinjam?: boolean;
  peminjamanAktif?: PeminjamanBerkas;
  riwayatPeminjaman?: PeminjamanBerkas[];
}

export type Asset = AsetTanah | AsetKendaraan | AsetBangunan;

export interface SyncPayload {
  assets: Asset[];
}

export const KECAMATAN_MADIUN = [
  // Kabupaten Madiun
  'Balerejo',
  'Dagangan',
  'Dolopo',
  'Geger',
  'Gemarang',
  'Jiwan',
  'Kare',
  'Kebonsari',
  'Mejayan',
  'Madiun',
  'Pilangkenceng',
  'Saradan',
  'Sawahan',
  'Wonoasri',
  'Wungu',
  // Kota Madiun
  'Kartoharjo',
  'Manguharjo',
  'Taman'
];

export interface PembayaranTahunPbb {
  tahun: number;
  lunas: boolean;
  tanggalBayar?: string;
  nominalBayar?: number;
  keterangan?: string;
}

export interface SpptPbbRecord {
  id: string;
  namaWajibPajak: string;
  lokasi: string;
  nop: string;
  pajakTerutang: number;
  totalBayarYayasanTahunan: number;
  riwayatPembayaran: Record<number, PembayaranTahunPbb>;
  keteranganTambahan?: string;
  createdAt: number;
  updatedAt: number;
}

