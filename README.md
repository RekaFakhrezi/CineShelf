# CineShelf — React Native + API

Aplikasi katalog film dan serial untuk Tugas Akhir Praktikum PPB. Tampilan gelap,
7 halaman, dua list utama beserta detail, pencarian/filter, paginasi, dan watchlist.
Versi 0.2.0 menambahkan REST API Express, database, dan integrasi fetch.

## Jalankan pertama kali (laptop + HP)

Gunakan **Node.js 22.13 atau lebih baru**. Backend dan Metro dijalankan di laptop;
HP Android dan laptop berada pada Wi-Fi yang sama.

### 1. Backend — terminal pertama

Buka folder `cineshelf`, lalu:

```bash
cd backend
npm ci
npm run setup
npm start
```

Database SQLite dibuat dan diisi 10 judul contoh otomatis. Tidak perlu akun
cloud untuk mencoba. Terminal menampilkan URL **untuk HP**, misalnya
`http://192.168.1.10:5002/api`. Biarkan terminal tetap menyala.

Buka `http://localhost:5002/api/health` di laptop. Respons yang benar memiliki
`status: "ok"`, `service: "cineshelf-api"`, dan `database: "sqlite"`.

### 2. Aplikasi — terminal kedua, dari folder `cineshelf`

```bash
npm ci
npx expo start
```

Buka menggunakan **Expo Go yang mendukung SDK 54**. Unduhan kompatibel Android
tersedia dari https://expo.dev/go (pilih SDK 54). Scan QR di terminal.
Untuk pratinjau browser laptop, jalankan `npm run web`.

### 3. Sambungkan aplikasi ke backend

Aplikasi mencoba mendeteksi IP laptop dari Metro. Jika katalog belum muncul,
tekan **Atur koneksi**, masukkan URL yang dicetak backend, lalu tekan
**Uji dan hubungkan**. Menu yang sama ada di **Profil → Sumber katalog**.
URL tersimpan pada perangkat; tidak perlu mengubah source setiap kali IP berganti.

Alternatif: isi `EXPO_PUBLIC_API_URL` pada `.env` root mengikuti `.env.example`,
lalu restart Metro. Pengaturan yang sebelumnya disimpan lewat aplikasi tetap
lebih diutamakan; ubah melalui Profil bila perlu.

**Jangan memakai localhost/127.0.0.1 sebagai alamat laptop dari HP.** Alamat itu
merujuk ke HP sendiri. Izinkan Node.js pada jaringan privat jika Windows Firewall
memblokir. Tunnel Expo hanya membantu koneksi Metro, bukan otomatis backend.

## Mode API dan mode demo

- **API (default):** beranda, daftar, detail, pencarian, genre dan resolusi watchlist
  memakai web service sendiri. Loading, error, retry, dan pembatalan request
  disediakan. Tidak ada fallback otomatis ke data contoh ketika API gagal.
- **Demo:** dipilih sendiri melalui Sumber katalog → Coba mode demo. Memakai
  `catalog.js` lokal. Mode ini diberi label dan bukan bukti integrasi API.
- Watchlist menyimpan ID secara lokal dengan AsyncStorage, bukan akun cloud.
  Detail judul di mode API tetap diambil dari backend. Tidak ada login/streaming.

Data seed berisi 6 film dan 4 serial fiktif; judul, rating, pemeran, dan episode
adalah contoh. Foto ilustrasi dari Unsplash, bukan poster resmi film.

## Supabase — mengikuti Modul 1

Struktur Node.js + Express + model/controller/router + `.env` mengikuti Modul 1.
SQLite adalah jalur tambahan untuk uji lokal. Untuk memakai Supabase:

1. Siapkan project Supabase sendiri.
2. Jalankan `backend/database/schema.supabase.sql` di SQL Editor.
3. Ubah `backend/.env`:

```dotenv
DB_DRIVER=supabase
SUPABASE_URL=https://PROJECT_KAMU.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ISI_DI_FILE_LOKAL_SENDIRI
```

