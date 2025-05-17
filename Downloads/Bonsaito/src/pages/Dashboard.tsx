import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  Snackbar
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
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
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
        <Container maxWidth="lg">
          {/* Welcome Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              Welcome back, {mockUserData.name}!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Last login: {mockUserData.lastLogin}
            </Typography>
          </Box>

          {/* Tabs */}
          <Paper sx={{ mb: 4 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Overview" />
              <Tab label="Skills" />
              <Tab label="Activity" />
            </Tabs>
          </Paper>

          {/* Quiz Results Snackbar */}
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
              Quiz completed! You've improved {quizResults.length} skills.
            </Alert>
          </Snackbar>

          {/* Tab Panels */}
          <TabPanel value={tabValue} index={0}>
            {showQuiz ? (
              <SkillQuiz onComplete={handleQuizComplete} />
            ) : (
              <>
                {/* Bonsai Tree Visualization */}
                <BonsaiTree skills={skills} totalSkills={totalSkills} />

                {/* Action Cards */}
                <Typography variant="h5" gutterBottom>
                  Quick Actions
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">Upload New Report</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Upload an SAT practice test score report to get personalized lessons.
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button size="small" component={Link} to="/upload">
                          Upload Report
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">Continue Learning</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Watch video lessons tailored to your skill gaps.
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button size="small" component={Link} to="/lessons">
                          Go to Lessons
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">Test Your Skills</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Take a short quiz to check your current skill levels.
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button size="small" onClick={() => setShowQuiz(true)}>
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
      </Box>
    </Box>
  );
};

export default Dashboard; 