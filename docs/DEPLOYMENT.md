# Supabase dan Vercel — langkah setelah source di-push

## 1. Supabase: satu kali jalankan SQL

1. Buka project Supabase milik sendiri. Gunakan Project URL dari dashboard, bukan alamat project lama yang tidak aktif.
2. Buka **SQL Editor → New query**.
3. Salin seluruh isi **backend/database/setup-and-seed.supabase.sql**, lalu Run.
4. Pada project kosong hasil akhir harus menunjukkan **film = 6** dan **serial = 4**. Tabel genres dan titles akan muncul di Table Editor.

File SQL sudah memuat schema, foreign key, index, RLS dan 10 judul fiktif. Boleh dijalankan ulang: ID yang sudah ada tidak diubah atau dihapus. File ini tidak berisi key. Jangan mematikan RLS atau memberi akses write publik.

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
