# Tambah film dan serial dengan foto

## Menggunakan fitur

Pada Beranda, Film, Serial, atau Watchlist dalam mode API, tekan tombol + melayang di kanan bawah, di atas navigasi. Pilih Film atau Serial, pilih foto, lalu isi judul, genre, tahun rilis, durasi/jumlah episode, dan sinopsis. Pemeran, sutradara, tagline, rating awal, dan batas usia tersedia pada Detail tambahan.

Tekan Simpan ke katalog. Setelah berhasil, aplikasi membuka detail judul yang baru disimpan dan memuat ulang katalog. Judul masuk ke katalog bersama; belum ada akun atau kepemilikan per pengguna. Pengguna dapat menambah tanpa ADMIN_API_KEY. Edit/hapus melalui endpoint admin yang sudah ada tetap memerlukan key backend. Fitur form ini hanya menambahkan judul.

Foto mendukung JPG, PNG, dan WebP maksimal 2 MB. Pemeriksaan format, ukuran, dan metadata dilakukan lagi oleh backend. Submit dikunci saat pengiriman agar klik ganda tidak mengirim dua permintaan bersamaan. Jika gagal, form tetap menyimpan isian agar dapat diperbaiki atau dicoba lagi.

## Penyimpanan Supabase

Bucket cineshelf-covers sudah dibuat pada project Supabase yang terhubung ke backend/.env dan telah diverifikasi private. Tidak ada secret key pada frontend. Tidak diperlukan environment variable tambahan untuk bucket ini.

Alurnya: aplikasi → POST /api/contributions → backend mengunggah foto → database titles menyimpan judul dan lokasi cover. Jika database gagal setelah upload, backend mencoba menghapus foto yang baru diunggah. Saat daftar/detail dibaca, backend membuat signed URL untuk foto private dengan masa berlaku satu jam. Memuat ulang katalog/detail memperbarui URL; URL lama dapat kedaluwarsa bila aplikasi dibiarkan terbuka lebih dari satu jam.

Untuk project Supabase baru, jalankan backend/database/storage.supabase.sql melalui SQL Editor, atau dari root project:

```powershell
npm --prefix backend run setup:storage
```

Script memakai konfigurasi backend/.env. Bucket tetap private; tidak ada policy upload anonymous pada storage.objects. Jangan mengubah bucket menjadi public untuk fitur ini.

## Memperbarui deployment

Push commit terbaru ke GitHub. Pastikan **kedua project Vercel** memakai source terbaru:

- Backend: Root Directory backend; konfigurasi Supabase yang sudah bekerja tetap dipakai.
- Frontend: root repo; build npx expo export --platform web; output dist; EXPO_PUBLIC_API_URL mengarah ke backend Vercel dengan akhiran /api.

Backend lama tidak memiliki /api/contributions. Jika muncul Endpoint tidak ditemukan ketika menyimpan, periksa versi deployment backend terlebih dahulu.

Untuk lokal, restart API setelah source berubah dan jalankan ulang Expo bila pemilih foto belum dikenali. Pada sesi pengujian, frontend berjalan di localhost:8088 dan backend perubahan di localhost:5004/api. Mode SQLite/offline tidak mengunggah ke Supabase. APK lama perlu dibangun ulang untuk memuat modul native expo-image-picker; bundle Android berhasil diperiksa, tetapi APK baru belum dibuat pada perubahan ini.

## Skeleton Beranda

HomeSkeleton sekarang memakai HeroBannerCarousel, CineRouletteCard, dan Shelf yang sama dengan Beranda, dalam keadaan loading. Urutannya: hero → indikator titik → kartu suasana/roulette → rak film → rak serial. Tombol dan poster mengikuti ukuran komponen aslinya. Animasi skeleton mengikuti preferensi reduced motion.

Uji browser 393×852 menunjukkan tinggi hero 579.359375 px dan posisi atas indikator titik 647.359375 px, sama pada skeleton maupun hasil data selesai dimuat.

## Validasi 23 November 2026

- 9 tes aplikasi lulus, termasuk form, validasi, data foto, serial, dan pencegahan klik ganda.
- 17 tes API lulus, termasuk kontribusi, validasi file, pembersihan foto jika database gagal, pembaruan signed URL, dan pembatasan percobaan.
- Uji Supabase asli untuk film dan serial berhasil: database tersimpan, detail terbaca, foto signed URL HTTP 200, dan akses foto tanpa signed URL ditolak.
- Baris serta foto sementara yang dibuat pengujian tersebut sudah dibersihkan; katalog awal tetap berisi 6 film dan 4 serial.
- Bundle web dan Android berhasil. Form dan tombol melayang diperiksa di browser ukuran HP.
- Alat browser otomatis macet saat memasukkan file lokal ke pemilih foto. Uji form memakai pemilih terkontrol, sedangkan file asli diuji langsung melalui API; pemilihan galeri sampai simpan pada HP fisik belum diverifikasi.

Endpoint tambah ini terbuka untuk katalog bersama. Batas percobaan saat ini lima permintaan per alamat koneksi per 10 menit pada setiap proses backend, bukan limiter terpusat antar-instance Vercel. Autentikasi, moderasi, serta pembatasan terpusat menjadi pengembangan berikutnya jika aplikasi dipakai lebih luas.

## Rollback

Jalankan Rollback-CineShelf-add-title.ps1 untuk mengembalikan source sebelum fitur tambah dan penyesuaian skeleton. Script memeriksa hash agar tidak menimpa edit berikutnya. Setelah rollback, jalankan npm install untuk menyamakan node_modules dengan lockfile, lalu restart Expo/API.

Rollback source tidak menghapus bucket atau film/foto yang sudah ditambahkan pengguna, tidak mengubah .env, dan tidak mengubah deployment publik. Endpoint admin lama tidak otomatis membersihkan file Storage ketika sebuah judul dihapus.
