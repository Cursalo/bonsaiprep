import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Card,
  CardContent,
  CardActions,
  Grid,
  Avatar,
  Tab,
  Tabs,
  Alert,
  Snackbar,
  LinearProgress,
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronRight as ChevronRightIcon,
  Home as HomeIcon,
  Upload as UploadIcon,
  PlayLesson as PlayLessonIcon,
  Insights as InsightsIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  Quiz as QuizIcon,
  EmojiNature as EmojiNatureIcon,
  LocalFlorist as LocalFloristIcon,
  Person as PersonIcon,
  Star as StarIcon,
  School as SchoolIcon,
  Flag as FlagIcon,
  Timer as TimerIcon,
  EmojiEvents as EmojiEventsIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { supabase } from '../supabaseClient';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { getUserProgress, calculateCorrectAnswersFromDatabase, recordCompletedTest, incrementCorrectAnswersCount } from '../services/userProgressService';
import { useSkills } from '../components/SkillsProvider';
import BonsaiTree from '../components/BonsaiTree';
import SkillQuiz from '../components/SkillQuiz';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { FadeIn, ScaleIn, FloatAnimation, SlideIn, ProgressAnimation, StaggeredList } from '../components/AnimationEffects';
import TestHistoryList from '../components/TestHistoryList';
import ThemeToggle from '../components/ThemeToggle';
import { useThemeContext } from '../contexts/ThemeContext';

// Mock data for the dashboard
const mockUserData = {
  name: 'Alex Johnson',
  email: 'alex@example.com',
  lastLogin: '2 days ago'
};

