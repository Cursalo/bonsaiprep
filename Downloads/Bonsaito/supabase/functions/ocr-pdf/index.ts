// @ts-nocheck
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Standard CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('OCR PDF function initializing - Global Scope Start - v1.5-txt');

// Safely get environment variables with fallbacks
const getEnvVar = (name, fallback = '') => {
  const value = Deno.env.get(name);
  if (!value) {
    console.warn(`[ENV] Variable ${name} is missing or empty. Using fallback.`);
    return fallback;
  }
  // console.log(`[ENV] Variable ${name} loaded successfully.`);
  return value;
};

// Get environment variables
const projectUrl = getEnvVar('PROJECT_URL');
const serviceRoleKey = getEnvVar('PROJECT_SERVICE_ROLE_KEY');
const googleVisionApiKey = getEnvVar('GOOGLE_VISION_API_KEY');

// Log environment variable status (without revealing values)
console.log(`[INIT] PROJECT_URL: ${projectUrl ? 'Available' : 'MISSING'}`);
console.log(`[INIT] PROJECT_SERVICE_ROLE_KEY: ${serviceRoleKey ? 'Available' : 'MISSING'}`);
console.log(`[INIT] GOOGLE_VISION_API_KEY: ${googleVisionApiKey ? 'Available' : 'MISSING'}`);

// Initialize Supabase client only if both URL and key are available
let supabaseAdmin = null;
if (projectUrl && serviceRoleKey) {
  try {
    supabaseAdmin = createClient(projectUrl, serviceRoleKey);
    console.log('[INIT] Supabase admin client initialized successfully.');
  } catch (error) {
    console.error('[INIT ERROR] Failed to initialize Supabase client:', error.message);
  }
} else {
  console.error('[INIT ERROR] Cannot initialize Supabase client: missing PROJECT_URL or PROJECT_SERVICE_ROLE_KEY.');
}

// Detect if the file name suggests it's an SAT test result
function isSatTestResult(fileName) {
  if (!fileName) return false;
  const lowerFileName = fileName.toLowerCase();
  const isSat = (lowerFileName.includes('sat') || lowerFileName.includes('practice') || lowerFileName.includes('psat')) &&
              (lowerFileName.includes('result') || lowerFileName.includes('score') || 
               lowerFileName.includes('detail') || lowerFileName.includes('report'));
  // console.log(`[SAT_DETECT] File: ${fileName}, Is SAT Report: ${isSat}`);
  return isSat;
}

// Helper function to prepare a PDF for Vision API when we suspect it's an image-based PDF
async function prepareImageBasedPdf(pdfBase64Content, fileName) {
  console.log(`[PDF_PREPROCESSING] Treating "${fileName}" as potentially image-based PDF`);
  
  // Return the PDF content as is, but in the future we might want to
  // convert it to images first or apply other preprocessing
  return pdfBase64Content;
}

// Helper to call the Vision API with different detection types
async function callVisionApi(content, apiKey, detectionType) {
  const apiUrl = `https://vision.googleapis.com/v1/files:annotate?key=${apiKey}`;
  
  // For SAT reports, we need to ensure we're using the best possible settings
  // Try a slightly higher image quality setting for text detection
  const model = detectionType === 'TEXT_DETECTION' ? 'builtin/latest' : undefined;
  
  // Process one page at a time to avoid timeout and memory issues
  const MAX_PAGES = 10;
  const results = { responses: [] };
  
  try {
    // Process pages 1-10 (more pages for SAT reports)
    for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
      console.log(`[VISION_API] Processing page ${pageNum} with ${detectionType}...`);
      
      const requestBody = {
        requests: [{
          inputConfig: { 
            content: content, 
            mimeType: 'application/pdf', 
            pages: [pageNum] 
          },
          features: [{ 
            type: detectionType, 
            model: model 
          }],
        }],
      };
      
      const response = await fetch(apiUrl, { 
        method: 'POST', 
        body: JSON.stringify(requestBody), 
        headers: { 'Content-Type': 'application/json' } 
      });
      
      if (!response.ok) {
        const errorBodyText = await response.text();
        console.error(`[VISION_API_ERROR] (${detectionType}) Page ${pageNum}, Status: ${response.status}, Body: ${errorBodyText.substring(0, 300)}...`);
        results.error = `Vision API Error (${detectionType}): ${response.status} ${response.statusText}`;
        results.errorDetailsBody = errorBodyText;
        break; // Stop processing pages if there's an error
      }
      
      const jsonResponse = await response.json();
      
      if (jsonResponse.responses && jsonResponse.responses.length > 0) {
        results.responses.push(...jsonResponse.responses);
        
        // For debugging: Get a sample of what was detected on this page
        if (jsonResponse.responses[0].fullTextAnnotation && jsonResponse.responses[0].fullTextAnnotation.text) {
          const sampleText = jsonResponse.responses[0].fullTextAnnotation.text.substring(0, 200);
          console.log(`[VISION_API] Page ${pageNum} (${detectionType}) sample: ${sampleText}...`);
        } else if (jsonResponse.responses[0].textAnnotations && jsonResponse.responses[0].textAnnotations.length > 0) {
          const sampleText = jsonResponse.responses[0].textAnnotations[0].description.substring(0, 200);
          console.log(`[VISION_API] Page ${pageNum} (${detectionType}) sample: ${sampleText}...`);
        }
        
        console.log(`[VISION_API] Page ${pageNum} (${detectionType}) - Successfully retrieved ${jsonResponse.responses.length} responses.`);
      } else {
        console.log(`[VISION_API] Page ${pageNum} (${detectionType}) - No valid responses.`);
      }
    }
    
    console.log(`[VISION_API_SUCCESS] (${detectionType}). Total responses: ${results.responses.length}.`);
    return results;
    
  } catch (error) {
    console.error(`[VISION_API_FAIL] Network or other error calling Vision API (${detectionType}):`, error.message, error.stack);
    return { error: `Network/fetch error calling Vision API (${detectionType}): ${error.message}`, responses: [] };
  }
}

