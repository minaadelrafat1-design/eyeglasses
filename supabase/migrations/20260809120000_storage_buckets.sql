-- Try-on images storage bucket ---------------------------------------------
-- Policies for this bucket were created in an earlier migration, but the
-- bucket itself was never created — uploads/selfies would fail with
-- "Bucket not found". Private bucket: only the owning user (via the
-- existing per-user folder policies) and staff via signed URLs can read it.

INSERT INTO storage.buckets (id, name, public)
VALUES ('try-on-images', 'try-on-images', false)
ON CONFLICT (id) DO NOTHING;

-- Product images storage bucket ------------------------------------------
-- Referenced by src/services/adminService.ts (uploadProductImage) but was
-- never created by a migration, so admin product-image uploads failed with
-- "Bucket not found". Public bucket: product photos are shown storefront-
-- wide to anon + authenticated visitors; only staff/admin may write.

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Product images are publicly readable"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images');

CREATE POLICY "Staff can upload product images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.is_staff());

CREATE POLICY "Staff can update product images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_staff())
  WITH CHECK (bucket_id = 'product-images' AND public.is_staff());

CREATE POLICY "Staff can delete product images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_staff());
