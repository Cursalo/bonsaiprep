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
                <FadeIn duration={1000}>
                  <GlassCard sx={{ mb: 3, p: 2, height: '100%' }}>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#113946' }}>
                      Welcome back, {loadingUserData ? 'User' : userData?.firstName || 'User'}!
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#3E606F' }}>
                      Let's continue your SAT preparation journey. Your current focus is on improving your core skills.
                    </Typography>
                    <Divider sx={{ my: 2, borderColor: 'rgba(17, 57, 70, 0.2)' }} />
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
                <SlideIn direction="right" duration={1000}>
                  <GlassCard sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#113946' }}>
                      Daily Tip
                    </Typography>
                    <Typography variant="body2" align="center" sx={{ color: '#3E606F' }}>
                      Practice consistently, even if it's just for 15-30 minutes each day. Consistency builds momentum!
                    </Typography>
                     <img src="/idea.svg" alt="Idea Lightbulb" style={{ width: '80px', marginTop: '16px' }} />
                  </GlassCard>
                </SlideIn>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {/* Bonsai Tree Content */}
            <ScaleIn duration={1000}>
              <GlassCard sx={{ textAlign: 'center', p: 3, background: 'rgba(255, 255, 255, 0.7)' }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#113946' }}>
                  Your Learning Bonsai
                </Typography>
                <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                  Watch your Bonsai grow as you master new skills and complete lessons.
                </Typography>
                <Box sx={{ height: 350, display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
                  <BonsaiTree skills={skills} showGrowthAnimation={showTreeAnimation} />
                </Box>
                <GradientButton 
                  variant="contained" 
                  color="primary" 
                  startIcon={<QuizIcon />} 
                  onClick={() => setShowQuiz(true)}
                  disabled={masteredSkillsCount >= totalSkills}
                >
                  {masteredSkillsCount >= totalSkills ? "All Skills Mastered!" : "Test a New Skill"}
                </GradientButton>
                {showTreeAnimation && (
                  <FloatAnimation>
                    <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                      Your Bonsai is growing!
                    </Typography>
                  </FloatAnimation>
                )}
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
                    <GlassCard sx={{ p: 2, height: '100%' }}>
                      <Typography variant="h6" sx={{ fontWeight: 500, color: '#1B4D3E' }}>{skill.name}</Typography>
                      <ProgressAnimation value={skill.progress * 100}>
                        <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress variant="determinate" value={skill.progress * 100} sx={{ height: 8, borderRadius: 4 }} />
                          </Box>
                          <Box sx={{ minWidth: 35 }}>
                            <Typography variant="body2" color="textSecondary">{`${Math.round(skill.progress * 100)}%`}</Typography>
                          </Box>
                        </Box>
                      </ProgressAnimation>
                      <Typography variant="caption" color="textSecondary">{skill.description}</Typography>
                    </GlassCard>
                  </StaggeredList>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            {/* Profile Content */}
            <FadeIn duration={1000}>
              <GlassCard sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#113946' }}>
                  Student Profile
                </Typography>
                {loadingUserData ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                    <CircularProgress />
                  </Box>
                ) : userData ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>Full Name:</Typography>
                      <Typography variant="body1">{userData.firstName} {userData.lastName}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>Age:</Typography>
                      <Typography variant="body1">{userData.age}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>Location:</Typography>
                      <Typography variant="body1">{userData.city}, {userData.country}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>Current SAT Score:</Typography>
                      <Typography variant="body1">{userData.satScore || 'Not provided'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>Target SAT Score:</Typography>
                      <Typography variant="body1">{userData.targetSatScore}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>Motivation:</Typography>
                      <Typography variant="body1">{userData.motivation}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>Subscription Plan:</Typography>
                      <Typography variant="body1">{userData.subscriptionPlan}</Typography>
                    </Grid>
                    {/* Add other fields like score report link if needed */}
                  </Grid>
                ) : (
                  <Alert severity="warning">Could not load user profile data.</Alert>
                )}
              </GlassCard>
            </FadeIn>
          </TabPanel>

        </Container>
      </Box>

      {/* Skill Quiz Dialog */}
      {showQuiz && (
        <SkillQuiz
          open={showQuiz}
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