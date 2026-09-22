# Dummy Knowledge: SOP Reset Logger

Dokumen ini adalah data dummy untuk uji ingest knowledge markdown ke Cognee.

## Tujuan

Menjelaskan langkah operasional dasar saat perlu melakukan reset logger pada stasiun.

## Prasyarat

- Pastikan catu daya stabil.
- Pastikan perangkat modem dan jaringan lokal aktif.
- Siapkan backup konfigurasi logger jika tersedia.

## Langkah Reset

1. Catat waktu mulai gangguan dan identitas stasiun.
2. Periksa indikator daya pada logger.
3. Pastikan koneksi jaringan tidak sedang putus total.
4. Lakukan backup konfigurasi jika fitur backup tersedia.
5. Restart logger sesuai prosedur perangkat.
6. Tunggu proses boot selesai sepenuhnya.
7. Validasi minimal 3 payload terakhir setelah logger aktif kembali.

## Validasi Pasca Reset

- Pastikan timestamp data baru terus bertambah.
- Pastikan data berhasil diterima server.
- Pastikan status realtime tidak lagi OFF, DELAY, atau NO DATA.

## Eskalasi

- Jika logger tidak menyala setelah reset, eskalasi ke teknisi lapangan.
- Jika logger aktif tetapi data belum masuk ke server, eskalasi ke tim integrasi data.

Dokumen ini hanya untuk pengujian knowledge base.
