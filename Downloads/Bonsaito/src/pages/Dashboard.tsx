import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  Grid,
  Avatar,
  useTheme,
  useMediaQuery,
  LinearProgress,
  CircularProgress,
  Chip,
  Snackbar,
  Paper
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Upload as UploadIcon,
  PlayLesson as PlayLessonIcon,
  Insights as InsightsIcon,
  Quiz as QuizIcon,
  EmojiNature as EmojiNatureIcon,
  LocalFlorist as LocalFloristIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
  EmojiEvents as EmojiEventsIcon,
  School as SchoolIcon,
  Speed as SpeedIcon,
  GpsFixed as TargetIcon
} from '@mui/icons-material';
import { supabase } from '../supabaseClient';
import { getUserProgress, calculateCorrectAnswersFromDatabase, recordCompletedTest } from '../services/userProgressService';
import { useSkills } from '../components/SkillsProvider';
import BonsaiTree from '../components/BonsaiTree';
import SkillQuiz from '../components/SkillQuiz';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { FadeIn, ScaleIn } from '../components/AnimationEffects';
import ThemeToggle from '../components/ThemeToggle';
import { useThemeContext } from '../contexts/ThemeContext';

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
}

interface StudyStats {
  dailyStreak: number;
  weeklyStudyTime: number;
  questionsAnswered: number;
  accuracyRate: number;
  completedTests: number;
  totalSkillsMastered: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  date?: string;
}

