-- Create a storage bucket for SAT score report uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT DO NOTHING;

-- Set up security policies for the uploads bucket
CREATE POLICY "Users can upload files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated');

-- Allow users to view only their own uploaded files
CREATE POLICY "Users can view their own files" ON storage.objects
  FOR SELECT USING (bucket_id = 'uploads' AND owner = auth.uid());

-- Allow users to update/delete only their own uploaded files
CREATE POLICY "Users can update their own files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'uploads' AND owner = auth.uid());

CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE USING (bucket_id = 'uploads' AND owner = auth.uid()); 