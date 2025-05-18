import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, Paper, Button, CircularProgress, Alert } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DeleteIcon from '@mui/icons-material/Delete';
import { supabase } from '../supabaseClient';

// Text styles for better contrast in dark theme
const textStyles = {
  heading: {
    color: 'rgba(255, 255, 255, 0.87)', // High-emphasis text at 87% opacity
    textShadow: '0 1px 2px rgba(0,0,0,0.2)'
  },
  subheading: {
    color: 'rgba(255, 255, 255, 0.87)', // High-emphasis text at 87% opacity
    opacity: 0.9
  },
  body: {
    color: 'rgba(255, 255, 255, 0.7)' // Medium-emphasis text at 70% opacity
  },
  label: {
    color: 'rgba(255, 255, 255, 0.87)',  // High-emphasis text at 87% opacity
    fontWeight: 500
  },
  secondary: {
    color: 'rgba(255, 255, 255, 0.6)' // Secondary text at 60% opacity
  },
  disabled: {
    color: 'rgba(255, 255, 255, 0.38)' // Disabled text at 38% opacity
  },
  accent: {
    color: 'rgba(136, 212, 152, 0.9)' // Desaturated accent color
  }
};

interface PdfUploaderProps {
  onUploadComplete: (url: string) => void;
  onTextExtracted?: (text: string) => void;
}

