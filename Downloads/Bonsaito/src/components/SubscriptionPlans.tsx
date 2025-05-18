import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardActions, 
  CardContent, 
  CardHeader, 
  Chip, 
  Container, 
  Divider, 
  Grid, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Paper, 
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';
import { animated, useSpring } from 'react-spring';

interface SubscriptionPlansProps {
  onSelectPlan: (planType: 'free' | 'pro') => void;
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ onSelectPlan }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [hoveredPlan, setHoveredPlan] = useState<'free' | 'pro' | null>(null);

  const freeFeatures = [
    'Basic SAT practice questions',
    'Limited question bank access',
    'Standard progress tracking',
    'Basic study recommendations',
    'Email support'
  ];

  const proFeatures = [
    'Custom SAT practice questions',
    'Full question bank access',
    'Advanced analytics & progress tracking',
    'Personalized study plan',
    'AI-powered learning insights',
    'Priority support',
    'Progress reports & insights'
  ];

  const freeAnimProps = useSpring({
    transform: hoveredPlan === 'free' ? 'scale(1.03)' : 'scale(1)',
    boxShadow: hoveredPlan === 'free' 
      ? '0 16px 70px -12px rgba(0,0,0,0.3)' 
      : '0 8px 40px -12px rgba(0,0,0,0.2)',
    config: { tension: 300, friction: 20 }
  });

  const proAnimProps = useSpring({
    transform: hoveredPlan === 'pro' ? 'scale(1.05)' : 'scale(1.02)',
    boxShadow: hoveredPlan === 'pro' 
      ? '0 20px 80px -12px rgba(0,0,0,0.4)' 
      : '0 12px 60px -12px rgba(0,0,0,0.3)',
    config: { tension: 300, friction: 20 }
  });

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          Choose Your Plan
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mb: 2 }}>
          Get started with Bonsaito and boost your SAT scores
        </Typography>
        <Chip 
          label="Free Beta Access" 
          color="primary" 
          icon={<StarIcon />} 
          sx={{ 
            px: 2, 
            py: 3, 
            fontSize: '1rem',
            fontWeight: 'bold',
            borderRadius: '16px', 
            background: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)',
            '& .MuiChip-icon': { color: 'white' }
          }} 
        />
      </Box>

      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={12} md={5}>
          <animated.div
            style={freeAnimProps}
            onMouseEnter={() => setHoveredPlan('free')}
            onMouseLeave={() => setHoveredPlan(null)}
          >
            <Card 
              elevation={0}
              sx={{ 
                height: '100%',
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden',
                transition: 'all 0.3s ease-in-out',
              }}
            >
              <CardHeader
                title={
                  <Typography variant="h4" component="h2" fontWeight="bold">
                    Free
                  </Typography>
                }
                subheader="Get started with the basics"
                sx={{ 
                  bgcolor: 'background.default', 
                  pb: 4,
                  textAlign: 'center'
                }}
              />
              <CardContent sx={{ pt: 4 }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h3" component="p" fontWeight="bold">
                    $0
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    forever free
                  </Typography>
                </Box>
                <Divider sx={{ my: 3 }} />
                <List>
                  {freeFeatures.map((feature, index) => (
                    <ListItem key={index} disableGutters>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <CheckIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={feature} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
              <CardActions sx={{ p: 3, pt: 0, justifyContent: 'center' }}>
                <Button 
                  variant="outlined" 
                  size="large" 
                  fullWidth
                  onClick={() => onSelectPlan('free')}
                  sx={{ 
                    py: 1.5, 
                    borderRadius: 2,
                    fontSize: '1rem'
                  }}
                >
                  Get Started
                </Button>
              </CardActions>
            </Card>
          </animated.div>
        </Grid>

        <Grid item xs={12} md={5}>
          <animated.div
            style={proAnimProps}
            onMouseEnter={() => setHoveredPlan('pro')}
            onMouseLeave={() => setHoveredPlan(null)}
          >
            <Card 
              elevation={0}
              sx={{ 
                height: '100%',
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                transition: 'all 0.3s ease-in-out',
              }}
            >
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 20, 
                  right: 20,
                  zIndex: 1
                }}
              >
                <Chip 
                  label="RECOMMENDED" 
                  sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 'bold'
                  }} 
                />
              </Box>
              <CardHeader
                title={
                  <Typography variant="h4" component="h2" fontWeight="bold" color="white">
                    Pro
                  </Typography>
                }
                subheader={
                  <Typography color="rgba(255,255,255,0.8)">
                    Advanced personalization
                  </Typography>
                }
                sx={{ 
                  bgcolor: 'rgba(0,0,0,0.1)', 
                  pb: 4,
                  textAlign: 'center'
                }}
              />
              <CardContent sx={{ pt: 4 }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography 
                      variant="h6" 
                      component="span" 
                      sx={{ 
                        textDecoration: 'line-through', 
                        color: 'rgba(255,255,255,0.6)',
                        mr: 1
                      }}
                    >
                      $50
                    </Typography>
                    <Typography variant="h3" component="p" fontWeight="bold" color="white">
                      $0
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    free during beta
                  </Typography>
                </Box>
                <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.2)' }} />
                <List>
                  {proFeatures.map((feature, index) => (
                    <ListItem key={index} disableGutters>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <CheckIcon sx={{ color: 'white' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={feature} 
                        primaryTypographyProps={{ 
                          sx: { color: 'white' } 
                        }} 
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
              <CardActions sx={{ p: 3, pt: 0, justifyContent: 'center' }}>
                <Button 
                  variant="contained" 
                  size="large"
                  fullWidth
                  onClick={() => onSelectPlan('pro')}
                  sx={{ 
                    py: 1.5, 
                    borderRadius: 2,
                    fontSize: '1rem',
                    bgcolor: 'white',
                    color: '#764ba2',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.9)',
                    }
                  }}
                >
                  Select Pro Plan
                </Button>
              </CardActions>
            </Card>
          </animated.div>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SubscriptionPlans; 