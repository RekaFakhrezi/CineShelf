-- CineShelf: run this entire file in Supabase SQL Editor.
-- Idempotent: existing title IDs and genres are not overwritten. No credentials belong in SQL.
BEGIN;
-- Jalankan di SQL Editor project Supabase milik sendiri.
-- Aman dijalankan ulang; tidak menghapus data.
CREATE TABLE IF NOT EXISTS public.genres (name TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.titles (
 id TEXT PRIMARY KEY,
 type TEXT NOT NULL CHECK(type IN ('film','serial')),
 title TEXT NOT NULL,
 genre TEXT NOT NULL REFERENCES public.genres(name) ON UPDATE CASCADE,
 payload JSONB NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS titles_type_genre ON public.titles(type,genre);
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.titles ENABLE ROW LEVEL SECURITY;
-- Akses database lewat backend sendiri menggunakan service_role.
-- Tidak memberikan kebijakan write anon atau mengirim service key ke frontend.
REVOKE ALL ON public.genres, public.titles FROM anon, authenticated;
GRANT ALL ON public.genres, public.titles TO service_role;

INSERT INTO public.genres (name) VALUES
('Sci-Fi'),
('Drama'),
('Thriller'),
('Petualangan')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.titles (id,type,title,genre,payload) VALUES
('f1','film','Orbit Terakhir','Sci-Fi','{"id":"f1","type":"film","title":"Orbit Terakhir","tagline":"Sejauh apa kamu akan mencari rumah?","genre":"Sci-Fi","year":2026,"rating":"8.7","age":"13+","duration":"1j 58m","image":"https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=900&q=80","color":"#213855","cast":"Nara Putri, Arya Pradana, Bima Santosa","director":"Aditya Pramana","synopsis":"Sebuah sinyal misterius membawa astronaut muda ke stasiun luar angkasa yang telah lama ditinggalkan. Di antara kenangan dan batas waktu oksigen, ia harus memilih: pulang ke Bumi atau menemukan jawaban yang mengubah segalanya."}'::jsonb),
('f2','film','Setelah Hujan','Drama','{"id":"f2","type":"film","title":"Setelah Hujan","tagline":"Ada cerita yang belum selesai.","genre":"Drama","year":2026,"rating":"8.3","age":"13+","duration":"1j 42m","image":"https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=80","color":"#34214b","cast":"Laras Anindya, Dimas Raditya","director":"Kirana Dewi","synopsis":"Di kota yang selalu diguyur hujan, seorang fotografer menemukan surat-surat lama di toko buku kecil. Setiap surat membawanya lebih dekat kepada seseorang yang pernah ia lupakan."}'::jsonb),
('f3','film','Jalur Sunyi','Thriller','{"id":"f3","type":"film","title":"Jalur Sunyi","tagline":"Tidak semua jalan membawa pulang.","genre":"Thriller","year":2025,"rating":"8.1","age":"16+","duration":"1j 36m","image":"https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80","color":"#173b32","cast":"Fajar Mahendra, Sinta Ayu","director":"Raka Wibawa","synopsis":"Perjalanan akhir pekan berubah menjadi teka-teki ketika tiga sahabat menemukan jalan yang tidak ada di peta. Mereka harus mengungkap rahasia hutan sebelum malam menutup semua arah."}'::jsonb),
('f4','film','Biru Tanpa Batas','Petualangan','{"id":"f4","type":"film","title":"Biru Tanpa Batas","tagline":"Petualangan dimulai dari keberanian.","genre":"Petualangan","year":2025,"rating":"8.5","age":"SU","duration":"1j 49m","image":"https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=900&q=80","color":"#15475a","cast":"Rani Puspita, Kevin Wijaya","director":"Dewangga Putra","synopsis":"Dua saudara berlayar mengikuti jurnal ayah mereka. Di pulau-pulau yang belum pernah mereka datangi, mereka menemukan arti keluarga dan keberanian untuk memulai kembali."}'::jsonb),
('f5','film','Kota Pukul Tiga','Drama','{"id":"f5","type":"film","title":"Kota Pukul Tiga","tagline":"Satu malam. Seribu kemungkinan.","genre":"Drama","year":2026,"rating":"7.9","age":"16+","duration":"1j 31m","image":"https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=900&q=80","color":"#49283b","cast":"Arga Wiratama, Nina Amalia","director":"Satria Wisesa","synopsis":"Seorang pengemudi malam dan penumpang terakhirnya melintasi kota yang hampir tertidur. Percakapan sederhana mengubah arah hidup keduanya sebelum matahari terbit."}'::jsonb),
('f6','film','Puncak Pertama','Petualangan','{"id":"f6","type":"film","title":"Puncak Pertama","tagline":"Langkah kecil, mimpi yang besar.","genre":"Petualangan","year":2024,"rating":"8.0","age":"SU","duration":"1j 45m","image":"https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80","color":"#3d444a","cast":"Tara Kusuma, Bagas Aji","director":"Intan Maharani","synopsis":"Mahasiswa yang takut ketinggian bergabung dalam pendakian pertamanya. Persahabatan yang tumbuh di perjalanan membantunya menghadapi sesuatu yang lebih besar daripada gunung."}'::jsonb),
('s1','serial','Frekuensi 03','Sci-Fi','{"id":"s1","type":"serial","title":"Frekuensi 03","tagline":"Masa depan sedang menghubungi.","genre":"Sci-Fi","year":2026,"rating":"8.9","age":"13+","duration":"1 musim · 6 episode","episodes":6,"image":"https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=900&q=80","color":"#49315b","cast":"Alif Ramadhan, Maya Sekar","director":"Rizky Darmawan","synopsis":"Sekelompok mahasiswa teknik menangkap siaran radio yang memprediksi kejadian esok hari. Setiap usaha mengubah masa depan justru membuka misteri yang lebih besar."}'::jsonb),
('s2','serial','Ruang 204','Drama','{"id":"s2","type":"serial","title":"Ruang 204","tagline":"Tetangga baru, cerita baru.","genre":"Drama","year":2026,"rating":"8.2","age":"13+","duration":"1 musim · 8 episode","episodes":8,"image":"https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80","color":"#615145","cast":"Nadia Safira, Galang Pratama","director":"Ayu Lestari","synopsis":"Lima penghuni kos dengan mimpi berbeda belajar hidup berdampingan. Dari tagihan listrik sampai tugas akhir, selalu ada cerita di balik pintu ruang 204."}'::jsonb),
('s3','serial','Arsip Tengah Malam','Thriller','{"id":"s3","type":"serial","title":"Arsip Tengah Malam","tagline":"Setiap berkas menyimpan rahasia.","genre":"Thriller","year":2025,"rating":"8.6","age":"16+","duration":"1 musim · 6 episode","episodes":6,"image":"https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=900&q=80","color":"#514030","cast":"Dian Paramita, Reza Anggara","director":"Damar Seno","synopsis":"Petugas arsip baru menemukan berkas orang hilang yang terus bertambah setiap tengah malam. Penyelidikannya membawa ia ke peristiwa yang sengaja dilupakan kota."}'::jsonb),
('s4','serial','Di Ujung Peta','Petualangan','{"id":"s4","type":"serial","title":"Di Ujung Peta","tagline":"Indonesia, dari dekat.","genre":"Petualangan","year":2025,"rating":"8.4","age":"SU","duration":"1 musim · 5 episode","episodes":5,"image":"https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=900&q=80","color":"#24575b","cast":"Kinan Putri, Aksa Mahardika","director":"Bayu Pamungkas","synopsis":"Dua sahabat mengunjungi desa-desa terpencil dan mendokumentasikan cerita penduduknya. Sebuah perjalanan tentang alam, rumah, dan hal-hal kecil yang sering terlewat."}'::jsonb)
ON CONFLICT (id) DO NOTHING;
COMMIT;

-- Expected for a fresh project: film=6, serial=4.
SELECT type, count(*) AS total FROM public.titles GROUP BY type ORDER BY type;
