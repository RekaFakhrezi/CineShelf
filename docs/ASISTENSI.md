# Persiapan asistensi CineShelf

## Urutan demo 5–7 menit

1. Jalankan backend dan tampilkan GET /api/health. Tunjukkan driver yang benar:
   sqlite untuk uji awal atau supabase setelah koneksi cloud sudah dikonfigurasi.
2. Buka aplikasi pada HP. Jelaskan lima tab: Beranda, Film, Serial, Watchlist, Profil.
3. Film: klik item → Detail Film. Tunjukkan request GET /movies dan /movies/:id.
4. Serial: klik item → Detail Serial, termasuk metadata episode.
5. Cari judul, pilih genre, dan tunjukkan query API. Paginasi tampil bila jumlah
   hasil melampaui 12; gunakan Postman limit=2 untuk contoh cepat.
6. Tambahkan/hapus watchlist. Jelaskan bahwa ID disimpan lokal dan detail diambil
   dari API; tidak ada klaim sinkronisasi akun.
7. Di Postman lakukan POST film, PUT dengan ID baru, GET untuk melihat perubahan,
   lalu DELETE ID baru. Tunjukkan penolakan write tanpa admin key.
8. Matikan server, coba muat ulang katalog: aplikasi menampilkan error/retry.
   Nyalakan lagi, lalu coba lagi. Jangan memilih demo untuk membuktikan API.
9. Tunjukkan Profil/About, struktur model/controller/router, schema SQL, dan repo.

## Ketentuan administratif yang harus dilakukan sendiri

- [ ] Cek ketersediaan dan daftarkan judul/platform/asisten (ditunda sesuai permintaan).
- [ ] Asistensi sungguhan minimal satu kali dan isi lembar yang disediakan asisten.
- [ ] Catat masukan dan perbaikan; jangan mengisi tanda tangan/tanggal fiktif.
- [ ] Cantumkan URL repository yang sudah berisi source.
- [ ] Uji di HP sebelum responsi.
- [ ] Opsional: build dan instal APK untuk tambahan nilai.

Tidak perlu menyebut aplikasi ini layanan streaming. Lingkupnya katalog film dan
serial dengan watchlist. Data demo diberi label fiktif.