interface Activity {
  id: string;
  type: 'quiz' | 'test' | 'lesson' | 'achievement';
  title: string;
  description: string;
  timestamp: string;
  score?: number;
}

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { themeMode } = useThemeContext();
  const { skills, totalSkills, masteredSkillsCount } = useSkills();
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [showQuiz, setShowQuiz] = useState<boolean>(false);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserOnboardingData | null>(null);
  const [loadingUserData, setLoadingUserData] = useState<boolean>(true);
  const [correctAnswersCount, setCorrectAnswersCount] = useState<number>(0);
  const [studyStats, setStudyStats] = useState<StudyStats>({
    dailyStreak: 7,
    weeklyStudyTime: 12.5,
    questionsAnswered: 145,
    accuracyRate: 78,
    completedTests: 3,
    totalSkillsMastered: masteredSkillsCount
  });
  
  const location = useLocation();

  // Mock data for achievements
  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'First Steps',
      description: 'Completed your first practice quiz',
      icon: <StarIcon sx={{ color: '#FFD700' }} />,
      unlocked: true,
      date: '2024-01-15'
    },
    {
      id: '2',
      title: 'Week Warrior',
      description: 'Maintained a 7-day study streak',
      icon: <LocalFloristIcon sx={{ color: '#4CAF50' }} />,
      unlocked: true,
      date: '2024-01-20'
    },
    {
      id: '3',
      title: 'Century Club',
      description: 'Answered 100 practice questions',
      icon: <EmojiEventsIcon sx={{ color: '#FF9800' }} />,
      unlocked: true,
      date: '2024-01-22'
    },
    {
      id: '4',
      title: 'Accuracy Master',
      description: 'Achieve 90% accuracy on a practice test',
      icon: <TargetIcon sx={{ color: '#9C27B0' }} />,
      unlocked: false
    }
  ];

  // Mock recent activity
  const recentActivity: Activity[] = [
    {
      id: '1',
      type: 'quiz',
      title: 'Algebra Skills Quiz',
      description: 'Completed with 85% accuracy',
      timestamp: '2 hours ago',
      score: 85
    },
    {
      id: '2',
      type: 'lesson',
      title: 'Quadratic Functions',
      description: 'Watched video lesson',
      timestamp: '1 day ago'
    },
    {
      id: '3',
      type: 'test',
      title: 'Math Practice Test',
      description: 'Uploaded score report',
      timestamp: '2 days ago',
      score: 680
    },
    {
      id: '4',
      type: 'achievement',
      title: 'Week Warrior',
      description: 'Unlocked new achievement',
      timestamp: '3 days ago'
    }
  ];

  const fetchCorrectAnswersCount = useCallback(async () => {
    try {
      const userProgress = await getUserProgress();
      if (userProgress && userProgress.correctAnswersCount !== undefined) {
        setCorrectAnswersCount(userProgress.correctAnswersCount);
      } else {
        const calculatedCount = await calculateCorrectAnswersFromDatabase(true);
        setCorrectAnswersCount(calculatedCount);
      }
    } catch (error) {
      console.error('Dashboard - Error fetching correct answers:', error);
      setCorrectAnswersCount(0);
    }
  }, []);

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
  }, [fetchCorrectAnswersCount]);

  useEffect(() => {
    setStudyStats(prev => ({
      ...prev,
      totalSkillsMastered: masteredSkillsCount
    }));
  }, [masteredSkillsCount]);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleQuizComplete = async (results: {skillId: string; score: number}[]) => {
    setShowQuiz(false);
    setSnackbarOpen(true);

    const newlyCorrectAnswers = results.filter(r => r.score > 0).length;
    if (newlyCorrectAnswers > 0) {
      try {
        await recordCompletedTest(newlyCorrectAnswers);
        await fetchCorrectAnswersCount();
      } catch (error) {
        console.error('Error updating progress after quiz:', error);
      }
    }
  };

  const getProgressPercentage = () => {
    if (!userData?.targetSatScore || !userData?.satScore) return 0;
    const progress = ((userData.satScore || 0) / userData.targetSatScore) * 100;
    return Math.min(progress, 100);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'quiz': return <QuizIcon sx={{ color: theme.palette.primary.main }} />;
      case 'test': return <AssignmentIcon sx={{ color: theme.palette.secondary.main }} />;
      case 'lesson': return <PlayLessonIcon sx={{ color: theme.palette.info.main }} />;
      case 'achievement': return <EmojiEventsIcon sx={{ color: '#FFD700' }} />;
      default: return <SchoolIcon />;
    }
  };

  // Background style that adapts to theme
  const getBackgroundStyle = () => {
    if (themeMode === 'light') {
      return {
        background: 'linear-gradient(135deg, #fafafa 0%, #f0f4f0 100%)',
        minHeight: '100vh',
        transition: 'background 0.5s ease-in-out',
      };
    }
    
    return {
      background: 'linear-gradient(135deg, #0c3b2e 0%, #18514a 100%)',
      minHeight: '100vh',
      backgroundSize: '200% 200%',
      animation: 'gradient 15s ease infinite',
      transition: 'background 0.5s ease-in-out',
      '@keyframes gradient': {
        '0%': { backgroundPosition: '0% 50%' },
        '50%': { backgroundPosition: '100% 50%' },
        '100%': { backgroundPosition: '0% 50%' }
      }
    };
  };

  return (
    <Box sx={getBackgroundStyle()}>
      {/* App Bar */}
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{ 
          backgroundColor: themeMode === 'light' 
            ? 'rgba(255, 255, 255, 0.95)' 
            : 'rgba(12, 59, 46, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
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
            <EmojiNatureIcon sx={{ fontSize: 32, color: theme.palette.primary.main, mr: 1 }} />
            <Typography variant="h5" component="div" sx={{ 
              fontWeight: 'bold',
              color: theme.palette.text.primary
            }}>
              Bonsai Prep
            </Typography>
          </Box>
          
          <ThemeToggle showBackgroundSelector={true} />
          
          <Avatar sx={{ 
            bgcolor: theme.palette.primary.main,
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
          {[
            { path: '/dashboard', icon: <HomeIcon />, label: 'Dashboard' },
            { path: '/upload', icon: <UploadIcon />, label: 'Upload Score Report' },
            { path: '/lessons', icon: <PlayLessonIcon />, label: 'My Lessons' },
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
                  ? theme.palette.primary.main + '20' 
                  : 'transparent',
                '&:hover': {
                  backgroundColor: theme.palette.primary.main + '10',
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
                    fontWeight: location.pathname === item.path ? 600 : 400
                  }
                }}
              />
            </ListItem>
          ))}
          
          <ListItem
            button
            onClick={() => setShowQuiz(true)}
            sx={{
              mx: 1,
              borderRadius: 2,
              mb: 0.5,
              '&:hover': {
                backgroundColor: theme.palette.primary.main + '10',
              },
            }}
          >
            <ListItemIcon sx={{ color: theme.palette.primary.main }}>
              <QuizIcon />
            </ListItemIcon>
            <ListItemText primary="Take Skill Quiz" />
          </ListItem>
        </List>
      </Drawer>

      {/* Main Content */}
      <Container 
        maxWidth="xl" 
        sx={{ 
          pt: isMobile ? 10 : 12, 
          pb: 4,
          px: isMobile ? 2 : 3,
          ml: !isMobile && drawerOpen ? '300px' : 0,
          transition: 'margin 0.3s ease',
        }}
      >
        {/* Welcome Header */}
        <FadeIn duration={800}>
          <Box sx={{ mb: 4 }}>
            <Typography variant={isMobile ? 'h4' : 'h3'} sx={{ 
              fontWeight: 'bold',
              color: theme.palette.text.primary,
              mb: 1
            }}>
              {getGreeting()}, {userData?.firstName || 'Student'}! 👋
            </Typography>
            <Typography variant="body1" sx={{ 
              color: theme.palette.text.secondary,
              fontSize: '1.1rem'
            }}>
              Ready to grow your SAT score today? Let's see your progress.
            </Typography>
          </Box>
        </FadeIn>

        <Grid container spacing={3}>
          {/* Quick Actions */}
          <Grid item xs={12} md={4}>
            <ScaleIn delay={100}>
              <GlassCard sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 'bold', 
                  mb: 3,
                  color: theme.palette.text.primary,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <SpeedIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <GradientButton
                    variant="contained"
                    gradient="primary"
                    onClick={() => setShowQuiz(true)}
                    startIcon={<QuizIcon />}
                    fullWidth
                  >
                    Take Practice Quiz
                  </GradientButton>
                  <GradientButton
                    variant="outlined"
                    gradient="secondary"
                    component={Link}
                    to="/upload"
                    startIcon={<UploadIcon />}
                    fullWidth
                  >
                    Upload Score Report
                  </GradientButton>
                  <GradientButton
                    variant="outlined"
                    gradient="info"
                    component={Link}
                    to="/lessons"
                    startIcon={<PlayArrowIcon />}
                    fullWidth
                  >
                    Continue Lessons
                  </GradientButton>
                </Box>
              </GlassCard>
            </ScaleIn>
          </Grid>

          {/* Progress Overview */}
          <Grid item xs={12} md={4}>
            <ScaleIn delay={200}>
              <GlassCard sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 'bold', 
                  mb: 3,
                  color: theme.palette.text.primary,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <TrendingUpIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  Progress Overview
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ position: 'relative', display: 'inline-flex', mr: 3 }}>
                    <CircularProgress
                      variant="determinate"
                      value={getProgressPercentage()}
                      size={80}
                      thickness={6}
                      sx={{ color: theme.palette.primary.main }}
                    />
                    <Box sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                        {Math.round(getProgressPercentage())}%
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Current: {userData?.satScore || 'Not set'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Target: {userData?.targetSatScore || 'Not set'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    Skills Mastered
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {masteredSkillsCount}/{totalSkills}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(masteredSkillsCount / totalSkills) * 100} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'
                  }}
                />
              </GlassCard>
            </ScaleIn>
          </Grid>

          {/* Study Statistics */}
          <Grid item xs={12} md={4}>
            <ScaleIn delay={300}>
              <GlassCard sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 'bold', 
                  mb: 3,
                  color: theme.palette.text.primary,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <InsightsIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  Study Stats
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                        {studyStats.dailyStreak}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Day Streak
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.secondary.main }}>
                        {studyStats.accuracyRate}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Accuracy
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                        {studyStats.questionsAnswered}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Questions
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.warning.main }}>
                        {studyStats.completedTests}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Tests
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </GlassCard>
            </ScaleIn>
          </Grid>

          {/* Bonsai Tree */}
          <Grid item xs={12} md={8}>
            <FadeIn delay={400}>
              <GlassCard sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 'bold', 
                  mb: 3,
                  color: theme.palette.text.primary,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <EmojiNatureIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  Your Learning Bonsai
                </Typography>
                <BonsaiTree 
                  skills={skills} 
                  totalSkills={totalSkills}
                  correctAnswersCount={correctAnswersCount}
                  showProgressText={false}
                />
              </GlassCard>
            </FadeIn>
          </Grid>

          {/* Achievements */}
          <Grid item xs={12} md={4}>
            <FadeIn delay={500}>
              <GlassCard sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 'bold', 
                  mb: 3,
                  color: theme.palette.text.primary,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <EmojiEventsIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  Achievements
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {achievements.map((achievement) => (
                    <Box
                      key={achievement.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: achievement.unlocked 
                          ? theme.palette.action.selected 
                          : theme.palette.action.disabled,
                        opacity: achievement.unlocked ? 1 : 0.6,
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <Box sx={{ mr: 2 }}>
                        {achievement.icon}
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {achievement.title}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {achievement.description}
                        </Typography>
                        {achievement.date && (
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: theme.palette.primary.main }}>
                            {achievement.date}
                          </Typography>
                        )}
                      </Box>
                      {achievement.unlocked && (
                        <CheckCircleIcon sx={{ color: theme.palette.success.main }} />
                      )}
                    </Box>
                  ))}
                </Box>
              </GlassCard>
            </FadeIn>
          </Grid>

          {/* Recent Activity */}
          <Grid item xs={12}>
            <FadeIn delay={600}>
              <GlassCard sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 'bold', 
                  mb: 3,
                  color: theme.palette.text.primary,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <ScheduleIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  Recent Activity
                </Typography>
                <Grid container spacing={2}>
                  {recentActivity.map((activity) => (
                    <Grid item xs={12} sm={6} md={3} key={activity.id}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: theme.palette.action.hover,
                          border: `1px solid ${theme.palette.divider}`,
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          {getActivityIcon(activity.type)}
                          <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 'bold' }}>
                            {activity.title}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1, flexGrow: 1 }}>
                          {activity.description}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="textSecondary">
                            {activity.timestamp}
                          </Typography>
                          {activity.score && (
                            <Chip 
                              label={`${activity.score}${activity.type === 'quiz' ? '%' : ''}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </GlassCard>
            </FadeIn>
          </Grid>
        </Grid>
      </Container>

      {/* SkillQuiz Dialog */}
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
        onClose={() => setSnackbarOpen(false)}
        message="Quiz Completed! Your skills have been updated."
      />
    </Box>
  );
};

export default Dashboard; 