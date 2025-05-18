import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Box, Typography } from '@mui/material';

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
        src="https://lottie.host/021e11ee-d290-4eaf-ac8a-27fed4579b9b/9DbV57Fb67.lottie"
        loop
        autoplay
        style={{ width, height }}
      />
      {message && (
        <Typography variant="h6" mt={2} align="center">
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingAnimation; 