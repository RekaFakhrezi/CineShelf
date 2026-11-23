-- Run once in the same Supabase project as genres/titles.
-- Private bucket. Our backend creates temporary image URLs when catalogue data is read.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('cineshelf-covers', 'cineshelf-covers', false, 2097152, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;
-- No anonymous INSERT/UPDATE/DELETE policies are required on storage.objects.
