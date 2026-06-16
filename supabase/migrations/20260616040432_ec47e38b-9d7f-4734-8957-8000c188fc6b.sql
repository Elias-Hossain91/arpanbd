
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS photos text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS upazila text,
  ADD CONSTRAINT posts_photos_max_3 CHECK (cardinality(photos) <= 3);

-- Storage policies on post-photos bucket. Path layout: <user_id>/<file>
CREATE POLICY "post-photos viewable by authenticated"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'post-photos');

CREATE POLICY "post-photos owner can insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "post-photos owner can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'post-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "post-photos owner can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'post-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
