CREATE POLICY "Users can read their own try-on images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'try-on-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload their own try-on images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'try-on-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own try-on images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'try-on-images' AND (storage.foldername(name))[1] = auth.uid()::text);