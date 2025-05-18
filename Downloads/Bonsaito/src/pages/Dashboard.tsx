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
  LinearProgress
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
  const navigate = useNavigate();
  const location = useLocation();

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
            {mockUserData.name.charAt(0)}
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
          pt: 8,
          pb: 4,
          px: { xs: 2, md: 4 }
        }}
      >
        <Toolbar />

        <Container maxWidth="lg" sx={{ mt: 4 }}>
          {/* Welcome Section with Skill Progress */}
          <FadeIn>
            <GlassCard
              cardTitle={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: 'primary.main', 
                      mr: 2,
                      width: 56,
                      height: 56,
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)' 
                    }}
                  >
                    {mockUserData.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: '-0.025em' }}>
                      Welcome back, {mockUserData.name.split(' ')[0]}!
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.8, mt: 0.5 }}>
                      Last login: {mockUserData.lastLogin}
                    </Typography>
                  </Box>
                </Box>
              }
              sx={{ mb: 4 }}
            >
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body1" fontWeight={600}>
                    Your SAT Skills Progress
                  </Typography>
                  <Typography variant="body2">
                    {masteredSkillsCount} of {totalSkills} skills mastered
                  </Typography>
                </Box>
                <ProgressAnimation value={progressPercentage} color="#1a936f" height={10} />
              </Box>
            </GlassCard>
          </FadeIn>

          {/* Main Dashboard Tabs */}
          <Box sx={{ mt: 4, borderRadius: 8, overflow: 'hidden' }}>
            <Box sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px 8px 0 0',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderBottom: 'none'
            }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="dashboard tabs"
                sx={{
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#1a936f',
                    height: 3,
                  },
                  '& .MuiTab-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&.Mui-selected': {
                      color: '#fff',
                    },
                    fontSize: '1rem',
                    textTransform: 'none',
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                  },
                }}
              >
                <Tab label="My Bonsai" />
                <Tab label="Skill Progress" />
                <Tab label="Recommendations" />
              </Tabs>
            </Box>

            {/* Tree Panel */}
            <TabPanel value={tabValue} index={0}>
              <GlassCard>
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <FloatAnimation amplitude={4}>
                    <Box sx={{ maxWidth: '100%', height: '400px', position: 'relative' }}>
                      <BonsaiTree 
                        skills={skills} 
                        showGrowthAnimation={showTreeAnimation} 
                      />
                    </Box>
                  </FloatAnimation>
                  
                  <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                    Grow your Bonsai tree by mastering SAT skills!
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                    <GradientButton
                      gradient="primary"
                      startIcon={<UploadIcon />}
                      onClick={() => navigate('/upload')}
                    >
                      Upload Report
                    </GradientButton>
                    
                    <GradientButton
                      gradient="secondary"
                      startIcon={<QuizIcon />}
                      onClick={() => setShowQuiz(true)}
                    >
                      Take Quiz
                    </GradientButton>
                  </Box>
                </Box>
              </GlassCard>
            </TabPanel>

            {/* Skills Progress Panel */}
            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={3}>
                <StaggeredList>
                  {skills.map((skill, index) => (
                    <Grid item xs={12} sm={6} md={4} key={skill.id}>
                      <GlassCard
                        cardTitle={skill.name}
                        subtitle={`Category: ${skill.category}`}
                        icon={
                          <Avatar
                            sx={{ 
                              bgcolor: skill.mastered ? 'success.main' : 'info.main',
                              width: 40,
                              height: 40
                            }}
                          >
                            {skill.mastered ? <EmojiNatureIcon /> : <LocalFloristIcon />}
                          </Avatar>
                        }
                      >
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>
                            {skill.description}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" fontWeight={600}>
                              Mastery Progress
                            </Typography>
                            <Typography variant="body2">
                              {Math.round(skill.progress * 100)}%
                            </Typography>
                          </Box>
                          <ProgressAnimation value={skill.progress * 100} color={skill.mastered ? '#88d498' : '#3d5a80'} />
                          
                          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                            <GradientButton
                              gradient={skill.mastered ? "success" : "info"}
                              size="small"
                              onClick={() => navigate(`/lessons?skill=${skill.id}`)}
                            >
                              {skill.mastered ? 'Review Lessons' : 'Start Learning'}
                            </GradientButton>
                          </Box>
                        </Box>
                      </GlassCard>
                    </Grid>
                  ))}
                </StaggeredList>
              </Grid>
            </TabPanel>

            {/* Recommendations Panel */}
            <TabPanel value={tabValue} index={2}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <ScaleIn>
                    <GlassCard
                      cardTitle="Personalized Recommendations"
                      subtitle="Based on your skill analysis"
                      withGlow={true}
                      glowColor="rgba(26, 147, 111, 0.3)"
                    >
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body1" sx={{ mb: 3 }}>
                          Here are your personalized recommendations based on your current progress:
                        </Typography>
                        
                        <Grid container spacing={3}>
                          {skills.filter(skill => skill.progress < 0.7).slice(0, 3).map((skill) => (
                            <Grid item xs={12} sm={4} key={skill.id}>
                              <SlideIn>
                                <GlassCard
                                  cardTitle={skill.name}
                                  withGlow={false}
                                  withHoverEffect={true}
                                  sx={{ height: '100%' }}
                                >
                                  <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
                                    Focus on this skill to improve your overall score. Current mastery: {Math.round(skill.progress * 100)}%
                                  </Typography>
                                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                    <GradientButton
                                      gradient="primary"
                                      size="small"
                                      onClick={() => navigate(`/lessons?skill=${skill.id}`)}
                                    >
                                      Start Learning
                                    </GradientButton>
                                  </Box>
                                </GlassCard>
                              </SlideIn>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    </GlassCard>
                  </ScaleIn>
                </Grid>
              </Grid>
            </TabPanel>
          </Box>
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