// Safely process a PDF - with multiple fallback mechanisms
async function processPdfWithVision(pdfBase64Content, googleVisionApiKey, options = {}) {
  const { fileName = '' } = options;
  
  const isSatResult = isSatTestResult(fileName);
  console.log(`[PROCESS_PDF] Version 1.5 - Processing "${fileName}". Is SAT report: ${isSatResult}`);
  
  // For MyPractice SAT PDFs specifically, prioritize image-based processing
  const isMyPracticeSat = fileName.toLowerCase().includes('mypractice') && 
                          fileName.toLowerCase().includes('sat') && 
                          fileName.toLowerCase().includes('practice');
  
  if (isMyPracticeSat) {
    console.log(`[PROCESS_PDF] Detected specific MyPractice SAT format, using optimized processing.`);
    
    // Prepare the PDF for image-based processing if needed
    const preparedPdfContent = await prepareImageBasedPdf(pdfBase64Content, fileName);
    
    // For MyPractice, IMAGE mode works better than document mode - start with that
    console.log(`[PROCESS_PDF] Calling Vision API in TEXT_DETECTION mode (IMAGE mode)...`);
    const imageResult = await callVisionApi(preparedPdfContent, googleVisionApiKey, 'TEXT_DETECTION');
    
    // Extract text and try to parse
    const imageText = extractTextFromResponse(imageResult);
    if (imageText) {
      console.log(`[PROCESS_PDF] Successfully extracted text with IMAGE mode (length: ${imageText.length}).`);
      console.log(`[PROCESS_PDF] Text sample: ${imageText.substring(0, 500)}...`);
      
      // If this contains key markers of a SAT table, we've succeeded
      if (imageText.includes('Reading and Writing') && 
          (imageText.includes('Correct') || imageText.includes('Incorrect')) &&
          /\d+\s+Reading and Writing\s+[A-D]/.test(imageText)) {
        console.log(`[PROCESS_PDF] Found SAT table markers in text, using IMAGE mode results.`);
        
        // Apply special pattern matching specifically for MyPractice format
        const satData = extractMyPracticeSatData(imageText, fileName);
        
        return { 
          extractedText: imageText.trim(),
          mode: 'text_detection',
          satSpecific: satData,
          visionResponses: { imageMode: imageResult }
        };
      }
    }
    
    // If IMAGE mode failed or didn't find table markers, fallback to standard approach
    console.log(`[PROCESS_PDF] Image mode didn't yield SAT data, falling back to multi-mode approach.`);
  }
  
  // Default multi-mode approach (try all modes in parallel)
  console.log(`[PROCESS_PDF] Attempting multiple detection methods for maximum extraction...`);
  
  const modes = ['TEXT_DETECTION', 'DOCUMENT_TEXT_DETECTION', 'DENSE_TEXT_DETECTION'];
  const results = {};
  const texts = {};
  
  // Try all detection modes in parallel for speed
  await Promise.all(modes.map(async (mode) => {
    console.log(`[PROCESS_PDF] Calling Vision API in ${mode} mode.`);
    const result = await callVisionApi(pdfBase64Content, googleVisionApiKey, mode);
    results[mode] = result;
    
    // Log only response summary to avoid overwhelming logs
    console.log(`[VISION_API] ${mode} response summary: ${result.responses ? result.responses.length : 0} pages, has error: ${!!result.error}`);
    
    // Only log full response if we have debug flag
    if (options.debug) {
      console.log(`[VISION_API_DEBUG] Full ${mode} response: ${JSON.stringify(result)}`);
    }
    
    const extractedText = extractTextFromResponse(result);
    if (extractedText) {
      texts[mode] = extractedText;
      console.log(`[PROCESS_PDF] Successfully extracted text with ${mode} mode (length: ${extractedText.length}).`);
      // Log a sample of the extracted text
      console.log(`[PROCESS_PDF] Text sample (${mode}): ${extractedText.substring(0, 200)}...`);
    } else {
      console.log(`[PROCESS_PDF] Failed to extract text with ${mode} mode.`);
    }
  }));
  
  // Check if any extraction was successful
  const successfulModes = Object.keys(texts);
  if (successfulModes.length === 0) {
    console.error('[PROCESS_PDF_FAIL] All text extraction methods failed.');
    return {
      error: 'Failed to extract text from PDF using all available Vision API modes.',
      visionResponses: results
    };
  }
  
  // Choose the best text based on length and content
  let bestMode = successfulModes[0];
  let bestText = texts[bestMode];
  
  // For SAT results, prefer the mode that has table headers
  if (isSatResult) {
    for (const mode of successfulModes) {
      const text = texts[mode];
      const hasTableStructure = (
        text.includes('Question') && 
        text.includes('Section') && 
        text.includes('Correct Answer') && 
        text.includes('Your Answer')
      );
      
      // If this text has table structure and is longer than the current best, use it
      if (hasTableStructure && (!bestText.includes('Question') || text.length > bestText.length)) {
        bestMode = mode;
        bestText = text;
      }
    }
  } else {
    // For other documents, just use the longest text
    for (const mode of successfulModes) {
      if (texts[mode].length > bestText.length) {
        bestMode = mode;
        bestText = texts[mode];
      }
    }
  }
  
  console.log(`[PROCESS_PDF] Selected ${bestMode} as best extraction mode (length: ${bestText.length}).`);
  
  return { 
    extractedText: bestText.trim(),
    mode: bestMode.toLowerCase(),
    satSpecific: isSatResult ? structureSatResults(bestText, fileName, texts) : null,
    visionResponses: results
  };
}

