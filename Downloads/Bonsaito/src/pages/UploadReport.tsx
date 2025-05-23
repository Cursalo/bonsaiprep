import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  Tooltip,
  Avatar,
  Snackbar,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Drawer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab
} from '@mui/material';
import { useThemeContext } from '../contexts/ThemeContext';
import MenuIcon from '@mui/icons-material/Menu';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import SchoolIcon from '@mui/icons-material/School';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import EmojiNatureIcon from '@mui/icons-material/EmojiNature';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import UploadIcon from '@mui/icons-material/Upload';
import PlayLessonIcon from '@mui/icons-material/PlayLesson';
import InsightsIcon from '@mui/icons-material/Insights';
import QuizIcon from '@mui/icons-material/Quiz';
import { useDropzone } from 'react-dropzone';
import { uploadFileToSupabase } from '../services/ocrService'; 
import { generateQuestionsFromMistakes, GeneratedQuestion } from '../services/geminiPdfService';
import { supabase } from '../supabaseClient';
import { useSkills } from '../components/SkillsProvider';
import LoadingAnimation from '../components/LoadingAnimation';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { FadeIn, ScaleIn, FloatAnimation, SlideIn } from '../components/AnimationEffects';
import BonsaiTree from '../components/BonsaiTree';
import { updateCorrectAnswersCount, getUserProgress } from '../services/userProgressService';
import TestHistoryList from '../components/TestHistoryList';
import ThemeToggle from '../components/ThemeToggle';

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

// Text styles for better readability based on theme
const getTextStyles = (themeMode: 'light' | 'dark') => ({
  heading: {
    color: themeMode === 'light' ? 'rgba(0, 0, 0, 0.87)' : 'rgba(255, 255, 255, 0.87)',
  },
  subheading: {
    color: themeMode === 'light' ? 'rgba(0, 0, 0, 0.87)' : 'rgba(255, 255, 255, 0.87)',
    opacity: 0.9
  },
  body: {
    color: themeMode === 'light' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)'
  },
  label: {
    color: themeMode === 'light' ? 'rgba(0, 0, 0, 0.87)' : 'rgba(255, 255, 255, 0.87)',
    fontWeight: 500
  },
  secondary: {
    color: themeMode === 'light' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)'
  },
  disabled: {
    color: themeMode === 'light' ? 'rgba(0, 0, 0, 0.38)' : 'rgba(255, 255, 255, 0.38)'
  },
  accent: {
    color: themeMode === 'light' ? 'rgba(26, 147, 111, 0.9)' : 'rgba(136, 212, 152, 0.9)'
  }
});

