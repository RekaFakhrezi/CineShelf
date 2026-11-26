# Kontrak CineShelf API

Base lokal: `http://localhost:5002/api`. Untuk HP ganti host dengan IP LAN laptop.
Semua respons JSON, kecuali DELETE berhasil (204 tanpa body).

| Method | Path | Kegunaan | Akses |
|---|---|---|---|
| GET | /health | Status koneksi database | Publik |
| GET | /home | Featured, rak film/serial, total | Publik |
| GET | /genres | Daftar genre | Publik |
| POST | /genres | Tambah genre (`name`) | Admin |
| GET | /movies | Daftar film | Publik |
| GET | /movies/:id | Detail film | Publik |
| POST | /movies | Tambah film | Admin |
| PUT | /movies/:id | Ganti seluruh field film | Admin |
| DELETE | /movies/:id | Hapus film | Admin |
| GET | /series | Daftar serial | Publik |
| GET | /series/:id | Detail serial | Publik |
| POST | /series | Tambah serial | Admin |
| PUT | /series/:id | Ganti seluruh field serial | Admin |
| DELETE | /series/:id | Hapus serial | Admin |
| POST | /catalog/resolve | Ambil judul dari array `ids`; tidak mengubah data | Publik |
| POST | /contributions | Tambah film/serial bersama dan unggah cover | Akun |
| POST | /auth/signup | Daftar (`email`, `password`, `name`) | Publik |
| POST | /auth/login | Masuk (`email`, `password`) | Publik |
| POST | /auth/refresh | Perbarui sesi (`refresh_token`) | Publik |
| POST | /auth/logout | Cabut sesi perangkat aktif | Akun |
| GET | /profile | Muat profil akun dan URL foto sementara | Akun |
| PATCH | /profile | Ubah nama, email, kata sandi, atau foto akun | Akun |
| GET | /library | Muat koleksi akun; `data: null` bila belum ada | Akun |
| PUT | /library | Simpan seluruh koleksi akun | Akun |

GET list mendukung `q` (judul/genre/pemeran), `genre`, `page` (default 1),
`limit` (default 12, maksimum 100). Paginasi dilakukan sebelum respons dikirim.
Untuk skala katalog besar, filter/paginasi sebaiknya dipindah seluruhnya ke query
SQL; implementasi pembelajaran ini memfilter hasil model di controller.

Respons list:

```json
{"data":[],"pagination":{"page":1,"limit":12,"total":0,"totalPages":0}}
```

Respons detail/POST/PUT: `{"data":{...}}`. Respons error:
`{"error":{"message":"Penjelasan kesalahan"}}`.

Admin: header `Authorization: Bearer ADMIN_API_KEY`. Tidak ada admin key yang
ditanam dalam frontend atau file Postman. Tanpa konfigurasi key, write nonaktif.

Field POST/PUT: `title`, `tagline`, `genre`, `year`, `rating`, `age`, `duration`,
`image`, `color`, `cast`, `director`, `synopsis`. Serial wajib menambahkan
`episodes` (1–100). Genre harus sudah ada. Image harus URL HTTPS, rating 0–10,
age SU/13+/16+/18+. `id` dibuat server; `type` mengikuti endpoint.

SQLite menyimpan judul di tabel `titles` dengan payload JSON dan foreign key ke
`genres`; Supabase menggunakan schema serupa dengan payload JSONB. Field indeks
`type`, `title`, dan `genre` diperbarui bersamaan melalui model.

Kode status: 200 baca/update, 201 create, 204 delete, 400 validasi, 401 admin key
salah, 404 endpoint/judul tidak ada, 413 body terlalu besar, 500 kegagalan database,
503 operasi tulis atau konfigurasi deployment belum siap.

## Kontribusi katalog bersama