// Function specifically for extracting data from MyPractice SAT format
function extractMyPracticeSatData(text, fileName) {
  console.log('[MY_PRACTICE_SAT] Extracting data using specialized MyPractice format detector');
  
  try {
    const result = {
      sourceFile: fileName,
      fileType: 'MyPractice SAT Report',
      detailedQuestions: [],
      totalQuestions: 0,
      totalCorrect: 0,
      totalIncorrect: 0
    };
    
    // Look specifically for the MyPractice format pattern
    // Example: "1    Reading and Writing    B    B; Correct"
    const questionPattern = /(\d+)\s+Reading\s+and\s+Writing\s+([A-D])\s+([A-D]);\s+(Correct|Incorrect)/gi;
    
    let match;
    while ((match = questionPattern.exec(text)) !== null) {
      const questionNumber = match[1];
      const correctAnswer = match[2];
      const yourAnswer = match[3];
      const isCorrect = match[4].toLowerCase() === 'correct';
      
      result.detailedQuestions.push({
        questionNumber,
        section: 'Reading and Writing',
        correctAnswer,
        yourAnswer,
        isCorrect,
        review: 'Review' // Based on the screenshot
      });
    }
    
    if (result.detailedQuestions.length > 0) {
      result.totalQuestions = result.detailedQuestions.length;
      result.totalCorrect = result.detailedQuestions.filter(q => q.isCorrect).length;
      result.totalIncorrect = result.totalQuestions - result.totalCorrect;
      
      console.log(`[MY_PRACTICE_SAT] Successfully extracted ${result.totalQuestions} questions`);
      console.log(`[MY_PRACTICE_SAT] Correct: ${result.totalCorrect}, Incorrect: ${result.totalIncorrect}`);
      
      return result;
    }
    
    // Try a more relaxed pattern if the strict one fails
    const relaxedPattern = /(\d+)\s+Reading\s+and\s+Writing\s+([A-D])\s+([A-D])/gi;
    
    while ((match = relaxedPattern.exec(text)) !== null) {
      const questionNumber = match[1];
      const correctAnswer = match[2];
      const yourAnswer = match[3];
      
      // Check if there's any "correct" or "incorrect" text after this match
      const nextFewChars = text.substring(match.index + match[0].length, match.index + match[0].length + 20);
      const isCorrect = nextFewChars.toLowerCase().includes('correct') && 
                       !nextFewChars.toLowerCase().includes('incorrect');
      
      result.detailedQuestions.push({
        questionNumber,
        section: 'Reading and Writing',
        correctAnswer,
        yourAnswer,
        isCorrect,
        review: 'Review'
      });
    }
    
    if (result.detailedQuestions.length > 0) {
      result.totalQuestions = result.detailedQuestions.length;
      result.totalCorrect = result.detailedQuestions.filter(q => q.isCorrect).length;
      result.totalIncorrect = result.totalQuestions - result.totalCorrect;
      
      console.log(`[MY_PRACTICE_SAT] Successfully extracted ${result.totalQuestions} questions with relaxed pattern`);
      console.log(`[MY_PRACTICE_SAT] Correct: ${result.totalCorrect}, Incorrect: ${result.totalIncorrect}`);
      
      return result;
    }
    
    console.log('[MY_PRACTICE_SAT] Could not extract questions with specialized patterns');
    return null;
    
  } catch (e) {
    console.error('[MY_PRACTICE_SAT_ERROR] Error extracting MyPractice SAT data:', e.message, e.stack);
    return { error: 'Failed to parse MyPractice SAT format', details: e.message };
  }
}

