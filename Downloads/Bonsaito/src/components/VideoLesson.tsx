import React, { useState, useRef, useEffect } from 'react';
import { 
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Avatar,
  Button,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Grid,
  Collapse,
  Rating,
  useTheme,
  useMediaQuery,
  Badge
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  CheckCircle as CheckCircleIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccessTime as TimeIcon,
  Star as StarIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  EmojiNature as EmojiNatureIcon
} from '@mui/icons-material';
import { useThemeContext } from '../contexts/ThemeContext';
import { useSkills } from '../components/SkillsProvider';
import GradientButton from './GradientButton';

interface VideoProps {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  duration: number;
  tutor: {
    name: string;
    title: string;
    avatar?: string;
  };
  skillName: string;
  category: string;
  difficulty: string;
  rating: number;
  completed: boolean;
  bookmarked: boolean;
  tags: string[];
  onComplete: (videoId: string) => void;
  onBookmarkToggle: (videoId: string) => void;
}

const VideoLesson: React.FC<VideoProps> = ({ 
  id,
  title,
  description,
  thumbnail,
  videoUrl,
  duration,
  tutor,
  skillName,
  category,
  difficulty,
  rating,
  completed,
  bookmarked,
  tags,
  onComplete,
  onBookmarkToggle
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { themeMode } = useThemeContext();
  const { updateSkillProgress } = useSkills();
  
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [watchTime, setWatchTime] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
    overflow: 'hidden',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: themeMode === 'light' 
        ? '0 8px 30px rgba(0, 0, 0, 0.12)' 
        : '0 8px 30px rgba(0, 0, 0, 0.6)',
    }
  });

  // Enhanced video simulation with realistic behavior
  const handlePlayPause = () => {
    if (!playing) {
      setPlaying(true);
      intervalRef.current = setInterval(() => {
        setWatchTime(prev => {
          const newTime = prev + playbackSpeed;
          const newProgress = Math.min(100, Math.round((newTime / duration) * 100));
          setProgress(newProgress);
          
          // Auto-mark as complete at 90%
          if (newProgress >= 90 && !completed) {
            handleComplete();
          }
          
          // Stop at end
          if (newTime >= duration) {
            setPlaying(false);
            return duration;
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      setPlaying(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const handleComplete = async () => {
    try {
      setPlaying(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Update skill progress (simulate 10-20% improvement)
      const progressIncrease = Math.floor(Math.random() * 11) + 10;
      
      onComplete(id);
      
      // Show growth feedback
      console.log(`Lesson completed! Skill progress increased by ${progressIncrease}%`);
    } catch (error) {
      console.error('Error marking video as complete:', error);
    }
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Format seconds to mm:ss or h:mm:ss
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return theme.palette.success.main;
      case 'Intermediate': return theme.palette.warning.main;
      case 'Advanced': return theme.palette.error.main;
      default: return theme.palette.info.main;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Math': return '📐';
      case 'Reading': return '📖';
      case 'Writing & Language': return '✍️';
      default: return '📚';
    }
  };

  return (
    <Paper sx={getCardStyle()}>
      <Grid container>
        {/* Video Thumbnail Section */}
        <Grid item xs={12} md={5}>
          <Box sx={{ position: 'relative', height: isMobile ? '240px' : '280px' }}>
            <CardMedia
              component="img"
              height="100%"
              image={thumbnail || 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=640&h=360&fit=crop'}
              alt={title}
              sx={{ 
                objectFit: 'cover',
                transition: 'all 0.3s ease'
              }}
            />
            
            {/* Video Controls Overlay */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: playing ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.5)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                },
              }}
              onClick={handlePlayPause}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  backgroundColor: getTextStyles(themeMode).accent.color,
                  color: 'white',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    backgroundColor: themeMode === 'light' ? '#114b5f' : '#a6e3b0',
                  }
                }}
              >
                {playing ? <PauseIcon fontSize="large" /> : <PlayArrowIcon fontSize="large" />}
              </Box>
            </Box>
            
            {/* Status Badges */}
            <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 1 }}>
              {completed && (
                <Chip
                  icon={<CheckCircleIcon />}
                  label="Completed"
                  color="success"
                  size="small"
                  sx={{ 
                    backgroundColor: 'rgba(76, 175, 80, 0.9)',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
              )}
              
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onBookmarkToggle(id);
                }}
                sx={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  }
                }}
              >
                {bookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
              </IconButton>
            </Box>

            {/* Duration Badge */}
            <Chip
              icon={<TimeIcon />}
              label={formatTime(duration)}
              size="small"
              sx={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                fontWeight: 'bold'
              }}
            />
          </Box>
          
          {/* Progress Bar */}
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ 
              height: 6,
              backgroundColor: themeMode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: getTextStyles(themeMode).accent.color
              }
            }}
          />
        </Grid>
        
        {/* Content Section */}
        <Grid item xs={12} md={7}>
          <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="h6" sx={{ 
                  ...getTextStyles(themeMode).heading,
                  fontWeight: 'bold',
                  lineHeight: 1.3,
                  flex: 1,
                  mr: 2
                }}>
                  {title}
                </Typography>
                <Rating 
                  value={rating} 
                  precision={0.1} 
                  size="small" 
                  readOnly 
                  sx={{ flexShrink: 0 }}
                />
              </Box>
              
              {/* Metadata Row */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Chip 
                  label={`${getCategoryIcon(category)} ${category}`}
                  size="small"
                  sx={{ 
                    backgroundColor: getTextStyles(themeMode).accent.color,
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
                <Chip 
                  label={difficulty} 
                  size="small" 
                  sx={{ 
                    bgcolor: getDifficultyColor(difficulty),
                    color: 'white',
                    fontWeight: 'bold'
                  }} 
                />
                <Chip 
                  label={skillName} 
                  size="small" 
                  variant="outlined"
                  sx={{ 
                    borderColor: getTextStyles(themeMode).accent.color,
                    color: getTextStyles(themeMode).accent.color
                  }}
                />
              </Box>
              
              {/* Progress Info */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="body2" sx={getTextStyles(themeMode).secondary}>
                  {formatTime(watchTime)} / {formatTime(duration)}
                </Typography>
                <Typography variant="body2" sx={getTextStyles(themeMode).secondary}>
                  •
                </Typography>
                <Typography variant="body2" sx={getTextStyles(themeMode).secondary}>
                  {progress.toFixed(0)}% watched
                </Typography>
                {completed && (
                  <>
                    <Typography variant="body2" sx={getTextStyles(themeMode).secondary}>
                      •
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EmojiNatureIcon 
                        fontSize="small" 
                        sx={{ color: getTextStyles(themeMode).accent.color, mr: 0.5 }} 
                      />
                      <Typography variant="body2" sx={{ color: getTextStyles(themeMode).accent.color, fontWeight: 'bold' }}>
                        Skill Growth!
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            </Box>
            
            {/* Description */}
            <Typography variant="body2" sx={{ 
              ...getTextStyles(themeMode).body,
              mb: 3,
              lineHeight: 1.6,
              flex: 1
            }}>
              {description}
            </Typography>
            
            {/* Tags */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 3 }}>
              {tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={`#${tag}`}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontSize: '0.75rem',
                    height: '24px',
                    borderColor: getTextStyles(themeMode).secondary.color,
                    color: getTextStyles(themeMode).secondary.color,
                    '&:hover': {
                      borderColor: getTextStyles(themeMode).accent.color,
                      color: getTextStyles(themeMode).accent.color,
                    }
                  }}
                />
              ))}
            </Box>
            
            {/* Tutor Information */}
            <Box sx={{ 
              p: 2, 
              borderRadius: 2, 
              backgroundColor: themeMode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${themeMode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
              mb: 3
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  src={tutor.avatar} 
                  alt={tutor.name}
                  sx={{ 
                    width: 48, 
                    height: 48, 
                    mr: 2,
                    border: `2px solid ${getTextStyles(themeMode).accent.color}`
                  }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ 
                    ...getTextStyles(themeMode).heading,
                    fontWeight: 'bold'
                  }}>
                    {tutor.name}
                  </Typography>
                  <Typography variant="body2" sx={getTextStyles(themeMode).secondary}>
                    {tutor.title}
                  </Typography>
                </Box>
                <SchoolIcon sx={{ color: getTextStyles(themeMode).accent.color }} />
              </Box>
            </Box>
            
            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <GradientButton 
                variant="contained"
                gradient="primary"
                onClick={handlePlayPause}
                startIcon={playing ? <PauseIcon /> : <PlayArrowIcon />}
                size="large"
                sx={{ flex: 1 }}
              >
                {playing ? 'Pause' : completed ? 'Rewatch' : 'Play'}
              </GradientButton>
              
              {progress > 0 && !completed && (
                <GradientButton 
                  variant="outlined" 
                  gradient="success"
                  onClick={handleComplete}
                  startIcon={<CheckCircleIcon />}
                  size="large"
                >
                  Mark Complete
                </GradientButton>
              )}
              
              <Tooltip title={bookmarked ? "Remove bookmark" : "Bookmark lesson"}>
                <IconButton
                  onClick={() => onBookmarkToggle(id)}
                  sx={{ 
                    color: bookmarked ? getTextStyles(themeMode).accent.color : getTextStyles(themeMode).secondary.color,
                    '&:hover': {
                      color: getTextStyles(themeMode).accent.color,
                      backgroundColor: themeMode === 'light' ? 'rgba(26, 147, 111, 0.08)' : 'rgba(26, 147, 111, 0.08)'
                    }
                  }}
                >
                  {bookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                </IconButton>
              </Tooltip>
            </Box>
          </CardContent>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default VideoLesson; 