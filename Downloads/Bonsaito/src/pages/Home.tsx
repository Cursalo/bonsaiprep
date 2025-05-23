import React from 'react';
import { Typography, Container, Box, Grid, AppBar, Toolbar, useTheme, useMediaQuery } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import EmojiNatureIcon from '@mui/icons-material/EmojiNature';
import SchoolIcon from '@mui/icons-material/School';
import InsightsIcon from '@mui/icons-material/Insights';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';

// Import our custom components
import GradientButton from '../components/GradientButton';
import GlassCard from '../components/GlassCard';
import { FadeIn, ScaleIn, FloatAnimation, SlideIn } from '../components/AnimationEffects';
import ThemeToggle from '../components/ThemeToggle';
import { useThemeContext } from '../contexts/ThemeContext';

const Home: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { themeMode } = useThemeContext();

  // Features data
  const features = [
    {
      title: "Personalized Learning",
      description: "Our AI analyzes your practice test results to create personalized learning paths focused on your specific needs.",
      icon: <SchoolIcon sx={{ fontSize: 48, color: theme.palette.primary.main }} />,
      animation: "fade"
    },
    {
      title: "Visual Progress Tracking",
      description: "Watch your Bonsai tree grow as you master SAT skills, providing a satisfying visual representation of your progress.",
      icon: <LocalFloristIcon sx={{ fontSize: 48, color: theme.palette.primary.main }} />,
      animation: "scale"
    },
    {
      title: "Targeted Practice",
      description: "Focus on areas that need improvement with targeted practice problems and video lessons.",
      icon: <MenuBookIcon sx={{ fontSize: 48, color: theme.palette.primary.main }} />,
      animation: "fade"
    },
    {
      title: "Detailed Analytics",
      description: "Get comprehensive insights into your strengths and weaknesses with detailed analytics and progress reports.",
      icon: <InsightsIcon sx={{ fontSize: 48, color: theme.palette.primary.main }} />,
      animation: "scale"
    }
  ];

  // Background style that adapts to theme
  const getBackgroundStyle = () => {
    if (themeMode === 'light') {
      return {
        backgroundColor: '#fafafa',
        minHeight: '100vh',
        transition: 'background-color 0.3s ease',
      };
    }
    
    return {
      backgroundColor: '#121212',
      minHeight: '100vh',
      transition: 'background-color 0.3s ease',
    };
  };

  return (
    <Box sx={getBackgroundStyle()}>
      {/* Navigation */}
      <AppBar position="fixed" elevation={0}>
        <Toolbar>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            flexGrow: 1
          }}>
            <img 
              src={themeMode === 'light' ? '/bonsaiblack.png' : '/bonsaiwhitenobg.png'}
              alt="Bonsai Prep Logo" 
              style={{ 
                height: '40px',
                width: 'auto',
                objectFit: 'contain',
                maxWidth: '200px'
              }} 
            />
          </Box>
          
          {/* Theme Toggle */}
          <ThemeToggle />
          
          <GradientButton
            variant="contained"
            gradient="primary"
            component={RouterLink}
            to="/login"
            sx={{ ml: 2 }}
          >
            Get Started
          </GradientButton>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Container maxWidth="lg">
        <Box sx={{ 
          pt: { xs: 12, md: 16 }, 
          pb: { xs: 6, md: 10 },
          textAlign: 'center'
        }}>
          <FadeIn duration={1000}>
            <Typography
              variant={isMobile ? 'h3' : 'h1'}
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 'bold',
                color: theme.palette.text.primary,
                textShadow: themeMode === 'dark' ? '0 2px 4px rgba(0,0,0,0.3)' : 'none',
                mb: 3
              }}
            >
              Grow Your SAT Score Like a{' '}
              <Box component="span" sx={{ color: theme.palette.primary.main }}>
                Bonsai Tree
              </Box>
            </Typography>
          </FadeIn>

          <FadeIn duration={1000} delay={200}>
            <Typography
              variant={isMobile ? 'h6' : 'h5'}
              sx={{
                color: theme.palette.text.secondary,
                maxWidth: '600px',
                mx: 'auto',
                mb: 4,
                lineHeight: 1.6
              }}
            >
              Nurture your knowledge with personalized SAT prep that adapts to your strengths and grows with your progress.
            </Typography>
          </FadeIn>

          <FadeIn duration={1000} delay={400}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <GradientButton
                variant="contained"
                gradient="primary"
                size="large"
                component={RouterLink}
                to="/login"
                sx={{ 
                  px: 4, 
                  py: 1.5,
                  fontSize: '1.1rem'
                }}
              >
                Start Your Journey
              </GradientButton>
              <GradientButton
                variant="outlined"
                gradient="secondary"
                size="large"
                sx={{ 
                  px: 4, 
                  py: 1.5,
                  fontSize: '1.1rem',
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main
                }}
              >
                Learn More
              </GradientButton>
            </Box>
          </FadeIn>
        </Box>

        {/* Features Section */}
        <Box sx={{ py: { xs: 6, md: 10 } }}>
          <FadeIn duration={800}>
            <Typography
              variant={isMobile ? 'h4' : 'h3'}
              component="h2"
              align="center"
              gutterBottom
              sx={{
                fontWeight: 'bold',
                color: theme.palette.text.primary,
                mb: 6
              }}
            >
              Why Choose Bonsai Prep?
            </Typography>
          </FadeIn>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} key={feature.title}>
                {feature.animation === "fade" ? (
                  <FadeIn duration={800} delay={index * 200}>
                    <GlassCard
                      sx={{
                        p: 4,
                        height: '100%',
                        textAlign: 'center',
                        border: `1px solid ${theme.palette.divider}`,
                        backgroundColor: themeMode === 'light' 
                          ? 'rgba(255, 255, 255, 0.8)' 
                          : 'rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <FloatAnimation>
                        <Box sx={{ mb: 3 }}>
                          {feature.icon}
                        </Box>
                      </FloatAnimation>
                      <Typography variant="h5" component="h3" gutterBottom sx={{ 
                        fontWeight: 'bold',
                        color: theme.palette.text.primary
                      }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        color: theme.palette.text.secondary,
                        lineHeight: 1.6
                      }}>
                        {feature.description}
                      </Typography>
                    </GlassCard>
                  </FadeIn>
                ) : (
                  <ScaleIn delay={index * 200}>
                    <GlassCard
                      sx={{
                        p: 4,
                        height: '100%',
                        textAlign: 'center',
                        border: `1px solid ${theme.palette.divider}`,
                        backgroundColor: themeMode === 'light' 
                          ? 'rgba(255, 255, 255, 0.8)' 
                          : 'rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <FloatAnimation>
                        <Box sx={{ mb: 3 }}>
                          {feature.icon}
                        </Box>
                      </FloatAnimation>
                      <Typography variant="h5" component="h3" gutterBottom sx={{ 
                        fontWeight: 'bold',
                        color: theme.palette.text.primary
                      }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        color: theme.palette.text.secondary,
                        lineHeight: 1.6
                      }}>
                        {feature.description}
                      </Typography>
                    </GlassCard>
                  </ScaleIn>
                )}
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Call to Action */}
        <Box sx={{ 
          py: { xs: 6, md: 10 },
          textAlign: 'center'
        }}>
          <SlideIn direction="bottom">
            <Typography
              variant={isMobile ? 'h4' : 'h3'}
              component="h2"
              gutterBottom
              sx={{
                fontWeight: 'bold',
                color: theme.palette.text.primary,
                mb: 3
              }}
            >
              Ready to Start Growing?
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.text.secondary,
                mb: 4,
                maxWidth: '500px',
                mx: 'auto'
              }}
            >
              Join thousands of students who are already improving their SAT scores with our personalized approach.
            </Typography>
            <GradientButton
              variant="contained"
              gradient="primary"
              size="large"
              component={RouterLink}
              to="/login"
              sx={{ 
                px: 6, 
                py: 2,
                fontSize: '1.2rem'
              }}
            >
              Get Started Today
            </GradientButton>
          </SlideIn>
        </Box>
      </Container>
    </Box>
  );
};

export default Home; 