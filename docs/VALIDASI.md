# Hasil validasi versi 0.2.0

Diverifikasi ulang pada 13 November 2026 di Windows dengan Node.js 24.13.1,
sebelum commit pertama prototype. Tes integrasi membutuhkan akses localhost.

- `npm run test:api`: 12 pengujian lolos.
- `npm test`: 5 pengujian client/hook lolos.
- `npm run check:bundle`: bundle Android dan Web berhasil.
- package-lock sesuai nama/versi package.json.

Pengujian API memakai server HTTP Express sungguhan dan database SQLite.
Client aplikasi yang sama diuji terhadap server tersebut. Kasus mencakup
list/detail, pencarian, filter, paginasi, CRUD, validasi, penolakan admin key,
watchlist resolve, persistensi sesudah restart, error jaringan, pembatalan
request lama dan retry.

Belum diverifikasi pada project Supabase cloud, deployment Vercel sungguhan,
APK terinstal, atau HP fisik. Berkas konfigurasi untuk langkah tersebut disertakan.
Tautan Expo Snack versi terdahulu masih merupakan prototipe sebelumnya; source
versi 0.2.0 yang lengkap ada pada paket ini.
