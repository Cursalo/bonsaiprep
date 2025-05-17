import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  AppBar,
  Toolbar,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useDropzone } from 'react-dropzone';
import { uploadFileToSupabase, ocrPdfFromSupabase } from '../services/ocrService'; 
import { generateQuestionsFromMistakes, GeneratedQuestion } from '../services/aiService';

const UploadReport: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false); 
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]); 
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type !== 'application/pdf') {
        setError('Invalid file type. Please upload a PDF.');
        setUploadedFile(null);
        return;
      }
      setUploadedFile(file);
      setError(null);
      setExtractedText(null);
      setGeneratedQuestions([]);
      setIsLoading(true);
      
      try {
        setLoadingMessage('Uploading PDF to secure storage...');
        // You might want to make this public if your OCR function needs a public URL
        // and your bucket policies allow. Otherwise, pass storagePath.
        const { storagePath, publicUrl } = await uploadFileToSupabase(file, 'score-reports', { publicAccess: false });
        console.log('File uploaded:', { storagePath, publicUrl });

        setLoadingMessage('Extracting text from PDF (OCR process)... This may take a moment.');
        // Use publicUrl if available and preferred by your OCR function, otherwise storagePath
        const text = await ocrPdfFromSupabase(publicUrl, storagePath);
        setExtractedText(text);
        console.log('Text extracted:', text.substring(0, 100) + '...');
        
        setLoadingMessage('Generating practice questions with AI...');
        const questions = await generateQuestionsFromMistakes(text);
        setGeneratedQuestions(questions);
        console.log('Questions generated:', questions);

      } catch (err: any) {
        console.error("Error processing file:", err);
        setError(`Failed to process the PDF: ${err.message || 'Unknown error'}. Check console for details.`);
      } finally {
        setIsLoading(false);
        setLoadingMessage('');
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle} 
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Upload Score Report
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Upload Your SAT Practice Report
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" paragraph>
          Upload your PDF score report to get personalized lessons and practice questions.
        </Typography>

        <Paper
          {...getRootProps()}
          elevation={3}
          sx={{
            p: 4,
            mt: 3,
            textAlign: 'center',
            border: isDragActive ? '2px dashed primary.main' : '2px dashed grey.500',
            backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
            cursor: 'pointer',
            minHeight: 200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <input {...getInputProps()} />
          <CloudUploadIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          {isDragActive ? (
            <Typography variant="h6">Drop the PDF here ...</Typography>
          ) : (
            <Typography variant="h6">Drag 'n' drop a PDF file here, or click to select file</Typography>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            (Max file size: 10MB. Supported format: PDF)
          </Typography>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {uploadedFile && !error && !isLoading && (
          <Paper elevation={1} sx={{ p: 2, mt: 3 }}>
            <Typography variant="h6">Uploaded File:</Typography>
            <Typography>{uploadedFile.name} ({Math.round(uploadedFile.size / 1024)} KB)</Typography>
          </Paper>
        )}

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 4 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>{loadingMessage || 'Processing your report...'}</Typography>
          </Box>
        )}

        {extractedText && !isLoading && (
          <Paper elevation={1} sx={{ p: 2, mt: 3 }}>
            <Typography variant="h6">Extracted Text (Preview from OCR):</Typography>
            <Typography variant="body2" sx={{ maxHeight: 150, overflowY: 'auto', whiteSpace: 'pre-wrap', backgroundColor: 'grey.100', p:1, borderRadius:1 }}>
              {extractedText}
            </Typography>
          </Paper>
        )}
        
        {generatedQuestions.length > 0 && !isLoading && (
          <Paper elevation={1} sx={{ p: 2, mt: 3 }}>
            <Typography variant="h6">AI Generated Practice Questions:</Typography>
            {generatedQuestions.map(q => (
              <Box key={q.id} sx={{ mb: 2, p:1.5, border: '1px solid #e0e0e0', borderRadius: 1}}>
                <Typography variant="subtitle1" gutterBottom>Topic: {q.topic}</Typography>
                <Typography variant="body1" gutterBottom><strong>Question:</strong> {q.text}</Typography>
                {q.options && (
                  <Box sx={{mb:1}}>
                    <Typography variant="body2">Options:</Typography>
                    <ul>
                      {q.options.map((opt, index) => <li key={index}><Typography variant="body2">{opt}</Typography></li>)}
                    </ul>
                  </Box>
                )}
                {q.answer && <Typography variant="body2" sx={{color: 'green', fontWeight: 'bold'}}>Answer: {q.answer}</Typography>}
                {q.explanation && <Typography variant="caption" display="block" sx={{mt:0.5, color: 'text.secondary'}}>Explanation: {q.explanation}</Typography>}
              </Box>
            ))}
          </Paper>
        )}

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Button component={Link} to="/dashboard" variant="outlined">
            Back to Dashboard
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default UploadReport; 