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
  CircularProgress,
  Paper
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
  const [currentTab, setCurrentTab] = useState<number>(0);
  const [showQuiz, setShowQuiz] = useState<boolean>(false);
  const [quizResults, setQuizResults] = useState<{skillId: string; score: number}[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showTreeAnimation, setShowTreeAnimation] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [userData, setUserData] = useState<UserOnboardingData | null>(null);
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
        setLoading(false);
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
    setCurrentTab(newValue);
  };

  const handleQuizComplete = (results: {skillId: string; score: number}[]) => {
    setQuizResults(results);
    setShowQuiz(false);
    setSnackbarOpen(true);
    setSnackbarMessage("Quiz Completed! Your skills have been updated.");
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Calculate progress percentage
  const progressPercentage = Math.round((masteredSkillsCount / totalSkills) * 100);

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#121212' }}>
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
              {loading ? '' : userData?.firstName?.charAt(0) || 'U'}
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
            minHeight: '100vh',
            bgcolor: 'background.default',
            position: 'relative',
          }}
        >
          <Toolbar />
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box
                  className="css-8mrznq"
                  sx={{
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundImage: 'url(/altar2.png)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      opacity: 0.4,
                      pointerEvents: 'none',
                      zIndex: 0,
                    }
                  }}
                >
                  <Box className="css-14lrhfz" />
                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: '20px',
                        backgroundColor: 'transparent',
                      }}
                    >
                      <Typography
                        variant="h5"
                        gutterBottom
                        align="center"
                        sx={{ color: '#fff' }}
                      >
                        Your Learning Bonsai
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <BonsaiTree skills={skills} totalSkills={totalSkills} />
                        <Typography
                          align="center"
                          sx={{ mt: 2, color: '#fff' }}
                        >
                          Complete practice questions to grow your bonsai!
                        </Typography>
                      </Box>
                    </Paper>
                  </Box>
                </Box>
              </Grid>
            </Grid>
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
          message={snackbarMessage}
        />
      </Box>
    </ThemeProvider>
  );
};

export default Dashboard; 