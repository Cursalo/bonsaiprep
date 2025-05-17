// @ts-nocheck
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Standard CORS headers. Adjust as necessary for your security requirements.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // Or specify your frontend's origin e.g., 'https://your-app.vercel.app'
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', // Ensure 'content-type' is present
};

// IMPORTANT: Google Cloud Vision API Integration
// 1. Enable the Cloud Vision API in your Google Cloud Platform project.
// 2. Create an API key for the Vision API.
// 3. Store this API key securely as an environment variable in your Supabase project settings:
//    - Go to Project Settings > Edge Functions > Add New Secret
//    - Name: GOOGLE_VISION_API_KEY
//    - Value: YOUR_API_KEY
// 4. Ensure your Supabase Storage bucket (e.g., 'score-reports') allows your Edge Function to read files.
//    This might involve setting up appropriate RLS policies or service roles if files are not public.

console.log('OCR PDF function with Google Cloud Vision API initializing');

// Initialize Supabase client if you need to fetch files from private storage
// This requires PROJECT_URL and PROJECT_SERVICE_ROLE_KEY to be set as environment variables in your function settings
const supabaseAdmin = createClient(
  Deno.env.get('PROJECT_URL') ?? '',
  Deno.env.get('PROJECT_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS, status: 200 });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, // Also include CORS headers on error
    });
  }

  try {
    const { fileUrl, storagePath } = await req.json(); // Expecting a URL or storage path

    if (!fileUrl && !storagePath) {
      return new Response(JSON.stringify({ error: 'Missing fileUrl or storagePath' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, // Also include CORS headers on error
      });
    }

    console.log(`Request to OCR. URL: ${fileUrl}, Path: ${storagePath}`);
    let pdfBase64Content: string;

    if (storagePath) {
      // Download the file from Supabase Storage
      const bucketName = 'score-reports'; // Or get from request/env
      console.log(`Fetching from Supabase Storage: ${bucketName}/${storagePath}`);
      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from(bucketName)
        .download(storagePath);

      if (downloadError) {
        console.error('Supabase Storage download error:', downloadError);
        throw new Error(`Failed to download from Storage: ${downloadError.message}`);
      }
      if (!fileData) {
        throw new Error('No data downloaded from Supabase Storage.');
      }
      
      const arrayBuffer = await fileData.arrayBuffer();
      pdfBase64Content = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      console.log(`File downloaded and converted to base64. Size: ${pdfBase64Content.length} chars`);

    } else if (fileUrl) {
      // If a direct public URL is provided and Vision API could use it,
      // you might pass the URL. However, Vision API for PDFs usually expects content.
      // For simplicity and consistency, let's assume we always fetch and send content.
      console.log(`Fetching PDF from URL: ${fileUrl}`);
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF from URL: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      pdfBase64Content = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
       console.log(`File fetched from URL and converted to base64. Size: ${pdfBase64Content.length} chars`);
    } else {
      throw new Error("No file source provided.");
    }

    const googleVisionApiKey = Deno.env.get('GOOGLE_VISION_API_KEY');
    if (!googleVisionApiKey) {
      console.error('GOOGLE_VISION_API_KEY is not set in Edge Function secrets.');
      throw new Error('Google Vision API key is not configured.');
    }

    const visionApiUrl = `https://vision.googleapis.com/v1/files:annotate?key=${googleVisionApiKey}`;

    const requestBody = {
      requests: [
        {
          inputConfig: {
            content: pdfBase64Content,
            mimeType: 'application/pdf',
          },
          features: [
            {
              type: 'DOCUMENT_TEXT_DETECTION',
            },
          ],
          // Optionally, add imageContext for language hints or other parameters
          // "imageContext": {
          //   "languageHints": ["en"]
          // }
        },
      ],
    };

    console.log('Sending request to Google Cloud Vision API...');
    const visionResponse = await fetch(visionApiUrl, {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!visionResponse.ok) {
      const errorBody = await visionResponse.json();
      console.error('Google Vision API error:', errorBody);
      throw new Error(`Vision API request failed: ${visionResponse.statusText} - ${JSON.stringify(errorBody)}`);
    }

    const visionResult = await visionResponse.json();
    console.log('Received response from Google Cloud Vision API.');

    // Extract text from the response
    // The response structure can be complex. Typically, you look for 'fullTextAnnotation.text'.
    const firstResponse = visionResult.responses && visionResult.responses[0];
    const fullTextAnnotation = firstResponse && firstResponse.fullTextAnnotation;
    
    if (!fullTextAnnotation || !fullTextAnnotation.text) {
      console.warn('No text found in Vision API response or unexpected response structure:', visionResult);
      // Check for individual page text if fullTextAnnotation is missing
      let pageText = '';
      if (firstResponse && firstResponse.textAnnotations && firstResponse.textAnnotations.length > 0) {
        // This path is more for simple text detection, not ideal for document structure
         pageText = firstResponse.textAnnotations[0].description;
      }
      if(!pageText && firstResponse && firstResponse.fullTextAnnotation && firstResponse.fullTextAnnotation.pages) {
        firstResponse.fullTextAnnotation.pages.forEach(page => {
            page.blocks.forEach(block => {
                block.paragraphs.forEach(paragraph => {
                    paragraph.words.forEach(word => {
                        word.symbols.forEach(symbol => {
                            pageText += symbol.text;
                        });
                        pageText += ' '; 
                    });
                    pageText += '\n'; 
                });
            });
        });
      }

      if(!pageText){
        throw new Error('Could not extract text using fullTextAnnotation or page-level annotations.');
      }
      console.log("Extracted text using page-level annotations fallback.")
      return new Response(JSON.stringify({ extractedText: pageText.trim() }), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, // Also include CORS headers
      });
    }
    
    const extractedText = fullTextAnnotation.text;
    console.log('Text extraction successful.');

    return new Response(JSON.stringify({ extractedText: extractedText.trim() }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, // Also include CORS headers
    });

  } catch (error) {
    console.error('Error in OCR PDF function:', error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, // Also include CORS headers
    });
  }
});

/*
To deploy this function:
1. Set up Google Cloud Vision API & API Key (store as GOOGLE_VISION_API_KEY secret in Supabase).
2. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as environment variables for this function in Supabase dashboard if fetching from private storage.
3. Run: supabase functions deploy ocr-pdf --project-ref YOUR_PROJECT_REF --no-verify-jwt (if calling from client with service key, or adjust as needed)
*/

/* 
To deploy this function:
1. Make sure you have the Supabase CLI installed and are logged in.
2. Navigate to your project's root directory in the terminal.
3. Run: supabase functions deploy ocr-pdf --project-ref YOUR_PROJECT_REF

To call this function from your client (e.g., UploadReport.tsx):

import { supabase } from '../supabaseClient'; // Your Supabase client instance

const ocrPdfOnSupabase = async (fileUrl: string) => {
  const { data, error } = await supabase.functions.invoke('ocr-pdf', {
    body: { fileUrl }, // or { storagePath: 'path/to/file.pdf' }
  });

  if (error) {
    console.error('Error calling ocr-pdf function:', error);
    throw error;
  }
  return data.extractedText; // Assuming the function returns { extractedText: "..." }
};

*/ 