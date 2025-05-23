import React from 'react';
import { 
  Container, 
  Typography, 
  Box,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useThemeContext } from '../contexts/ThemeContext';
import Lessons from './Lessons';

const VideoLessons: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { themeMode } = useThemeContext();

  // Theme-aware styling functions
  const getTextStyles = (themeMode: 'light' | 'dark') => ({
    heading: {
      color: themeMode === 'light' ? 'rgba(0, 0, 0, 0.87)' : 'rgba(255, 255, 255, 0.87)',
    },
    body: {
      color: themeMode === 'light' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
    },
    accent: {
      color: themeMode === 'light' ? '#1a936f' : '#88d498',
    },
  });

  const getBackgroundStyle = () => ({
    backgroundColor: themeMode === 'light' ? '#fafafa' : '#121212',
    minHeight: '100vh',
    py: 2,
  });

  return (
    <Box sx={getBackgroundStyle()}>
      <Container maxWidth="xl">
        {/* Video Lessons Header */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography 
            variant={isMobile ? 'h4' : 'h3'} 
            sx={{ 
              ...getTextStyles(themeMode).heading,
              fontWeight: 'bold',
              mb: 1,
              background: `linear-gradient(135deg, ${getTextStyles(themeMode).accent.color}, #4caf50)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            🎬 Video Lessons
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              ...getTextStyles(themeMode).body,
              maxWidth: '600px',
              mx: 'auto'
            }}
          >
            Master SAT concepts with expert-led video tutorials designed to accelerate your learning
          </Typography>
        </Box>
        
        {/* Use the existing Lessons component */}
        <Lessons />
      </Container>
    </Box>
  );
};

export default VideoLessons; 