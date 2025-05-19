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
  Tooltip,
  Avatar
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
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

// Text styles for better readability based on dark theme best practices
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

// Create a dark theme to match onboarding
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#88d498',
    },
    secondary: {
      main: '#88d498',
    },
    background: {
      paper: 'rgba(33, 33, 33, 0.95)',
      default: '#121212',
    },
    text: {
      primary: 'rgba(255, 255, 255, 0.87)',
      secondary: 'rgba(255, 255, 255, 0.6)',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    }
  },
  components: {
    MuiInputBase: {
      styleOverrides: {
        input: {
          color: 'rgba(255, 255, 255, 0.87)',
        },
        root: {
          backgroundColor: 'rgba(30, 30, 30, 0.4)',
        }
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#88d498',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#88d498',
          },
        },
        notchedOutline: {
          borderColor: 'rgba(255, 255, 255, 0.23)',
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          color: 'rgba(255, 255, 255, 0.6)',
          '&.Mui-focused': {
            color: '#88d498',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(30, 30, 30, 0.6)',
          backdropFilter: 'blur(10px)',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(24, 24, 24, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(12, 59, 46, 0.8)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
        contained: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          backgroundColor: '#88d498',
          '&:hover': {
            backgroundColor: '#6bbb7b',
          },
        },
        outlined: {
          borderColor: '#88d498',
          color: '#88d498',
          '&:hover': {
            borderColor: '#6bbb7b',
            backgroundColor: 'rgba(136, 212, 152, 0.08)',
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          '&.Mui-selected': {
            color: '#88d498',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#88d498',
        },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          color: 'rgba(30, 30, 30, 0.8)',
          '&.Mui-active': {
            color: '#88d498',
          },
          '&.Mui-completed': {
            color: '#6bbb7b',
          },
        },
      },
    },
  },
});

