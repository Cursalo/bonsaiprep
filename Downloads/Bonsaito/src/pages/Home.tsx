import React from 'react';
import { Typography, Container, Box, Grid, AppBar, Toolbar, useTheme, useMediaQuery, Paper, Chip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import CheckIcon from '@mui/icons-material/Check';
import StarIcon from '@mui/icons-material/Star';
import SchoolIcon from '@mui/icons-material/School';
import InsightsIcon from '@mui/icons-material/Insights';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

// Import our custom components
import GradientButton from '../components/GradientButton';
import { FadeIn, ScaleIn, SlideIn } from '../components/AnimationEffects';
import ThemeToggle from '../components/ThemeToggle';
import { useThemeContext } from '../contexts/ThemeContext';

const Home: React.FC = () => {
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
    secondary: {
      color: themeMode === 'light' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)',
    },
    accent: {
      color: themeMode === 'light' ? '#1a936f' : '#88d498',
    },
  });

  const getBackgroundStyle = () => ({
    backgroundColor: themeMode === 'light' ? '#fafafa' : '#121212',
    minHeight: '100vh',
    transition: 'background-color 0.3s ease',
  });

  const getCardStyle = () => ({
    backgroundColor: themeMode === 'light' 
      ? 'rgba(255, 255, 255, 0.95)' 
      : 'rgba(30, 30, 30, 0.95)',
    border: `1px solid ${themeMode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}`,
    borderRadius: '24px',
    backdropFilter: 'blur(10px)',
    boxShadow: themeMode === 'light' 
      ? '0 8px 40px rgba(0, 0, 0, 0.08)' 
      : '0 8px 40px rgba(0, 0, 0, 0.4)',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: themeMode === 'light' 
        ? '0 12px 50px rgba(0, 0, 0, 0.12)' 
        : '0 12px 50px rgba(0, 0, 0, 0.6)',
    }
  });

  const features = [
    {
      icon: <SchoolIcon sx={{ fontSize: 32, color: getTextStyles(themeMode).accent.color }} />,
      title: "AI-Powered Learning",
      description: "Personalized study paths based on your strengths and weaknesses"
    },
    {
      icon: <LocalFloristIcon sx={{ fontSize: 32, color: getTextStyles(themeMode).accent.color }} />,
      title: "Visual Progress",
      description: "Watch your Bonsai tree grow as you master new skills"
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 32, color: getTextStyles(themeMode).accent.color }} />,
      title: "Score Growth",
      description: "Track your improvement with detailed analytics and insights"
    }
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      features: [
        "5 practice quizzes per month",
        "Basic progress tracking",
        "Bonsai tree visualization",
        "Community support"
      ],
      buttonText: "Start Free",
      popular: false
    },
    {
      name: "Pro",
      price: "$19",
      period: "per month",
      description: "Everything you need to excel",
      features: [
        "Unlimited practice quizzes",
        "Advanced AI-powered analysis",
        "Personalized study plans",
        "Video lessons library",
        "Priority support",
        "Score prediction",
        "Detailed progress reports"
      ],
      buttonText: "Start Pro Trial",
      popular: true
    }
  ];

  return (
    <Box sx={getBackgroundStyle()}>
      {/* Navigation */}
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{
          backgroundColor: themeMode === 'light' 
            ? 'rgba(255, 255, 255, 0.95)' 
            : 'rgba(18, 18, 18, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${themeMode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}`,
        }}
      >
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

      <Container maxWidth="xl">
        {/* Hero Section */}
        <Box sx={{ 
          pt: { xs: 16, md: 20 }, 
          pb: { xs: 8, md: 12 },
          textAlign: 'center'
        }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <FadeIn duration={1000}>
                <Typography
                  variant={isMobile ? 'h3' : 'h1'}
                  component="h1"
                  sx={{
                    ...getTextStyles(themeMode).heading,
                    fontWeight: 'bold',
                    mb: 3,
                    lineHeight: 1.1
                  }}
                >
                  Grow Your SAT Score
                  <br />
                  <Box component="span" sx={{ 
                    background: `linear-gradient(135deg, ${getTextStyles(themeMode).accent.color}, #4caf50)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    Like a Bonsai
                  </Box>
                </Typography>
              </FadeIn>

              <FadeIn duration={1000} delay={200}>
                <Typography
                  variant={isMobile ? 'h6' : 'h5'}
                  sx={{
                    ...getTextStyles(themeMode).body,
                    mb: 4,
                    lineHeight: 1.6,
                    fontWeight: 300
                  }}
                >
                  Personalized SAT prep that adapts to your learning style.
                  <br />
                  Watch your progress bloom with every correct answer.
                </Typography>
              </FadeIn>

              <FadeIn duration={1000} delay={400}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mb: 4 }}>
                  <GradientButton
                    variant="contained"
                    gradient="primary"
                    size="large"
                    component={RouterLink}
                    to="/login"
                    sx={{ 
                      px: 4, 
                      py: 1.5,
                      fontSize: '1.1rem',
                      borderRadius: '12px'
                    }}
                  >
                    Start Growing Today
                  </GradientButton>
                </Box>
              </FadeIn>

              <FadeIn duration={1000} delay={600}>
                <Box sx={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {features.map((feature, index) => (
                    <Box key={index} sx={{ textAlign: 'center', maxWidth: '140px' }}>
                      <Box sx={{ mb: 1 }}>
                        {feature.icon}
                      </Box>
                      <Typography variant="caption" sx={{ 
                        ...getTextStyles(themeMode).secondary,
                        fontWeight: 'bold',
                        display: 'block',
                        mb: 0.5
                      }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="caption" sx={getTextStyles(themeMode).secondary}>
                        {feature.description}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </FadeIn>
            </Grid>

            <Grid item xs={12} md={6}>
              <ScaleIn delay={800}>
                <Box sx={{ 
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <img 
                    src="/bonsai1024.png"
                    alt="Beautiful Bonsai Tree representing growth and learning"
                    style={{
                      width: '100%',
                      maxWidth: '500px',
                      height: 'auto',
                      filter: themeMode === 'dark' ? 'brightness(0.9) contrast(1.1)' : 'none',
                      borderRadius: '20px'
                    }}
                  />
                </Box>
              </ScaleIn>
            </Grid>
          </Grid>
        </Box>

        {/* Pricing Section */}
        <Box sx={{ py: { xs: 8, md: 12 } }}>
          <FadeIn duration={800}>
            <Typography
              variant={isMobile ? 'h4' : 'h3'}
              component="h2"
              align="center"
              sx={{
                ...getTextStyles(themeMode).heading,
                fontWeight: 'bold',
                mb: 2
              }}
            >
              Choose Your Growth Plan
            </Typography>
            <Typography
              variant="h6"
              align="center"
              sx={{
                ...getTextStyles(themeMode).body,
                mb: 6,
                fontWeight: 300
              }}
            >
              Start free, upgrade when you're ready to accelerate
            </Typography>
          </FadeIn>

          <Grid container spacing={4} justifyContent="center">
            {pricingPlans.map((plan, index) => (
              <Grid item xs={12} md={5} key={plan.name}>
                <SlideIn direction="bottom" delay={index * 200}>
                  <Paper sx={{ 
                    ...getCardStyle(), 
                    p: 4, 
                    height: '100%', 
                    position: 'relative',
                    ...(plan.popular && {
                      border: `2px solid ${getTextStyles(themeMode).accent.color}`,
                      transform: 'scale(1.05)',
                    })
                  }}>
                    {plan.popular && (
                      <Chip
                        icon={<StarIcon />}
                        label="Most Popular"
                        sx={{
                          position: 'absolute',
                          top: -12,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          bgcolor: getTextStyles(themeMode).accent.color,
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    )}

                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <Typography variant="h5" sx={{ 
                        ...getTextStyles(themeMode).heading,
                        fontWeight: 'bold',
                        mb: 1
                      }}>
                        {plan.name}
                      </Typography>
                      <Typography variant="body2" sx={getTextStyles(themeMode).secondary}>
                        {plan.description}
                      </Typography>
                    </Box>

                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                      <Typography variant="h2" sx={{ 
                        ...getTextStyles(themeMode).heading,
                        fontWeight: 'bold',
                        display: 'inline'
                      }}>
                        {plan.price}
                      </Typography>
                      <Typography variant="h6" sx={{ 
                        ...getTextStyles(themeMode).secondary,
                        display: 'inline',
                        ml: 1
                      }}>
                        {plan.period}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 4 }}>
                      {plan.features.map((feature, featureIndex) => (
                        <Box key={featureIndex} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <CheckIcon sx={{ 
                            color: getTextStyles(themeMode).accent.color, 
                            mr: 2,
                            fontSize: 20
                          }} />
                          <Typography variant="body2" sx={getTextStyles(themeMode).body}>
                            {feature}
                          </Typography>
                        </Box>
                      ))}
                    </Box>

                    <GradientButton
                      variant={plan.popular ? "contained" : "outlined"}
                      gradient={plan.popular ? "primary" : "secondary"}
                      fullWidth
                      size="large"
                      component={RouterLink}
                      to="/login"
                      sx={{ 
                        borderRadius: '12px',
                        py: 1.5,
                        ...(plan.popular && {
                          boxShadow: `0 4px 20px ${getTextStyles(themeMode).accent.color}40`
                        })
                      }}
                    >
                      {plan.buttonText}
                    </GradientButton>
                  </Paper>
                </SlideIn>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Final CTA */}
        <Box sx={{ 
          py: { xs: 8, md: 12 },
          textAlign: 'center'
        }}>
          <SlideIn direction="bottom">
            <Box sx={{ 
              ...getCardStyle(),
              p: 6,
              maxWidth: '600px',
              mx: 'auto'
            }}>
              <AutoAwesomeIcon sx={{ 
                fontSize: 48, 
                color: getTextStyles(themeMode).accent.color,
                mb: 2
              }} />
              <Typography
                variant={isMobile ? 'h5' : 'h4'}
                component="h2"
                sx={{
                  ...getTextStyles(themeMode).heading,
                  fontWeight: 'bold',
                  mb: 2
                }}
              >
                Ready to Bloom?
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  ...getTextStyles(themeMode).body,
                  mb: 4,
                  lineHeight: 1.6
                }}
              >
                Join thousands of students already growing their SAT scores with our personalized approach. 
                Your journey to success starts with a single step.
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
                  fontSize: '1.1rem',
                  borderRadius: '12px'
                }}
              >
                Plant Your Success Today
              </GradientButton>
            </Box>
          </SlideIn>
        </Box>
      </Container>
    </Box>
  );
};

export default Home; 