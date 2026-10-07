import { Asset } from "../types";

export function exportToCSV(assets: Asset[], type: 'tanah' | 'kendaraan' | 'bangunan'): string {
  if (type === 'tanah') {
    const headers = [
      "No",
      "Jenis Sertifikat",
      "Nomor Sertifikat",
      "Atas Nama Sertifikat",
      "Lokasi",
      "Luas Tanah (m2)",
      "Penggunaan",
      "Tempat Simpan Berkas",
      "Tanggal Input"
    ];
    
    const rows = assets
      .filter(a => a.type === 'tanah')
      .map((a, idx) => {
        const t = a as any;
        return [
          idx + 1,
          t.jenisSertifikat || '',
          t.nomerSertifikat || '',
          t.atasNamaSertifikat || '',
          t.lokasi || '',
          t.luasTanah || '',
          t.penggunaan || '',
          t.tempatSimpanBerkas || '',
          new Date(t.createdAt).toLocaleDateString('id-ID')
        ];
      });

    return [headers, ...rows]
      .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");
  } else if (type === 'kendaraan') {
    const headers = [
      "No",
      "Jenis Kendaraan",
      "Nomor Polisi",
      "Merk",
      "Atas Nama",
      "Tahun Pembuatan",
      "Kondisi Kendaraan",
      "Tanggal Input"
    ];

    const rows = assets
      .filter(a => a.type === 'kendaraan')
      .map((a, idx) => {
        const k = a as any;
        return [
          idx + 1,
          k.jenisKendaraan || '',
          k.nomorPolisi || '',
          k.merk || '',
          k.atasNama || '',
          k.tahunPembuatan || '',
          k.kondisiKendaraan || '',
          new Date(k.createdAt).toLocaleDateString('id-ID')
        ];
      });

    return [headers, ...rows]
      .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");
  } else {
    // Bangunan
    const headers = [
      "No",
      "Nama Bangunan",
      "Lokasi",
      "Luas Bangunan (m2)",
      "Penggunaan Bangunan",
      "Nomor PBG",
      "Nomor SLF",
      "Kondisi",
      "Keterangan Kerusakan",
      "Tanggal Input"
    ];

    const rows = assets
      .filter(a => a.type === 'bangunan')
      .map((a, idx) => {
        const b = a as any;
        return [
          idx + 1,
          b.namaBangunan || '',
          b.lokasi || '',
          b.luasBangunan || '0',
          b.penggunaanBangunan || '',
          b.nomerPBG || '-',
          b.nomerSLF || '-',
          b.kondisi || '',
          b.keteranganKerusakan || '-',
          new Date(b.createdAt).toLocaleDateString('id-ID')
        ];
      });

    return [headers, ...rows]
      .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");
  }
}

export function downloadCSVFile(content: string, filename: string) {
  const blob = new Blob(["\uFEFF" + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
