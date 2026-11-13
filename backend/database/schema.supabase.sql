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