// Try to extract SAT specific data patterns from the text
function structureSatResults(text, fileName = '', allTexts = {}) {
  if (!text) {
    console.log('[SAT_STRUCTURE] No text provided to structureSatResults.');
    return null;
  }
  console.log(`[SAT_STRUCTURE] Structuring SAT results from text (length: ${text.length}) for file: ${fileName}`);
  
  // Log a sample of the text to help with debugging
  console.log(`[SAT_STRUCTURE] Text sample: ${text.substring(0, 500)}...`);
  
  try {
    const result = {
      sourceFile: fileName,
      overallScore: null,
      readingWritingScore: null,
      mathScore: null,
      sectionsSummary: [],
      detailedQuestions: [],
      totalQuestions: null,
      totalCorrect: null,
      totalIncorrect: null,
    };

    // Enhanced score extraction
    const totalScoreMatch = text.match(/Total\s*Score\s*[:\s]*(\d{3,4})/i) || text.match(/Your\s*Total\s*Score\s*is\s*(\d{3,4})/i) || text.match(/SAT\s*Score\s*[:\s]*(\d{3,4})/i);
    if (totalScoreMatch && totalScoreMatch[1]) {
        result.overallScore = parseInt(totalScoreMatch[1]);
        console.log(`[SAT_STRUCTURE] Found Overall Score: ${result.overallScore}`);
    }

    const rwScoreMatch = text.match(/(?:Reading\s*(?:and|&)\s*Writing|Evidence-Based\s*Reading\s*and\s*Writing)\s*Score\s*[:\s]*(\d{2,3})/i);
    if (rwScoreMatch && rwScoreMatch[1]) {
        result.readingWritingScore = parseInt(rwScoreMatch[1]);
        console.log(`[SAT_STRUCTURE] Found Reading & Writing Score: ${result.readingWritingScore}`);
    }

    const mathScoreMatch = text.match(/Math\s*Score\s*[:\s]*(\d{2,3})/i);
    if (mathScoreMatch && mathScoreMatch[1]) {
        result.mathScore = parseInt(mathScoreMatch[1]);
        console.log(`[SAT_STRUCTURE] Found Math Score: ${result.mathScore}`);
    }
    
    // Try to count total questions from the text itself if a structured question section exists
    const questionNumbersInText = text.match(/\d+\s+Reading\s+and\s+Writing\s+[A-D]/g) || [];
    if (questionNumbersInText.length > 0) {
        result.totalQuestions = questionNumbersInText.length;
        console.log(`[SAT_STRUCTURE] Estimated total questions from text: ${result.totalQuestions}`);
    }
    
    // SAT table pattern from the screenshot - trying very specific patterns first
    const tableRowPatterns = [
        // Pattern for the exact format seen in the screenshot "1 Reading and Writing B B; Correct"
        /\s*(\d+)\s+(Reading\s+and\s+Writing)\s+([A-D])\s+([A-D]);\s*(Correct|Incorrect)/gim,
        
        // Slightly more flexible pattern with variable spacing
        /\s*(\d+)\s+(.+?)\s+([A-D])\s+([A-D]);\s*(Correct|Incorrect)/gim,
        
        // Even more flexible pattern to catch most table formats
        /\s*(\d+)\s+(.+?)\s+([A-D])\s+([A-D][^a-zA-Z]*(?:Correct|Incorrect))/gim,
        
        // Last resort pattern for anything that looks like question data
        /\s*(\d+)\s+([^\d]+?)\s+([A-D])\s+([A-D])/gim
    ];
    
    for (const pattern of tableRowPatterns) {
        pattern.lastIndex = 0; // Reset pattern
        let matches = [];
        let match;
        
        while ((match = pattern.exec(text)) !== null) {
            const questionNumber = match[1];
            const section = match[2]?.trim() || "Reading and Writing"; // Default to RW if unclear
            const correctAnswer = match[3];
            let yourAnswer, isCorrect;
            
            if (pattern === tableRowPatterns[3]) {
                // Last resort pattern - simple extraction
                yourAnswer = match[4];
                isCorrect = correctAnswer === yourAnswer;
            } else if (pattern === tableRowPatterns[2]) {
                // More flexible pattern
                const answerText = match[4];
                yourAnswer = answerText.substring(0, 1); // First character is the answer
                isCorrect = answerText.toLowerCase().includes('correct');
            } else {
                // Standard pattern
                yourAnswer = match[4];
                isCorrect = match[5]?.toLowerCase() === 'correct';
            }
            
            matches.push({
                questionNumber,
                section,
                correctAnswer,
                yourAnswer,
                isCorrect,
                review: 'Review' // Based on the screenshot
            });
        }
        
        if (matches.length > 0) {
            console.log(`[SAT_STRUCTURE] Found ${matches.length} questions using pattern ${tableRowPatterns.indexOf(pattern) + 1}`);
            result.detailedQuestions = matches;
            break;
        }
    }
    
    // If we still don't have questions, try with all texts from different modes
    if (result.detailedQuestions.length === 0 && allTexts) {
        console.log('[SAT_STRUCTURE] Trying to find questions in all extraction modes...');
        
        for (const mode in allTexts) {
            if (mode === 'TEXT_DETECTION' && text === allTexts[mode]) continue; // Skip if already tried
            
            const alternateText = allTexts[mode];
            console.log(`[SAT_STRUCTURE] Checking ${mode} text (length: ${alternateText.length})`);
            
            // Try all patterns on this alternate text
            for (const pattern of tableRowPatterns) {
                pattern.lastIndex = 0;
                let matches = [];
                let match;
                
                while ((match = pattern.exec(alternateText)) !== null) {
                    matches.push({
                        questionNumber: match[1],
                        section: match[2]?.trim() || "Reading and Writing",
                        correctAnswer: match[3],
                        yourAnswer: match[4]?.substring(0, 1) || match[4],
                        isCorrect: (match[5]?.toLowerCase() === 'correct') || 
                                  (match[4]?.toLowerCase().includes('correct')),
                        review: 'Review'
                    });
                }
                
                if (matches.length > 0) {
                    console.log(`[SAT_STRUCTURE] Found ${matches.length} questions in ${mode} text using pattern ${tableRowPatterns.indexOf(pattern) + 1}`);
                    result.detailedQuestions = matches;
                    break;
                }
            }
            
            if (result.detailedQuestions.length > 0) break;
        }
    }
    
    // Last chance - try to extract data from raw detection outputs
    if (result.detailedQuestions.length === 0) {
        // This last-resort approach would need more complex parsing of the raw Vision API results
        console.log('[SAT_STRUCTURE] No questions found using any pattern. Need more advanced parsing.');
    }
    
    // Count correct/incorrect answers
    if (result.detailedQuestions.length > 0) {
        result.totalQuestions = result.detailedQuestions.length;
        result.totalCorrect = result.detailedQuestions.filter(q => q.isCorrect).length;
        result.totalIncorrect = result.totalQuestions - result.totalCorrect;
        
        console.log(`[SAT_STRUCTURE] Questions: ${result.totalQuestions}, Correct: ${result.totalCorrect}, Incorrect: ${result.totalIncorrect}`);
    }

    return result;
  } catch (e) {
    console.error('[SAT_STRUCTURE_ERROR] Error parsing SAT results structure:', e.message, e.stack);
    return { error: 'Failed to parse SAT structure from text', details: e.message };
  }
}

