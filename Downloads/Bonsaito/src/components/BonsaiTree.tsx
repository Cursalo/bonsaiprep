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
  correctAnswersCount?: number; // Add optional prop to allow direct control of correct answers
  maxCorrectAnswers?: number; // Maximum number of correct answers to reach the final tree stage
  showProgressText?: boolean; // Prop to control visibility of progress text
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

const BonsaiTree: React.FC<BonsaiTreeProps> = ({ 
  skills, 
  totalSkills, 
  correctAnswersCount: externalCorrectAnswersCount, 
  maxCorrectAnswers = 10, // Default to 10 max correct answers
  showProgressText = true // Default to showing progress text
}) => {
  const theme = useTheme();
  const [internalCorrectAnswersCount, setInternalCorrectAnswersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [treeGrowthAnimation, setTreeGrowthAnimation] = useState(false);

  // Use external count if provided, otherwise use internal count from DB
  const correctAnswersCount = externalCorrectAnswersCount !== undefined 
    ? externalCorrectAnswersCount 
    : internalCorrectAnswersCount;

  // Determine which bonsai image to show (2.png to 11.png)
  const getBonsaiImageNumber = () => {
    console.log('Calculating image number for correctAnswersCount:', correctAnswersCount);
    
    // If no correct answers, show first image (1.png)
    if (correctAnswersCount <= 0) return 1;
    
    // Map the number of correct answers to the appropriate image
    // 1-10 correct answers maps to images 2-11
    // clamp to ensure we don't exceed 11.png
    const imageNumber = Math.min(correctAnswersCount + 1, 11);
    console.log('Selected bonsai image number:', imageNumber);
    return imageNumber;
  };

  const bonsaiImageNumber = getBonsaiImageNumber();
  
  // Construct the image path using the base URL
  const bonsaiImagePath = `/bonsaipng/${bonsaiImageNumber}.png`;
  const altarImagePath = '/altar2.png';

  // Enhanced logging for debugging
  console.log('BonsaiTree - Props:', { 
    externalCorrectAnswersCount, 
    internalCorrectAnswersCount, 
    finalCount: correctAnswersCount,
    bonsaiImageNumber,
    bonsaiImagePath
  });

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

  // Trigger growth animation when correctAnswersCount changes
  useEffect(() => {
    if (correctAnswersCount > 0) {
      setTreeGrowthAnimation(true);
      const timer = setTimeout(() => setTreeGrowthAnimation(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [correctAnswersCount]);

  // Force refresh when correctAnswersCount changes
  useEffect(() => {
    console.log('correctAnswersCount changed to:', correctAnswersCount);
    // Trigger a refresh of the image when count changes
    setIsImageLoaded(false);
    setIsLoading(true);
    
    // This will cause the image to reload with the new path
    const img = new Image();
    img.src = bonsaiImagePath;
    img.onload = () => {
      setIsImageLoaded(true);
      setIsLoading(false);
      setImageError(false);
    };
    img.onerror = () => {
      console.error('Failed to load image on count change:', bonsaiImagePath);
      setImageError(true);
      setIsLoading(false);
    };
  }, [correctAnswersCount, bonsaiImagePath]);

  // Preload both bonsai and altar images
  useEffect(() => {
    const preloadImages = async () => {
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
      } catch (error) {
        console.error('Failed to preload images:', error);
      }
    };

    preloadImages();
  }, [bonsaiImagePath, altarImagePath]);

  // Fetch the user's question data to determine how many questions were answered correctly
  // Only run this if externalCorrectAnswersCount is not provided
  useEffect(() => {
    if (externalCorrectAnswersCount !== undefined) {
      setIsLoading(false);
      return; // Skip fetching if external count is provided
    }

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
        console.log('Correct answers from database:', correctAnswers);
        setInternalCorrectAnswersCount(correctAnswers);
      } catch (error) {
        console.error('Error fetching user progress:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProgress();
  }, [externalCorrectAnswersCount]);

  const handleImageError = () => {
    console.error(`Failed to load image: ${bonsaiImagePath}`);
    setImageError(true);
  };

  // Add global keyframes for floating and growth animations
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes floatBonsai {
        0% { transform: translateY(10px) scale(0.35); filter: contrast(130%); }
        50% { transform: translateY(0px) scale(0.35); filter: contrast(130%); }
        100% { transform: translateY(10px) scale(0.35); filter: contrast(130%); }
      }
      @keyframes growBonsai {
        0% { transform: translateY(10px) scale(0.33); filter: contrast(130%); }
        50% { transform: translateY(5px) scale(0.37); filter: contrast(140%); }
        100% { transform: translateY(10px) scale(0.35); filter: contrast(130%); }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

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
          backdropFilter: 'none',
          '&.MuiPaper-root': {
            backgroundColor: 'transparent !important',
            backdropFilter: 'none !important',
            border: 'none !important',
            boxShadow: 'none !important'
          },
          position: 'relative',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{
            flexGrow: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            position: 'relative',
            width: '100%',
            aspectRatio: '16/9',
            maxHeight: '600px',
            mt: '-20%', // Move the bonsai 20% higher
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
                opacity: isImageLoaded ? 1 : 0,
                animation: treeGrowthAnimation 
                  ? 'growBonsai 1.5s ease-in-out' 
                  : 'floatBonsai 3.5s ease-in-out infinite',
                transform: 'scale(0.35)',
                filter: 'contrast(130%)',
                marginLeft: '4px'
              }}
              onLoad={() => setIsImageLoaded(true)}
              onError={handleImageError}
            />
          </Box>
          

        </Box>
      </Paper>
    </animated.div>
  );
};

export default BonsaiTree;

 
