# Supabase dan Vercel — langkah setelah source di-push

## 1. Supabase: satu kali jalankan SQL

1. Buka project Supabase milik sendiri. Gunakan Project URL dari dashboard, bukan alamat project lama yang tidak aktif.
2. Buka **SQL Editor → New query**.
3. Salin seluruh isi **backend/database/setup-and-seed.supabase.sql**, lalu Run.
4. Pada project kosong hasil akhir harus menunjukkan **film = 6** dan **serial = 4**. Tabel genres dan titles akan muncul di Table Editor.

File SQL sudah memuat schema, foreign key, index, RLS dan 10 judul fiktif. Boleh dijalankan ulang: ID yang sudah ada tidak diubah atau dihapus. File ini tidak berisi key. Jangan mematikan RLS atau memberi akses write publik.

### Login dan rak per akun

Untuk project baru maupun yang katalog/storage-nya sudah aktif:

1. Jalankan seluruh **backend/database/accounts.supabase.sql** di **SQL Editor**.
   File membuat `user_libraries`, foreign key ke `auth.users`, dan RLS pemilik.
   Aman dijalankan ulang; tidak menghapus katalog atau data akun.
2. Di **Authentication → Sign In / Providers → Email**, pastikan
   **Enable Email provider** aktif dan matikan **Confirm email**, lalu **Save**.
   Dengan pengaturan ini, daftar langsung menghasilkan sesi login tanpa
   membuka email. Tidak perlu SQL untuk membuat atau mengonfirmasi akun.
   Konsekuensi: kepemilikan alamat email tidak diverifikasi. Pengaturan Auth
   harus diubah lewat dashboard/Management API, bukan service-role Data API key.
3. Bila Confirm email masih aktif, Supabase tetap meminta konfirmasi; aplikasi
   tidak memalsukan sesi atau melewati kebijakan Auth memakai admin key.
4. Restart backend lokal atau redeploy backend Vercel, lalu jalankan/redeploy
   frontend dari source yang sama. Environment tetap `DB_DRIVER=supabase`,
   `SUPABASE_URL`, dan `SUPABASE_SERVICE_ROLE_KEY`; tidak ada key baru di frontend.

Aplikasi pertama kali membuka katalog sebagai **guest**, bukan layar login.
Profil guest menampilkan **Masuk / Daftar**; menekan simpan/watchlist meminta
login. Guest tidak mengirim permintaan library, tidak menyimpan rak/watchlist,
dan tidak bisa memberi rating, reaksi atau status ditonton. Login dapat dibatalkan
melalui **Kembali ke katalog** tanpa kehilangan posisi jelajah.

Uji dengan dua email: akun A menambah film dan rak, keluar kembali menjadi guest,
akun B harus kosong; masuk lagi sebagai A harus mengembalikan koleksinya.
Status ditonton, rating, dan reaksi ikut dipisahkan. Katalog dan kontribusi
judul tetap bersama. Sesi yang masih aktif dipulihkan pada pembukaan berikutnya.
Data AsyncStorage lama tanpa pemilik tidak diimpor otomatis ke akun pertama.
Perubahan disimpan online, dengan pesan gagal dan tombol **Simpan ulang**;
keluar akun menunggu penyimpanan berhasil. Pada dua perangkat yang mengedit akun
sama bersamaan, penyimpanan terakhir menjadi isi rak akun.

Jika muncul **Perpustakaan belum tersedia**, pastikan SQL akun dijalankan pada
project yang sama dengan `SUPABASE_URL` backend. Secret key Data API tidak
memberi akses DDL/SQL Editor; bila tidak tersedia koneksi PostgreSQL atau akses
dashboard, SQL ini harus dijalankan pemilik project.

## 2. Letakkan URL dan key hanya pada backend

Untuk uji backend di laptop, isi **backend/.env** (bukan .env root aplikasi):

```dotenv
DB_DRIVER=supabase
PORT=5002
HOST=0.0.0.0
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_ISI_SECRET_KEY_PROJECT_ANDA
ADMIN_API_KEY=KUNCI_ADMIN_ACAK_YANG_ANDA_SIMPAN_SENDIRI
```

Project URL tersedia pada Connect/pengaturan Data API. Dari Settings → API Keys, gunakan **Secret key** berawalan **sb_secret_**. Masukkan nilainya pada variabel **SUPABASE_SERVICE_ROLE_KEY**; nama variabel ini dipertahankan untuk kompatibilitas kode backend. Secret key modern mengakses database melalui role service_role. Bila project masih memakai key lama, legacy service_role key juga kompatibel, tetapi Supabase menyarankan migrasi ke secret key modern. Jangan gunakan publishable/anon key di variabel ini.

Jangan menaruh service_role key atau ADMIN_API_KEY di app.json, catalog.js, SQL, EXPO_PUBLIC_*, source frontend, atau GitHub. Jangan mengirimkannya lewat screenshot. .env sudah diabaikan Git.

SQL sudah mengisi data, sehingga npm run seed tidak wajib. Untuk memeriksa dari root project:

```powershell
npm run api
# Di terminal lain:
npm run api:check -- http://localhost:5002/api
```

Output pemeriksaan harus menyebut **Live API check passed (supabase)**.

## 3. Deploy backend sendiri ke Vercel