// Extract text from a Vision API response using multiple fallback methods
function extractTextFromResponse(response) {
  if (!response || !response.responses || response.responses.length === 0) {
    const errorMsg = response && response.error ? response.error : 'No response object or empty responses array.';
    console.log(`[EXTRACT_TEXT] Invalid or error response from Vision API: ${errorMsg}`);
    if (response && response.errorDetailsBody) console.log(`[EXTRACT_TEXT] Vision API Error Body: ${response.errorDetailsBody.substring(0,300)}...`);
    return null;
  }

  try {
    let combinedText = '';
    console.log(`[EXTRACT_TEXT] Processing ${response.responses.length} page responses.`);
    
    for (const pageResponse of response.responses) {
      if (pageResponse.error) {
        console.warn(`[EXTRACT_TEXT] Error in page response: ${JSON.stringify(pageResponse.error).substring(0,200)}... Skipping page.`);
        continue;
      }
      
      // Try different extraction methods in order of reliability
      if (pageResponse.fullTextAnnotation && pageResponse.fullTextAnnotation.text) {
        combinedText += pageResponse.fullTextAnnotation.text + '\n\n';
        continue;
      }
      
      if (pageResponse.textAnnotations && pageResponse.textAnnotations.length > 0 && pageResponse.textAnnotations[0].description) {
        combinedText += pageResponse.textAnnotations[0].description + '\n\n';
        continue;
      }
      
      if (pageResponse.fullTextAnnotation && pageResponse.fullTextAnnotation.pages) {
        let pageDataText = '';
        pageResponse.fullTextAnnotation.pages.forEach(page => {
          if (page.blocks) page.blocks.forEach(block => {
            if (block.paragraphs) block.paragraphs.forEach(paragraph => {
              if (paragraph.words) paragraph.words.forEach(word => {
                if (word.symbols) word.symbols.forEach(symbol => pageDataText += symbol.text || '');
                pageDataText += ' ';
              });
              pageDataText += '\n';
                });
            });
        });
        if (pageDataText.length > 0) combinedText += pageDataText.trim() + '\n\n';
      }
    }
    
    const finalText = combinedText.trim();
    console.log(`[EXTRACT_TEXT] Final combined text length: ${finalText.length}`);
    return finalText.length > 0 ? finalText : null;
  } catch (e) {
    console.error('[EXTRACT_TEXT_ERROR] Error during text extraction logic:', e.message, e.stack);
    return null;
  }
}