interface UserOnboardingData {
  firstName: string;
  lastName: string;
  age: number;
  country: string;
  city: string;
  satScore: number | null;
  targetSatScore: number;
  motivation: string;
  subscriptionPlan: string;
  // Add other fields if necessary
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
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
    h5: {
      fontWeight: 500,
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

// Custom styles for better text readability based on dark theme best practices
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

// Background style function that adapts to theme
const getBackgroundStyle = (themeMode: 'light' | 'dark') => {
  if (themeMode === 'light') {
    return {
      background: 'linear-gradient(135deg, #fafafa 0%, #f0f4f0 100%)',
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
  }
  
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

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { themeMode } = useThemeContext();
  const { skills, totalSkills, masteredSkillsCount } = useSkills();
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [tabValue, setTabValue] = useState<number>(0);
  const [showQuiz, setShowQuiz] = useState<boolean>(false);
  const [quizResults, setQuizResults] = useState<{skillId: string; score: number}[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [showTreeAnimation, setShowTreeAnimation] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserOnboardingData | null>(null);
  const [loadingUserData, setLoadingUserData] = useState<boolean>(true);
  const [correctAnswersCount, setCorrectAnswersCount] = useState<number>(0);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchCorrectAnswersCount = useCallback(async () => {
    try {
      // First try to get the count from user_progress table
      const userProgress = await getUserProgress();
      if (userProgress && userProgress.correctAnswersCount !== undefined) {
        console.log('Dashboard - Fetched correct answers from user_progress table:', userProgress.correctAnswersCount);
        setCorrectAnswersCount(userProgress.correctAnswersCount);
      } else {
        console.warn('Dashboard - Could not get user progress from user_progress table. Calculating from practice_questions.');
        // Fall back to calculating from practice_questions and sync with user_progress
        const calculatedCount = await calculateCorrectAnswersFromDatabase(true); // Sync with user_progress table
        console.log('Dashboard - Calculated correct answers from database:', calculatedCount);
        setCorrectAnswersCount(calculatedCount);
      }
    } catch (error) {
      console.error('Dashboard - Error in fetchCorrectAnswersCount:', error);
      setCorrectAnswersCount(0); // Default to 0 on error
    }
  }, []); // Empty dependency array as these functions don't depend on component state

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: onboardingData, error } = await supabase
            .from('user_onboarding')
            .select('first_name, last_name, age, country, city, sat_score, target_sat_score, motivation, subscription_plan')
            .eq('user_id', user.id)
            .single();

          if (error) {
            console.error("Error fetching user onboarding data:", error);
          } else if (onboardingData) {
            setUserData({
              firstName: onboardingData.first_name,
              lastName: onboardingData.last_name,
              age: onboardingData.age,
              country: onboardingData.country,
              city: onboardingData.city,
              satScore: onboardingData.sat_score,
              targetSatScore: onboardingData.target_sat_score,
              motivation: onboardingData.motivation,
              subscriptionPlan: onboardingData.subscription_plan,
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
    fetchCorrectAnswersCount();
  }, [fetchCorrectAnswersCount]); // Added fetchCorrectAnswersCount to dependency array

  useEffect(() => {
    if (location.state?.fromUpload && location.state?.correctAnswers !== undefined) {
      console.log('Dashboard - Received correctAnswers from navigation:', location.state.correctAnswers);
      setShowTreeAnimation(true);
      setCorrectAnswersCount(location.state.correctAnswers); // Directly set from navigation state
      navigate(location.pathname, { replace: true, state: {} });
      const timer = setTimeout(() => setShowTreeAnimation(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [location, navigate]);

  useEffect(() => {
    console.log('Dashboard - Current correctAnswersCount state for BonsaiTree:', correctAnswersCount);
  }, [correctAnswersCount]);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleQuizComplete = async (results: {skillId: string; score: number}[]) => {
    setQuizResults(results);
    setShowQuiz(false);
    setSnackbarOpen(true);

    // Count how many results have a positive score (indicating a correct answer)
    const newlyCorrectAnswersInThisQuiz = results.filter(r => r.score > 0).length;

    if (newlyCorrectAnswersInThisQuiz > 0) {
      console.log(`Recording ${newlyCorrectAnswersInThisQuiz} newly correct answers from quiz.`);
      try {
        // recordCompletedTest adds the count to the existing total and increments completed_tests
        await recordCompletedTest(newlyCorrectAnswersInThisQuiz);
        
        // Refresh our count from the database after recording
        await fetchCorrectAnswersCount();
      } catch (error) {
        console.error('Error updating progress after quiz:', error);
      }
    } else {
      console.log('No new correct answers to record from this quiz.');
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={getBackgroundStyle(themeMode)}>
        {/* App Bar */}
        <AppBar position="fixed">
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
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              flexGrow: 1,
              justifyContent: 'center'
            }}>
              <img 
                src="/bonsaiwhitenobg.png" 
                alt="Bonsai Prep Logo" 
                style={{ 
                  height: '40px',
                  width: 'auto',
                  objectFit: 'contain',
                  maxWidth: '200px'
                }} 
              />
            </Box>
            
            {/* Theme Toggle */}
            <ThemeToggle showBackgroundSelector={true} />
            
            <Avatar sx={{ 
              bgcolor: 'primary.main',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
              ml: 1
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
              background: themeMode === 'light' 
                ? 'rgba(255, 255, 255, 0.95)' 
                : 'rgba(30, 30, 30, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
        >
          <Box sx={{ 
            pt: 8, 
            pb: 2,
            background: themeMode === 'light'
              ? 'linear-gradient(135deg, rgba(26, 147, 111, 0.1), rgba(17, 75, 95, 0.1))'
              : 'linear-gradient(135deg, rgba(136, 212, 152, 0.1), rgba(17, 75, 95, 0.1))',
          }}>
            <Typography variant="h6" sx={{ 
              textAlign: 'center', 
              fontWeight: 'bold',
              color: theme.palette.primary.main,
              mb: 2
            }}>
              Navigation
            </Typography>
          </Box>
          
          <List>
            <ListItem
              button
              component={Link}
              to="/dashboard"
              sx={{
                mx: 1,
                borderRadius: 2,
                mb: 0.5,
                backgroundColor: location.pathname === '/dashboard' 
                  ? theme.palette.primary.main + '20' 
                  : 'transparent',
                '&:hover': {
                  backgroundColor: theme.palette.primary.main + '10',
                },
              }}
            >
              <ListItemIcon sx={{ color: theme.palette.primary.main }}>
                <HomeIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Dashboard"
                sx={{ 
                  '& .MuiListItemText-primary': {
                    fontWeight: location.pathname === '/dashboard' ? 600 : 400
                  }
                }}
              />
            </ListItem>
            <ListItem
              button
              component={Link}
              to="/upload"
              sx={{
                mx: 1,
                borderRadius: 2,
                mb: 0.5,
                backgroundColor: location.pathname === '/upload' 
                  ? theme.palette.primary.main + '20' 
                  : 'transparent',
                '&:hover': {
                  backgroundColor: theme.palette.primary.main + '10',
                },
              }}
            >
              <ListItemIcon sx={{ color: theme.palette.primary.main }}>
                <UploadIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Upload Score Report"
                sx={{ 
                  '& .MuiListItemText-primary': {
                    fontWeight: location.pathname === '/upload' ? 600 : 400
                  }
                }}
              />
            </ListItem>
            <ListItem
              button
              component={Link}
              to="/lessons"
              sx={{
                mx: 1,
                borderRadius: 2,
                mb: 0.5,
                backgroundColor: location.pathname === '/lessons' 
                  ? theme.palette.primary.main + '20' 
                  : 'transparent',
                '&:hover': {
                  backgroundColor: theme.palette.primary.main + '10',
                },
              }}
            >
              <ListItemIcon sx={{ color: theme.palette.primary.main }}>
                <PlayLessonIcon />
              </ListItemIcon>
              <ListItemText 
                primary="My Lessons"
                sx={{ 
                  '& .MuiListItemText-primary': {
                    fontWeight: location.pathname === '/lessons' ? 600 : 400
                  }
                }}
              />
            </ListItem>
            <ListItem
              button
              component={Link}
              to="/video-lessons"
              sx={{
                mx: 1,
                borderRadius: 2,
                mb: 0.5,
                backgroundColor: location.pathname === '/video-lessons' 
                  ? theme.palette.primary.main + '20' 
                  : 'transparent',
                '&:hover': {
                  backgroundColor: theme.palette.primary.main + '10',
                },
              }}
            >
              <ListItemIcon sx={{ color: theme.palette.primary.main }}>
                <PlayLessonIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Video Lessons"
                sx={{ 
                  '& .MuiListItemText-primary': {
                    fontWeight: location.pathname === '/video-lessons' ? 600 : 400
                  }
                }}
              />
            </ListItem>
            <ListItem
              button
              onClick={() => setShowQuiz(true)}
              sx={{
                mx: 1,
                borderRadius: 2,
                mb: 0.5,
                backgroundColor: location.pathname === '/quiz' 
                  ? theme.palette.primary.main + '20' 
                  : 'transparent',
                '&:hover': {
                  backgroundColor: theme.palette.primary.main + '10',
                },
              }}
            >
              <ListItemIcon sx={{ color: theme.palette.primary.main }}>
                <QuizIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Take Skill Quiz"
                sx={{ 
                  '& .MuiListItemText-primary': {
                    fontWeight: location.pathname === '/quiz' ? 600 : 400
                  }
                }}
              />
            </ListItem>
            <ListItem
              button
              component={Link}
              to="/progress"
              sx={{
                mx: 1,
                borderRadius: 2,
                mb: 0.5,
                backgroundColor: location.pathname === '/progress' 
                  ? theme.palette.primary.main + '20' 
                  : 'transparent',
                '&:hover': {
                  backgroundColor: theme.palette.primary.main + '10',
                },
              }}
            >
              <ListItemIcon sx={{ color: theme.palette.primary.main }}>
                <InsightsIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Progress"
                sx={{ 
                  '& .MuiListItemText-primary': {
                    fontWeight: location.pathname === '/progress' ? 600 : 400
                  }
                }}
              />
            </ListItem>
          </List>
        </Drawer>

        {/* Main content with better mobile spacing */}
        <Container 
          maxWidth="lg" 
          sx={{ 
            pt: isMobile ? 8 : 10, 
            pb: 4,
            px: isMobile ? 2 : 3,
            ml: !isMobile && drawerOpen ? '300px' : 0,
            transition: 'margin 0.3s ease',
          }}
        >
          <Grid container spacing={isMobile ? 2 : 4}>
            <Grid item xs={12}>
              <Box sx={{ mt: isMobile ? 1 : 3, mb: isMobile ? 2 : 4 }}>
                <Typography variant={isMobile ? 'h6' : 'h5'} gutterBottom sx={{ 
                  fontWeight: 'bold', 
                  color: theme.palette.text.primary,
                  textShadow: themeMode === 'dark' ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
                  textAlign: 'center',
                  mb: isMobile ? 2 : 4,
                  fontSize: isMobile ? '1.5rem' : '2rem'
                }}>
                  Your Learning Bonsai
                </Typography>
                
                <BonsaiTree 
                  skills={skills} 
                  totalSkills={totalSkills}
                  correctAnswersCount={correctAnswersCount}
                  showProgressText={false}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>

        {/* SkillQuiz dialog */}
        {showQuiz && (
          <SkillQuiz 
            onComplete={handleQuizComplete} 
            onClose={() => setShowQuiz(false)} 
          />
        )}

        {/* Snackbar for quiz results */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          message="Quiz Completed! Your skills have been updated."
        />
      </Box>
    </ThemeProvider>
  );
};

export default Dashboard; 