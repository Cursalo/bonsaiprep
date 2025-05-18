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

  // Determine which bonsai image to show (1.png to 11.png)
  const getBonsaiImageNumber = () => {
    // Default to image 1 (empty bonsai)
    if (correctAnswersCount === 0) return 1;
    
    // Map the number of correct answers to the appropriate image
    // 1-10 correct answers maps to images 2-11
    return Math.min(correctAnswersCount + 1, 11);
  };

  const bonsaiImageNumber = getBonsaiImageNumber();
  // Use process.env.PUBLIC_URL to ensure correct path resolution
  const bonsaiImagePath = `${process.env.PUBLIC_URL}/bonsaipng/${bonsaiImageNumber}.png`;

  // Log the image path for debugging
  console.log('Loading bonsai image:', bonsaiImagePath);

  // Animations
  const containerAnimation = useSpring({ 
    opacity: 1, 
    from: { opacity: 0 }, 
    config: { duration: 500 } 
  });

  const imageAnimation = useSpring({
    transform: 'translateY(0px)',
    from: { transform: 'translateY(20px)' },
    config: { tension: 100, friction: 10 },
  });

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

  return (
    <animated.div style={containerAnimation}>
      <Box 
        sx={{ 
          width: '100%',
          position: 'relative',
          borderRadius: '20px',
          overflow: 'hidden',
          aspectRatio: '16/9',
          backgroundImage: 'url(/altar2.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            borderRadius: '20px',
            backgroundColor: 'transparent',
            height: '100%',
            width: '100%',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
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
              flexDirection: 'column',
              position: 'relative',
            }}>
              <animated.div style={imageAnimation}>
                {!imageError ? (
                  <Box 
                    component="img" 
                    src={bonsaiImagePath}
                    alt={`Bonsai tree growth stage ${bonsaiImageNumber}`}
                    onError={handleImageError}
                    sx={{ 
                      maxWidth: '80%',
                      height: 'auto',
                      maxHeight: '70%',
                      filter: 'drop-shadow(0px 5px 15px rgba(0,0,0,0.3))',
                      objectFit: 'contain',
                      display: 'block',
                      margin: '0 auto',
                    }}
                  />
                ) : (
                  <Typography color="error">Image failed to load</Typography>
                )}
              </animated.div>
              
              <Typography 
                variant="body1" 
                align="center" 
                sx={{ 
                  mt: 3, 
                  fontWeight: 'medium',
                  color: '#2C1810',
                }}
              >
                {correctAnswersCount === 0 
                  ? "Complete practice questions to grow your bonsai!" 
                  : `You've answered ${correctAnswersCount} question${correctAnswersCount === 1 ? '' : 's'} correctly!`}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </animated.div>
  );
};

export default BonsaiTree;

 