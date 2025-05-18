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
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar position="fixed" sx={{ 
        background: 'rgba(12, 59, 46, 0.8)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
      }}>
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
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s ease'
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
          mt: '64px',
          width: '100%',
          overflowY: 'auto'
        }}
      >
        <Container maxWidth="lg">
          <FadeIn duration={800}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                aria-label="dashboard tabs" 
                variant="scrollable"
                scrollButtons="auto"
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
                        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#113946', m: 0 }}>
                          Welcome back, {loadingUserData ? 'User' : userData?.firstName || 'User'}!
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#3E606F' }}>
                          Let's continue your SAT preparation journey.
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 2, borderColor: 'rgba(17, 57, 70, 0.2)' }} />
                    
                    {/* Score Visualization */}
                    {userData?.targetSatScore && (
                      <Box sx={{ mt: 3, mb: 4 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#113946' }}>
                          Your SAT Score Journey
                        </Typography>
                        
                        <Box sx={{ 
                          position: 'relative', 
                          height: 70, 
                          background: 'linear-gradient(90deg, #f0f0f0 0%, #e6f7ff 50%, #ccf2e5 100%)',
                          borderRadius: 4,
                          mt: 2,
                          mb: 1,
                          overflow: 'hidden'
                        }}>
                          {/* Base Score Line at 400 */}
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              position: 'absolute', 
                              bottom: 0, 
                              left: '0%', 
                              transform: 'translateX(-50%)',
                              color: '#666' 
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
                              color: '#666' 
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
                                bgcolor: '#3498db',
                                border: '2px solid white',
                                boxShadow: '0 0 10px rgba(52, 152, 219, 0.5)',
                                zIndex: 2
                              }} />
                              <Typography 
                                variant="subtitle2" 
                                sx={{ 
                                  position: 'absolute', 
                                  top: 5, 
                                  left: `${((userData.satScore - 400) / 1200) * 100}%`, 
                                  transform: 'translateX(-50%)',
                                  color: '#3498db',
                                  fontWeight: 'bold'
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
                            bgcolor: '#27ae60',
                            border: '2px solid white',
                            boxShadow: '0 0 10px rgba(39, 174, 96, 0.5)',
                            zIndex: 2
                          }} />
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              position: 'absolute', 
                              bottom: 5, 
                              left: `${((userData.targetSatScore - 400) / 1200) * 100}%`, 
                              transform: 'translateX(-50%)',
                              color: '#27ae60',
                              fontWeight: 'bold'
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
                              background: 'linear-gradient(90deg, #3498db 0%, #27ae60 100%)',
                              zIndex: 1
                            }} />
                          )}
                        </Box>
                        
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1, textAlign: 'center' }}>
                          {userData.satScore 
                            ? `You need ${userData.targetSatScore - userData.satScore} more points to reach your target score!` 
                            : `Set your current score to track your progress toward ${userData.targetSatScore}!`}
                        </Typography>
                      </Box>
                    )}
                    
                    <Typography variant="body2" sx={{ color: '#50727B' }}>
                      {masteredSkillsCount < totalSkills 
                        ? `You have mastered ${masteredSkillsCount} out of ${totalSkills} skills. Keep up the great work!` 
                        : "Congratulations! You've mastered all skills!"}
                    </Typography>
                    {masteredSkillsCount < totalSkills && (
                       <Box sx={{ mt: 2 }}>
                         <LinearProgress 
                           variant="determinate" 
                           value={progressPercentage} 
                           sx={{ height: 10, borderRadius: 5, mb: 1 }} 
                         />
                         <Typography variant="caption" color="textSecondary">
                           {progressPercentage}% complete
                         </Typography>
                       </Box>
                    )}
                    <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                      <GradientButton 
                        variant="contained" 
                        color="primary" 
                        startIcon={<PlayLessonIcon />} 
                        onClick={() => navigate('/lessons')}
                      >
                        Go to Lessons
                      </GradientButton>
                      <GradientButton 
                        variant="outlined" 
                        color="secondary" 
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
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#113946' }}>
                      Daily Tip
                    </Typography>
                    <Typography variant="body2" align="center" sx={{ color: '#3E606F' }}>
                      Practice consistently, even if it's just for 15-30 minutes each day. Consistency builds momentum!
                    </Typography>
                    <img src="/idea.svg" alt="Idea Lightbulb" style={{ width: '80px', marginTop: '16px', display: 'block', margin: '0 auto' }} />
                  </GlassCard>
                </SlideIn>
              </Grid>
              
              {/* Quick Metrics Grid */}
              <Grid item xs={12} sm={6} md={3}>
                <GlassCard sx={{ 
                  p: 2, 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 100%)'
                }}>
                  <Avatar sx={{ bgcolor: '#ff9800', mb: 2, width: 56, height: 56 }}>
                    <StarIcon fontSize="large" />
                  </Avatar>
                  <Typography variant="h5" align="center" sx={{ fontWeight: 'bold', color: '#113946' }}>
                    {masteredSkillsCount}
                  </Typography>
                  <Typography variant="body2" align="center" color="textSecondary">
                    Skills Mastered
                  </Typography>
                </GlassCard>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <GlassCard sx={{ 
                  p: 2, 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 100%)'
                }}>
                  <Avatar sx={{ bgcolor: '#e91e63', mb: 2, width: 56, height: 56 }}>
                    <SchoolIcon fontSize="large" />
                  </Avatar>
                  <Typography variant="h5" align="center" sx={{ fontWeight: 'bold', color: '#113946' }}>
                    {userData?.age || '-'}
                  </Typography>
                  <Typography variant="body2" align="center" color="textSecondary">
                    Student Age
                  </Typography>
                </GlassCard>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <GlassCard sx={{ 
                  p: 2, 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 100%)'
                }}>
                  <Avatar sx={{ bgcolor: '#4caf50', mb: 2, width: 56, height: 56 }}>
                    <FlagIcon fontSize="large" />
                  </Avatar>
                  <Typography variant="h5" align="center" sx={{ fontWeight: 'bold', color: '#113946' }}>
                    {userData?.country || '-'}
                  </Typography>
                  <Typography variant="body2" align="center" color="textSecondary">
                    Country
                  </Typography>
                </GlassCard>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <GlassCard sx={{ 
                  p: 2, 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 100%)'
                }}>
                  <Avatar sx={{ bgcolor: '#2196f3', mb: 2, width: 56, height: 56 }}>
                    <TimerIcon fontSize="large" />
                  </Avatar>
                  <Typography variant="h5" align="center" sx={{ fontWeight: 'bold', color: '#113946' }}>
                    14
                  </Typography>
                  <Typography variant="body2" align="center" color="textSecondary">
                    Days Active
                  </Typography>
                </GlassCard>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {/* Bonsai Tree Content */}
            <ScaleIn>
              <Box sx={{ 
                borderRadius: 2, 
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
              }}>
                {/* Header */}
                <Box sx={{ 
                  bgcolor: 'rgba(26, 147, 111, 0.9)',
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <EmojiNatureIcon sx={{ color: '#fff', mr: 1, fontSize: 28 }} />
                    <Typography variant="h5" sx={{ color: '#fff', fontWeight: 'bold' }}>
                      Your Learning Bonsai
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    Growth Level: {masteredSkillsCount} / {totalSkills}
                  </Typography>
                </Box>
                
                {/* Tree Visualization */}
                <Box sx={{ 
                  background: 'linear-gradient(180deg, #f5f7fa 0%, #e6e9f0 100%)',
                  p: 4,
                  textAlign: 'center'
                }}>
                  <Box sx={{ 
                    position: 'relative',
                    mb: 2,
                    height: 350,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: '10%',
                      right: '10%',
                      height: '1px',
                      background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 70%)',
                      filter: 'blur(3px)',
                    }
                  }}>
                    <BonsaiTree skills={skills} totalSkills={totalSkills} showGrowthAnimation={showTreeAnimation} />
                    
                    {/* Floating badges around the tree */}
                    {skills.slice(0, 3).map((skill, index) => (
                      <Box 
                        key={skill.id}
                        sx={{
                          position: 'absolute',
                          top: `${30 + (index * 20)}%`,
                          left: `${15 + (index * 10)}%`,
                          transform: 'translate(-50%, -50%)',
                          animation: 'float 3s ease-in-out infinite',
                          animationDelay: `${index * 0.5}s`,
                          '@keyframes float': {
                            '0%, 100%': { transform: 'translate(-50%, -50%)' },
                            '50%': { transform: 'translate(-50%, calc(-50% - 10px))' }
                          }
                        }}
                      >
                        <Avatar 
                          sx={{ 
                            bgcolor: 'primary.main', 
                            boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
                          }}
                        >
                          {skill.name.charAt(0)}
                        </Avatar>
                      </Box>
                    ))}
                    
                    {skills.slice(3, 6).map((skill, index) => (
                      <Box 
                        key={skill.id}
                        sx={{
                          position: 'absolute',
                          top: `${20 + (index * 25)}%`,
                          right: `${15 + (index * 8)}%`,
                          transform: 'translate(50%, -50%)',
                          animation: 'float 4s ease-in-out infinite',
                          animationDelay: `${index * 0.3}s`,
                          '@keyframes float': {
                            '0%, 100%': { transform: 'translate(50%, -50%)' },
                            '50%': { transform: 'translate(50%, calc(-50% - 10px))' }
                          }
                        }}
                      >
                        <Avatar 
                          sx={{ 
                            bgcolor: 'secondary.main', 
                            boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
                          }}
                        >
                          {skill.name.charAt(0)}
                        </Avatar>
                      </Box>
                    ))}
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
                    <GradientButton 
                      variant="contained" 
                      color="primary" 
                      startIcon={<QuizIcon />} 
                      onClick={() => setShowQuiz(true)}
                      disabled={masteredSkillsCount >= totalSkills}
                    >
                      {masteredSkillsCount >= totalSkills ? "All Skills Mastered!" : "Test a New Skill"}
                    </GradientButton>
                    <GradientButton 
                      variant="outlined" 
                      color="secondary" 
                      startIcon={<PlayLessonIcon />} 
                      onClick={() => navigate('/lessons')}
                    >
                      Practice Lessons
                    </GradientButton>
                  </Box>
                  
                  {showTreeAnimation && (
                    <FloatAnimation>
                      <Typography variant="h6" color="primary" sx={{ mt: 1, fontWeight: 'bold' }}>
                        Your Bonsai is growing!
                      </Typography>
                    </FloatAnimation>
                  )}
                </Box>
                
                {/* Stats */}
                <Box sx={{ p: 3, bgcolor: '#fff' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#113946', fontWeight: 'bold' }}>
                    Your Growth Stats
                  </Typography>
                  
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        bgcolor: 'rgba(26, 147, 111, 0.1)',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <EmojiEventsIcon sx={{ fontSize: 32, color: '#1a936f', mb: 1 }} />
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a936f', mb: 0.5 }}>
                          {masteredSkillsCount}
                        </Typography>
                        <Typography variant="body2" align="center">
                          Skills Mastered
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        bgcolor: 'rgba(52, 152, 219, 0.1)',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <TrendingUpIcon sx={{ fontSize: 32, color: '#3498db', mb: 1 }} />
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#3498db', mb: 0.5 }}>
                          {progressPercentage}%
                        </Typography>
                        <Typography variant="body2" align="center">
                          Overall Progress
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        bgcolor: 'rgba(155, 89, 182, 0.1)',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <TimerIcon sx={{ fontSize: 32, color: '#9b59b6', mb: 1 }} />
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#9b59b6', mb: 0.5 }}>
                          14
                        </Typography>
                        <Typography variant="body2" align="center">
                          Study Days
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        bgcolor: 'rgba(241, 196, 15, 0.1)',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FlagIcon sx={{ fontSize: 32, color: '#f1c40f', mb: 1 }} />
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#f1c40f', mb: 0.5 }}>
                          {totalSkills - masteredSkillsCount}
                        </Typography>
                        <Typography variant="body2" align="center">
                          Skills Remaining
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
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

      {/* Skill Quiz Dialog */}
      {showQuiz && (
        <SkillQuiz
          onClose={() => setShowQuiz(false)}
          onComplete={handleQuizComplete}
        />
      )}

      {/* Snackbar for quiz results */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="success" 
          variant="filled"
          sx={{ 
            width: '100%',
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)' 
          }}
        >
          Quiz completed! You've updated your mastery in {quizResults.length} skills.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard; 