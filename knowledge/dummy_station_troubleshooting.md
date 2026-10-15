# Dummy Knowledge: Troubleshooting AWS Delay

Dokumen ini adalah data dummy untuk uji integrasi Cognee RAG pada platform monitoring stasiun.

## Kasus
Jika status stasiun AWS berubah menjadi **DELAY** lebih dari 120 menit.

## Langkah Diagnostik
1. Verifikasi koneksi jaringan perangkat (ping gateway lokal).
2. Cek catu daya utama dan backup (indikator baterai/UPS).
3. Pastikan logger masih mengirim data periodik sesuai `interval_detected`.
4. Bandingkan `last_observed_at` vs `last_ingested_at` untuk mendeteksi bottleneck ingest.
5. Jika data sensor ada tapi tidak masuk ke server, eskalasi ke tim integrasi data.

## Kriteria Eskalasi
- Jika DELAY > 2 jam dan tidak ada data baru: eskalasi level 1.
- Jika DELAY > 6 jam: eskalasi level 2 + notifikasi supervisor regional.
- Jika DELAY > 24 jam: buat tiket insiden mayor.

## Tindakan Pemulihan
- Restart modem/router lapangan.
- Sinkronisasi waktu perangkat (NTP).
- Restart logger jika konektivitas normal namun data tidak terkirim.
- Validasi 3 payload observasi terakhir setelah pemulihan.

## Catatan
Ini hanya dokumen dummy untuk pengujian RAG.
