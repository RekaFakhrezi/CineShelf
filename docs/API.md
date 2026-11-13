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