POST `/contributions` memakai `Authorization: Bearer ACCESS_TOKEN` akun Supabase,
bukan `ADMIN_API_KEY`. Token diverifikasi sebelum parsing JSON, upload, atau penulisan
judul. Token hilang/tidak valid/kedaluwarsa menghasilkan 401; kegagalan layanan
verifikasi menghasilkan 503. Tidak memerlukan kesiapan tabel `/library` atau
kepemilikan pengguna. Katalog dan cover melalui endpoint baca tetap publik.

Body JSON maksimal 3 MiB: `{ "type": "film", "title": { ... }, "cover": { "base64": "..." } }`.
`type` menerima `film`/`serial`; field `title` mengikuti validasi judul di atas,
tetapi URL gambar ditentukan backend dari cover JPG/PNG/WebP maksimal 2 MiB.
Respons berhasil 201 berisi judul bersama. Upload dibersihkan jika penulisan judul
gagal. Batas lima percobaan per alamat koneksi per 10 menit per proses tetap berlaku
(429); endpoint admin dan akses baca publik tidak berubah.

## Akun dan koleksi pribadi

Memerlukan `DB_DRIVER=supabase` dan `backend/database/accounts.supabase.sql`;
SQLite mengembalikan 503 untuk endpoint akun/library, bukan login tiruan.
Provider Email harus aktif di Supabase. Kata sandi baru minimal 6 karakter
(atau lebih kuat bila kebijakan project mengharuskannya), nama 1–80 karakter.
Respons auth: `{"data": session}` dengan format sesi Supabase (`access_token`,
`refresh_token`, `expires_at`, `user`). Signup yang perlu konfirmasi mengembalikan
`{"data":null,"message":"Periksa email ..."}`; belum dianggap login.

Akses akun menggunakan `Authorization: Bearer ACCESS_TOKEN`, **bukan** admin key.
Backend memverifikasi token ke Supabase Auth dan menentukan `user_id` sendiri;
body `user_id` ditolak dan query pemilik tidak digunakan. Respons akun/library
memakai `Cache-Control: no-store`. Logout mencabut refresh token sesi aktif;
access token Supabase dapat tetap berlaku sampai waktu kedaluwarsanya.

Body PUT `/library`:

```json
{
  "saved": ["f1"],
  "shelves": [
    {"id":"all","name":"Semua","icon":"albums-outline","isDefault":true,"items":[]},
    {"id":"shelf_1","name":"Akhir pekan","icon":"film-outline","isDefault":false,"items":["f1"]}
  ],
  "watchedList": [],
  "userRatings": {"f1":4},
  "userReactions": {"f1":"😍"}
}
```

Maksimal body JSON 32 KiB, 500 ID per daftar, 50 rak, serta masing-masing 500
rating/reaksi. ID unik berisi huruf/angka/underscore/tanda hubung maksimal 100
karakter; rating 0–5. Rak `all` wajib ada, `isDefault` hanya benar untuk rak itu.
Validasi gagal menghasilkan 400; sesi tidak valid 401; batas percobaan Supabase
429; layanan akun atau tabel belum siap 503. PUT mengganti snapshot koleksi
akun, bukan menggabungkan edit bersamaan dari beberapa perangkat.

## Edit profil

`GET /profile` dan `PATCH /profile` memakai token akun yang sama seperti `/library`.
Keduanya mengembalikan `{"data":{"user":{...},"avatarUrl":null}}`; foto yang ada
menghasilkan URL bertanda tangan dengan masa berlaku satu jam. Respons tidak di-cache.

`PATCH` menerima hanya field yang diubah: `name` (1–80 karakter), `email`,
`password` (minimal 6 karakter), atau `avatar` (`{"base64":"..."}` untuk foto
JPG/PNG/WebP maksimal 2 MiB, `null` untuk hapus). Identitas akun berasal dari token,
bukan body. Email login mengikuti konfirmasi Supabase Auth; bila masih menunggu,
respons menyertakan `message` dan `user.email` tetap memakai alamat aktif.