const UploadReport: React.FC = () => {
  const theme = useTheme();
  const { themeMode } = useThemeContext();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const { skills, updateSkillProgress, totalSkills } = useSkills();
  
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
  const [userData, setUserData] = useState<{firstName?: string, lastName?: string} | null>(null);
  const [loadingUserData, setLoadingUserData] = useState<boolean>(true);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [showBonsaiTree, setShowBonsaiTree] = useState<boolean>(false);
  const [treeGrowthTriggered, setTreeGrowthTriggered] = useState<boolean>(false);
  
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

  // Helper function to get card styling that adapts to theme
  const getCardStyle = () => ({
    backgroundColor: themeMode === 'light' 
      ? 'rgba(255, 255, 255, 0.95)' 
      : 'rgba(30, 30, 30, 0.95)',
    border: `1px solid ${themeMode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}`,
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
    boxShadow: themeMode === 'light' 
      ? '0 4px 20px rgba(0, 0, 0, 0.08)' 
      : '0 4px 20px rgba(0, 0, 0, 0.4)',
  });

  // Fetch user data for personalization
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: onboardingData, error } = await supabase
            .from('user_onboarding')
            .select('first_name, last_name')
            .eq('user_id', user.id)
            .single();

          if (error) {
            console.error("Error fetching user onboarding data:", error);
          } else if (onboardingData) {
            setUserData({
              firstName: onboardingData.first_name,
              lastName: onboardingData.last_name,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching user session:", error);
      } finally {
        setLoadingUserData(false);
      }
    };

    fetchUserData();
  }, []);

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
    const file = acceptedFiles[0];
    setUploadedFile(file);
    setError(null);

    if (file) {
      setIsLoading(true);
      try {
        setActiveStep(1);
        setLoadingMessage('Uploading and extracting text from PDF...');
        await addProcessingDelay(3000);

        // For now, simulate text extraction since uploadFileToSupabase doesn't return extractedText
        // This would need to be updated when the OCR service is properly implemented
        const simulatedText = "Sample SAT report text for processing...";
        setExtractedText(simulatedText);
        
        setActiveStep(2);
        setLoadingMessage('Analyzing PDF and generating personalized questions...');
        
        // Generate questions directly from the simulated text
        await addProcessingDelay(15000);
        const questions = await generateQuestionsFromMistakes(simulatedText);
        setGeneratedQuestions(questions);
        setActiveStep(3);

        // Map questions to skills for growth tracking
        mapQuestionsToSkills(questions);
      } catch (error) {
        console.error('Error processing file:', error);
        setError(`Failed to process the file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
        setLoadingMessage('');
      }
    }
  }, [mapQuestionsToSkills]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt']
    },
    maxSize: 10485760, // 10MB
    disabled: isLoading
  });

  const handleTextSubmit = async () => {
    if (!pastedText.trim()) return;

    setIsLoading(true);
    setError(null);
    setActiveStep(1);

    try {
      setLoadingMessage('Processing your text...');
      await addProcessingDelay(2000);

      setActiveStep(2);
      setLoadingMessage('Analyzing text and generating personalized questions...');
      await addProcessingDelay(8000);

      const questions = await generateQuestionsFromMistakes(pastedText);
      setGeneratedQuestions(questions);
      setExtractedText(pastedText);
      setActiveStep(3);

      // Map questions to skills for growth tracking
      mapQuestionsToSkills(questions);
    } catch (error) {
      console.error('Error processing text:', error);
      setError(`Failed to process the text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleInputMethodChange = (_event: React.SyntheticEvent, newValue: string) => {
    if (!isLoading) {
      setInputMethod(newValue);
      setError(null);
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'Easy': return '#4caf50';
      case 'Medium': return '#ff9800';
      case 'Hard': return '#f44336';
      default: return '#2196f3';
    }
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setStudentAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const checkAnswer = async (questionId: string) => {
    const question = generatedQuestions.find(q => q.id === questionId);
    const studentAnswer = studentAnswers[questionId];
    
    if (!question || !studentAnswer) return;

    // Show explanation
    setShowExplanations(prev => ({
      ...prev,
      [questionId]: true
    }));

    // If answer is correct, track it
    if (isAnswerCorrect(question, studentAnswer)) {
      if (!correctAnswers.includes(questionId)) {
        const newCorrectAnswers = [...correctAnswers, questionId];
        setCorrectAnswers(newCorrectAnswers);
        
        // Trigger tree growth animation
        setShowTreeGrowthBadge(true);
        setTreeBadgeCount(prev => prev + 1);
        setTimeout(() => setShowTreeGrowthBadge(false), 3000);

        // Update skill progress if this question maps to a skill
        const skillId = questionSkillMap[questionId];
        if (skillId) {
          try {
            await updateSkillProgress(skillId, 15); // 15% increase per question
            console.log(`Updated skill ${skillId} by 15%`);
          } catch (error) {
            console.error('Error updating skill progress:', error);
          }
        }

        try {
          // Save progress to database - simplified for now
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            console.log(`User ${user.id} answered question correctly: ${questionId}`);
            // Note: This would need proper implementation when user progress service is ready
          }
        } catch (error) {
          console.error('Error updating user progress:', error);
        }
      }
    }
  };

  const resetQuestion = (questionId: string) => {
    setStudentAnswers(prev => {
      const updated = { ...prev };
      delete updated[questionId];
      return updated;
    });
    
    setShowExplanations(prev => ({
      ...prev,
      [questionId]: false
    }));
  };

  const isAnswerCorrect = (question: GeneratedQuestion, studentAnswer: string): boolean => {
    if (!question.answer || !studentAnswer) return false;
    
    const normalizedQuestionAnswer = question.answer.trim().toUpperCase();
    const normalizedStudentAnswer = studentAnswer.trim().toUpperCase();
    
    return normalizedQuestionAnswer === normalizedStudentAnswer;
  };

  const handleViewTreeGrowth = async () => {
    setShowBonsaiTree(true);
    
    // Trigger tree growth animation
    setTreeGrowthTriggered(true);
    setTimeout(() => {
      setTreeGrowthTriggered(false);
    }, 2000);

    // If there are correct answers, show a brief animation
    if (correctAnswers.length > 0) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('Current user progress for user:', user.id);
          // Note: This would fetch actual progress when the service is implemented
        }
      } catch (error) {
        console.error('Error fetching progress:', error);
      }
    }
  };

  const getBackgroundStyle = () => ({
    backgroundColor: themeMode === 'light' ? '#fafafa' : '#121212',
    minHeight: '100vh',
    py: 4,
  });

  const getTextColor = (variant: 'primary' | 'secondary') => {
    return variant === 'primary'
      ? (themeMode === 'light' ? 'rgba(0, 0, 0, 0.87)' : 'rgba(255, 255, 255, 0.87)')
      : (themeMode === 'light' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)');
  };

  return (
    <Box sx={getBackgroundStyle()}>
      {/* Navigation */}
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{
          backgroundColor: themeMode === 'light' 
            ? 'rgba(255, 255, 255, 0.98)' 
            : 'rgba(18, 18, 18, 0.98)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${themeMode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}`,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2,
              color: getTextColor('primary')
            }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            flexGrow: 1,
            justifyContent: 'center'
          }}>
            <img 
              src={themeMode === 'light' ? '/bonsaiblack.png' : '/bonsaiwhitenobg.png'}
              alt="Bonsai Prep Logo" 
              style={{ 
                height: '40px',
                width: 'auto',
                objectFit: 'contain',
                maxWidth: '200px'
              }} 
            />
          </Box>
          
          <ThemeToggle showBackgroundSelector={true} />
          
          <Avatar sx={{ 
            bgcolor: theme.palette.primary.main,
            ml: 1,
            fontWeight: 'bold'
          }}>
            {loadingUserData ? '' : userData?.firstName?.charAt(0) || 'U'}
          </Avatar>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        sx={{
          '& .MuiDrawer-paper': {
            width: isMobile ? 280 : 300,
            backgroundColor: themeMode === 'light' 
              ? 'rgba(255, 255, 255, 0.98)' 
              : 'rgba(18, 18, 18, 0.98)',
            backdropFilter: 'blur(20px)',
            borderRight: `1px solid ${themeMode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}`,
          },
        }}
      >
        <Box sx={{ 
          pt: 10, 
          pb: 2,
          px: 2
        }}>
          <Typography variant="h6" sx={{ 
            textAlign: 'center', 
            fontWeight: 'bold',
            color: getTextColor('primary'),
            mb: 2
          }}>
            Navigation
          </Typography>
        </Box>
        
        <List>
          {[
            { path: '/dashboard', icon: <HomeIcon />, label: 'Dashboard' },
            { path: '/upload', icon: <UploadIcon />, label: 'Upload Score Report' },
            { path: '/lessons', icon: <PlayLessonIcon />, label: 'My Lessons' },
            { path: '/profile', icon: <SchoolIcon />, label: 'My Profile' },
            { path: '/video-lessons', icon: <PlayLessonIcon />, label: 'Video Lessons' },
            { path: '/progress', icon: <InsightsIcon />, label: 'Progress' },
          ].map((item) => (
            <ListItem
              key={item.path}
              button
              component={Link}
              to={item.path}
              sx={{
                mx: 1,
                borderRadius: 2,
                mb: 0.5,
                backgroundColor: location.pathname === item.path 
                  ? `${theme.palette.primary.main}20` 
                  : 'transparent',
                '&:hover': {
                  backgroundColor: `${theme.palette.primary.main}10`,
                },
              }}
            >
              <ListItemIcon sx={{ color: theme.palette.primary.main }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.label}
                sx={{ 
                  '& .MuiListItemText-primary': {
                    fontWeight: location.pathname === item.path ? 600 : 400,
                    color: getTextColor('primary')
                  }
                }}
              />
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main Content */}
      <Container 
        maxWidth="md" 
        sx={{ 
          pt: isMobile ? 12 : 16, 
          pb: 4,
          px: isMobile ? 1 : 3,
          ml: !isMobile && drawerOpen ? '300px' : 0,
          transition: 'margin 0.3s ease',
          width: '100%',
          maxWidth: isMobile ? '100vw' : 'md',
        }}
      >
        <GlassCard sx={{ 
          p: isMobile ? 1.5 : 4, 
          mx: isMobile ? 0.5 : 0,
          ...getCardStyle()
        }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" sx={{ ...getTextStyles(themeMode).heading, fontWeight: 'bold', mb: 2 }}>
              Upload SAT Report
            </Typography>
            <Typography variant="body1" sx={getTextStyles(themeMode).secondary}>
              Upload your SAT practice test report or paste the text to get personalized practice questions
            </Typography>
          </Box>

          {/* Progress Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            <Step>
              <StepLabel>Upload Report</StepLabel>
            </Step>
            <Step>
              <StepLabel>Extract Text</StepLabel>
            </Step>
            <Step>
              <StepLabel>Generate Questions</StepLabel>
            </Step>
            <Step>
              <StepLabel>Practice Questions</StepLabel>
            </Step>
          </Stepper>

          {/* Input Method Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={inputMethod}
              onChange={handleInputMethodChange}
              centered
              sx={{
                '& .MuiTabs-indicator': {
                  backgroundColor: getTextStyles(themeMode).accent.color,
                  height: 3
                },
                '& .MuiTab-root': {
                  color: getTextStyles(themeMode).secondary.color,
                  fontSize: '1rem',
                  '&.Mui-selected': {
                    color: getTextStyles(themeMode).heading.color
                  }
                }
              }}
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
                <Box
                  {...getRootProps()}
                  sx={{
                    p: isMobile ? 2 : 4,
                    textAlign: 'center',
                    border: '2px dashed',
                    borderColor: isDragActive ? getTextStyles(themeMode).accent.color : (themeMode === 'light' ? 'rgba(0, 0, 0, 0.23)' : 'rgba(255, 255, 255, 0.23)'),
                    borderRadius: 2,
                    backgroundColor: isDragActive 
                      ? (themeMode === 'light' ? 'rgba(26, 147, 111, 0.08)' : 'rgba(26, 147, 111, 0.08)')
                      : (themeMode === 'light' ? 'rgba(248, 249, 250, 0.8)' : 'rgba(18, 18, 18, 0.5)'),
                    cursor: 'pointer',
                    minHeight: isMobile ? 150 : 200,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <input {...getInputProps()} />
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                  }}>
                    <CloudUploadIcon sx={{ 
                      fontSize: isMobile ? 40 : 60, 
                      color: getTextStyles(themeMode).accent.color, 
                      mb: 1,
                    }} />
                    <PictureAsPdfIcon sx={{ 
                      fontSize: isMobile ? 30 : 40, 
                      color: getTextStyles(themeMode).secondary.color, 
                      mb: 2,
                    }} />
                  </Box>
                  {isDragActive ? (
                    <Typography variant="h6" sx={{ 
                      ...getTextStyles(themeMode).accent, 
                      fontWeight: 'bold',
                    }}>
                      Drop the file here ...
                    </Typography>
                  ) : (
                    <Typography variant={isMobile ? "body1" : "h6"} sx={{ 
                      ...getTextStyles(themeMode).secondary, 
                      fontWeight: 'medium',
                    }}>
                      Drag 'n' drop a file here, or click to select file
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ ...getTextStyles(themeMode).secondary, mt: 1 }}>
                    (Max file size: 10MB. Supported formats: PDF, TXT)
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ 
                    ...getTextStyles(themeMode).secondary,
                    fontWeight: 'medium',
                    mb: 2
                  }}>
                    Paste Your SAT Report Text
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={10}
                    variant="outlined"
                    placeholder="Paste the content of your SAT report here..."
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    disabled={isLoading}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: themeMode === 'light' ? 'rgba(248, 249, 250, 0.8)' : 'rgba(18, 18, 18, 0.5)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: getTextStyles(themeMode).accent.color
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: getTextStyles(themeMode).accent.color,
                          borderWidth: 2
                        }
                      },
                      '& .MuiInputBase-input': {
                        color: getTextStyles(themeMode).heading.color
                      }
                    }}
                  />
                  <GradientButton 
                    variant="contained" 
                    gradient="primary"
                    onClick={handleTextSubmit}
                    disabled={!pastedText.trim() || isLoading}
                    fullWidth
                    size="large"
                    sx={{ py: 1.5, mt: 2 }}
                  >
                    Process Text
                  </GradientButton>
                </Box>
              )}
            </>
          )}

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mt: 2, 
                backgroundColor: themeMode === 'light' ? 'rgba(211, 47, 47, 0.08)' : 'rgba(211, 47, 47, 0.15)', 
                color: getTextStyles(themeMode).heading.color,
                '& .MuiAlert-icon': {
                  color: themeMode === 'light' ? 'rgba(211, 47, 47, 0.9)' : 'rgba(244, 67, 54, 0.9)'
                },
                borderRadius: 2
              }}
            >
              {error}
            </Alert>
          )}

          {uploadedFile && inputMethod === 'file' && !error && !isLoading && activeStep < 3 && (
            <Box sx={{ 
              p: 3, 
              mt: 3, 
              ...getCardStyle(),
            }}>
              <Typography variant="h6" sx={{ 
                ...getTextStyles(themeMode).heading,
                fontWeight: 'medium',
                mb: 2
              }}>
                Uploaded File:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <PictureAsPdfIcon sx={{ color: getTextStyles(themeMode).accent.color, mr: 1 }} />
                <Typography sx={getTextStyles(themeMode).body}>
                  {uploadedFile.name} ({Math.round(uploadedFile.size / 1024)} KB)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <GradientButton 
                  variant="contained" 
                  gradient="primary"
                  onClick={() => {
                    onDrop([uploadedFile]);
                  }}
                  size="medium"
                >
                  Process File
                </GradientButton>
              </Box>
            </Box>
          )}

          {isLoading && (
            <Box sx={{ textAlign: 'center', my: 6, position: 'relative' }}>
              <LoadingAnimation
                message={loadingMessage || 'Processing...'}
                width={280}
                height={280}
              />
            </Box>
          )}

          {extractedText && !isLoading && activeStep === 2 && (
            <Box sx={{ 
              p: 4, 
              mt: 4, 
              ...getCardStyle(),
            }}>
              <Typography variant="h6" gutterBottom sx={{ 
                ...getTextStyles(themeMode).heading,
                fontWeight: 'medium',
                mb: 2
              }}>
                Extracted Text (Preview):
              </Typography>
              <Box sx={{ 
                maxHeight: 150, 
                overflowY: 'auto', 
                whiteSpace: 'pre-wrap', 
                backgroundColor: themeMode === 'light' ? 'rgba(248, 249, 250, 0.8)' : 'rgba(12, 12, 12, 0.9)', 
                p: 3, 
                borderRadius: 2,
                border: `1px solid ${themeMode === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'}`
              }}>
                <Typography variant="body2" sx={getTextStyles(themeMode).body}>
                  {extractedText}
                </Typography>
              </Box>
            </Box>
          )}
          
          {generatedQuestions.length > 0 && !isLoading && (
            <Box sx={{ mt: 4 }}>
              <Box sx={{ 
                p: 3, 
                mb: 4,
                ...getCardStyle(),
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <SchoolIcon sx={{ fontSize: 32, color: getTextStyles(themeMode).accent.color, mr: 1.5 }} />
                  <Typography variant="h5" sx={{ ...getTextStyles(themeMode).heading, fontWeight: 'bold' }}>
                    Your Personalized Practice Questions
                  </Typography>
                </Box>
                
                <Typography variant="body1" paragraph sx={getTextStyles(themeMode).body}>
                  Based on your test results, we've created {generatedQuestions.length} personalized practice questions 
                  covering different topics to help you improve your SAT score.
                </Typography>
                
                {correctAnswers.length > 0 && (
                  <Alert 
                    severity="success" 
                    icon={<LocalFloristIcon />}
                    sx={{ 
                      mb: 3, 
                      display: 'flex', 
                      alignItems: 'center',
                      backgroundColor: themeMode === 'light' ? 'rgba(46, 125, 50, 0.08)' : 'rgba(46, 125, 50, 0.15)',
                      color: getTextStyles(themeMode).heading.color,
                      '& .MuiAlert-icon': {
                        color: getTextStyles(themeMode).accent.color
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <Typography sx={getTextStyles(themeMode).body}>
                        You've correctly answered {correctAnswers.length} question{correctAnswers.length !== 1 ? 's' : ''}! 
                        Your Bonsai Tree is growing with each correct answer.
                      </Typography>
                      <GradientButton 
                        variant="outlined" 
                        size="small" 
                        gradient="success"
                        startIcon={<EmojiNatureIcon />}
                        onClick={handleViewTreeGrowth}
                        sx={{ ml: 2 }}
                      >
                        View Growth
                      </GradientButton>
                    </Box>
                  </Alert>
                )}
                
                <Divider sx={{ mb: 3, borderColor: themeMode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)' }} />
                
                {Object.entries(questionsByTopic).map(([topic, questions], topicIndex) => (
                  <Accordion 
                    key={topicIndex} 
                    defaultExpanded={topicIndex === 0} 
                    sx={{ 
                      mb: 2, 
                      boxShadow: 'none', 
                      backgroundColor: themeMode === 'light' ? 'rgba(248, 249, 250, 0.8)' : 'rgba(30, 30, 30, 0.4)', 
                      border: `1px solid ${themeMode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)'}`,
                      '&:before': {
                        display: 'none'
                      },
                      '&.Mui-expanded': {
                        margin: '0 0 16px 0'
                      }
                    }}
                  >
                    <AccordionSummary 
                      expandIcon={<ExpandMoreIcon sx={{ color: getTextStyles(themeMode).secondary.color }} />}
                      sx={{ 
                        backgroundColor: themeMode === 'light' ? 'rgba(248, 249, 250, 1)' : 'rgba(18, 18, 18, 0.6)',
                        borderBottom: `1px solid ${themeMode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)'}`,
                        '&.Mui-expanded': {
                          borderBottomLeftRadius: 0,
                          borderBottomRightRadius: 0
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                        <Typography variant="h6" sx={{ ...getTextStyles(themeMode).heading, fontWeight: 'bold' }}>
                          {topic} ({questions.length})
                        </Typography>
                        
                        {/* Show mini progress for this topic */}
                        {questions.length > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ ...getTextStyles(themeMode).secondary, mr: 1 }}>
                              {questions.filter(q => correctAnswers.includes(q.id)).length}/{questions.length} Correct
                            </Typography>
                            {questions.some(q => correctAnswers.includes(q.id)) && (
                              <LocalFloristIcon 
                                fontSize="small" 
                                sx={{ 
                                  color: getTextStyles(themeMode).accent.color,
                                  opacity: questions.every(q => correctAnswers.includes(q.id)) ? 1 : 0.6,
                                }} 
                              />
                            )}
                          </Box>
                        )}
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0 }}>
                      {questions.map((question, qIndex) => (
                        <Box 
                          key={question.id} 
                          sx={{ 
                            mb: 2, 
                            m: 2, 
                            p: 3,
                            borderRadius: 2, 
                            backgroundColor: themeMode === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(24, 24, 24, 0.9)',
                            border: `1px solid ${themeMode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)'}`
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle1" sx={{ ...getTextStyles(themeMode).heading, fontWeight: 'bold' }}>
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
                                      color: getTextStyles(themeMode).secondary.color,
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
                          
                          <Typography variant="body1" paragraph sx={{ ...getTextStyles(themeMode).body, whiteSpace: 'pre-wrap' }}>
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
                                    control={
                                      <Radio 
                                        sx={{
                                          color: getTextStyles(themeMode).secondary.color,
                                          '&.Mui-checked': {
                                            color: getTextStyles(themeMode).accent.color,
                                          }
                                        }}
                                      />
                                    }
                                    label={
                                      <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        color: showExplanations[question.id] && 
                                              question.answer === String.fromCharCode(65 + i) ? 
                                              getTextStyles(themeMode).accent.color : getTextStyles(themeMode).heading.color
                                      }}>
                                        <Typography variant="body1">
                                          {String.fromCharCode(65 + i)}. {opt}
                                        </Typography>
                                        {showExplanations[question.id] && 
                                          question.answer === String.fromCharCode(65 + i) && 
                                          <CheckCircleIcon sx={{ ml:.5, color: getTextStyles(themeMode).accent.color }} />
                                        }
                                      </Box>
                                    }
                                    sx={{ 
                                      p: 1.5, 
                                      mb: 1, 
                                      borderRadius: 1, 
                                      border: '1px solid',
                                      borderColor: themeMode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.1)',
                                      backgroundColor: showExplanations[question.id] && 
                                                question.answer === String.fromCharCode(65 + i) ? 
                                                (themeMode === 'light' ? 'rgba(76, 175, 80, 0.08)' : 'rgba(76, 175, 80, 0.08)') : 
                                                (themeMode === 'light' ? 'rgba(248, 249, 250, 0.8)' : 'rgba(30, 30, 30, 0.3)'),
                                      transition: 'all 0.2s ease',
                                    }}
                                    disabled={showExplanations[question.id]}
                                  />
                                ))}
                              </RadioGroup>
                            </Box>
                          )}
                          
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            {studentAnswers[question.id] && !showExplanations[question.id] && (
                              <GradientButton 
                                variant="contained" 
                                gradient="primary" 
                                onClick={() => checkAnswer(question.id)}
                                sx={{ mr: 1 }}
                              >
                                Check Answer
                              </GradientButton>
                            )}
                            {showExplanations[question.id] && (
                              <GradientButton 
                                variant="outlined" 
                                gradient="primary"
                                onClick={() => resetQuestion(question.id)}
                              >
                                Try Again
                              </GradientButton>
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
                                      sx={{ 
                                        width: '100%',
                                        backgroundColor: themeMode === 'light' ? 'rgba(46, 125, 50, 0.08)' : 'rgba(46, 125, 50, 0.15)',
                                        color: getTextStyles(themeMode).heading.color,
                                        '& .MuiAlert-icon': {
                                          color: getTextStyles(themeMode).accent.color
                                        }
                                      }}
                                    >
                                      <Typography variant="body1" fontWeight="bold">
                                        Correct! Well done.
                                      </Typography>
                                    </Alert>
                                  ) : (
                                    <Alert 
                                      severity="error" 
                                      icon={<CancelIcon fontSize="inherit" />}
                                      sx={{ 
                                        width: '100%',
                                        backgroundColor: themeMode === 'light' ? 'rgba(211, 47, 47, 0.08)' : 'rgba(211, 47, 47, 0.15)',
                                        color: getTextStyles(themeMode).heading.color,
                                        '& .MuiAlert-icon': {
                                          color: themeMode === 'light' ? 'rgba(211, 47, 47, 0.9)' : 'rgba(244, 67, 54, 0.9)'
                                        }
                                      }}
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
                                  bgcolor: themeMode === 'light' ? 'rgba(248, 249, 250, 0.8)' : 'rgba(18, 18, 18, 0.8)', 
                                  borderRadius: 1.5,
                                  border: `1px solid ${getTextStyles(themeMode).accent.color}`,
                                  position: 'relative',
                                  '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '4px',
                                    height: '100%',
                                    backgroundColor: getTextStyles(themeMode).accent.color,
                                    borderTopLeftRadius: 4,
                                    borderBottomLeftRadius: 4
                                  }
                                }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', ...getTextStyles(themeMode).heading, mb: 0.5, pl: 1 }}>
                                    Explanation:
                                  </Typography>
                                  <Typography variant="body2" sx={{ ...getTextStyles(themeMode).body, whiteSpace: 'pre-wrap', pl: 1 }}>
                                    {question.explanation}
                                  </Typography>
                                </Box>
                              </Box>
                            </Fade>
                          )}
                        </Box>
                      ))}
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
              
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
                <GradientButton 
                  onClick={handleViewTreeGrowth}
                  variant="outlined" 
                  gradient="success"
                  size="large"
                  startIcon={<EmojiNatureIcon />}
                >
                  View Your Bonsai Tree
                </GradientButton>
                <GradientButton
                  variant="contained"
                  gradient="primary"
                  size="large"
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
                </GradientButton>
              </Box>
            </Box>
          )}

          {generatedQuestions.length > 0 && correctAnswers.length > 0 && (
            <Box sx={{ 
              p: 3, 
              mt: 4, 
              mb: 4, 
              ...getCardStyle(),
              textAlign: 'center'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'center' }}>
                <EmojiNatureIcon sx={{ fontSize: 32, color: getTextStyles(themeMode).accent.color, mr: 1.5 }} />
                <Typography variant="h5" sx={{ ...getTextStyles(themeMode).heading, fontWeight: 'bold' }}>
                  Your Bonsai Tree Growth
                </Typography>
              </Box>
              
              <Typography variant="body1" paragraph sx={{ ...getTextStyles(themeMode).body, mb: 4 }}>
                Watch your bonsai tree grow as you answer questions correctly! You've answered {correctAnswers.length} question{correctAnswers.length !== 1 ? 's' : ''} correctly.
              </Typography>
              
              <Box sx={{ 
                position: 'relative', 
                width: '100%',
                height: { xs: '200px', sm: '250px', md: '300px' }, 
                backgroundColor: 'transparent', 
                backgroundImage: `url('/altar4.png')`,
                backgroundSize: 'cover',
                backgroundPosition: '60% bottom',
                backgroundRepeat: 'no-repeat',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: { xs: '8px', sm: '12px' }, 
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  zIndex: 1,
                }
              }}>
                <Box sx={{ position: 'relative', zIndex: 2, width: '100%', height: '100%' }}>
                  <BonsaiTree 
                    skills={skills} 
                    totalSkills={totalSkills} 
                    correctAnswersCount={correctAnswers.length} 
                    showProgressText={false}
                  />
                </Box>
              </Box>
              
              <Typography variant="body2" sx={{ mt: 3, ...getTextStyles(themeMode).secondary, fontStyle: 'italic' }}>
                {correctAnswers.length < 10 
                  ? `Answer ${10 - correctAnswers.length} more questions correctly to fully grow your bonsai!` 
                  : "Congratulations! Your bonsai tree is fully grown!"}
              </Typography>
            </Box>
          )}

        </GlassCard>
      </Container>
    </Box>
  );
};

export default UploadReport; 