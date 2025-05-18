import React, { useState, useEffect } from 'react';
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
  CircularProgress
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import HomeIcon from '@mui/icons-material/Home';
import UploadIcon from '@mui/icons-material/Upload';
import PlayLessonIcon from '@mui/icons-material/PlayLesson';
import InsightsIcon from '@mui/icons-material/Insights';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import QuizIcon from '@mui/icons-material/Quiz';
import EmojiNatureIcon from '@mui/icons-material/EmojiNature';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import SchoolIcon from '@mui/icons-material/School';
import FlagIcon from '@mui/icons-material/Flag';
import TimerIcon from '@mui/icons-material/Timer';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { supabase } from '../supabaseClient';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Import our components
import BonsaiTree from '../components/BonsaiTree';
import SkillQuiz from '../components/SkillQuiz';
import { useSkills } from '../components/SkillsProvider';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { FadeIn, ScaleIn, FloatAnimation, SlideIn, ProgressAnimation, StaggeredList } from '../components/AnimationEffects';

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

// Function to define animated background gradient
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

const Dashboard: React.FC = () => {
  const { skills, totalSkills, masteredSkillsCount /*, updateSkillProgress */ } = useSkills(); // Commented out updateSkillProgress
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [tabValue, setTabValue] = useState<number>(0);
  const [showQuiz, setShowQuiz] = useState<boolean>(false);
  const [quizResults, setQuizResults] = useState<{skillId: string; score: number}[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [showTreeAnimation, setShowTreeAnimation] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserOnboardingData | null>(null);
  const [loadingUserData, setLoadingUserData] = useState<boolean>(true);
  const navigate = useNavigate();
  const location = useLocation();

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
            // Handle error (e.g., show a notification to the user)
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
  }, []);

  // Check if we're coming from the upload page to show animation
  useEffect(() => {
    // If we're coming from upload page, show animation
    if (location.state?.fromUpload && location.state?.correctAnswers > 0) {
      setShowTreeAnimation(true);
      
      // Reset animation after a delay
      const timer = setTimeout(() => {
        setShowTreeAnimation(false);
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  }, [location]);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleQuizComplete = (results: {skillId: string; score: number}[]) => {
    setQuizResults(results);
    setShowQuiz(false);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Calculate progress percentage
  const progressPercentage = Math.round((masteredSkillsCount / totalSkills) * 100);

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={getBackgroundStyle()}>
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
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, letterSpacing: '-0.01em' }}>
              Bonsai Prep - Dashboard
            </Typography>
            <Avatar sx={{ 
              bgcolor: 'primary.main',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
            }}>
              {loadingUserData ? '' : userData?.firstName?.charAt(0) || 'U'}
            </Avatar>
          </Toolbar>
        </AppBar>

        {/* Drawer */}
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            '& .MuiDrawer-paper': { 
              width: 240,
              background: 'rgba(12, 59, 46, 0.95)',
              backdropFilter: 'blur(10px)',
              color: '#f8f9fa',
              border: 'none',
              boxShadow: '0 0 20px rgba(0, 0, 0, 0.3)'
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
            <Typography variant="h6" sx={{ flexGrow: 1, color: '#f8f9fa', letterSpacing: '-0.01em' }}>
              Bonsai Prep
            </Typography>
            <IconButton onClick={handleDrawerToggle} sx={{ color: '#f8f9fa' }}>
              <ChevronRightIcon />
            </IconButton>
          </Box>
          <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
          <List>
            <ListItem 
              button 
              component={Link} 
              to="/dashboard"
              sx={{
                borderRadius: '8px',
                m: 0.5,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              <ListItemIcon sx={{ color: '#1a936f' }}>
                <HomeIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            <ListItem 
              button 
              component={Link} 
              to="/upload"
              sx={{
                borderRadius: '8px',
                m: 0.5,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              <ListItemIcon sx={{ color: '#1a936f' }}>
                <UploadIcon />
              </ListItemIcon>
              <ListItemText primary="Upload Score Report" />
            </ListItem>
            <ListItem 
              button 
              component={Link} 
              to="/lessons"
              sx={{
                borderRadius: '8px',
                m: 0.5,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              <ListItemIcon sx={{ color: '#1a936f' }}>
                <PlayLessonIcon />
              </ListItemIcon>
              <ListItemText primary="My Lessons" />
            </ListItem>
            <ListItem 
              button 
              onClick={() => setShowQuiz(true)}
              sx={{
                borderRadius: '8px',
                m: 0.5,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              <ListItemIcon sx={{ color: '#1a936f' }}>
                <QuizIcon />
              </ListItemIcon>
              <ListItemText primary="Take Skill Quiz" />
            </ListItem>
            <ListItem 
              button 
              component={Link} 
              to="/progress"
              sx={{
                borderRadius: '8px',
                m: 0.5,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              <ListItemIcon sx={{ color: '#1a936f' }}>
                <InsightsIcon />
              </ListItemIcon>
              <ListItemText primary="Progress" />
            </ListItem>
          </List>
        </Drawer>

        {/* Main content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            pt: '80px', // Adjusted to account for AppBar
            width: '100%',
            overflowY: 'auto',
            minHeight: '100vh'
          }}
        >
          <Container maxWidth="lg">
            <FadeIn duration={800}>
              <Box sx={{ 
                borderBottom: 1, 
                borderColor: 'rgba(255, 255, 255, 0.1)', 
                mb: 3,
                pb: 1
              }}>
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange} 
                  aria-label="dashboard tabs" 
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    '& .MuiTab-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '1rem',
                      '&.Mui-selected': {
                        color: 'rgba(255, 255, 255, 0.95)'
                      }
                    }
                  }}
                >
                  <Tab label="Overview" icon={<InsightsIcon />} sx={{ minWidth: 120 }} />
                  <Tab label="My Bonsai" icon={<EmojiNatureIcon />} sx={{ minWidth: 120 }} />
                  <Tab label="Skill Progress" icon={<LocalFloristIcon />} sx={{ minWidth: 120 }} />
                  <Tab label="Profile" icon={<PersonIcon />} sx={{ minWidth: 120 }} />
                </Tabs>
              </Box>
            </FadeIn>

            <TabPanel value={tabValue} index={0}>
              {/* Overview Content */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <FadeIn>
                    <GlassCard sx={{ mb: 3, p: 3, height: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar 
                          sx={{ 
                            width: 64, 
                            height: 64, 
                            bgcolor: 'primary.main',
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                            mr: 2
                          }}
                        >
                          {loadingUserData ? '' : userData?.firstName?.charAt(0) || 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="h4" gutterBottom sx={{ 
                            fontWeight: 'bold',
                            color: 'rgba(255, 255, 255, 0.87)',
                            textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            m: 0 
                          }}>
                            Welcome back, {loadingUserData ? 'User' : userData?.firstName || 'User'}!
                          </Typography>
                          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Let's continue your SAT preparation journey.
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                      
                      {/* Score Visualization */}
                      {userData?.targetSatScore && (
                        <Box sx={{ mt: 3, mb: 4 }}>
                          <Typography variant="h6" gutterBottom sx={{ 
                            fontWeight: 'bold', 
                            color: 'rgba(255, 255, 255, 0.87)',
                            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                          }}>
                            Your SAT Score Journey
                          </Typography>
                          
                          <Box sx={{ 
                            position: 'relative', 
                            height: 70, 
                            background: 'linear-gradient(90deg, rgba(30, 30, 30, 0.7) 0%, rgba(12, 59, 46, 0.7) 50%, rgba(40, 80, 60, 0.7) 100%)',
                            backdropFilter: 'blur(8px)',
                            borderRadius: 4,
                            mt: 2,
                            mb: 1,
                            overflow: 'hidden',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.2)'
                          }}>
                            {/* Base Score Line at 400 */}
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                position: 'absolute', 
                                bottom: 0, 
                                left: '0%', 
                                transform: 'translateX(-50%)',
                                color: 'rgba(255, 255, 255, 0.6)'
                              }}
                            >
                              400
                            </Typography>
                            
                            {/* Perfect Score Line at 1600 */}
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                position: 'absolute', 
                                bottom: 0, 
                                left: '100%', 
                                transform: 'translateX(-50%)',
                                color: 'rgba(255, 255, 255, 0.6)'
                              }}
                            >
                              1600
                            </Typography>
                            
                            {/* Current Score Marker */}
                            {userData.satScore && (
                              <>
                                <Box sx={{ 
                                  position: 'absolute',
                                  left: `${((userData.satScore - 400) / 1200) * 100}%`,
                                  top: '50%',
                                  transform: 'translate(-50%, -50%)',
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  bgcolor: '#88d498',
                                  border: '2px solid rgba(255, 255, 255, 0.9)',
                                  boxShadow: '0 0 10px rgba(136, 212, 152, 0.7)',
                                  zIndex: 2
                                }} />
                                <Typography 
                                  variant="subtitle2" 
                                  sx={{ 
                                    position: 'absolute', 
                                    top: 5, 
                                    left: `${((userData.satScore - 400) / 1200) * 100}%`, 
                                    transform: 'translateX(-50%)',
                                    color: '#88d498',
                                    fontWeight: 'bold',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.4)'
                                  }}
                                >
                                  Current: {userData.satScore}
                                </Typography>
                              </>
                            )}
                            
                            {/* Target Score Marker */}
                            <Box sx={{ 
                              position: 'absolute',
                              left: `${((userData.targetSatScore - 400) / 1200) * 100}%`,
                              top: '50%',
                              transform: 'translate(-50%, -50%)',
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: '#88d498',
                              border: '2px solid rgba(255, 255, 255, 0.9)',
                              boxShadow: '0 0 10px rgba(136, 212, 152, 0.7)',
                              zIndex: 2
                            }} />
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                position: 'absolute', 
                                bottom: 5, 
                                left: `${((userData.targetSatScore - 400) / 1200) * 100}%`, 
                                transform: 'translateX(-50%)',
                                color: '#88d498',
                                fontWeight: 'bold',
                                textShadow: '0 1px 2px rgba(0,0,0,0.4)'
                              }}
                            >
                              Target: {userData.targetSatScore}
                            </Typography>
                            
                            {/* Score Connection Line */}
                            {userData.satScore && (
                              <Box sx={{ 
                                position: 'absolute',
                                left: `${((userData.satScore - 400) / 1200) * 100}%`,
                                width: `${((userData.targetSatScore - userData.satScore) / 1200) * 100}%`,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                height: 2,
                                background: 'linear-gradient(90deg, #88d498 0%, #6bcca1 100%)',
                                zIndex: 1,
                                boxShadow: '0 0 8px rgba(136, 212, 152, 0.5)'
                              }} />
                            )}
                          </Box>
                          
                          <Typography variant="body2" sx={{ mt: 1, textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)' }}>
                            {userData.satScore 
                              ? `You need ${userData.targetSatScore - userData.satScore} more points to reach your target score!` 
                              : `Set your current score to track your progress toward ${userData.targetSatScore}!`}
                          </Typography>
                        </Box>
                      )}
                      
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {masteredSkillsCount < totalSkills 
                          ? `You have mastered ${masteredSkillsCount} out of ${totalSkills} skills. Keep up the great work!` 
                          : "Congratulations! You've mastered all skills!"}
                      </Typography>
                      {masteredSkillsCount < totalSkills && (
                         <Box sx={{ mt: 2 }}>
                           <LinearProgress 
                             variant="determinate" 
                             value={progressPercentage} 
                             sx={{ 
                               height: 10, 
                               borderRadius: 5, 
                               mb: 1,
                               backgroundColor: 'rgba(30, 30, 30, 0.5)',
                               '& .MuiLinearProgress-bar': {
                                 backgroundColor: '#88d498',
                                 boxShadow: '0 0 5px rgba(136, 212, 152, 0.5)'
                               }
                             }} 
                           />
                           <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                             {progressPercentage}% complete
                           </Typography>
                         </Box>
                      )}
                      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                        <GradientButton 
                          variant="contained" 
                          gradient="primary" 
                          startIcon={<PlayLessonIcon />} 
                          onClick={() => navigate('/lessons')}
                        >
                          Go to Lessons
                        </GradientButton>
                        <GradientButton 
                          variant="outlined" 
                          gradient="primary" 
                          startIcon={<UploadIcon />} 
                          onClick={() => navigate('/upload')}
                        >
                          Upload Report
                        </GradientButton>
                      </Box>
                    </GlassCard>
                  </FadeIn>
                </Grid>
                <Grid item xs={12} md={4}>
                  <SlideIn direction="right">
                    <GlassCard sx={{ p: 2, height: '100%' }}>
                      <Typography variant="h6" gutterBottom sx={{ 
                        fontWeight: 'bold', 
                        color: 'rgba(255, 255, 255, 0.87)',
                        textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                      }}>
                        Daily Tip
                      </Typography>
                      <Typography variant="body2" align="center" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Practice consistently, even if it's just for 15-30 minutes each day. Consistency builds momentum!
                      </Typography>
                      <Box sx={{ textAlign: 'center', mt: 2 }}>
                        <img src="/idea.svg" alt="Idea Lightbulb" style={{ width: '80px', margin: '0 auto', filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.2))' }} />
                      </Box>
                    </GlassCard>
                  </SlideIn>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {/* Bonsai Tree Content */}
              <ScaleIn>
                <GlassCard sx={{ 
                  overflow: 'hidden',
                  p: 0,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                  border: '1px solid rgba(136, 212, 152, 0.2)'
                }}>
                  {/* Header */}
                  <Box sx={{ 
                    bgcolor: 'rgba(12, 59, 46, 0.8)',
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EmojiNatureIcon sx={{ 
                        color: '#88d498', 
                        mr: 1, 
                        fontSize: 28,
                        filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))'
                      }} />
                      <Typography variant="h5" sx={{ 
                        color: 'rgba(255, 255, 255, 0.87)', 
                        fontWeight: 'bold',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                      }}>
                        Your Learning Bonsai
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Growth Level: {masteredSkillsCount} / {totalSkills}
                    </Typography>
                  </Box>
                  
                  {/* Tree Visualization */}
                  <Box sx={{ 
                    background: 'linear-gradient(180deg, rgba(30, 30, 30, 0.9) 0%, rgba(18, 18, 18, 0.95) 100%)',
                    p: 4,
                    textAlign: 'center'
                  }}>
                    <Box sx={{ 
                      position: 'relative',
                      mb: 2,
                      height: 400,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: '10%',
                        right: '10%',
                        height: '2px',
                        background: 'radial-gradient(ellipse at center, rgba(136, 212, 152, 0.3) 0%, rgba(0,0,0,0) 70%)',
                        filter: 'blur(3px)',
                      }
                    }}>
                      <BonsaiTree skills={skills} totalSkills={totalSkills} showGrowthAnimation={showTreeAnimation} />
                    </Box>
                    
                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
                      <GradientButton
                        variant="contained"
                        gradient="success"
                        size="large"
                        onClick={() => setShowQuiz(true)}
                        startIcon={<QuizIcon />}
                      >
                        Grow Your Tree
                      </GradientButton>
                      <GradientButton
                        variant="outlined"
                        gradient="primary"
                        size="large"
                        onClick={() => navigate('/upload')}
                        startIcon={<UploadIcon />}
                      >
                        Upload Report
                      </GradientButton>
                    </Box>
                  </Box>
                </GlassCard>
              </ScaleIn>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              {/* Skill Progress Content */}
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#113946' }}>Skill Progress</Typography>
                  <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                    Track your progress in different SAT skill areas.
                  </Typography>
                </Grid>
                {skills.map((skill, index) => (
                  <Grid item xs={12} sm={6} md={4} key={skill.id}>
                    <StaggeredList index={index}>
                      {[
                        <GlassCard sx={{ p: 2, height: '100%' }} key={`glass-${skill.id}`}>
                          <Typography variant="h6" sx={{ fontWeight: 500, color: '#1B4D3E' }}>{skill.name}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={'progress' in skill ? (skill.progress as number) * 100 : 0} 
                                sx={{ height: 8, borderRadius: 4 }} 
                              />
                            </Box>
                            <Box sx={{ minWidth: 35 }}>
                              <Typography variant="body2" color="textSecondary">
                                {`${Math.round('progress' in skill ? (skill.progress as number) * 100 : 0)}%`}
                              </Typography>
                            </Box>
                          </Box>
                          <Typography variant="caption" color="textSecondary">{skill.description}</Typography>
                        </GlassCard>
                      ]}
                    </StaggeredList>
                  </Grid>
                ))}
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              {/* Profile Content */}
              <FadeIn>
                <Box sx={{ 
                  borderRadius: 4, 
                  overflow: 'hidden',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
                }}>
                  {/* Header Banner with Personal Info */}
                  <Box sx={{ 
                    p: 4, 
                    background: 'linear-gradient(135deg, #113946 0%, #3E606F 100%)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* Decorative Elements */}
                    <Box sx={{ 
                      position: 'absolute', 
                      top: -20, 
                      right: -20, 
                      width: 200, 
                      height: 200, 
                      borderRadius: '50%', 
                      background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)'
                    }} />
                    <Box sx={{ 
                      position: 'absolute', 
                      bottom: -30, 
                      left: -30, 
                      width: 150, 
                      height: 150, 
                      borderRadius: '50%', 
                      background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 70%)'
                    }} />
                  
                    {loadingUserData ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '150px' }}>
                        <CircularProgress sx={{ color: '#fff' }} />
                      </Box>
                    ) : userData ? (
                      <Grid container spacing={2} alignItems="center">
                        <Grid item>
                          <Avatar sx={{ 
                            width: 100, 
                            height: 100,
                            bgcolor: '#1a936f',
                            fontSize: '2.5rem',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                          }}>
                            {userData.firstName.charAt(0)}{userData.lastName.charAt(0)}
                          </Avatar>
                        </Grid>
                        <Grid item xs>
                          <Typography variant="h3" sx={{ color: '#fff', fontWeight: 'bold', mb: 0.5 }}>
                            {userData.firstName} {userData.lastName}
                          </Typography>
                          <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1 }}>
                            {userData.city}, {userData.country}
                          </Typography>
                          <Box sx={{ 
                            display: 'inline-block', 
                            px: 2, 
                            py: 0.5, 
                            borderRadius: 2,
                            bgcolor: 'rgba(255, 255, 255, 0.15)',
                            backdropFilter: 'blur(5px)',
                            color: '#fff'
                          }}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {userData.subscriptionPlan.charAt(0).toUpperCase() + userData.subscriptionPlan.slice(1)} Plan
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    ) : (
                      <Alert severity="warning">Could not load user profile data.</Alert>
                    )}
                  </Box>
                  
                  {/* Profile Details Cards */}
                  {userData && (
                    <Box sx={{ bgcolor: '#fff', p: 3 }}>
                      <Grid container spacing={3}>
                        {/* SAT Score Card */}
                        <Grid item xs={12} md={6}>
                          <GlassCard sx={{ 
                            p: 3, 
                            height: '100%',
                            borderTop: '4px solid #3498db',
                            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-5px)',
                              boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)'
                            }
                          }}>
                            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#113946' }}>
                              SAT Score Progress
                            </Typography>
                            
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'flex-end', 
                              justifyContent: 'space-between',
                              mb: 2
                            }}>
                              <Box>
                                <Typography variant="body2" color="textSecondary">Current Score</Typography>
                                <Typography variant="h3" sx={{ fontWeight: 'bold', color: userData.satScore ? '#3498db' : '#999' }}>
                                  {userData.satScore || 'N/A'}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ mx: 2, mb: 1 }}>
                                <Typography variant="h4" color="textSecondary">→</Typography>
                              </Box>
                              
                              <Box>
                                <Typography variant="body2" color="textSecondary" align="right">Target Score</Typography>
                                <Typography variant="h3" align="right" sx={{ fontWeight: 'bold', color: '#27ae60' }}>
                                  {userData.targetSatScore}
                                </Typography>
                              </Box>
                            </Box>
                            
                            {userData.satScore && (
                              <>
                                <Box sx={{ position: 'relative', mt: 2, mb: 1 }}>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={((userData.satScore - 400) / (userData.targetSatScore - 400)) * 100} 
                                    sx={{ 
                                      height: 10, 
                                      borderRadius: 5,
                                      background: 'linear-gradient(90deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.05) 100%)'
                                    }} 
                                  />
                                </Box>
                                <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                                  {Math.round(((userData.satScore - 400) / (userData.targetSatScore - 400)) * 100)}% to goal
                                </Typography>
                              </>
                            )}
                          </GlassCard>
                        </Grid>
                        
                        {/* Motivation Card */}
                        <Grid item xs={12} md={6}>
                          <GlassCard sx={{ 
                            p: 3, 
                            height: '100%',
                            borderTop: '4px solid #9b59b6',
                            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-5px)',
                              boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)'
                            },
                            display: 'flex',
                            flexDirection: 'column'
                          }}>
                            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#113946' }}>
                              Your Motivation
                            </Typography>
                            
                            <Box sx={{ 
                              flex: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'center',
                              p: 2
                            }}>
                              <Box sx={{ 
                                width: 60, 
                                height: 60, 
                                borderRadius: '50%', 
                                bgcolor: 'rgba(155, 89, 182, 0.1)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                mb: 2
                              }}>
                                <FlagIcon sx={{ fontSize: 30, color: '#9b59b6' }} />
                              </Box>
                              <Typography 
                                variant="h6" 
                                align="center" 
                                sx={{ 
                                  fontStyle: 'italic', 
                                  color: '#333',
                                  position: 'relative',
                                  '&:before': {
                                    content: '"""',
                                    position: 'absolute',
                                    left: -15,
                                    top: -10,
                                    fontSize: '2rem',
                                    color: 'rgba(155, 89, 182, 0.2)',
                                  },
                                  '&:after': {
                                    content: '"""',
                                    position: 'absolute',
                                    right: -15,
                                    bottom: -20,
                                    fontSize: '2rem',
                                    color: 'rgba(155, 89, 182, 0.2)',
                                  }
                                }}
                              >
                                {userData.motivation}
                              </Typography>
                            </Box>
                          </GlassCard>
                        </Grid>
                        
                        {/* Additional Personal Info Card */}
                        <Grid item xs={12} md={6}>
                          <GlassCard sx={{ 
                            p: 3, 
                            height: '100%',
                            borderTop: '4px solid #e74c3c',
                            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-5px)',
                              boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)'
                            }
                          }}>
                            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#113946' }}>
                              Personal Details
                            </Typography>
                            
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary">Age</Typography>
                                <Typography variant="h6">{userData.age} years</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary">Location</Typography>
                                <Typography variant="h6">{userData.city}, {userData.country}</Typography>
                              </Grid>
                              <Grid item xs={12}>
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="body2" color="textSecondary">Email</Typography>
                                <Typography variant="h6">student@example.com</Typography>
                              </Grid>
                            </Grid>
                          </GlassCard>
                        </Grid>
                        
                        {/* Subscription Plan Card */}
                        <Grid item xs={12} md={6}>
                          <GlassCard sx={{ 
                            p: 3, 
                            height: '100%',
                            borderTop: '4px solid #f1c40f',
                            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-5px)',
                              boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)'
                            },
                            display: 'flex',
                            flexDirection: 'column'
                          }}>
                            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#113946' }}>
                              Subscription Plan
                            </Typography>
                            
                            <Box sx={{ 
                              mt: 2,
                              p: 2,
                              bgcolor: userData.subscriptionPlan === 'pro' ? 'rgba(241, 196, 15, 0.1)' : 'transparent',
                              borderRadius: 2,
                              border: userData.subscriptionPlan === 'pro' ? '1px dashed #f1c40f' : 'none'
                            }}>
                              <Typography 
                                variant="h4" 
                                align="center" 
                                sx={{ 
                                  fontWeight: 'bold', 
                                  color: userData.subscriptionPlan === 'pro' ? '#f1c40f' : '#666',
                                  textTransform: 'uppercase',
                                  mb: 1
                                }}
                              >
                                {userData.subscriptionPlan}
                              </Typography>
                              
                              {userData.subscriptionPlan === 'pro' ? (
                                <Typography variant="body1" align="center">
                                  You have access to all premium features including personalized study plans, unlimited practice questions, and expert support.
                                </Typography>
                              ) : (
                                <Typography variant="body1" align="center">
                                  Upgrade to Pro to unlock personalized study plans, unlimited practice questions, and expert support.
                                </Typography>
                              )}
                              
                              {userData.subscriptionPlan !== 'pro' && (
                                <Box sx={{ textAlign: 'center', mt: 2 }}>
                                  <GradientButton
                                    variant="contained"
                                    color="primary"
                                  >
                                    Upgrade Now
                                  </GradientButton>
                                </Box>
                              )}
                            </Box>
                          </GlassCard>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </Box>
              </FadeIn>
            </TabPanel>

          </Container>
        </Box>

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