serve(async (req) => {
  const requestStartTime = Date.now();
  console.log(`[REQUEST_START] Method: ${req.method}, URL: ${req.url}`);
  
  if (req.method === 'OPTIONS') {
    console.log('[REQUEST_OPTIONS] Handling OPTIONS preflight.');
    return new Response('ok', { headers: CORS_HEADERS, status: 200 });
  }
  if (req.method !== 'POST') {
    console.warn(`[REQUEST_REJECTED] Method ${req.method} not allowed.`);
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  try {
    if (!googleVisionApiKey) {
      console.error('[CRITICAL_ERROR] GOOGLE_VISION_API_KEY is not configured.');
      return new Response(JSON.stringify({ error: 'Server configuration error: Google Vision API key missing.', errorType: 'MISSING_API_KEY' }), 
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    const requestData = await req.json().catch(err => {
      console.error('[REQUEST_ERROR] Failed to parse request JSON:', err.message); return null;
    });
    if (!requestData) {
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body.' }), 
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    const { fileUrl, storagePath } = requestData;
    if (!fileUrl && !storagePath) {
      return new Response(JSON.stringify({ error: 'Missing fileUrl or storagePath.' }), 
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    let fileName = '';
    if (storagePath) {
      fileName = storagePath.split('/').pop() || 'unknown_from_storage.pdf';
    } else if (fileUrl) {
      try { 
        const url = new URL(fileUrl); 
        fileName = url.pathname.split('/').pop() || 'unknown_from_url.pdf'; 
      } catch { 
        fileName = 'unknown_from_invalid_url.pdf'; 
      }
    }
    console.log(`[FILE_ACQUISITION] Determined filename: ${fileName}`);

    const isTxtFile = fileName.toLowerCase().endsWith('.txt');
    
    let extractedTextForResponse = '';
    let processingDetailsForResponse = {};
    let satDataForResponse = null;
    let modeForResponse = isTxtFile ? 'text' : 'ocr_unknown'; // Default for PDF, will be updated by Vision result
    let fileTypeMessageForResponse = '';
    let warningForResponse = null;
    let technicalErrorForResponse = null;


    if (isTxtFile) {
      modeForResponse = 'text';
      console.log(`[PROCESS_INIT] Processing TXT file: "${fileName}"`);
      let rawTextContent = '';

      if (storagePath) {
        console.log(`[FILE_ACQUISITION] Using storagePath for TXT: ${storagePath}`);
        if (!supabaseAdmin) {
          console.error('[CRITICAL_ERROR] Supabase client not initialized, cannot access storage for TXT.');
          return new Response(JSON.stringify({ error: 'Server error: Storage client not available.', errorType: 'SUPABASE_CLIENT_ERROR' }),
            { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
        }
        const { data: fileBlob, error: dlError } = await supabaseAdmin.storage.from('score-reports').download(storagePath);
        if (dlError) {
          console.error(`[FILE_ACQUISITION_ERROR] Storage download failed for TXT "${storagePath}":`, dlError.message);
          return new Response(JSON.stringify({ error: `Storage download failed: ${dlError.message}`, errorType: 'STORAGE_DOWNLOAD_ERROR' }),
            { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
        }
        if (!fileBlob) {
          console.error(`[FILE_ACQUISITION_ERROR] No data returned from Storage for TXT "${storagePath}".`);
          return new Response(JSON.stringify({ error: 'File not found in storage or empty.', errorType: 'EMPTY_DOWNLOAD' }),
            { status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
        }
        rawTextContent = await fileBlob.text();
        console.log(`[FILE_ACQUISITION] Successfully read text from storage. Length: ${rawTextContent.length}`);
      } else if (fileUrl) {
        console.log(`[FILE_ACQUISITION] Using fileUrl for TXT: ${fileUrl}`);
        try {
          const response = await fetch(fileUrl, { method: 'GET' });
          if (!response.ok) {
            console.error(`[FILE_ACQUISITION_ERROR] URL fetch failed for TXT "${fileUrl}": ${response.status} ${response.statusText}`);
            return new Response(JSON.stringify({ error: `URL fetch failed: ${response.status} ${response.statusText}`, errorType: 'URL_FETCH_ERROR' }),
              { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
          }
          rawTextContent = await response.text();
          console.log(`[FILE_ACQUISITION] Successfully fetched text from URL. Length: ${rawTextContent.length}`);
        } catch (fetchErr) {
          console.error(`[FILE_ACQUISITION_ERROR] Network error fetching TXT from URL "${fileUrl}":`, fetchErr.message);
          return new Response(JSON.stringify({ error: `Network error during file fetch: ${fetchErr.message}`, errorType: 'FETCH_ERROR' }),
            { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
        }
      }

      if (!rawTextContent && extractedTextForResponse === '') { // Check if error already handled by return
          console.error('[CRITICAL_ERROR] Failed to obtain TXT content after checks.');
          return new Response(JSON.stringify({ error: 'Internal error: Failed to load TXT content.', errorType: 'EMPTY_TXT_CONTENT' }),
            { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
      }
      
      extractedTextForResponse = rawTextContent;
      processingDetailsForResponse = { type: 'direct_text_extraction' };
      
      if (isSatTestResult(fileName)) {
        console.log(`[SAT_STRUCTURE] Attempting to structure SAT data from TXT content for "${fileName}".`);
        satDataForResponse = structureSatResults(extractedTextForResponse, fileName, {});
        if (!satDataForResponse && fileName.toLowerCase().includes('mypractice')) { // Check MyPractice if primary fails
            satDataForResponse = extractMyPracticeSatData(extractedTextForResponse, fileName);
        }
        fileTypeMessageForResponse = 'File processed as SAT/Practice Test report (TXT mode).';
        if (!satDataForResponse) {
            warningForResponse = "File identified as SAT report, but no structured data could be parsed from the TXT content.";
        }
      } else {
        fileTypeMessageForResponse = 'File processed as generic TXT.';
      }

    } else { // Existing PDF processing logic
      if (!googleVisionApiKey) {
        console.error('[CRITICAL_ERROR] GOOGLE_VISION_API_KEY is not configured (required for PDF processing).');
        return new Response(JSON.stringify({ error: 'Server configuration error: Google Vision API key missing for PDF processing.', errorType: 'MISSING_API_KEY_FOR_PDF' }), 
          { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
      }

      let pdfBase64Content = '';
      console.log(`[FILE_ACQUISITION] Attempting to get PDF for OCR. StoragePath: ${storagePath}, FileURL: ${fileUrl}`);

      if (storagePath) {
        fileName = storagePath.split('/').pop() || 'unknown_from_storage.pdf';
        console.log(`[FILE_ACQUISITION] Using storagePath for PDF: ${storagePath}, determined filename: ${fileName}`);
        if (!supabaseAdmin) {
          console.error('[CRITICAL_ERROR] Supabase client not initialized, cannot access storage for PDF.');
          return new Response(JSON.stringify({ error: 'Server error: Storage client not available.', errorType: 'SUPABASE_CLIENT_ERROR' }),
            { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
        }
        const { data: fileData, error: dlError } = await supabaseAdmin.storage.from('score-reports').download(storagePath);
        if (dlError) {
          console.error(`[FILE_ACQUISITION_ERROR] Storage download failed for PDF "${storagePath}":`, dlError.message);
          return new Response(JSON.stringify({ error: `Storage download failed: ${dlError.message}`, errorType: 'STORAGE_DOWNLOAD_ERROR' }),
            { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
        }
        if (!fileData) {
          console.error(`[FILE_ACQUISITION_ERROR] No data returned from Storage for PDF "${storagePath}".`);
          return new Response(JSON.stringify({ error: 'File not found in storage or empty.', errorType: 'EMPTY_DOWNLOAD' }),
            { status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
        }
        pdfBase64Content = btoa(String.fromCharCode(...new Uint8Array(await fileData.arrayBuffer())));
        console.log(`[FILE_ACQUISITION] Successfully downloaded PDF and base64 encoded from storage. Length: ${pdfBase64Content.length}`);
      } else if (fileUrl) {
        try { const url = new URL(fileUrl); fileName = url.pathname.split('/').pop() || 'unknown_from_url.pdf'; } catch { fileName = 'unknown_from_invalid_url.pdf'; }
        console.log(`[FILE_ACQUISITION] Using fileUrl for PDF: ${fileUrl}, determined filename: ${fileName}`);
        try {
          const response = await fetch(fileUrl, { method: 'GET' });
          if (!response.ok) {
            console.error(`[FILE_ACQUISITION_ERROR] URL fetch failed for PDF "${fileUrl}": ${response.status} ${response.statusText}`);
            return new Response(JSON.stringify({ error: `URL fetch failed: ${response.status} ${response.statusText}`, errorType: 'URL_FETCH_ERROR' }),
              { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
          }
          pdfBase64Content = btoa(String.fromCharCode(...new Uint8Array(await response.arrayBuffer())));
          console.log(`[FILE_ACQUISITION] Successfully fetched PDF and base64 encoded from URL. Length: ${pdfBase64Content.length}`);
        } catch (fetchErr) {
          console.error(`[FILE_ACQUISITION_ERROR] Network error fetching PDF from URL "${fileUrl}":`, fetchErr.message);
          return new Response(JSON.stringify({ error: `Network error during file fetch: ${fetchErr.message}`, errorType: 'FETCH_ERROR' }),
            { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
        }
      }

      if (!pdfBase64Content && extractedTextForResponse === '') { // Check if error already handled
        console.error('[CRITICAL_ERROR] Failed to obtain PDF content after checks.');
        return new Response(JSON.stringify({ error: 'Internal error: Failed to load PDF content.', errorType: 'EMPTY_PDF_CONTENT' }),
          { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
      }

      console.log(`[PROCESS_INIT] Processing PDF file: "${fileName}" (base64 length: ${pdfBase64Content.length}) using Vision API...`);
      const result = await processPdfWithVision(pdfBase64Content, googleVisionApiKey, { 
        fileName,
        debug: true // Enable full response logging
      });
      
      if (result.error) {
        console.error(`[PROCESS_RESULT_FAIL] PDF processing failed for "${fileName}". Error: ${result.error}`);
        let fallbackText = 'Unable to extract details from this PDF format.';
        if (isSatTestResult(fileName)) {
          fallbackText = 'SAT Practice Test Results\n\nQuestion - Section - Correct Answer - Your Answer\n' + fallbackText;
        }
        extractedTextForResponse = fallbackText;
        warningForResponse = 'Could not extract text from the PDF. Check server logs for Vision API responses.';
        processingDetailsForResponse = result.visionResponses; // Store vision responses here
        technicalErrorForResponse = result.error;
        modeForResponse = 'ocr_error';
        fileTypeMessageForResponse = isSatTestResult(fileName) ? 'File processed as SAT/Practice Test report (OCR attempt failed).' : 'File processed as generic PDF (OCR attempt failed).';
      } else {
        console.log(`[PROCESS_RESULT_SUCCESS] Text extraction successful for "${fileName}" using ${result.mode} mode.`);
        extractedTextForResponse = result.extractedText;
        modeForResponse = result.mode; 
        processingDetailsForResponse = result.visionResponses;
        satDataForResponse = result.satSpecific;
        fileTypeMessageForResponse = isSatTestResult(fileName) ? `File processed as SAT/Practice Test report (OCR mode: ${result.mode}).` : `File processed as generic PDF (OCR mode: ${result.mode}).`;
        
        if (result.satSpecific) {
          console.log(`[PROCESS_RESULT_SUCCESS] Structured SAT data extracted for "${fileName}".`);
        } else if (isSatTestResult(fileName)) {
          warningForResponse = `File "${fileName}" was identified as SAT report (OCR), but no structured data could be parsed from extracted text.`;
          console.warn(warningForResponse);
        }
      }
    }
    
    const finalResponseData = { 
      extractedText: extractedTextForResponse,
      mode: modeForResponse,
      details: processingDetailsForResponse,
      fileName: fileName,
      fileTypeMessage: fileTypeMessageForResponse,
      structuredSatData: satDataForResponse,
      warning: warningForResponse,
      technicalError: technicalErrorForResponse,
    };
    
    const duration = Date.now() - requestStartTime;
    console.log(`[REQUEST_END] Successfully processed "${fileName}". Mode: ${modeForResponse}. Duration: ${duration}ms.`);
    return new Response(JSON.stringify(finalResponseData), {
      status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });

  } catch (unhandledError) {
    const duration = Date.now() - requestStartTime;
    console.error(`[UNHANDLED_ERROR] Unhandled error in main serve function. Duration: ${duration}ms. Error:`, unhandledError.message, unhandledError.stack);
    return new Response(JSON.stringify({ 
      extractedText: '',
      error: 'An unexpected internal server error occurred. Please check server logs.',
      errorType: 'UNHANDLED_SERVER_ERROR',
      details: { errorMessage: unhandledError.message } 
    }), { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  }
});

/*
v1.5-txt Changelog:
- Added support for .txt file uploads.
  - If a .txt file is provided, its content is read directly, bypassing OCR.
  - PDF files are still processed using Google Vision API.
- SAT structure parsing is attempted for both .txt and PDF SAT reports.
- Response includes 'mode' ('text' or OCR mode like 'text_detection')
- Conditional GOOGLE_VISION_API_KEY check (only if processing a PDF).

Note: Before deploying, make sure the following secrets are configured in Supabase:
1. GOOGLE_VISION_API_KEY - Your Google Cloud Vision API key (needed for PDFs)
2. PROJECT_URL - Your Supabase project URL
3. PROJECT_SERVICE_ROLE_KEY - Your Supabase service role key
To deploy:
supabase functions deploy ocr-pdf --project-ref YOUR_PROJECT_REF
*/ 