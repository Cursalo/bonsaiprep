import React, { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  TextField,
  Card,
  CardContent,
  Divider,
  Chip,
  Grid,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  RadioGroup,
  Radio,
  FormControlLabel,
  Collapse,
  Fade,
  Badge,
  Tooltip
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import SchoolIcon from '@mui/icons-material/School';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import EmojiNatureIcon from '@mui/icons-material/EmojiNature';
import { useDropzone } from 'react-dropzone';
import { uploadFileToSupabase, ocrPdfFromSupabase } from '../services/ocrService'; 
import { generateQuestionsFromMistakes, GeneratedQuestion } from '../services/aiService';
import { supabase } from '../supabaseClient';
import { useSkills } from '../components/SkillsProvider';
import Lottie from 'lottie-react';

// Define an interface for user answers
interface StudentAnswers {
  [questionId: string]: string;
}

// Interface for tracking which skills are improved by which questions
interface QuestionSkillMapping {
  [questionId: string]: string; // maps question id to skill id
}

// Function to simulate processing delay
const addProcessingDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const UploadReport: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { skills, updateSkillProgress } = useSkills();
  
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false); 
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]); 
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [inputMethod, setInputMethod] = useState<string>('file'); // 'file' or 'text'
  const [pastedText, setPastedText] = useState<string>('');
  const [activeStep, setActiveStep] = useState<number>(0);
  const [apiKeyMissing, setApiKeyMissing] = useState<boolean>(!process.env.REACT_APP_GEMINI_API_KEY);
  
  // New state for tracking student answers and showing explanations
  const [studentAnswers, setStudentAnswers] = useState<StudentAnswers>({});
  const [showExplanations, setShowExplanations] = useState<{[key: string]: boolean}>({});
  const [correctAnswers, setCorrectAnswers] = useState<string[]>([]);
  const [questionSkillMap, setQuestionSkillMap] = useState<QuestionSkillMapping>({});
  const [showTreeGrowthBadge, setShowTreeGrowthBadge] = useState<boolean>(false);
  const [treeBadgeCount, setTreeBadgeCount] = useState<number>(0);
  
  // Group questions by topic for better organization
  const questionsByTopic = React.useMemo(() => {
    const grouped: Record<string, GeneratedQuestion[]> = {};
    generatedQuestions.forEach(q => {
      if (!grouped[q.topic]) {
        grouped[q.topic] = [];
      }
      grouped[q.topic].push(q);
    });
    return grouped;
  }, [generatedQuestions]);

  // Maps generated questions to skills
  const mapQuestionsToSkills = useCallback((questions: GeneratedQuestion[]) => {
    // Create a mapping between question topics and skill categories
    const topicToCategory: Record<string, string> = {
      'Grammar': 'Standard English Conventions',
      'Punctuation': 'Standard English Conventions',
      'Sentence Structure': 'Standard English Conventions',
      'Evidence': 'Expression of Ideas',
      'Organization': 'Expression of Ideas',
      'Vocabulary': 'Expression of Ideas',
      'Algebra': 'Math',
      'Geometry': 'Math',
      'Data Analysis': 'Math'
    };
    
    // Generate a mapping between question IDs and skill IDs
    const mapping: QuestionSkillMapping = {};
    
    questions.forEach(question => {
      // Find matching skills from the skills context
      const category = topicToCategory[question.topic] || question.topic;
      
      // Find skills that match this category
      const matchingSkills = skills.filter(s => 
        s.category === category || 
        s.subcategory === question.topic ||
        s.name.toLowerCase().includes(question.topic.toLowerCase())
      );
      
      if (matchingSkills.length > 0) {
        // Pick a skill to associate with this question (preferably one that's not mastered yet)
        const notYetMastered = matchingSkills.filter(s => !s.mastered);
        const skillToUse = notYetMastered.length > 0 
          ? notYetMastered[Math.floor(Math.random() * notYetMastered.length)]
          : matchingSkills[Math.floor(Math.random() * matchingSkills.length)];
        
        mapping[question.id] = skillToUse.id;
      }
    });
    
    setQuestionSkillMap(mapping);
  }, [skills]);

  // Effect to map questions to skills when questions are generated
  useEffect(() => {
    if (generatedQuestions.length > 0) {
      mapQuestionsToSkills(generatedQuestions);
    }
  }, [generatedQuestions, mapQuestionsToSkills]);

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
      setActiveStep(1);
      
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
          // Add realistic processing delay
          await addProcessingDelay(2500);
          setExtractedText(text);
          setActiveStep(2);
          
          setLoadingMessage('Analyzing report and generating personalized questions...');
          // Add realistic processing delay before question generation - increased to 15 seconds
          await addProcessingDelay(15000);
          const questions = await generateQuestionsFromMistakes(text);
          setGeneratedQuestions(questions);
          setActiveStep(3);
        } else {
          // PDF processing flow
          setLoadingMessage('Uploading PDF to secure storage...');
          const { storagePath, publicUrl } = await uploadFileToSupabase(file, 'score-reports', { publicAccess: false });
          console.log('File uploaded:', { storagePath, publicUrl });
          
          // Add realistic processing delay
          await addProcessingDelay(2000);

          setLoadingMessage('Extracting text from PDF (OCR process)... This may take a moment.');
          const text = await ocrPdfFromSupabase(publicUrl, storagePath);
          setExtractedText(text);
          setActiveStep(2);
          console.log('Text extracted:', text.substring(0, 100) + '...');
          
          setLoadingMessage('Analyzing your report and building personalized questions...');
          // Add realistic processing delay for question generation - increased to 15 seconds
          await addProcessingDelay(15000);
          const questions = await generateQuestionsFromMistakes(text);
          setGeneratedQuestions(questions);
          setActiveStep(3);
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
    setActiveStep(1);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('No active session. Please log in again.');
        setIsLoading(false);
        return;
      }

      // Process the pasted text with realistic delays
      setLoadingMessage('Processing your text input...');
      await addProcessingDelay(1800);
      setExtractedText(pastedText);
      setActiveStep(2);
      
      setLoadingMessage('Analyzing report data and creating personalized questions...');
      // Add realistic processing delay - increased to 15 seconds
      await addProcessingDelay(15000);
      const questions = await generateQuestionsFromMistakes(pastedText);
      setGeneratedQuestions(questions);
      setActiveStep(3);
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
    setActiveStep(0);
  };

  // Function to determine difficulty level color
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return theme.palette.success.main;
      case 'medium': return theme.palette.warning.main;
      case 'hard': return theme.palette.error.main;
      default: return theme.palette.info.main;
    }
  };

  // Handle student answer selection
  const handleAnswerSelect = (questionId: string, answer: string) => {
    setStudentAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // Check if an answer is correct and reveal explanation
  const checkAnswer = (questionId: string) => {
    setShowExplanations(prev => ({
      ...prev,
      [questionId]: true
    }));
    
    const question = generatedQuestions.find(q => q.id === questionId);
    if (question && isAnswerCorrect(question, studentAnswers[questionId])) {
      // If correct and not already in correctAnswers, add it
      if (!correctAnswers.includes(questionId)) {
        setCorrectAnswers(prev => [...prev, questionId]);
        
        // Update the associated skill's progress
        const skillId = questionSkillMap[questionId];
        if (skillId) {
          // Find current skill to determine new progress level
          const skill = skills.find(s => s.id === skillId);
          if (skill) {
            // Increase skill mastery level by 15-25% for each correct answer
            const progressIncrease = Math.floor(Math.random() * 11) + 15; // 15-25
            const newProgress = Math.min(100, skill.masteryLevel + progressIncrease);
            
            // Ensure we call updateSkillProgress with the correct parameters
            updateSkillProgress(skillId, newProgress);
            console.log(`Skill ${skillId} updated: ${skill.masteryLevel} -> ${newProgress}`);
            
            // Show growth badge and increment counter
            setShowTreeGrowthBadge(true);
            setTreeBadgeCount(prev => prev + 1);
            
            // Hide badge after a few seconds
            setTimeout(() => {
              setShowTreeGrowthBadge(false);
            }, 3000);
          }
        }
      }
    }
  };

  // Reset a question to try again
  const resetQuestion = (questionId: string) => {
    const newAnswers = {...studentAnswers};
    delete newAnswers[questionId];
    setStudentAnswers(newAnswers);
    
    setShowExplanations(prev => ({
      ...prev,
      [questionId]: false
    }));
    
    // If it was a correct answer, remove it from correctAnswers
    if (correctAnswers.includes(questionId)) {
      setCorrectAnswers(prev => prev.filter(id => id !== questionId));
    }
  };

  // Function to determine if a student's answer is correct
  const isAnswerCorrect = (question: GeneratedQuestion, studentAnswer: string) => {
    return studentAnswer === question.answer;
  };

  // Handle navigate to dashboard to see tree growth
  const handleViewTreeGrowth = () => {
    navigate('/dashboard', { 
      state: { 
        fromUpload: true, 
        correctAnswers: correctAnswers.length 
      } 
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f8f9fa' }}>
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
          
          {/* Tree growth badge */}
          {correctAnswers.length > 0 && (
            <Tooltip title="Your bonsai tree is growing! Click to view">
              <Badge 
                badgeContent={treeBadgeCount} 
                color="success"
                sx={{ mr: 2, opacity: showTreeGrowthBadge ? 1 : 0.8, transition: 'all 0.3s ease' }}
              >
                <IconButton 
                  color="inherit" 
                  onClick={handleViewTreeGrowth}
                  sx={{ 
                    animation: showTreeGrowthBadge ? 'treeGrow 1s ease-in-out' : 'none',
                    '@keyframes treeGrow': {
                      '0%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.3)' },
                      '100%': { transform: 'scale(1)' }
                    }
                  }}
                >
                  <EmojiNatureIcon />
                </IconButton>
              </Badge>
            </Tooltip>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom align="center" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
          Upload Your SAT Practice Report
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" paragraph>
          Upload your report or paste text to get personalized lessons and practice questions
        </Typography>

        {apiKeyMissing && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold">API Key Missing</Typography>
            <Typography variant="body2">
              The application is running in limited mode. Some advanced features may not be available. Please contact the administrator for full functionality.
            </Typography>
          </Alert>
        )}

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4, display: { xs: 'none', sm: 'flex' } }}>
          <Step>
            <StepLabel>Upload Report</StepLabel>
          </Step>
          <Step>
            <StepLabel>Process Content</StepLabel>
          </Step>
          <Step>
            <StepLabel>Extract Information</StepLabel>
          </Step>
          <Step>
            <StepLabel>Generate Questions</StepLabel>
          </Step>
        </Stepper>
        
        <Box sx={{ width: '100%', mb: 3 }}>
          <Tabs
            value={inputMethod}
            onChange={handleInputMethodChange}
            centered
            indicatorColor="primary"
            textColor="primary"
            variant={isMobile ? "fullWidth" : "standard"}
          >
            <Tab 
              value="file" 
              label="Upload File" 
              icon={<CloudUploadIcon />} 
              iconPosition="start"
              disabled={isLoading}
            />
            <Tab 
              value="text" 
              label="Paste Text" 
              icon={<TextFieldsIcon />} 
              iconPosition="start"
              disabled={isLoading}
            />
          </Tabs>
        </Box>

        {!isLoading && activeStep < 3 && (
          <>
            {inputMethod === 'file' ? (
              <Paper
                {...getRootProps()}
                elevation={3}
                sx={{
                  p: 4,
                  mt: 3,
                  textAlign: 'center',
                  border: isDragActive ? '2px dashed' : '2px dashed grey.500',
                  borderColor: isDragActive ? 'primary.main' : 'grey.500',
                  backgroundColor: isDragActive ? 'rgba(76, 175, 80, 0.04)' : 'background.paper',
                  cursor: 'pointer',
                  minHeight: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease'
                }}
              >
                <input {...getInputProps()} />
                <CloudUploadIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                {isDragActive ? (
                  <Typography variant="h6" color="primary.main">Drop the file here ...</Typography>
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
                  size="large"
                  sx={{ py: 1.5, textTransform: 'none', fontWeight: 'bold' }}
                >
                  Process Text
                </Button>
              </Paper>
            )}
          </>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {uploadedFile && inputMethod === 'file' && !error && !isLoading && activeStep < 3 && (
          <Paper elevation={1} sx={{ p: 2, mt: 3 }}>
            <Typography variant="h6">Uploaded File:</Typography>
            <Typography>{uploadedFile.name} ({Math.round(uploadedFile.size / 1024)} KB)</Typography>
          </Paper>
        )}

        {isLoading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', mt: 6, mb: 4 }}>
            <Box sx={{ width: '240px', height: '240px', mb: 3 }}>
              <Lottie 
                animationData={'/book.lottie'} 
                loop={true}
                style={{ width: '100%', height: '100%' }}
              />
            </Box>
            <Typography variant="h6" sx={{ mt: 3, fontWeight: 'bold' }}>{loadingMessage || 'Processing your report...'}</Typography>
          </Box>
        )}

        {extractedText && !isLoading && activeStep === 2 && (
          <Paper elevation={1} sx={{ p: 3, mt: 4 }}>
            <Typography variant="h6" gutterBottom>Extracted Text (Preview):</Typography>
            <Typography variant="body2" sx={{ maxHeight: 150, overflowY: 'auto', whiteSpace: 'pre-wrap', backgroundColor: 'grey.100', p:2, borderRadius:1 }}>
              {extractedText}
            </Typography>
          </Paper>
        )}
        
        {generatedQuestions.length > 0 && !isLoading && (
          <Box sx={{ mt: 4 }}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <SchoolIcon sx={{ fontSize: 32, color: 'primary.main', mr: 1.5 }} />
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  Your Personalized Practice Questions
                </Typography>
              </Box>
              
              <Typography variant="body1" paragraph>
                Based on your test results, we've created {generatedQuestions.length} personalized practice questions 
                covering different topics to help you improve your SAT score.
              </Typography>
              
              {correctAnswers.length > 0 && (
                <Alert 
                  severity="success" 
                  icon={<LocalFloristIcon />}
                  sx={{ mb: 3, display: 'flex', alignItems: 'center' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Typography>
                      You've correctly answered {correctAnswers.length} question{correctAnswers.length !== 1 ? 's' : ''}! 
                      Your Bonsai Tree is growing with each correct answer.
                    </Typography>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      color="success" 
                      startIcon={<EmojiNatureIcon />}
                      onClick={handleViewTreeGrowth}
                      sx={{ ml: 2 }}
                    >
                      View Growth
                    </Button>
                  </Box>
                </Alert>
              )}
              
              <Divider sx={{ mb: 3 }} />
              
              {Object.entries(questionsByTopic).map(([topic, questions], topicIndex) => (
                <Accordion key={topicIndex} defaultExpanded={topicIndex === 0} sx={{ mb: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      borderBottom: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {topic} ({questions.length})
                      </Typography>
                      
                      {/* Show mini progress for this topic */}
                      {questions.length > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                            {questions.filter(q => correctAnswers.includes(q.id)).length}/{questions.length} Correct
                          </Typography>
                          {questions.some(q => correctAnswers.includes(q.id)) && (
                            <LocalFloristIcon 
                              fontSize="small" 
                              color="success" 
                              sx={{ 
                                opacity: questions.every(q => correctAnswers.includes(q.id)) ? 1 : 0.6,
                                animation: showTreeGrowthBadge ? 'pulse 1.5s infinite' : 'none',
                                '@keyframes pulse': {
                                  '0%': { transform: 'scale(1)' },
                                  '50%': { transform: 'scale(1.2)' },
                                  '100%': { transform: 'scale(1)' }
                                }
                              }} 
                            />
                          )}
                        </Box>
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    {questions.map((question, qIndex) => (
                      <Card key={question.id} sx={{ mb: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider', m: 2 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              Question {topicIndex + 1}.{qIndex + 1}
                              
                              {/* Show which skill this question helps */}
                              {questionSkillMap[question.id] && (
                                <Tooltip 
                                  title={`Answering this correctly will help grow your "${skills.find(s => s.id === questionSkillMap[question.id])?.name}" skill`}
                                  arrow
                                >
                                  <Typography
                                    component="span"
                                    variant="body2"
                                    sx={{ 
                                      ml: 1, 
                                      color: 'text.secondary',
                                      cursor: 'help',
                                      textDecoration: 'underline',
                                      textDecorationStyle: 'dotted'
                                    }}
                                  >
                                    (Improves a skill)
                                  </Typography>
                                </Tooltip>
                              )}
                            </Typography>
                            {question.difficulty && (
                              <Chip 
                                label={question.difficulty} 
                                size="small" 
                                sx={{ 
                                  bgcolor: getDifficultyColor(question.difficulty),
                                  color: 'white',
                                  fontWeight: 'bold'
                                }} 
                              />
                            )}
                          </Box>
                          
                          <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                            {question.text}
                          </Typography>
                          
                          {question.options && (
                            <Box sx={{ ml: 2, mb: 2 }}>
                              <RadioGroup 
                                value={studentAnswers[question.id] || ''} 
                                onChange={(e) => handleAnswerSelect(question.id, e.target.value)}
                              >
                                {question.options.map((opt, i) => (
                                  <FormControlLabel
                                    key={i}
                                    value={String.fromCharCode(65 + i)} // A, B, C, D...
                                    control={<Radio />}
                                    label={
                                      <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        color: showExplanations[question.id] && 
                                               question.answer === String.fromCharCode(65 + i) ? 
                                               'success.main' : 'text.primary'
                                      }}>
                                        <Typography variant="body1">
                                          {String.fromCharCode(65 + i)}. {opt}
                                        </Typography>
                                        {showExplanations[question.id] && 
                                          question.answer === String.fromCharCode(65 + i) && 
                                          <CheckCircleIcon sx={{ ml: 1, color: 'success.main' }} />
                                        }
                                      </Box>
                                    }
                                    sx={{ 
                                      p: 1.5, 
                                      mb: 1, 
                                      borderRadius: 1, 
                                      border: '1px solid',
                                      borderColor: 'divider',
                                      bgcolor: showExplanations[question.id] && 
                                               question.answer === String.fromCharCode(65 + i) ? 
                                               'rgba(76, 175, 80, 0.12)' : 'transparent',
                                    }}
                                    disabled={showExplanations[question.id]}
                                  />
                                ))}
                              </RadioGroup>
                            </Box>
                          )}
                          
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            {studentAnswers[question.id] && !showExplanations[question.id] && (
                              <Button 
                                variant="contained" 
                                color="primary" 
                                onClick={() => checkAnswer(question.id)}
                                sx={{ mr: 1 }}
                              >
                                Check Answer
                              </Button>
                            )}
                            {showExplanations[question.id] && (
                              <Button 
                                variant="outlined" 
                                onClick={() => resetQuestion(question.id)}
                              >
                                Try Again
                              </Button>
                            )}
                          </Box>
                          
                          {showExplanations[question.id] && (
                            <Fade in={showExplanations[question.id]} timeout={500}>
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 1 }}>
                                  {isAnswerCorrect(question, studentAnswers[question.id]) ? (
                                    <Alert 
                                      severity="success" 
                                      icon={<CheckCircleIcon fontSize="inherit" />}
                                      sx={{ width: '100%' }}
                                    >
                                      <Typography variant="body1" fontWeight="bold">
                                        Correct! Well done.
                                      </Typography>
                                    </Alert>
                                  ) : (
                                    <Alert 
                                      severity="error" 
                                      icon={<CancelIcon fontSize="inherit" />}
                                      sx={{ width: '100%' }}
                                    >
                                      <Typography variant="body1" fontWeight="bold">
                                        Incorrect. The correct answer is {question.answer}.
                                      </Typography>
                                    </Alert>
                                  )}
                                </Box>
                                
                                <Box sx={{ 
                                  mt: 2, 
                                  p: 2, 
                                  bgcolor: 'rgba(247, 247, 247, 0.9)', 
                                  borderRadius: 1.5,
                                  border: '1px solid',
                                  borderColor: 'grey.200',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                  position: 'relative',
                                  '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '4px',
                                    height: '100%',
                                    backgroundColor: 'primary.main',
                                    borderTopLeftRadius: 4,
                                    borderBottomLeftRadius: 4
                                  }
                                }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'text.primary', mb: 0.5 }}>
                                    Explanation:
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
                                    {question.explanation}
                                  </Typography>
                                </Box>
                              </Box>
                            </Fade>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Paper>
            
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
                          <Button 
              onClick={handleViewTreeGrowth}
              variant="outlined" 
              size="large"
              sx={{ textTransform: 'none' }}
              startIcon={<EmojiNatureIcon />}
            >
              View Your Bonsai Tree
            </Button>
              <Button
                variant="contained"
                color="primary"
                size="large"
                sx={{ textTransform: 'none', fontWeight: 'bold' }}
                onClick={() => {
                  setActiveStep(0);
                  setGeneratedQuestions([]);
                  setExtractedText(null);
                  setInputMethod('file');
                  setUploadedFile(null);
                  setPastedText('');
                  setStudentAnswers({});
                  setShowExplanations({});
                  setCorrectAnswers([]);
                  setQuestionSkillMap({});
                  setTreeBadgeCount(0);
                }}
              >
                Upload Another Report
              </Button>
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default UploadReport; 