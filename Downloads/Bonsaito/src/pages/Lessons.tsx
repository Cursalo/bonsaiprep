import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Paper, 
  Tabs, 
  Tab, 
  CircularProgress,
  Button,
  Divider,
  Alert,
  TextField,
  InputAdornment,
  Chip,
  Card,
  CardContent,
  LinearProgress,
  Avatar,
  IconButton,
  Tooltip,
  Badge,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
  AccessTime as TimeIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  EmojiNature as EmojiNatureIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import VideoLesson from '../components/VideoLesson';
import { useSkills } from '../components/SkillsProvider';
import { useThemeContext } from '../contexts/ThemeContext';
import GradientButton from '../components/GradientButton';
import { supabase } from '../supabaseClient';

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  duration: number;
  skillId: string;
  skillName: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  rating: number;
  tutor: {
    name: string;
    title: string;
    avatar?: string;
  };
  completed: boolean;
  bookmarked: boolean;
  tags: string[];
  transcript?: string;
}

const Lessons: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { themeMode } = useThemeContext();
  const { skills } = useSkills();
  const location = useLocation();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('recommended');
  const [completedVideos, setCompletedVideos] = useState<string[]>([]);
  const [bookmarkedVideos, setBookmarkedVideos] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Theme-aware styling functions
  const getTextStyles = (themeMode: 'light' | 'dark') => ({
    heading: {
      color: themeMode === 'light' ? 'rgba(0, 0, 0, 0.87)' : 'rgba(255, 255, 255, 0.87)',
    },
    body: {
      color: themeMode === 'light' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
    },
    secondary: {
      color: themeMode === 'light' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)',
    },
    accent: {
      color: themeMode === 'light' ? '#1a936f' : '#88d498',
    },
  });

  const getBackgroundStyle = () => ({
    backgroundColor: themeMode === 'light' ? '#fafafa' : '#121212',
    minHeight: '100vh',
    py: 4,
  });

  const getCardStyle = () => ({
    backgroundColor: themeMode === 'light' 
      ? 'rgba(255, 255, 255, 0.95)' 
      : 'rgba(30, 30, 30, 0.95)',
    border: `1px solid ${themeMode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}`,
    borderRadius: '16px',
    backdropFilter: 'blur(10px)',
    boxShadow: themeMode === 'light' 
      ? '0 4px 20px rgba(0, 0, 0, 0.08)' 
      : '0 4px 20px rgba(0, 0, 0, 0.4)',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: themeMode === 'light' 
        ? '0 8px 30px rgba(0, 0, 0, 0.12)' 
        : '0 8px 30px rgba(0, 0, 0, 0.6)',
    }
  });

  // Enhanced mock data with more realistic SAT content
  const mockVideos: Video[] = [
    {
      id: 'v1',
      title: 'Mastering Semicolons and Advanced Punctuation',
      description: 'Learn the sophisticated use of semicolons, colons, and dashes in complex sentences. Master the punctuation rules that appear most frequently on the SAT Writing section.',
      thumbnail: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=640&h=360&fit=crop',
      videoUrl: 'https://example.com/videos/semicolons.mp4',
      duration: 1820, // 30:20
      skillId: 'sec-pun-semi',
      skillName: 'Advanced Punctuation',
      category: 'Writing & Language',
      difficulty: 'Intermediate',
      rating: 4.8,
      tutor: {
        name: 'Dr. Emily Chen',
        title: 'English Professor, Stanford University',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face'
      },
      completed: false,
      bookmarked: false,
      tags: ['punctuation', 'grammar', 'writing'],
      transcript: 'In this lesson, we\'ll explore the nuanced use of semicolons...'
    },
    {
      id: 'v2',
      title: 'Eliminating Run-on Sentences: Strategies That Work',
      description: 'Master three proven techniques for identifying and fixing run-on sentences and comma splices. Practice with real SAT examples.',
      thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=640&h=360&fit=crop',
      videoUrl: 'https://example.com/videos/runonsentences.mp4',
      duration: 1650, // 27:30
      skillId: 'sec-sent-run',
      skillName: 'Sentence Structure',
      category: 'Writing & Language',
      difficulty: 'Beginner',
      rating: 4.9,
      tutor: {
        name: 'James Wilson',
        title: 'SAT Writing Specialist, 15+ years experience',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
      },
      completed: false,
      bookmarked: true,
      tags: ['sentence structure', 'grammar', 'clarity']
    },
    {
      id: 'v3',
      title: 'Quadratic Equations: Complete Problem-Solving Guide',
      description: 'Master all approaches to quadratic equations: factoring, completing the square, and the quadratic formula. Learn when to use each method for maximum efficiency.',
      thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=640&h=360&fit=crop',
      videoUrl: 'https://example.com/videos/quadratics.mp4',
      duration: 2760, // 46:00
      skillId: 'math-alg-quad',
      skillName: 'Quadratic Equations',
      category: 'Math',
      difficulty: 'Intermediate',
      rating: 4.7,
      tutor: {
        name: 'Dr. Robert Martinez',
        title: 'Math Department Chair, PrepAcademy',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
      },
      completed: false,
      bookmarked: false,
      tags: ['algebra', 'quadratics', 'problem solving']
    },
    {
      id: 'v4',
      title: 'Exponents and Radicals: From Basics to Advanced',
      description: 'Comprehensive guide to exponent rules and radical expressions. Practice with complex SAT problems involving exponential growth and scientific notation.',
      thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=640&h=360&fit=crop',
      videoUrl: 'https://example.com/videos/exponents.mp4',
      duration: 2100, // 35:00
      skillId: 'math-alg-exp',
      skillName: 'Exponents and Radicals',
      category: 'Math',
      difficulty: 'Advanced',
      rating: 4.6,
      tutor: {
        name: 'Sarah Johnson',
        title: 'Math Specialist, MIT Graduate',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
      },
      completed: false,
      bookmarked: false,
      tags: ['algebra', 'exponents', 'radicals', 'scientific notation']
    },
    {
      id: 'v5',
      title: 'Reading Comprehension: Advanced Inference Strategies',
      description: 'Learn to make sophisticated inferences from complex passages. Master the reasoning skills needed for high-level SAT Reading questions.',
      thumbnail: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=640&h=360&fit=crop',
      videoUrl: 'https://example.com/videos/inference.mp4',
      duration: 1980, // 33:00
      skillId: 'read-comp-inf',
      skillName: 'Inference Skills',
      category: 'Reading',
      difficulty: 'Advanced',
      rating: 4.9,
      tutor: {
        name: 'Dr. Amanda Foster',
        title: 'Literature Professor, Yale University',
        avatar: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face'
      },
      completed: false,
      bookmarked: true,
      tags: ['reading', 'inference', 'comprehension', 'critical thinking']
    },
    {
      id: 'v6',
      title: 'Data Analysis and Statistics: SAT Essentials',
      description: 'Master data interpretation, statistical reasoning, and probability concepts that frequently appear on the SAT Math section.',
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=640&h=360&fit=crop',
      videoUrl: 'https://example.com/videos/statistics.mp4',
      duration: 2400, // 40:00
      skillId: 'math-data-stat',
      skillName: 'Statistics and Data',
      category: 'Math',
      difficulty: 'Intermediate',
      rating: 4.7,
      tutor: {
        name: 'Dr. Kevin Park',
        title: 'Statistics Professor, UC Berkeley',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
      },
      completed: false,
      bookmarked: false,
      tags: ['statistics', 'data analysis', 'probability', 'graphs']
    }
  ];

  // Fetch videos and user progress on component mount
  useEffect(() => {
    const loadLessons = async () => {
      setLoading(true);
      try {
        // Load user's completed lessons and bookmarks from database
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: progressData } = await supabase
            .from('user_lesson_progress')
            .select('lesson_id, completed, bookmarked')
            .eq('user_id', user.id);

          if (progressData) {
            setCompletedVideos(progressData.filter(p => p.completed).map(p => p.lesson_id));
            setBookmarkedVideos(progressData.filter(p => p.bookmarked).map(p => p.lesson_id));
          }
        }

        // Sort videos to prioritize those for weaker skills
        const sortedVideos = [...mockVideos].sort((a, b) => {
          const skillA = skills.find(s => s.id === a.skillId);
          const skillB = skills.find(s => s.id === b.skillId);
          
          // Prioritize videos for skills that need improvement
          if (!skillA || skillA.mastered) return 1;
          if (!skillB || skillB.mastered) return -1;
          
          return skillA.masteryLevel - skillB.masteryLevel;
        });
        
        setVideos(sortedVideos);
      } catch (error) {
        console.error('Error loading lessons:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLessons();
  }, [skills]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  const handleVideoComplete = async (videoId: string) => {
    setCompletedVideos(prev => [...prev, videoId]);
    
    // Update video list
    setVideos(prevVideos => 
      prevVideos.map(video => 
        video.id === videoId ? { ...video, completed: true } : video
      )
    );
    
    // Save progress to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_lesson_progress')
          .upsert({
            user_id: user.id,
            lesson_id: videoId,
            completed: true,
            completed_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error saving lesson progress:', error);
    }
  };

  const handleBookmarkToggle = async (videoId: string) => {
    const isBookmarked = bookmarkedVideos.includes(videoId);
    
    if (isBookmarked) {
      setBookmarkedVideos(prev => prev.filter(id => id !== videoId));
    } else {
      setBookmarkedVideos(prev => [...prev, videoId]);
    }

    // Update in database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_lesson_progress')
          .upsert({
            user_id: user.id,
            lesson_id: videoId,
            bookmarked: !isBookmarked
          });
      }
    } catch (error) {
      console.error('Error updating bookmark:', error);
    }
  };

  // Filter videos based on search and filters
  const filteredVideos = videos.filter(video => {
    const matchesTab = (() => {
      switch (activeTab) {
        case 'recommended':
          const skill = skills.find(s => s.id === video.skillId);
          return skill && !skill.mastered;
        case 'completed':
          return completedVideos.includes(video.id);
        case 'bookmarked':
          return bookmarkedVideos.includes(video.id);
        default:
          return true;
      }
    })();

    const matchesSearch = searchQuery === '' || 
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDifficulty = selectedDifficulty === 'all' || video.difficulty === selectedDifficulty;
    const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory;

    return matchesTab && matchesSearch && matchesDifficulty && matchesCategory;
  });

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return theme.palette.success.main;
      case 'Intermediate': return theme.palette.warning.main;
      case 'Advanced': return theme.palette.error.main;
      default: return theme.palette.info.main;
    }
  };

  return (
    <Box sx={getBackgroundStyle()}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ ...getTextStyles(themeMode).heading, fontWeight: 'bold', mb: 2 }}>
            {location.pathname === '/video-lessons' ? '🎬' : '📚'} Video Lessons
          </Typography>
          <Typography variant="subtitle1" sx={{ ...getTextStyles(themeMode).secondary, mb: 4 }}>
            Expert-led lessons tailored to your skill gaps. Master specific SAT concepts with top tutors.
          </Typography>
        </Box>

        {/* Search and Filters */}
        <Paper sx={{ ...getCardStyle(), p: 3, mb: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search lessons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: getTextStyles(themeMode).secondary.color }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: themeMode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
                  },
                  '& .MuiInputBase-input': {
                    color: getTextStyles(themeMode).heading.color
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Difficulty"
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                SelectProps={{ native: true }}
                sx={{
                  '& .MuiInputBase-input': {
                    color: getTextStyles(themeMode).heading.color
                  }
                }}
              >
                <option value="all">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                SelectProps={{ native: true }}
                sx={{
                  '& .MuiInputBase-input': {
                    color: getTextStyles(themeMode).heading.color
                  }
                }}
              >
                <option value="all">All Categories</option>
                <option value="Math">Math</option>
                <option value="Reading">Reading</option>
                <option value="Writing & Language">Writing & Language</option>
              </TextField>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabs */}
        <Paper sx={{ ...getCardStyle(), mb: 4 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant={isMobile ? "fullWidth" : "standard"}
            sx={{
              '& .MuiTab-root': {
                color: getTextStyles(themeMode).secondary.color,
                '&.Mui-selected': {
                  color: getTextStyles(themeMode).accent.color
                }
              }
            }}
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon sx={{ mr: 1, fontSize: '1rem' }} />
                  Recommended For You
                  <Badge 
                    badgeContent={filteredVideos.length} 
                    color="primary" 
                    sx={{ ml: 1 }}
                  />
                </Box>
              } 
              value="recommended" 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircleIcon sx={{ mr: 1, fontSize: '1rem' }} />
                  Completed
                  <Badge 
                    badgeContent={completedVideos.length} 
                    color="success" 
                    sx={{ ml: 1 }}
                  />
                </Box>
              } 
              value="completed" 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <BookmarkIcon sx={{ mr: 1, fontSize: '1rem' }} />
                  Bookmarked
                  <Badge 
                    badgeContent={bookmarkedVideos.length} 
                    color="secondary" 
                    sx={{ ml: 1 }}
                  />
                </Box>
              } 
              value="bookmarked" 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SchoolIcon sx={{ mr: 1, fontSize: '1rem' }} />
                  All Lessons
                </Box>
              } 
              value="all" 
            />
          </Tabs>
        </Paper>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
            <CircularProgress size={60} />
          </Box>
        ) : filteredVideos.length > 0 ? (
          <Grid container spacing={3}>
            {filteredVideos.map(video => (
              <Grid item xs={12} key={video.id}>
                <VideoLesson
                  id={video.id}
                  title={video.title}
                  description={video.description}
                  thumbnail={video.thumbnail}
                  videoUrl={video.videoUrl}
                  duration={video.duration}
                  tutor={video.tutor}
                  skillName={video.skillName}
                  category={video.category}
                  difficulty={video.difficulty}
                  rating={video.rating}
                  completed={completedVideos.includes(video.id)}
                  bookmarked={bookmarkedVideos.includes(video.id)}
                  tags={video.tags}
                  onComplete={handleVideoComplete}
                  onBookmarkToggle={handleBookmarkToggle}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper sx={{ ...getCardStyle(), p: 6, textAlign: 'center' }}>
            {activeTab === 'recommended' ? (
              <Alert 
                severity="success" 
                sx={{ 
                  mb: 3,
                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                  '& .MuiAlert-icon': {
                    color: getTextStyles(themeMode).accent.color
                  }
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  🎉 Excellent Progress!
                </Typography>
                <Typography>
                  You've mastered the skills covered by available lessons. Upload a new practice test to discover more areas for improvement.
                </Typography>
              </Alert>
            ) : activeTab === 'completed' ? (
              <Alert 
                severity="info" 
                sx={{ 
                  mb: 3,
                  backgroundColor: 'rgba(33, 150, 243, 0.1)',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  📝 Ready to Start Learning?
                </Typography>
                <Typography>
                  You haven't completed any lessons yet. Start with our recommended lessons to boost your SAT skills.
                </Typography>
              </Alert>
            ) : (
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  🔍 No Results Found
                </Typography>
                <Typography>
                  Try adjusting your search terms or filters to find more lessons.
                </Typography>
              </Alert>
            )}
            
            <GradientButton 
              variant="contained" 
              gradient="primary"
              component={Link} 
              to="/upload"
              size="large"
              startIcon={<EmojiNatureIcon />}
              sx={{ mr: 2 }}
            >
              Upload Practice Test
            </GradientButton>
            <GradientButton 
              variant="outlined"
              gradient="secondary"
              component={Link} 
              to="/dashboard"
              size="large"
            >
              View Progress Dashboard
            </GradientButton>
          </Paper>
        )}
        
        <Divider sx={{ my: 6 }} />
        
        {/* Progress Summary */}
        <Paper sx={{ ...getCardStyle(), p: 4, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ ...getTextStyles(themeMode).heading, fontWeight: 'bold', mb: 3 }}>
            🌳 Your Learning Growth
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} sm={4}>
              <Box>
                <Typography variant="h3" sx={{ color: getTextStyles(themeMode).accent.color, fontWeight: 'bold' }}>
                  {completedVideos.length}
                </Typography>
                <Typography sx={getTextStyles(themeMode).secondary}>
                  Lessons Completed
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box>
                <Typography variant="h3" sx={{ color: theme.palette.secondary.main, fontWeight: 'bold' }}>
                  {Math.round(completedVideos.reduce((acc, id) => {
                    const video = videos.find(v => v.id === id);
                    return acc + (video ? video.duration : 0);
                  }, 0) / 60)}m
                </Typography>
                <Typography sx={getTextStyles(themeMode).secondary}>
                  Study Time
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box>
                <Typography variant="h3" sx={{ color: theme.palette.success.main, fontWeight: 'bold' }}>
                  {bookmarkedVideos.length}
                </Typography>
                <Typography sx={getTextStyles(themeMode).secondary}>
                  Bookmarked
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4 }}>
            <GradientButton 
              variant="outlined" 
              gradient="success"
              component={Link} 
              to="/dashboard"
              startIcon={<EmojiNatureIcon />}
            >
              View Your Bonsai Tree Growth
            </GradientButton>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Lessons; 