1. Import repository **RekaFakhrezi/CineShelf**.
2. Pilih **Root Directory = backend**, **Framework Preset = Other**.
3. Jangan mengatur output directory frontend. Tidak perlu custom build command frontend; gunakan default backend.
4. Tambahkan environment variables untuk Production: DB_DRIVER=supabase, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_API_KEY. Isi key yang sama dengan project Anda. PORT/HOST tidak diperlukan pada serverless Vercel.
5. Deploy. Bila variabel diubah setelah deploy, lakukan Redeploy.
6. Buka **https://DOMAIN_ANDA/api/health**. Harus ada status=ok, service=cineshelf-api dan database=supabase.
7. Dari laptop jalankan: **npm run api:check -- https://DOMAIN_ANDA/api**. Ini membaca setiap item film/serial dan detailnya tanpa mengubah data.

Backend memakai backend/vercel.json dan entry backend/api/index.js. SQLite ditolak pada Vercel karena data file lokal tidak persisten.

## 4. Sambungkan aplikasi / APK

Buka **Profil → Ganti Sumber / Sambungkan API**, isi **https://DOMAIN_ANDA/api**, lalu **Uji & Hubungkan ke API**. URL tersimpan di perangkat. Tidak perlu rebuild APK ketika URL diganti.

Jika ingin URL default untuk build berikutnya, isi hanya URL publik API pada **.env root**:

```dotenv
EXPO_PUBLIC_API_URL=https://DOMAIN_ANDA/api
```

Restart Expo/rebuild agar nilai default berubah. Pengaturan URL yang sudah tersimpan di perangkat lebih diutamakan. Tidak ada key database pada aplikasi.

## 5. Uji lokal sebelum deployment (opsional)

Dari root: **npm run api:local**. Ini memaksa SQLite secara eksplisit tanpa mengubah .env Supabase. Server berjalan pada port PORT (default 5002). Jalankan **npm run api:check** di terminal kedua.

Untuk Expo Go, HP dan laptop berada di Wi-Fi yang sama. Masukkan URL LAN yang dicetak terminal, misalnya http://IP_LAPTOP:5002/api. Jangan pakai localhost dari HP.

APK standalone mempertahankan kebijakan HTTPS. Gunakan URL Vercel HTTPS untuk API pada APK. Mode demo tersedia untuk melihat UI sebelum backend online, tetapi mode demo bukan bukti syarat API.

Referensi resmi: [jenis API key Supabase](https://supabase.com/docs/guides/getting-started/api-keys), [Express di Vercel](https://vercel.com/docs/frameworks/backend/express), [environment variables Vercel](https://vercel.com/docs/environment-variables).

## Alamat utama backend dan tampilan aplikasi

Deployment dengan Root Directory backend hanya menyediakan API. Alamat utama diarahkan ke /api/health, bukan halaman aplikasi. Framework di vercel.json ditetapkan null agar memakai handler API eksplisit. Jika /api/health dan api:check berhasil tetapi / menampilkan FUNCTION_INVOCATION_FAILED, jangan mengganti key Supabase yang sudah valid; push perubahan konfigurasi ini lalu Redeploy. Penyebab internal function sebelumnya memerlukan runtime log Vercel untuk dipastikan.

Untuk menjalankan tampilan di terminal IDE, dari root cineshelf gunakan npm run web (browser) atau npm start (Expo Go). Jalankan npm run api pada terminal terpisah jika memakai backend laptop. npm expo run bukan perintah npm yang valid. Untuk build Android lokal gunakan npm run android hanya bila Android SDK/emulator sudah disiapkan.

Tampilan web dapat dideploy sebagai project Vercel kedua: Root Directory cineshelf/root repo, Framework Other, Build Command npx expo export --platform web, Output Directory dist, dan EXPO_PUBLIC_API_URL=https://cine-shelf-sigma.vercel.app/api. Jangan menyalin secret key ke project frontend.

Konfigurasi frontend disimpan pada vercel.json root: framework=null (Other), buildCommand=npx expo export --platform web, outputDirectory=dist. Ini mencegah build frontend Expo diproses sebagai Express. Jika log sudah Exported: dist lalu No entrypoint found which imports express, pastikan deployment frontend memakai commit yang memuat file root ini dan Root Directory adalah root repository. backend/vercel.json hanya untuk project API dengan Root Directory backend.

Fitur tambah judul dengan cover: lihat docs/CONTRIBUTIONS.md. Bucket cineshelf-covers harus private; backend membuat signed URL saat katalog dibaca. Untuk project baru jalankan backend/database/storage.supabase.sql atau npm --prefix backend run setup:storage. Deploy backend dan frontend dari commit fitur yang sama.

## Instalasi web di HP

Frontend menyertakan `public/index.html`, `public/manifest.webmanifest`, dan ikon
192/512 piksel dari logo CineShelf. Expo menyalinnya ke `dist` saat export;
build command Vercel tetap sama. Deploy ulang **project frontend** agar perubahan
tersedia di domain publik; restart backend tidak diperlukan.

Buka domain frontend HTTPS di Chrome Android, muat ulang halaman, lalu pilih
**Instal aplikasi** pada menu Chrome. Manifest menggunakan `display: standalone`
agar hasil instalasi terbuka tanpa address bar. Ini instalasi web, bukan APK;
katalog API dan login tetap memerlukan internet. Tidak ada service worker/cache
offline tambahan yang dapat menahan versi frontend lama.

Layout web menggunakan `100dvh` dengan fallback `100%`: tinggi aplikasi mengikuti
address bar browser saat muncul/hilang, sementara scroll tetap di `ScrollView`.
Uji Beranda dan Profil sampai bawah, termasuk setelah address bar berubah dan
rotasi layar; navbar harus tetap di tepi bawah tanpa menutup konten terakhir.
