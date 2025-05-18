import React, { useState, useEffect } from 'react';
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
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Bonsai Prep - Dashboard
          </Typography>
          <Avatar sx={{ bgcolor: 'secondary.main' }}>
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
          '& .MuiDrawer-paper': { width: 240 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Bonsai Prep
          </Typography>
          <IconButton onClick={handleDrawerToggle}>
            <ChevronRightIcon />
          </IconButton>
        </Box>
        <Divider />
        <List>
          <ListItem button component={Link} to="/dashboard">
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItem>
          <ListItem button component={Link} to="/upload">
            <ListItemIcon>
              <UploadIcon />
            </ListItemIcon>
            <ListItemText primary="Upload Score Report" />
          </ListItem>
          <ListItem button component={Link} to="/lessons">
            <ListItemIcon>
              <PlayLessonIcon />
            </ListItemIcon>
            <ListItemText primary="My Lessons" />
          </ListItem>
          <ListItem button onClick={() => setShowQuiz(true)}>
            <ListItemIcon>
              <QuizIcon />
            </ListItemIcon>
            <ListItemText primary="Take Skill Quiz" />
          </ListItem>
          <ListItem button component={Link} to="/progress">
            <ListItemIcon>
              <InsightsIcon />
            </ListItemIcon>
            <ListItemText primary="Progress" />
          </ListItem>
        </List>
        <Divider />
        <List>
          <ListItem button component={Link} to="/profile">
            <ListItemIcon>
              <AccountCircleIcon />
            </ListItemIcon>
            <ListItemText primary="Profile" />
          </ListItem>
          <ListItem button component={Link} to="/logout">
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItem>
        </List>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
          mt: 8, // Toolbar height
        }}
      >
        <Container maxWidth="md" sx={{ mt: 4, mb: 4, flex: 1 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 3, 
                  borderRadius: 2, 
                  position: 'relative',
                  overflow: 'hidden',
                  background: showTreeAnimation 
                    ? 'linear-gradient(to bottom, #e8f5e9 0%, #e8f5e9 60%, #c8e6c9 100%)' 
                    : 'auto'
                }}
              >
                <Box sx={{ 
                  textAlign: 'center', 
                  mb: 3,
                  animation: showTreeAnimation ? 'fadeIn 1s ease-in-out' : 'none',
                  '@keyframes fadeIn': {
                    '0%': { opacity: 0 },
                    '100%': { opacity: 1 }
                  }
                }}>
                  <Typography 
                    variant="h4" 
                    gutterBottom 
                    sx={{ 
                      fontWeight: 'bold',
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1
                    }}
                  >
                    {location.state?.fromUpload && showTreeAnimation ? (
                      <>
                        <EmojiNatureIcon sx={{ fontSize: 32 }} />
                        Your Bonsai Tree is Growing!
                        <EmojiNatureIcon sx={{ fontSize: 32 }} />
                      </>
                    ) : (
                      'Your Learning Dashboard'
                    )}
                  </Typography>
                  
                  {location.state?.fromUpload && location.state?.correctAnswers > 0 && showTreeAnimation && (
                    <Alert 
                      severity="success" 
                      icon={<LocalFloristIcon fontSize="inherit" />}
                      sx={{ mb: 2, width: 'fit-content', mx: 'auto' }}
                    >
                      <Typography variant="body1">
                        You answered {location.state.correctAnswers} question{location.state.correctAnswers !== 1 ? 's' : ''} correctly!
                        Your skills have improved and your tree is flourishing.
                      </Typography>
                    </Alert>
                  )}
                </Box>

                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange} 
                  centered 
                  variant="fullWidth"
                  sx={{ 
                    mb: 3,
                    '& .MuiTab-root': {
                      minHeight: 64,
                      fontSize: '1rem',
                    }
                  }}
                >
                  <Tab 
                    label={
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <HomeIcon sx={{ mb: 0.5 }} />
                        <Typography variant="body1">Overview</Typography>
                      </Box>
                    } 
                  />
                  <Tab 
                    label={
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <PlayLessonIcon sx={{ mb: 0.5 }} />
                        <Typography variant="body1">Lessons</Typography>
                      </Box>
                    } 
                  />
                  <Tab 
                    label={
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <InsightsIcon sx={{ mb: 0.5 }} />
                        <Typography variant="body1">Progress</Typography>
                      </Box>
                    } 
                  />
                </Tabs>
              </Paper>
            </Grid>
          </Grid>
          
          <TabPanel value={tabValue} index={0}>
            {showQuiz ? (
              <SkillQuiz onComplete={handleQuizComplete} />
            ) : (
              <>
                {/* Animated wrapper for tree when coming from upload page */}
                <Box sx={{
                  position: 'relative',
                  animation: showTreeAnimation ? 'treeEntrance 2s ease-in-out' : 'none',
                  '@keyframes treeEntrance': {
                    '0%': { transform: 'translateY(20px)', opacity: 0.7 },
                    '100%': { transform: 'translateY(0)', opacity: 1 }
                  }
                }}>
                  {/* Floating particles to indicate growth */}
                  {showTreeAnimation && (
                    <>
                      {Array.from({ length: 10 }).map((_, i) => (
                        <Box
                          key={i}
                          sx={{
                            position: 'absolute',
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: i % 2 === 0 ? 'primary.main' : 'success.light',
                            opacity: 0.7,
                            top: `${Math.random() * 80 + 10}%`,
                            left: `${Math.random() * 80 + 10}%`,
                            animation: `float ${Math.random() * 3 + 2}s ease-in-out infinite`,
                            '@keyframes float': {
                              '0%': { transform: 'translateY(0px) rotate(0deg)', opacity: 0.7 },
                              '50%': { transform: 'translateY(-20px) rotate(180deg)', opacity: 0.3 },
                              '100%': { transform: 'translateY(0px) rotate(360deg)', opacity: 0.7 }
                            },
                            animationDelay: `${Math.random() * 2}s`
                          }}
                        />
                      ))}
                    </>
                  )}
                  
                  {/* Bonsai Tree Visualization */}
                  <BonsaiTree skills={skills} totalSkills={totalSkills} />
                </Box>

                {/* Action Cards */}
                <Typography variant="h5" gutterBottom sx={{ mt: 4, fontWeight: 'bold' }}>
                  Quick Actions
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card 
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: 6
                        }
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          Upload New Report
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Upload an SAT practice test score report to get personalized lessons and grow your bonsai tree.
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button 
                          size="medium" 
                          fullWidth 
                          component={Link} 
                          to="/upload"
                          variant="contained"
                          sx={{ textTransform: 'none' }}
                          startIcon={<UploadIcon />}
                        >
                          Upload Report
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card 
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: 6
                        }
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          Continue Learning
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Watch video lessons tailored to your skill gaps and help your bonsai tree flourish.
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button 
                          size="medium" 
                          fullWidth
                          component={Link} 
                          to="/lessons"
                          variant="contained"
                          color="secondary"
                          sx={{ textTransform: 'none' }}
                          startIcon={<PlayLessonIcon />}
                        >
                          Go to Lessons
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card 
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: 6
                        }
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          Take a Practice Quiz
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Test your knowledge with a quick quiz to improve your skills and grow your bonsai tree.
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button 
                          size="medium" 
                          fullWidth
                          onClick={() => setShowQuiz(true)}
                          variant="contained"
                          color="info"
                          sx={{ textTransform: 'none' }}
                          startIcon={<QuizIcon />}
                        >
                          Start Quiz
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                </Grid>
              </>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                Your SAT Skills
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Mastered {masteredSkillsCount} of {totalSkills} skills ({progressPercentage}%)
              </Typography>
            </Box>

            <Grid container spacing={2}>
              {skills.map(skill => (
                <Grid item xs={12} md={6} key={skill.id}>
                  <Paper
                    sx={{
                      p: 2,
                      mb: 2,
                      borderLeft: '4px solid',
                      borderColor: skill.mastered ? 'primary.main' : 'grey.400',
                    }}
                  >
                    <Typography variant="subtitle1">
                      {skill.name}
                      {skill.mastered && (
                        <Box
                          component="span"
                          sx={{
                            ml: 1,
                            color: 'primary.main',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                          }}
                        >
                          MASTERED
                        </Box>
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {skill.category} • {skill.subcategory}
                    </Typography>
                    <Box
                      sx={{
                        mt: 1,
                        width: '100%',
                        height: 8,
                        bgcolor: 'grey.200',
                        borderRadius: 1,
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          width: `${skill.masteryLevel}%`,
                          height: '100%',
                          bgcolor: skill.mastered ? 'primary.main' : 'secondary.main',
                        }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="caption">{skill.masteryLevel}%</Typography>
                      <Button
                        size="small"
                        component={Link}
                        to={`/lessons?skill=${skill.id}`}
                      >
                        Watch Lessons
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="h5" gutterBottom>
              Recent Activity
            </Typography>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body1">
                Activity tracking coming soon!
              </Typography>
            </Paper>
          </TabPanel>
        </Container>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
            <Typography variant="body1">
              Great job! You've improved your skills and helped your bonsai tree grow.
            </Typography>
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default Dashboard; 