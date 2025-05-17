import React, { useState } from 'react';
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
  LinearProgress
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
// import { videosAPI } from '../services/api'; // Commented out as it's unused for now

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
  completed: boolean;
  onComplete: (videoId: string) => void;
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
  completed,
  onComplete
}) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [watchTime, setWatchTime] = useState(0);

  // In a real app, we would use a video player library like react-player
  // This is a simplified mock implementation
  const handlePlayPause = () => {
    if (!playing) {
      setPlaying(true);
      // Simulate video playback with a timer
      const interval = setInterval(() => {
        setWatchTime(prev => {
          const newTime = prev + 1;
          const newProgress = Math.min(100, Math.round((newTime / duration) * 100));
          setProgress(newProgress);
          
          // Auto-mark as complete at 90%
          if (newProgress >= 90 && !completed) {
            clearInterval(interval);
            handleComplete();
          }
          
          // Stop at end
          if (newTime >= duration) {
            clearInterval(interval);
            setPlaying(false);
            return duration;
          }
          
          return newTime;
        });
      }, 1000);
      
      // Store interval ID for cleanup
      return () => clearInterval(interval);
    } else {
      setPlaying(false);
    }
  };

  const handleComplete = async () => {
    try {
      // In a real app, we would call the API to mark the video as completed
      // await videosAPI.markVideoComplete(id);
      onComplete(id);
    } catch (error) {
      console.error('Error marking video as complete:', error);
    }
  };

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <Paper elevation={3} sx={{ mb: 4, overflow: 'hidden' }}>
      <Card sx={{ display: 'flex', flexDirection: 'column' }}>
        {/* Video thumbnail with play button overlay */}
        <Box sx={{ position: 'relative' }}>
          <CardMedia
            component="img"
            height="240"
            image={thumbnail || 'https://via.placeholder.com/640x360'}
            alt={title}
          />
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
              backgroundColor: playing ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
              },
            }}
            onClick={handlePlayPause}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 60,
                height: 60,
                borderRadius: '50%',
                backgroundColor: 'primary.main',
                color: 'white',
              }}
            >
              {playing ? <PauseIcon fontSize="large" /> : <PlayArrowIcon fontSize="large" />}
            </Box>
            
            {completed && (
              <Chip
                icon={<CheckCircleIcon />}
                label="Completed"
                color="success"
                sx={{ position: 'absolute', top: 16, right: 16 }}
              />
            )}
          </Box>
        </Box>
        
        {/* Progress bar */}
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ height: 5 }}
        />
        
        {/* Video info */}
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {title}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Chip label={skillName} size="small" sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {formatTime(watchTime)} / {formatTime(duration)}
            </Typography>
          </Box>
          
          <Typography variant="body2" paragraph>
            {description}
          </Typography>
          
          {/* Tutor info */}
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 3 }}>
            <Avatar 
              src={tutor.avatar} 
              alt={tutor.name}
              sx={{ width: 48, height: 48, mr: 2 }}
            />
            <Box>
              <Typography variant="subtitle1">
                {tutor.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {tutor.title}
              </Typography>
            </Box>
          </Box>
          
          {/* Action buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button variant="outlined" onClick={handlePlayPause}>
              {playing ? 'Pause' : 'Play'}
            </Button>
            <Button 
              variant="contained" 
              color="success"
              onClick={handleComplete}
              disabled={completed}
            >
              Mark as Complete
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Paper>
  );
};

export default VideoLesson; 