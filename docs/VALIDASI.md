# Hasil validasi CineShelf — 22 November 2026

## Aplikasi dan API

- npm test: 7 tes lulus (client, request lifecycle, roulette, reduced motion).
- npm run test:api: 12 tes backend lulus (CRUD, validasi, authorization, persistensi SQLite).
- npm run check:bundle: bundle Android dan web berhasil.
- npx expo install --check: dependensi sesuai Expo SDK 54.
- npm run api:check -- http://localhost:5003/api: 6 item film dan 4 serial beserta seluruh detail berhasil dibaca melalui server Express lokal.
- Browser: mode API benar-benar diaktifkan; list Film → detail dan Serial → detail berhasil. Profil/About diperiksa pada layar 375 px; bottom navigation tersedia juga pada desktop.

## APK

- Gradle :app:assembleRelease menghasilkan app-release.apk dari salinan source dengan path pendek di Windows.
- ABI: arm64-v8a dan x86_64. Kunci debug digunakan untuk instalasi internal tugas, bukan Play Store.
- JavaScript dan aset dibundel di dalam APK; tidak memerlukan Metro untuk membuka aplikasi.
- SHA-256: 4fbf68592c356f951e168f948173cfb2e9d3bd0375e6a9ca28d7c3fe1ef1573e
- File APK tidak di-commit ke source repository. Hasilnya diserahkan terpisah.
- Belum dipasang pada HP fisik; tidak ada perangkat ADB yang tersambung saat pemeriksaan.

## Supabase dan Vercel

Sesuai permintaan pemilik project, setup database cloud dan deployment dilakukan sendiri kemudian. SQL schema + seed yang idempotent ada di backend/database/setup-and-seed.supabase.sql. Petunjuk key backend dan konfigurasi Vercel ada di docs/DEPLOYMENT.md. Tes otomatis/live di atas memakai SQLite lokal, bukan bukti Supabase sudah tersambung.

## Administrasi

Asistensi, pendaftaran/keunikan judul dan pencantuman link repo pada form resmi harus dipenuhi pemilik project. Dokumen ini bukan bukti asistensi.