const UploadReport: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
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

        // Handle text files the same way as before
        if (file.type === 'text/plain') {
          setLoadingMessage('Reading text file content...');
          const text = await file.text();
          // Add realistic processing delay
          await addProcessingDelay(2500);
          setExtractedText(text);
          setActiveStep(2);
          
          setLoadingMessage('Analyzing report and generating personalized questions...');
          await addProcessingDelay(10000);
          const questions = await generateQuestionsFromMistakes(text);
          setGeneratedQuestions(questions);
          setActiveStep(3);
        } else {
          // For PDF files, now process directly with Gemini 1.5 Flash
          setLoadingMessage('Processing PDF content...');
          
          // We'll upload the file to Supabase for tracking/storage purposes
          const { storagePath } = await uploadFileToSupabase(file, 'score-reports', { publicAccess: false });
          console.log('File uploaded to Supabase:', { storagePath });
          
          // Skip text extraction step and directly process the PDF with Gemini
          await addProcessingDelay(3000);
          
          // Skip the text extraction step for improved UI flow
          setActiveStep(2);
          setLoadingMessage('Analyzing PDF and generating personalized questions...');
          
          // Generate questions directly from the PDF file using Gemini 2.0 Flash
          await addProcessingDelay(10000);
          const questions = await generateQuestionsFromMistakes(file);
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
      await addProcessingDelay(10000);
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
  const checkAnswer = async (questionId: string) => {
    setShowExplanations(prev => ({
      ...prev,
      [questionId]: true
    }));
    
    const question = generatedQuestions.find(q => q.id === questionId);
    if (question && isAnswerCorrect(question, studentAnswers[questionId])) {
      // If correct and not already in correctAnswers, add it
      if (!correctAnswers.includes(questionId)) {
        // Update local state
        setCorrectAnswers(prev => {
          const newCorrectAnswers = [...prev, questionId];
          
          // Update user progress in database (don't await to avoid blocking UI)
          updateCorrectAnswersCount(newCorrectAnswers.length).catch(error => {
            console.error('Error updating correct answers count:', error);
          });
          
          return newCorrectAnswers;
        });
        
        // Show the tree growth effect
        setTreeGrowthTriggered(true);
        setTimeout(() => setTreeGrowthTriggered(false), 2000);
        
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
            
            // Record the practice question in the database
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                // Store the question attempt
                await supabase
                  .from('practice_questions')
                  .insert({
                    user_id: user.id,
                    question_data: question,
                    completed: true,
                    correct: true,
                    selected_option: studentAnswers[questionId],
                    source: 'upload'
                  });
              }
            } catch (error) {
              console.error('Error recording question attempt:', error);
            }
            
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
    } else if (question) {
      // If incorrect, still record the attempt
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Store the incorrect question attempt
          await supabase
            .from('practice_questions')
            .insert({
              user_id: user.id,
              question_data: question,
              completed: true,
              correct: false,
              selected_option: studentAnswers[questionId],
              source: 'upload'
            });
        }
      } catch (error) {
        console.error('Error recording incorrect question attempt:', error);
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
  const isAnswerCorrect = (question: GeneratedQuestion, studentAnswer: string): boolean => {
    // Ensure both studentAnswer and question.answer are valid strings before trimming and comparing.
    if (typeof studentAnswer !== 'string' || typeof question.answer !== 'string') {
      // This scenario indicates an issue with data or types, log for debugging.
      console.error('Invalid data for answer comparison:', { questionId: question?.id, studentAnswer, questionAnswer: question?.answer });
      return false;
    }
    return studentAnswer.trim().toUpperCase() === question.answer.trim().toUpperCase(); // Compare in uppercase
  };

  // Handle navigate to dashboard to see tree growth
  const handleViewTreeGrowth = async () => {
    try {
      // Update correct answers count in the database before navigating
      await updateCorrectAnswersCount(correctAnswers.length);
      console.log('Updated correct answers count in database:', correctAnswers.length);
      
      // Navigate to dashboard with state
      navigate('/dashboard', { 
        state: { 
          fromUpload: true, 
          correctAnswers: correctAnswers.length 
        } 
      });
    } catch (error) {
      console.error('Error updating correct answers count:', error);
      
      // Still navigate even if there was an error
      navigate('/dashboard', { 
        state: { 
          fromUpload: true, 
          correctAnswers: correctAnswers.length 
        } 
      });
    }
  };

  // Background style with animation to match onboarding
  const getBackgroundStyle = () => {
    return {
      background: 'linear-gradient(135deg, #121212 0%, #1e3a34 100%)',
      backgroundSize: '200% 200%',
      animation: 'gradient 15s ease infinite',
      minHeight: '100vh',
      transition: 'background 0.5s ease-in-out',
      '@keyframes gradient': {
        '0%': { backgroundPosition: '0% 50%' },
        '50%': { backgroundPosition: '100% 50%' },
        '100%': { backgroundPosition: '0% 50%' }
      }
    } as React.CSSProperties;
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={getBackgroundStyle()}>
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
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, letterSpacing: '-0.01em' }}>
              Upload Score Report
            </Typography>
            
            {/* User Avatar */}
            <Avatar sx={{ 
              bgcolor: 'primary.main',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            }}>
              {loadingUserData ? '' : userData?.firstName?.charAt(0) || 'U'}
            </Avatar>
            
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

        <Container maxWidth="md" sx={{ py: 4 }}>
          <FadeIn>
            <Typography variant="h4" gutterBottom align="center" 
              sx={{ color: 'rgba(255, 255, 255, 0.87)', textShadow: '0 2px 4px rgba(0,0,0,0.3)', fontWeight: 'bold', mb: 2 }}>
              Upload Your SAT Practice Report
            </Typography>
            <Typography variant="subtitle1" paragraph align="center" 
              sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 4 }}>
              Upload your report or paste text to get personalized lessons and practice questions
            </Typography>
          </FadeIn>

          {apiKeyMissing && (
            <Alert 
              severity="warning" 
              sx={{ 
                mb: 3, 
                background: 'rgba(237, 108, 2, 0.15)', 
                color: 'rgba(255, 255, 255, 0.87)',
                '& .MuiAlert-icon': {
                  color: 'rgba(255, 167, 38, 0.9)'
                },
                borderRadius: 2
              }}
            >
              <Typography variant="subtitle2" fontWeight="bold">API Key Missing</Typography>
              <Typography variant="body2">
                The application is running in limited mode. Some advanced features may not be available. Please contact the administrator for full functionality.
              </Typography>
            </Alert>
          )}

          <GlassCard sx={{ p: {xs: 3, md: 4}, mb: 4, backdropFilter: 'blur(10px)' }}>
            <Stepper 
              activeStep={activeStep} 
              alternativeLabel 
              sx={{ 
                mb: 4, 
                display: { xs: 'none', sm: 'flex' },
                '& .MuiStepLabel-label': {
                  color: 'rgba(255, 255, 255, 0.6)',
                  mt: 1
                },
                '& .MuiStepLabel-active': {
                  color: 'rgba(255, 255, 255, 0.87)'
                },
                '& .MuiStepIcon-root': {
                  color: 'rgba(30, 30, 30, 0.8)'
                },
                '& .MuiStepIcon-active': {
                  color: '#88d498'
                },
                '& .MuiStepIcon-completed': {
                  color: 'rgba(136, 212, 152, 0.7)'
                },
                '& .MuiStepConnector-line': {
                  borderColor: 'rgba(255, 255, 255, 0.12)'
                }
              }}
            >
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
            
            {/* Mobile stepper status */}
            <Box sx={{ mb: 4, display: { xs: 'block', sm: 'none' }, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Step {activeStep + 1} of 4: {['Upload Report', 'Process Content', 'Extract Information', 'Generate Questions'][activeStep]}
              </Typography>
            </Box>
            
            <Box sx={{ width: '100%', mb: 3 }}>
              <Tabs
                value={inputMethod}
                onChange={handleInputMethodChange}
                centered
                sx={{
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#88d498',
                    height: 3
                  },
                  '& .MuiTab-root': {
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '1rem',
                    '&.Mui-selected': {
                      color: 'rgba(255, 255, 255, 0.87)'
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
                      p: 4,
                      textAlign: 'center',
                      border: '2px dashed',
                      borderColor: isDragActive ? '#88d498' : 'rgba(255, 255, 255, 0.23)',
                      borderRadius: 2,
                      backgroundColor: isDragActive ? 'rgba(26, 147, 111, 0.08)' : 'rgba(18, 18, 18, 0.5)',
                      backdropFilter: 'blur(8px)',
                      cursor: 'pointer',
                      minHeight: 200,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      overflow: 'hidden',
                      position: 'relative',
                      '&:hover': {
                        borderColor: '#88d498',
                        backgroundColor: 'rgba(26, 147, 111, 0.05)'
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: -1,
                        opacity: 0.1,
                        background: 'linear-gradient(135deg, rgba(136, 212, 152, 0.2) 0%, rgba(12, 59, 46, 0.2) 100%)',
                        animation: 'gradientBackground 15s ease infinite',
                        '@keyframes gradientBackground': {
                          '0%': { backgroundPosition: '0% 50%' },
                          '50%': { backgroundPosition: '100% 50%' },
                          '100%': { backgroundPosition: '0% 50%' }
                        }
                      }
                    }}
                  >
                    <input {...getInputProps()} />
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      position: 'relative',
                      zIndex: 1
                    }}>
                      <CloudUploadIcon sx={{ 
                        fontSize: 60, 
                        color: '#88d498', 
                        mb: 1,
                        filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))',
                        animation: isDragActive ? 'pulse 1.5s infinite' : 'none',
                        '@keyframes pulse': {
                          '0%': { transform: 'scale(1)' },
                          '50%': { transform: 'scale(1.1)' },
                          '100%': { transform: 'scale(1)' },
                        }
                      }} />
                      <PictureAsPdfIcon sx={{ 
                        fontSize: 40, 
                        color: 'rgba(255, 255, 255, 0.6)', 
                        mb: 2,
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                      }} />
                    </Box>
                    {isDragActive ? (
                      <Typography variant="h6" sx={{ 
                        color: '#88d498', 
                        fontWeight: 'bold',
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}>
                        Drop the file here ...
                      </Typography>
                    ) : (
                      <Typography variant="h6" sx={{ 
                        color: 'rgba(255, 255, 255, 0.87)', 
                        fontWeight: 'medium',
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}>
                        Drag 'n' drop a file here, or click to select file
                      </Typography>
                    )}
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mt: 1 }}>
                      (Max file size: 10MB. Supported formats: PDF, TXT)
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ 
                      color: 'rgba(255, 255, 255, 0.87)',
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
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(18, 18, 18, 0.5)',
                          backdropFilter: 'blur(8px)',
                          borderRadius: 2,
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#88d498'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#88d498',
                            borderWidth: 2
                          }
                        },
                        '& .MuiInputBase-input': {
                          color: 'rgba(255, 255, 255, 0.87)'
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
                      sx={{ py: 1.5 }}
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
                  backgroundColor: 'rgba(211, 47, 47, 0.15)', 
                  color: 'rgba(255, 255, 255, 0.87)',
                  '& .MuiAlert-icon': {
                    color: 'rgba(244, 67, 54, 0.9)'
                  },
                  borderRadius: 2
                }}
              >
                {error}
              </Alert>
            )}

            {uploadedFile && inputMethod === 'file' && !error && !isLoading && activeStep < 3 && (
              <ScaleIn>
                <Box sx={{ 
                  p: 3, 
                  mt: 3, 
                  backgroundColor: 'rgba(18, 18, 18, 0.7)', 
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  border: '1px solid rgba(136, 212, 152, 0.2)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                }}>
                  <Typography variant="h6" sx={{ 
                    color: 'rgba(255, 255, 255, 0.87)',
                    fontWeight: 'medium',
                    mb: 2
                  }}>
                    Uploaded File:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <PictureAsPdfIcon sx={{ color: '#88d498', mr: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
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
              </ScaleIn>
            )}

            {isLoading && (
              <Box sx={{ textAlign: 'center', my: 6, position: 'relative' }}>
                <FloatAnimation>
                  <LoadingAnimation
                    message={loadingMessage || 'Processing...'}
                    width={280}
                    height={280}
                  />
                </FloatAnimation>
              </Box>
            )}

            {extractedText && !isLoading && activeStep === 2 && (
              <ScaleIn>
                <Box sx={{ 
                  p: 4, 
                  mt: 4, 
                  backgroundColor: 'rgba(18, 18, 18, 0.7)', 
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  border: '1px solid rgba(136, 212, 152, 0.2)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                }}>
                  <Typography variant="h6" gutterBottom sx={{ 
                    color: 'rgba(255, 255, 255, 0.87)',
                    fontWeight: 'medium',
                    mb: 2
                  }}>
                    Extracted Text (Preview):
                  </Typography>
                  <Box sx={{ 
                    maxHeight: 150, 
                    overflowY: 'auto', 
                    whiteSpace: 'pre-wrap', 
                    backgroundColor: 'rgba(12, 12, 12, 0.9)', 
                    p: 3, 
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      {extractedText}
                    </Typography>
                  </Box>
                </Box>
              </ScaleIn>
            )}
            
            {generatedQuestions.length > 0 && !isLoading && (
              <Box sx={{ mt: 4 }}>
                <FadeIn>
                  <GlassCard sx={{ 
                    p: 3, 
                    borderRadius: 2, 
                    mb: 4,
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(136, 212, 152, 0.2)',
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <SchoolIcon sx={{ fontSize: 32, color: '#88d498', mr: 1.5, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                      <Typography variant="h5" sx={{ color: 'rgba(255, 255, 255, 0.87)', fontWeight: 'bold' }}>
                        Your Personalized Practice Questions
                      </Typography>
                    </Box>
                    
                    <Typography variant="body1" paragraph sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
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
                          background: 'rgba(46, 125, 50, 0.15)',
                          color: 'rgba(255, 255, 255, 0.87)',
                          '& .MuiAlert-icon': {
                            color: 'rgba(129, 199, 132, 0.9)'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <Typography sx={textStyles.body}>
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
                    
                    <Divider sx={{ mb: 3, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                    
                    {Object.entries(questionsByTopic).map(([topic, questions], topicIndex) => (
                      <Accordion 
                        key={topicIndex} 
                        defaultExpanded={topicIndex === 0} 
                        sx={{ 
                          mb: 2, 
                          boxShadow: 'none', 
                          background: 'rgba(30, 30, 30, 0.4)', 
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '4px !important',
                          '&:before': {
                            display: 'none'
                          },
                          '&.Mui-expanded': {
                            margin: '0 0 16px 0'
                          }
                        }}
                      >
                        <AccordionSummary 
                          expandIcon={<ExpandMoreIcon sx={{ color: 'rgba(255, 255, 255, 0.6)' }} />}
                          sx={{ 
                            backgroundColor: 'rgba(18, 18, 18, 0.6)',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '4px',
                            '&.Mui-expanded': {
                              borderBottomLeftRadius: 0,
                              borderBottomRightRadius: 0
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                            <Typography variant="h6" sx={{ ...textStyles.heading, fontWeight: 'bold' }}>
                              {topic} ({questions.length})
                            </Typography>
                            
                            {/* Show mini progress for this topic */}
                            {questions.length > 0 && (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ ...textStyles.secondary, mr: 1 }}>
                                  {questions.filter(q => correctAnswers.includes(q.id)).length}/{questions.length} Correct
                                </Typography>
                                {questions.some(q => correctAnswers.includes(q.id)) && (
                                  <LocalFloristIcon 
                                    fontSize="small" 
                                    sx={{ 
                                      color: 'rgba(129, 199, 132, 0.9)',
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
                            <Box 
                              key={question.id} 
                              sx={{ 
                                mb: 2, 
                                m: 2, 
                                p: 3,
                                borderRadius: 2, 
                                background: 'rgba(24, 24, 24, 0.9)',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="subtitle1" sx={{ ...textStyles.heading, fontWeight: 'bold' }}>
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
                                          color: 'rgba(255, 255, 255, 0.6)',
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
                              
                              <Typography variant="body1" paragraph sx={{ ...textStyles.body, whiteSpace: 'pre-wrap' }}>
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
                                              color: 'rgba(255, 255, 255, 0.6)',
                                              '&.Mui-checked': {
                                                color: 'rgba(136, 212, 152, 0.9)',
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
                                                  'rgba(129, 199, 132, 0.9)' : 'rgba(255, 255, 255, 0.87)'
                                          }}>
                                            <Typography variant="body1">
                                              {String.fromCharCode(65 + i)}. {opt}
                                            </Typography>
                                            {showExplanations[question.id] && 
                                              question.answer === String.fromCharCode(65 + i) && 
                                              <CheckCircleIcon sx={{ ml:.5, color: 'rgba(129, 199, 132, 0.9)' }} />
                                            }
                                          </Box>
                                        }
                                        sx={{ 
                                          p: 1.5, 
                                          mb: 1, 
                                          borderRadius: 1, 
                                          border: '1px solid',
                                          borderColor: 'rgba(255, 255, 255, 0.1)',
                                          backgroundColor: showExplanations[question.id] && 
                                                    question.answer === String.fromCharCode(65 + i) ? 
                                                    'rgba(76, 175, 80, 0.08)' : 'rgba(30, 30, 30, 0.3)',
                                          transition: 'all 0.2s ease',
                                          '&:hover': {
                                            backgroundColor: !showExplanations[question.id] ? 
                                              'rgba(30, 30, 30, 0.6)' : 
                                              (question.answer === String.fromCharCode(65 + i) ? 
                                                'rgba(76, 175, 80, 0.08)' : 'rgba(30, 30, 30, 0.3)')
                                          }
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
                                            backgroundColor: 'rgba(46, 125, 50, 0.15)',
                                            color: 'rgba(255, 255, 255, 0.87)',
                                            '& .MuiAlert-icon': {
                                              color: 'rgba(129, 199, 132, 0.9)'
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
                                            backgroundColor: 'rgba(211, 47, 47, 0.15)',
                                            color: 'rgba(255, 255, 255, 0.87)',
                                            '& .MuiAlert-icon': {
                                              color: 'rgba(244, 67, 54, 0.9)'
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
                                      bgcolor: 'rgba(18, 18, 18, 0.8)', 
                                      borderRadius: 1.5,
                                      border: '1px solid rgba(136, 212, 152, 0.2)',
                                      position: 'relative',
                                      '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '4px',
                                        height: '100%',
                                        backgroundColor: 'rgba(136, 212, 152, 0.9)',
                                        borderTopLeftRadius: 4,
                                        borderBottomLeftRadius: 4
                                      }
                                    }}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', ...textStyles.heading, mb: 0.5, pl: 1 }}>
                                        Explanation:
                                      </Typography>
                                      <Typography variant="body2" sx={{ ...textStyles.body, whiteSpace: 'pre-wrap', pl: 1 }}>
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
                  </GlassCard>
                </FadeIn>
                
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
              <FadeIn>
                <GlassCard sx={{ 
                  p: 3, 
                  mt: 4, 
                  mb: 4, 
                  borderRadius: 2, 
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(136, 212, 152, 0.2)',
                  textAlign: 'center'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'center' }}>
                    <EmojiNatureIcon sx={{ fontSize: 32, color: '#88d498', mr: 1.5, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                    <Typography variant="h5" sx={{ color: 'rgba(255, 255, 255, 0.87)', fontWeight: 'bold' }}>
                      Your Bonsai Tree Growth
                    </Typography>
                  </Box>
                  
                  <Typography variant="body1" paragraph sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 4 }}>
                    Watch your bonsai tree grow as you answer questions correctly! You've answered {correctAnswers.length} question{correctAnswers.length !== 1 ? 's' : ''} correctly.
                  </Typography>
                  
                  <Box sx={{ 
                    // Use styling similar to Dashboard for the Bonsai Tree container
                    position: 'relative', 
                    width: '100%', // Take full width of its parent GlassCard
                    aspectRatio: '16/9', 
                    maxHeight: '500px', // Match dashboard's height
                    backgroundColor: 'transparent', 
                    backgroundImage: `url('/altar4.png')`, // Use the same altar image
                    backgroundSize: 'cover',
                    backgroundPosition: '60% bottom',
                    backgroundRepeat: 'no-repeat',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: '12px', // Keep existing card's border radius for the container
                    overflow: 'hidden', // Ensure content respects border radius
                    margin: '20px auto' // Add some margin for spacing within the card
                  }}>
                    <BonsaiTree 
                      skills={skills} 
                      totalSkills={totalSkills} 
                      correctAnswersCount={correctAnswers.length} 
                      maxCorrectAnswers={10} 
                    />
                  </Box>
                  
                  <Typography variant="body2" sx={{ mt: 3, color: 'rgba(255, 255, 255, 0.6)', fontStyle: 'italic' }}>
                    {correctAnswers.length < 10 
                      ? `Answer ${10 - correctAnswers.length} more questions correctly to fully grow your bonsai!` 
                      : "Congratulations! Your bonsai tree is fully grown!"}
                  </Typography>
                </GlassCard>
              </FadeIn>
            )}

          </GlassCard>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default UploadReport; 