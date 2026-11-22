# Persiapan asistensi dan responsi CineShelf

## Peta persyaratan

| Syarat | Implementasi |
|---|---|
| React Native | Expo + React Native; source App.js dan src/ |
| API sendiri | Express → router → controller → model → SQLite lokal / Supabase |
| Bottom navigation | Beranda, Film, Serial, Watchlist, Profil; tampil juga pada tablet/web |
| Minimal lima halaman | Lima tab utama; detail merupakan layar tambahan |
| Dua list dapat diklik | Film dan Serial, masing-masing list dan detail dari API |
| Profile/About | Identitas pembuat, NIM, kelompok, tujuan, versi, keterangan data fiktif |
| GitHub | https://github.com/RekaFakhrezi/CineShelf |

## Urutan demo 5–7 menit

1. Tunjukkan /api/health dan hasil npm run api:check pada server yang dipakai. Untuk Supabase, hasil health harus menyebut database=supabase.
2. Aktifkan mode API melalui Profil; jangan memakai mode demo untuk membuktikan integrasi.
3. Tunjukkan kelima halaman melalui bottom navigation.
4. Film: list → klik judul → detail. Jelaskan GET /api/movies dan GET /api/movies/:id.
5. Serial: list → detail serial. Jelaskan bahwa komponen list/detail dipakai ulang dengan data berbeda.
6. Cari judul, pilih genre dan buka detail hasilnya. Data katalog dikelola backend.
7. Simpan judul ke watchlist/rak, tandai ditonton dan beri rating. ID/status/rating disimpan lokal menggunakan AsyncStorage, bukan sinkronisasi akun.
8. Tunjukkan roulette; metadata hasil baru muncul setelah animasi selesai.
9. Di Postman gunakan koleksi docs/CineShelf.postman_collection.json. Demonstrasikan POST → PUT → GET → DELETE pada ID uji baru, bukan data seed. Operasi tulis memerlukan ADMIN_API_KEY backend.
10. Tunjukkan halaman Profil/About dan source GitHub terbaru. Jelaskan alur request dari aplikasi sampai database.

## Jawaban yang perlu dipahami

- API sendiri berarti aplikasi menghubungi endpoint Express yang kita buat; frontend tidak mengakses Supabase langsung.
- Lima halaman dihitung dari layar/tab yang berbeda, bukan jumlah file atau modal.
- Katalog fiktif digunakan sebagai dataset pembelajaran. Foto adalah ilustrasi; tidak ada klaim ketersediaan streaming atau trivia produksi yang dibuat-buat.
- Admin CRUD dilakukan melalui Postman; pengumuman tidak mewajibkan form admin di aplikasi.
- Deploy frontend tidak wajib untuk jalur React Native. Deployment backend dan database disiapkan pada docs/DEPLOYMENT.md.
- APK preview untuk instalasi internal; bundle Metro saja bukan APK.

## Administrasi yang harus dituntaskan sendiri

- Pastikan judul CineShelf/platform React Native sudah terdaftar dan tidak duplikat.
- Lakukan asistensi minimal satu kali, bawa aplikasi yang berfungsi dan isi lembar asistensi resmi. Dokumen ini bukan bukti asistensi.
- Cantumkan link repository pada kolom GitHub yang diminta.
- Ikuti responsi sesuai jadwal asisten. Jangan mencatat asistensi atau tanda tangan yang belum dilakukan.
- Uji di HP fisik sebelum responsi.
