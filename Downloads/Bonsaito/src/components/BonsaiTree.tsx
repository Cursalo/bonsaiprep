import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { animated, useSpring } from 'react-spring';
import { supabase } from '../supabaseClient';

// Helper functions
const lerp = (a: number, b: number, t: number): number => a * (1 - t) + b * t;
const clamp = (num: number, min: number, max: number): number => Math.min(Math.max(num, min), max);
const randRange = (min: number, max: number): number => Math.random() * (max - min) + min;

interface Skill {
  id: string;
  name: string;
  category: string;
  mastered: boolean;
  masteryLevel: number; // Assuming 0-100
}

interface BonsaiTreeProps {
  skills: Skill[];
  totalSkills: number;
}

interface Point {
  x: number;
  y: number;
}

// Simplified structure - focusing on trunk and foliage pads
interface FoliagePadElement {
  id: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rotation: number;
  // Elements for gradient/layering
  layers: {
    color: string;
    opacity: number;
    scale: number; // To create inner layers
  }[];
}

// New Color Palette based on the target image
const TRUNK_COLOR = '#604E43'; 
const FOLIAGE_HIGHLIGHT_COLOR = '#A1D490';
const FOLIAGE_SHADE_COLOR = '#7CAC6C'; 
const POT_COLOR = '#8D7B6F';

const BonsaiTree: React.FC<BonsaiTreeProps> = ({ skills, totalSkills }) => {
  const theme = useTheme();
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Determine which bonsai image to show (1.png to 11.png)
  const getBonsaiImageNumber = () => {
    // Default to image 1 (empty bonsai)
    if (correctAnswersCount === 0) return 1;
    
    // Map the number of correct answers to the appropriate image
    // 1-10 correct answers maps to images 2-11
    return Math.min(correctAnswersCount + 1, 11);
  };

  const bonsaiImageNumber = getBonsaiImageNumber();
  
  // Construct the image path using the base URL
  const bonsaiImagePath = `/bonsaipng/${bonsaiImageNumber}.png`;
  const altarImagePath = '/altar2.png';

  // Log the image path for debugging
  console.log('Loading bonsai image:', bonsaiImagePath);

  // Animations - updated to use the recommended API
  const [containerProps, containerApi] = useSpring(() => ({ 
    opacity: 0,
    config: { duration: 500 }
  }));

  useEffect(() => {
    containerApi.start({ opacity: 1 });
  }, [containerApi]);

  const [imageProps, imageApi] = useSpring(() => ({
    transform: 'translateY(20px)',
    config: { tension: 100, friction: 10 }
  }));

  useEffect(() => {
    imageApi.start({ transform: 'translateY(0px)' });
  }, [imageApi]);

  // Preload both bonsai and altar images
  useEffect(() => {
    const preloadImages = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          new Promise((resolve, reject) => {
            const bonsaiImg = new Image();
            bonsaiImg.src = bonsaiImagePath;
            bonsaiImg.onload = resolve;
            bonsaiImg.onerror = reject;
          }),
          new Promise((resolve, reject) => {
            const altarImg = new Image();
            altarImg.src = altarImagePath;
            altarImg.onload = resolve;
            altarImg.onerror = reject;
          })
        ]);
        setIsImageLoaded(true);
        setImageError(false);
      } catch (error) {
        console.error('Failed to load images:', error);
        setImageError(true);
      } finally {
        setIsLoading(false);
      }
    };

    preloadImages();
  }, [bonsaiImagePath, altarImagePath]);

  // Fetch the user's question data to determine how many questions were answered correctly
  useEffect(() => {
    const fetchUserProgress = async () => {
      setIsLoading(true);
      try {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.error('No user logged in');
          setIsLoading(false);
          return;
        }

        // Get the completed questions for the user
        const { data, error } = await supabase
          .from('practice_questions')
          .select('*')
          .eq('user_id', user.id)
          .eq('completed', true);

        if (error) {
          throw error;
        }

        // Calculate how many questions were answered correctly
        const correctAnswers = data ? data.filter(q => q.correct === true).length : 0;
        console.log('Correct answers:', correctAnswers);
        setCorrectAnswersCount(correctAnswers);
      } catch (error) {
        console.error('Error fetching user progress:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProgress();
  }, []);

  const handleImageError = () => {
    console.error(`Failed to load image: ${bonsaiImagePath}`);
    setImageError(true);
  };

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px' 
      }}>
        <Typography>Loading your bonsai...</Typography>
      </Box>
    );
  }

  if (imageError) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        gap: 2
      }}>
        <Typography color="error">Unable to load bonsai image</Typography>
        <Typography variant="body2">Please try refreshing the page</Typography>
      </Box>
    );
  }

  return (
    <animated.div style={containerProps}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: '20px',
          backgroundColor: 'transparent',
          position: 'relative',
          height: '100%',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${altarImagePath})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.85,
            zIndex: 0,
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Typography 
          variant="h5" 
          gutterBottom 
          align="center" 
          sx={{ 
            fontWeight: 'bold', 
              color: '#2C1810',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
            mb: 3
          }}
          >
            Your Learning Bonsai
          </Typography>
          
          <Box sx={{
            flexGrow: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            width: '100%',
            aspectRatio: '16/9',
            maxHeight: '600px',
            '& img': {
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'scale(1.02)'
              }
            }
          }}>
            <animated.img
              src={bonsaiImagePath}
              alt={`Bonsai tree progress - ${correctAnswersCount} questions correct`}
              style={{
                ...imageProps,
                opacity: isImageLoaded ? 1 : 0
              }}
              onLoad={() => setIsImageLoaded(true)}
              onError={handleImageError}
            />
          </Box>
          
          <Box sx={{ 
            mt: 3, 
            textAlign: 'center',
            color: '#2C1810',
            textShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}>
            <Typography variant="h6">
              {correctAnswersCount} Questions Mastered
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
              Keep practicing to grow your bonsai!
            </Typography>
          </Box>
        </Box>
      </Paper>
    </animated.div>
  );
};

export default BonsaiTree;

 