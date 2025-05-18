import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { keyframes } from '@mui/system';
import { useSpring, animated } from 'react-spring';

interface LoadingSpinnerProps {
  text?: string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  withText?: boolean;
  withGlow?: boolean;
}

// Create keyframes for the glow effect
const glowAnimation = keyframes`
  0% { filter: drop-shadow(0 0 5px rgba(26, 147, 111, 0.3)); }
  50% { filter: drop-shadow(0 0 20px rgba(26, 147, 111, 0.6)); }
  100% { filter: drop-shadow(0 0 5px rgba(26, 147, 111, 0.3)); }
`;

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = 'Loading...',
  size = 'medium',
  color = '#1a936f',
  withText = true,
  withGlow = true,
}) => {
  // Get the size in pixels
  const getSizeInPixels = () => {
    switch (size) {
      case 'small':
        return 40;
      case 'medium':
        return 60;
      case 'large':
        return 80;
      default:
        return 60;
    }
  };

  // Animation for the spinner
  const spinnerAnimation = useSpring({
    loop: true,
    from: { rotateZ: 0 },
    to: { rotateZ: 360 },
    config: {
      tension: 80,
      friction: 10,
    },
  });

  // Animation for the text
  const textAnimation = useSpring({
    loop: true,
    from: { opacity: 0.5 },
    to: { opacity: 1 },
    config: {
      duration: 1000,
    },
  });

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      {/* Custom Spinner */}
      <Box
        sx={{
          position: 'relative',
          width: getSizeInPixels(),
          height: getSizeInPixels(),
          animation: withGlow ? `${glowAnimation} 2s infinite` : 'none',
        }}
      >
        {/* Background Circle */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        />

        {/* Spinner Element */}
        <animated.div
          style={{
            ...spinnerAnimation,
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              height: '100%',
            }}
          >
            <CircularProgress
              size={getSizeInPixels()}
              thickness={4}
              sx={{
                color: color,
                '.MuiCircularProgress-circle': {
                  strokeLinecap: 'round',
                },
              }}
            />
          </Box>
        </animated.div>

        {/* Center Dot */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: getSizeInPixels() / 5,
            height: getSizeInPixels() / 5,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color} 0%, rgba(26, 147, 111, 0.7) 100%)`,
            boxShadow: `0 0 15px ${color}`,
          }}
        />
      </Box>

      {/* Loading Text */}
      {withText && (
        <animated.div style={textAnimation}>
          <Typography
            variant="body1"
            sx={{
              color: 'white',
              fontWeight: 500,
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
              letterSpacing: '0.05em',
            }}
          >
            {text}
          </Typography>
        </animated.div>
      )}
    </Box>
  );
};

export default LoadingSpinner; 