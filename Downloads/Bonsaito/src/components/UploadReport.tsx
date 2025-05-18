import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useDropzone } from 'react-dropzone';
import { BarLoader } from 'react-spinners';
import { toast } from 'react-toastify';
import { generateQuestionsFromMistakes } from '../services/geminiPdfService';
import LoadingAnimation from './LoadingAnimation';

interface User {
  id: string;
  [key: string]: any;
}

interface UploadReportProps {
  user: User | null;
}

const UploadReport: React.FC<UploadReportProps> = ({ user }) => {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [inputMethod, setInputMethod] = useState('file'); // 'file' or 'text'
  const [pastedText, setPastedText] = useState('');
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt']
    },
    onDrop: acceptedFiles => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
        setInputMethod('file');
      }
    }
  });

  const generatePracticeQuestions = async (input: string | File, fileUrl?: string) => {
    try {
      setGeneratingQuestions(true);
      toast.info('Generating personalized practice questions...', { autoClose: false, toastId: 'generating-questions' });
      
      // Call the Gemini API to generate questions
      const questions = await generateQuestionsFromMistakes(input);
      
      if (!questions || questions.length === 0) {
        throw new Error('Failed to generate practice questions');
      }
      
      toast.dismiss('generating-questions');
      toast.success(`Successfully generated ${questions.length} practice questions!`);
      
      // Store the questions in the database
      if (user) {
        const { error: insertError } = await supabase.from('practice_questions').insert(
          questions.map(q => ({
            user_id: user.id,
            question_data: q,
            source: 'upload',
            completed: false
          }))
        );
        
        if (insertError) {
          console.error('Error storing practice questions:', insertError);
          toast.error('Error saving questions to your account');
        } else {
          toast.success('Questions are ready in your dashboard!');
        }
      }
      
      return questions;
    } catch (error: any) {
      console.error('Error generating practice questions:', error);
      toast.dismiss('generating-questions');
      toast.error('Error generating practice questions: ' + (error.message || 'Unknown error'));
      return [];
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleUpload = async () => {
    if (!user) {
      toast.error('You must be logged in to upload a report');
      return;
    }

    if (!file && inputMethod === 'file') {
      toast.error('Please select a file to upload');
      return;
    }
    
    if (!pastedText && inputMethod === 'text') {
      toast.error('Please paste your report text');
      return;
    }
    
    setUploading(true);
    
    try {
      let uploadedFileUrl = '';
      
      if (inputMethod === 'file' && file) {
        // Handle file upload to storage for record-keeping
        const filePath = `${user.id}/${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
          .from('score-reports')
          .upload(filePath, file);

        if (error) {
          throw new Error(error.message);
        }
        
        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('score-reports')
          .getPublicUrl(filePath);
          
        uploadedFileUrl = publicUrl;
        
        // Process the file directly with Gemini API
        toast.info('Processing your file...', { autoClose: false, toastId: 'processing-file' });
        
        // For PDFs or text files, use Gemini API directly
        await generatePracticeQuestions(file);
        
        toast.dismiss('processing-file');
        toast.success('Report processed successfully!');
      } else if (inputMethod === 'text' && pastedText) {
        // Process the pasted text directly
        await generatePracticeQuestions(pastedText);
      }

      // Clear form after successful processing
      setFile(null);
      setPastedText('');
      
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error occurred';
      toast.error('Error uploading report: ' + errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const ExpressApp = () => {
    return (
      <div className="upload-report-container p-4 md:p-8 max-w-2xl mx-auto bg-white shadow-xl rounded-lg">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-700">Upload Your Score Report</h2>

        {user ? (
          <>
            <div className="mb-6">
              <div className="flex space-x-4 mb-4">
                <button 
                  onClick={() => setInputMethod('file')}
                  className={`flex-1 py-2 px-4 rounded-lg ${inputMethod === 'file' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Upload File
                </button>
                <button 
                  onClick={() => setInputMethod('text')}
                  className={`flex-1 py-2 px-4 rounded-lg ${inputMethod === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Paste Text
                </button>
              </div>
              
              {inputMethod === 'file' ? (
                // File Upload UI
                <>
                  <div {...getRootProps()} className="dropzone bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors">
                    <input {...getInputProps()} />
                    {isDragActive ? (
                      <p className="text-blue-600">Drop the files here ...</p>
                    ) : (
                      <div>
                        <p className="text-gray-700 mb-2">Drag 'n' drop your SAT report file here, or click to select</p>
                        <p className="text-gray-500 text-sm">Accepted formats: .txt, .pdf</p>
                        <p className="text-gray-500 text-sm mt-1">TXT format is recommended for more reliable results</p>
                      </div>
                    )}
                  </div>
                  {file && (
                    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                      <p className="font-semibold text-gray-700">Selected file: <span className="font-normal text-blue-600">{file.name}</span></p>
                      <button 
                        onClick={() => setFile(null)} 
                        className="mt-2 text-sm text-red-500 hover:text-red-700"
                      >
                        Remove file
                      </button>
                    </div>
                  )}
                </>
              ) : (
                // Text Paste UI
                <div className="mt-2">
                  <label className="block text-gray-700 mb-2">Paste your SAT report text here:</label>
                  <textarea 
                    className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Copy and paste your entire SAT report text content here..."
                  />
                  {pastedText && (
                    <div className="mt-2 text-right">
                      <span className="text-sm text-gray-500">{pastedText.length} characters</span>
                      <button
                        onClick={() => setPastedText('')}
                        className="ml-4 text-sm text-red-500 hover:text-red-700"
                      >
                        Clear text
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <button 
              onClick={handleUpload}
              disabled={(!file && inputMethod === 'file') || (!pastedText && inputMethod === 'text') || uploading || generatingQuestions}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {uploading || generatingQuestions ? (
                <div className="flex items-center justify-center w-full">
                  <LoadingAnimation 
                    message={uploading ? "Processing..." : "Generating questions..."} 
                    width={60} 
                    height={60} 
                  />
                </div>
              ) : (
                'Process Report'
              )}
            </button>
          </>
        ) : (
          <p className="text-center text-red-500">Please <a href="/login" className="underline">log in</a> to upload a report.</p>
        )}
      </div>
    );
  };

  return ExpressApp();
};

export default UploadReport;