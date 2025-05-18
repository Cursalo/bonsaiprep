import React from 'react';
import { Typography, Container, Box, Grid, AppBar, Toolbar, useTheme, useMediaQuery } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import EmojiNatureIcon from '@mui/icons-material/EmojiNature';
import SchoolIcon from '@mui/icons-material/School';
import InsightsIcon from '@mui/icons-material/Insights';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import bonsaiImage from '../../../bonsai1024.png'; // Added import for the new image

// Import our custom components
import GradientButton from '../components/GradientButton';
import GlassCard from '../components/GlassCard';
import { FadeIn, ScaleIn, FloatAnimation, SlideIn } from '../components/AnimationEffects';

const Home: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Features data
  const features = [
    {
      title: "Personalized Learning",
      description: "Our AI analyzes your practice test results to create personalized learning paths focused on your specific needs.",
      icon: <SchoolIcon sx={{ fontSize: 48, color: '#88d498' }} />,
      animation: "fade"
    },
    {
      title: "Visual Progress Tracking",
      description: "Watch your Bonsai tree grow as you master SAT skills, providing a satisfying visual representation of your progress.",
      icon: <LocalFloristIcon sx={{ fontSize: 48, color: '#88d498' }} />,
      animation: "scale"
    },
    {
      title: "Targeted Practice",
      description: "Focus on areas that need improvement with targeted practice problems and video lessons.",
      icon: <MenuBookIcon sx={{ fontSize: 48, color: '#88d498' }} />,
      animation: "fade"
    },
    {
      title: "Detailed Analytics",
      description: "Get comprehensive insights into your strengths and weaknesses with detailed analytics and progress reports.",
      icon: <InsightsIcon sx={{ fontSize: 48, color: '#88d498' }} />,
      animation: "scale"
    }
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Glowing orbs background effect */}
      <Box sx={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '40%',
        height: '40%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(26, 147, 111, 0.3) 0%, rgba(26, 147, 111, 0) 70%)',
        filter: 'blur(40px)',
        zIndex: 0
      }} />
      
      <Box sx={{
        position: 'absolute',
        bottom: '-5%',
        right: '-5%',
        width: '30%',
        height: '30%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(17, 75, 95, 0.3) 0%, rgba(17, 75, 95, 0) 70%)',
        filter: 'blur(40px)',
        zIndex: 0
      }} />

      {/* Header */}
      <AppBar 
        position="static" 
        elevation={0} 
        sx={{ 
          background: 'rgba(12, 59, 46, 0.8)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <img src="/bonsaiwhitenobg.png" alt="Bonsai Prep Logo" style={{ height: '40px', marginRight: '16px' }} />
          </Box>
          
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <RouterLink to="/login" style={{ textDecoration: 'none' }}>
              <GradientButton
                gradient="secondary"
                rounded={true}
                withShimmer={false}
                sx={{ mr: 2 }}
              >
                Login
              </GradientButton>
            </RouterLink>
            <RouterLink to="/login" style={{ textDecoration: 'none' }}>
              <GradientButton
                gradient="primary"
                rounded={true}
              >
                Sign Up
              </GradientButton>
            </RouterLink>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ mt: isMobile ? 6 : 10, position: 'relative', zIndex: 1 }}>
        <Grid container spacing={6} alignItems="center" justifyContent="center">
          <Grid item xs={12} md={6}>
            <FadeIn>
              <Typography 
                variant="h1" 
                component="h1" 
                sx={{ 
                  fontWeight: 800,
                  fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                  mb: 2,
                  textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
                }}
              >
                Grow Your SAT Skills With <span style={{ color: '#88d498' }}>Bonsai</span>
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  mb: 4,
                  fontWeight: 400,
                  lineHeight: 1.5
                }}
              >
                Master the SAT step by step. Watch your skills and scores grow like a carefully tended bonsai tree.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 4 }}>
                <RouterLink to="/login" style={{ textDecoration: 'none' }}>
                  <GradientButton
                    gradient="primary"
                    size="large"
                    sx={{ fontSize: '1.1rem', py: 1.5 }}
                  >
                    Get Started Free
                  </GradientButton>
                </RouterLink>
                <RouterLink to="/lessons" style={{ textDecoration: 'none' }}>
                  <GradientButton
                    gradient="secondary"
                    size="large"
                    sx={{ fontSize: '1.1rem', py: 1.5 }}
                  >
                    Explore Lessons
                  </GradientButton>
                </RouterLink>
              </Box>
            </FadeIn>
          </Grid>
          <Grid item xs={12} md={6}>
            <FloatAnimation>
              <Box
                component="img"
                src="/bonsai1024.png" // Use path from public folder
                alt="Bonsai Tree"
                sx={{
                  width: '100%',
                  maxWidth: '500px',
                  height: 'auto',
                  display: 'block',
                  margin: '0 auto',
                  filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3))',
                }}
              />
            </FloatAnimation>
          </Grid>
        </Grid>
      </Container>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mt: isMobile ? 8 : 12, mb: 8, position: 'relative', zIndex: 1 }}>
        <ScaleIn>
          <Typography 
            variant="h2" 
            component="h2" 
            align="center" 
            sx={{ 
              fontWeight: 700,
              mb: 2,
              letterSpacing: '-0.02em'
            }}
          >
            Why Choose Bonsai?
          </Typography>
          <Typography 
            variant="h6" 
            align="center" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              mb: 6,
              maxWidth: '800px',
              mx: 'auto'
            }}
          >
            Our innovative learning approach helps you master the SAT through personalized guidance and visual progress tracking.
          </Typography>
        </ScaleIn>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              {feature.animation === "fade" ? (
                <FadeIn delay={index * 100}>
                  <GlassCard
                    cardTitle={feature.title}
                    withGlow={true}
                    withHoverEffect={true}
                    sx={{ height: '100%' }}
                    icon={feature.icon}
                  >
                    <Typography variant="body1" sx={{ mt: 2, opacity: 0.9 }}>
                      {feature.description}
                    </Typography>
                  </GlassCard>
                </FadeIn>
              ) : (
                <ScaleIn delay={index * 100}>
                  <GlassCard
                    cardTitle={feature.title}
                    withGlow={true}
                    withHoverEffect={true}
                    sx={{ height: '100%' }}
                    icon={feature.icon}
                  >
                    <Typography variant="body1" sx={{ mt: 2, opacity: 0.9 }}>
                      {feature.description}
                    </Typography>
                  </GlassCard>
                </ScaleIn>
              )}
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Container maxWidth="md" sx={{ mb: 10, position: 'relative', zIndex: 1 }}>
        <SlideIn>
          <GlassCard
            withGlow={true}
            glowColor="rgba(17, 75, 95, 0.3)"
            borderColor="rgba(255, 255, 255, 0.15)"
          >
            <Box sx={{ py: 3, px: isMobile ? 2 : 4, textAlign: 'center' }}>
              <Typography variant="h3" component="h3" sx={{ fontWeight: 700, mb: 2 }}>
                Ready to grow your SAT skills?
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 4, maxWidth: '800px', mx: 'auto' }}>
                Join thousands of students who have improved their SAT scores with Bonsai's unique learning approach.
              </Typography>
              <RouterLink to="/login" style={{ textDecoration: 'none' }}>
                <GradientButton
                  gradient="primary"
                  size="large"
                  sx={{ fontSize: '1.1rem', py: 1.5, px: 4 }}
                >
                  Start Your Journey
                </GradientButton>
              </RouterLink>
            </Box>
          </GlassCard>
        </SlideIn>
      </Container>

      {/* Footer */}
      <Box 
        component="footer" 
        sx={{ 
          py: 4, 
          textAlign: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          background: 'rgba(12, 59, 46, 0.8)'
        }}
      >
        <Container>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            &copy; {new Date().getFullYear()} Bonsai. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Home; 