4. Dari folder backend jalankan `npm run seed`, lalu `npm start`.
5. Pastikan `/api/health` menunjukkan `database: "supabase"` dan uji list/detail.

Seed tidak menimpa ID yang sudah ada. Service-role key hanya dipakai backend;
frontend hanya mengetahui URL API. Tabel mengaktifkan RLS tanpa kebijakan write
publik. API tetap buatan sendiri: aplikasi menghubungi Express, bukan Supabase
langsung. Operasi tulis katalog memakai ADMIN_API_KEY yang dibuat oleh setup.

## Pengujian dan Postman

Sesudah dependensi frontend dan backend terpasang, dari root:

```bash
npm run test:api
npm test
npm run check:bundle
```

Impor `docs/CineShelf.postman_collection.json` ke Postman. Isi `base_url` dan
`admin_api_key` (nilai dari backend/.env lokal). Koleksi berisi GET, POST, PUT,
DELETE; ID hasil POST disimpan agar pengujian update/delete tidak menyasar seed.
Admin key tidak perlu diisi di aplikasi mobile.

## Deployment backend (opsional untuk uji LAN)

Untuk akses HP dari jaringan berbeda tanpa laptop, backend harus online.
Konfigurasi Vercel tersedia di `backend/vercel.json` dan `backend/api/index.js`.

1. Unggah source ke GitHub, lalu import repository di Vercel.
2. Pilih **Root Directory: backend**, preset Other, tanpa perintah build/output
   frontend khusus.
3. Isi env `DB_DRIVER=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, dan
   `ADMIN_API_KEY`. Jalankan SQL dan seed terlebih dahulu.
4. Deploy, lalu uji `https://DOMAIN_API/api/health`.
5. Masukkan `https://DOMAIN_API/api` di Sumber katalog aplikasi.

SQLite sengaja ditolak pada Vercel karena file database lokal tidak cocok untuk
persistensi serverless. Konfigurasi deployment disediakan, tetapi belum dideploy
ke akun cloud. Adapter Supabase belum diuji dengan project cloud sungguhan.

## GitHub

Repository: [RekaFakhrezi/CineShelf](https://github.com/RekaFakhrezi/CineShelf).
Commit pertama berisi prototype versi 0.2.0 (aplikasi, backend, tes, dan dokumentasi).
`.gitignore` mengecualikan `.env`, database lokal, node_modules, dan kredensial.

Untuk mengambil source di komputer lain:

```bash
git clone https://github.com/RekaFakhrezi/CineShelf.git
cd CineShelf
```

Lanjutkan langkah **Jalankan pertama kali** di atas. Folder root hasil clone
bernama `CineShelf`; perintah yang menyebut root `cineshelf` dijalankan di folder ini.

## APK (tambahan nilai)

`eas.json` berisi profil preview untuk APK. Dari root:

```bash
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android --profile preview
```

Gunakan backend **HTTPS** untuk APK. Atur URL lewat Profil setelah instalasi atau
variabel `EXPO_PUBLIC_API_URL` di environment build Expo. Backend lokal HTTP
belum dikonfigurasi untuk cleartext pada APK release. Akun/proyek Expo, pilihan
kredensial Android, kuota build, dan pengujian APK fisik belum dilakukan. File APK
belum termasuk paket ini; build bundle Metro bukan APK.

## Struktur utama

```text
App.js                        UI dan navigasi
catalog.js                    dataset demo opsional
src/services/api.js           client REST API + timeout
src/services/config.js        deteksi URL default
src/hooks/useRequest.js        lifecycle request dan pembatalan
backend/src/config/           koneksi SQLite / Supabase
backend/src/models/           akses database
backend/src/controllers/      logika endpoint
backend/src/routes/           pemetaan URL dan method
backend/src/middleware/        validasi, admin key, error
backend/database/             schema SQL dan seed
backend/tests/                tes API integrasi
backend/api/index.js          entry serverless
```

Petunjuk demo: `docs/ASISTENSI.md`. Kontrak API: `docs/API.md`.
