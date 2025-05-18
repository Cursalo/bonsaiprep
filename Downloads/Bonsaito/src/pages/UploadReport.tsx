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
  Alert,
  Tabs,
  Tab,
  TextField
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import { useDropzone } from 'react-dropzone';
import { uploadFileToSupabase, ocrPdfFromSupabase } from '../services/ocrService'; 
import { generateQuestionsFromMistakes, GeneratedQuestion } from '../services/aiService';
import { supabase } from '../supabaseClient';

const UploadReport: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false); 
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]); 
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [inputMethod, setInputMethod] = useState<string>('file'); // 'file' or 'text'
  const [pastedText, setPastedText] = useState<string>('');

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const validFileTypes = ['application/pdf', 'text/plain'];
      
      if (!validFileTypes.includes(file.type)) {
        setError('Invalid file type. Please upload a PDF or TXT file.');
        setUploadedFile(null);
        return;
      }
      
      setUploadedFile(file);
      setError(null);
      setExtractedText(null);
      setGeneratedQuestions([]);
      setIsLoading(true);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('No active session. Please log in again.');
          setIsLoading(false);
          return;
        }

        // Handle differently based on file type
        if (file.type === 'text/plain') {
          // For text files, read the content directly
          setLoadingMessage('Reading text file content...');
          const text = await file.text();
          setExtractedText(text);
          
          setLoadingMessage('Generating practice questions with AI...');
          const questions = await generateQuestionsFromMistakes(text);
          setGeneratedQuestions(questions);
        } else {
          // PDF processing flow
          setLoadingMessage('Uploading PDF to secure storage...');
          const { storagePath, publicUrl } = await uploadFileToSupabase(file, 'score-reports', { publicAccess: false });
          console.log('File uploaded:', { storagePath, publicUrl });

          setLoadingMessage('Extracting text from PDF (OCR process)... This may take a moment.');
          const text = await ocrPdfFromSupabase(publicUrl, storagePath);
          setExtractedText(text);
          console.log('Text extracted:', text.substring(0, 100) + '...');
          
          setLoadingMessage('Generating practice questions with AI...');
          const questions = await generateQuestionsFromMistakes(text);
          setGeneratedQuestions(questions);
        }
      } catch (err: any) {
        console.error("Error processing file:", err);
        setError(`Failed to process the file: ${err.message || 'Unknown error'}. Check console for details.`);
      } finally {
        setIsLoading(false);
        setLoadingMessage('');
      }
    }
  }, []);

  const handleTextSubmit = async () => {
    if (!pastedText.trim()) {
      setError('Please paste some text before submitting.');
      return;
    }

    setError(null);
    setExtractedText(null);
    setGeneratedQuestions([]);
    setIsLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('No active session. Please log in again.');
        setIsLoading(false);
        return;
      }

      // Process the pasted text directly
      setLoadingMessage('Processing your text input...');
      setExtractedText(pastedText);
      
      setLoadingMessage('Generating practice questions with AI...');
      const questions = await generateQuestionsFromMistakes(pastedText);
      setGeneratedQuestions(questions);
    } catch (err: any) {
      console.error("Error processing text:", err);
      setError(`Failed to process text: ${err.message || 'Unknown error'}. Check console for details.`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt']
    },
    multiple: false,
    disabled: isLoading || inputMethod === 'text'
  });

  const handleInputMethodChange = (_event: React.SyntheticEvent, newValue: string) => {
    setInputMethod(newValue);
    // Reset state when changing methods
    setError(null);
    setUploadedFile(null);
    setPastedText('');
    setExtractedText(null);
    setGeneratedQuestions([]);
  };

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
          Upload your report or paste text to get personalized lessons and practice questions.
        </Typography>

        <Box sx={{ width: '100%', mb: 3 }}>
          <Tabs
            value={inputMethod}
            onChange={handleInputMethodChange}
            centered
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab value="file" label="Upload File" icon={<CloudUploadIcon />} iconPosition="start" />
            <Tab value="text" label="Paste Text" icon={<TextFieldsIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {inputMethod === 'file' ? (
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
              <Typography variant="h6">Drop the file here ...</Typography>
            ) : (
              <Typography variant="h6">Drag 'n' drop a file here, or click to select file</Typography>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              (Max file size: 10MB. Supported formats: PDF, TXT)
            </Typography>
          </Paper>
        ) : (
          <Paper elevation={3} sx={{ p: 4, mt: 3 }}>
            <Typography variant="h6" gutterBottom>Paste Your SAT Report Text</Typography>
            <TextField
              fullWidth
              multiline
              rows={10}
              variant="outlined"
              placeholder="Paste the content of your SAT report here..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              disabled={isLoading}
              sx={{ mb: 2 }}
            />
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleTextSubmit}
              disabled={!pastedText.trim() || isLoading}
              fullWidth
            >
              Process Text
            </Button>
          </Paper>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {uploadedFile && inputMethod === 'file' && !error && !isLoading && (
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
            <Typography variant="h6">Extracted Text (Preview):</Typography>
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