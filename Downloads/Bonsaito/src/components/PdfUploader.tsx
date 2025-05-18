import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, Paper, Button, CircularProgress, Alert } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DeleteIcon from '@mui/icons-material/Delete';
import { supabase } from '../supabaseClient';

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
          <Alert severity="success" sx={{ mb: 2 }}>
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
            <PictureAsPdfIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="body1" noWrap>
              {file?.name}
            </Typography>
          </Box>
          <Button 
            startIcon={<DeleteIcon />} 
            onClick={handleRemove}
            variant="outlined"
            color="error"
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
              borderColor: isDragActive ? 'primary.main' : 'divider',
              borderRadius: 2,
              backgroundColor: isDragActive ? 'rgba(76, 175, 80, 0.04)' : 'background.paper',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'rgba(76, 175, 80, 0.04)'
              }
            }}
          >
            <input {...getInputProps()} />
            <CloudUploadIcon 
              color="primary" 
              sx={{ 
                fontSize: 48, 
                mb: 2,
                animation: isDragActive ? 'pulse 1.5s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.1)' },
                  '100%': { transform: 'scale(1)' },
                }
              }} 
            />
            <Typography variant="h6" gutterBottom>
              {isDragActive
                ? "Drop the PDF here"
                : "Drag & drop your SAT Score Report"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              or click to select a file
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              PDF only, max 10MB
            </Typography>
          </Paper>
          
          {file && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PictureAsPdfIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                  {file.name}
                </Typography>
              </Box>
              <Box>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleUpload}
                  disabled={uploading || !file}
                  sx={{ mr: 1 }}
                >
                  {uploading ? <CircularProgress size={24} /> : 'Upload'}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleRemove}
                  disabled={uploading}
                >
                  Remove
                </Button>
              </Box>
            </Box>
          )}
          
          {uploadError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {uploadError}
            </Alert>
          )}
          
          {extractingText && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              <Typography variant="body2">
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