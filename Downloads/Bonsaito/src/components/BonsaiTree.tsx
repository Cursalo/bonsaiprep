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

  // Determine which bonsai image to show (1.png to 11.png)
  const getBonsaiImageNumber = () => {
    // Default to image 1 (empty bonsai)
    if (correctAnswersCount === 0) return 1;
    
    // Map the number of correct answers to the appropriate image
    // 1-10 correct answers maps to images 2-11
    return Math.min(correctAnswersCount + 1, 11);
  };

  const bonsaiImageNumber = getBonsaiImageNumber();
  const bonsaiImagePath = `/bonsaipng/${bonsaiImageNumber}.png`;

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
        setCorrectAnswersCount(correctAnswers);
      } catch (error) {
        console.error('Error fetching user progress:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProgress();
  }, []);

  return (
    <animated.div style={containerAnimation}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: '20px',
          backgroundColor: 'transparent',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(/altar2.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.85,
            borderRadius: '20px',
            zIndex: 0,
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
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
            width: '100%', 
            height: 450, 
            position: 'relative',
            mt: 2,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column'
          }}>
            <animated.div style={imageAnimation}>
              <Box 
                component="img" 
                src={bonsaiImagePath}
                alt={`Bonsai tree growth stage ${bonsaiImageNumber}`}
                sx={{
                  maxWidth: '100%',
                  height: 'auto',
                  maxHeight: 350,
                  filter: 'drop-shadow(0px 5px 15px rgba(0,0,0,0.3))',
                }}
              />
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
    </animated.div>
  );
};

export default BonsaiTree;

 