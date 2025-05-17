import { supabase } from '../supabaseClient'; // Your Supabase client instance

/**
 * Calls the Supabase Edge Function 'ocr-pdf' to extract text from a PDF.
 * 
 * @param fileUrl The publicly accessible URL of the PDF file in Supabase Storage.
 * @param storagePath Alternatively, the path to the file in Supabase Storage (if not using a public URL).
 * @returns A promise that resolves to the extracted text.
 */
export const ocrPdfFromSupabase = async (fileUrl?: string, storagePath?: string): Promise<string> => {
  if (!fileUrl && !storagePath) {
    throw new Error('Either fileUrl or storagePath must be provided to ocrPdfFromSupabase.');
  }

  // Construct the body for the function call
  const body: { fileUrl?: string; storagePath?: string } = {};
  if (fileUrl) body.fileUrl = fileUrl;
  if (storagePath) body.storagePath = storagePath;

  const { data, error } = await supabase.functions.invoke('ocr-pdf', {
    body: body,
  });

  if (error) {
    console.error('Error calling ocr-pdf Supabase function:', error);
    throw new Error(`Failed to process PDF with OCR function: ${error.message}`);
  }

  if (!data || !data.extractedText) {
    console.error('OCR function did not return extracted text:', data);
    throw new Error('OCR function did not return the expected extractedText field.');
  }

  return data.extractedText;
};

/**
 * Uploads a file to Supabase Storage and returns its public URL or storage path.
 * 
 * @param file The file to upload.
 * @param bucketName The name of the Supabase Storage bucket.
 * @param options Optional settings for the upload (e.g., make public, path prefix).
 * @returns A promise that resolves to an object containing the public URL and/or storage path.
 */
export const uploadFileToSupabase = async (
  file: File,
  bucketName: string = 'score-reports', // Example bucket name
  options: { publicAccess?: boolean; pathPrefix?: string } = {}
): Promise<{ publicUrl?: string; storagePath: string }> => {
  const { publicAccess = false, pathPrefix = 'uploads' } = options;
  const fileName = `${pathPrefix}/${Date.now()}-${file.name}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false, // true to overwrite if file already exists
    });

  if (uploadError) {
    console.error('Error uploading file to Supabase Storage:', uploadError);
    throw new Error(`Supabase Storage upload failed: ${uploadError.message}`);
  }

  const storagePath = uploadData.path;
  let publicUrl: string | undefined = undefined;

  if (publicAccess) {
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);
    publicUrl = urlData?.publicUrl;
  }

  return { publicUrl, storagePath };
}; 