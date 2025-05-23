import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Box, Typography } from '@mui/material';
import { useThemeContext } from '../contexts/ThemeContext';

interface LoadingAnimationProps {
  message?: string;
  width?: number;
  height?: number;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ 
  message = 'Processing...', 
  width = 280, 
  height = 280 
}) => {
  const { themeMode } = useThemeContext();

  const getTextStyles = (themeMode: 'light' | 'dark') => ({
    heading: {
      color: themeMode === 'light' ? 'rgba(0, 0, 0, 0.87)' : 'rgba(255, 255, 255, 0.87)',
    }
  });

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
      }}
    >
      <DotLottieReact
        src="https://lottie.host/d2496ec5-3972-45c9-8e12-74123f42fa49/GGA5w0BWEP.lottie"
        loop
        autoplay
        style={{ width, height }}
      />
      {message && (
        <Typography variant="h6" mt={2} align="center" sx={getTextStyles(themeMode).heading}>
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingAnimation; 