const PdfUploader: React.FC<PdfUploaderProps> = ({ 
  onUploadComplete, 
  onTextExtracted 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [extractingText, setExtractingText] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    
    // Check file type
    if (selectedFile && selectedFile.type !== 'application/pdf') {
      setUploadError('Please upload a PDF file');
      return;
    }

    // Check file size (max 10MB)
    if (selectedFile && selectedFile.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB limit');
      return;
    }

    setFile(selectedFile);
    setUploadError(null);
    setUploadSuccess(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  });

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setUploadError(null);
    
    try {
      // Get current user id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `satscores/${fileName}`;
      
      // Upload file to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);
      
      // Call the onUploadComplete callback with the URL
      onUploadComplete(publicUrl);
      setUploadSuccess(true);
      
      // Process the PDF for text extraction if needed
      if (onTextExtracted) {
        await extractTextFromPdf(filePath);
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setUploadError(error.message || 'Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const extractTextFromPdf = async (filePath: string) => {
    if (!onTextExtracted) return;
    
    setExtractingText(true);
    
    try {
      // Call Supabase Edge Function for PDF extraction
      // Note: You would need to implement this function
      const { data, error } = await supabase.functions.invoke('ocr-pdf', {
        body: { filePath }
      });
      
      if (error) throw error;
      
      if (data?.text) {
        onTextExtracted(data.text);
      }
    } catch (error: any) {
      console.error('Error extracting text from PDF:', error);
      // Don't set an error here, as the upload still succeeded
    } finally {
      setExtractingText(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setUploadSuccess(false);
    setUploadError(null);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {uploadSuccess ? (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Alert 
            severity="success" 
            sx={{ 
              mb: 2, 
              backgroundColor: 'rgba(46, 125, 50, 0.2)', 
              color: 'rgba(255, 255, 255, 0.87)'
            }}
          >
            PDF uploaded successfully!
          </Alert>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              mb: 2 
            }}
          >
            <PictureAsPdfIcon sx={{ mr: 1, color: 'rgba(136, 212, 152, 0.9)' }} />
            <Typography variant="body1" noWrap sx={textStyles.body}>
              {file?.name}
            </Typography>
          </Box>
          <Button 
            startIcon={<DeleteIcon />} 
            onClick={handleRemove}
            variant="outlined"
            sx={{
              color: 'rgba(255, 255, 255, 0.87)',
              borderColor: 'rgba(211, 47, 47, 0.7)',
              '&:hover': {
                borderColor: 'rgba(211, 47, 47, 0.9)',
                backgroundColor: 'rgba(211, 47, 47, 0.08)'
              }
            }}
            size="small"
          >
            Remove File
          </Button>
        </Box>
      ) : (
        <>
          <Paper
            {...getRootProps()}
            sx={{
              p: 3,
              border: '2px dashed',
              borderColor: isDragActive ? 'rgba(136, 212, 152, 0.9)' : 'rgba(255, 255, 255, 0.23)',
              borderRadius: 2,
              backgroundColor: isDragActive ? 'rgba(26, 147, 111, 0.08)' : 'rgba(33, 33, 33, 0.95)',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: 'rgba(136, 212, 152, 0.9)',
                backgroundColor: 'rgba(26, 147, 111, 0.08)'
              }
            }}
          >
            <input {...getInputProps()} />
            <CloudUploadIcon 
              sx={{ 
                fontSize: 48, 
                mb: 2,
                color: 'rgba(136, 212, 152, 0.9)',
                animation: isDragActive ? 'pulse 1.5s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.1)' },
                  '100%': { transform: 'scale(1)' },
                }
              }} 
            />
            <Typography variant="h6" gutterBottom sx={textStyles.heading}>
              {isDragActive
                ? "Drop the PDF here"
                : "Drag & drop your SAT Score Report"}
            </Typography>
            <Typography variant="body2" sx={textStyles.secondary}>
              or click to select a file
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 1, ...textStyles.secondary }}>
              PDF only, max 10MB
            </Typography>
          </Paper>
          
          {file && (
            <Box sx={{ 
              mt: 2, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              p: 2,
              backgroundColor: 'rgba(33, 33, 33, 0.8)',
              borderRadius: 1
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PictureAsPdfIcon sx={{ mr: 1, color: 'rgba(136, 212, 152, 0.9)' }} />
                <Typography variant="body2" noWrap sx={{ maxWidth: 200, ...textStyles.body }}>
                  {file.name}
                </Typography>
              </Box>
              <Box>
                <Button
                  variant="contained"
                  onClick={handleUpload}
                  disabled={uploading || !file}
                  sx={{ 
                    mr: 1,
                    background: 'linear-gradient(90deg, #1a936f 0%, #114b5f 100%)',
                    color: 'rgba(255, 255, 255, 0.95)',
                    fontWeight: 500,
                    '&:hover': {
                      background: 'linear-gradient(90deg, #114b5f 0%, #1a936f 100%)',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
                    },
                    '&.Mui-disabled': {
                      background: 'rgba(136, 212, 152, 0.2)',
                      color: 'rgba(255, 255, 255, 0.38)'
                    }
                  }}
                >
                  {uploading ? <CircularProgress size={24} sx={{ color: 'rgba(255, 255, 255, 0.87)' }} /> : 'Upload'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleRemove}
                  disabled={uploading}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.87)',
                    borderColor: 'rgba(211, 47, 47, 0.7)',
                    '&:hover': {
                      borderColor: 'rgba(211, 47, 47, 0.9)',
                      backgroundColor: 'rgba(211, 47, 47, 0.08)'
                    },
                    '&.Mui-disabled': {
                      borderColor: 'rgba(255, 255, 255, 0.12)',
                      color: 'rgba(255, 255, 255, 0.38)'
                    }
                  }}
                >
                  Remove
                </Button>
              </Box>
            </Box>
          )}
          
          {uploadError && (
            <Alert 
              severity="error" 
              sx={{ 
                mt: 2, 
                backgroundColor: 'rgba(211, 47, 47, 0.15)', 
                color: 'rgba(255, 255, 255, 0.87)'
              }}
            >
              {uploadError}
            </Alert>
          )}
          
          {extractingText && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <CircularProgress size={20} sx={{ mr: 1, color: 'rgba(136, 212, 152, 0.9)' }} />
              <Typography variant="body2" sx={textStyles.body}>
                Extracting text from PDF...
              </Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default PdfUploader; 