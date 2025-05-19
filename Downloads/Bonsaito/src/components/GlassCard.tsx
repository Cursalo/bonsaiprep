import React, { ReactNode } from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useSpring, animated } from 'react-spring';
import { HoverEffect } from '../components/AnimationEffects';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 8,
  padding: theme.spacing(2),
  overflow: 'hidden',
  position: 'relative',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
}));

const AnimatedCard = animated(StyledCard);

const CardHeader = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const GlowEffect = styled(Box)(({ theme }) => ({
  position: 'absolute',
  width: '150px',
  height: '150px',
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(26, 147, 111, 0.4) 0%, rgba(26, 147, 111, 0) 70%)',
  filter: 'blur(20px)',
  opacity: 0.5,
}));

export interface GlassCardProps {
  cardTitle?: string | ReactNode;
  subtitle?: string;
  icon?: ReactNode;
  withHoverEffect?: boolean;
  withGlow?: boolean;
  glowColor?: string;
  borderColor?: string;
  children?: ReactNode;
  sx?: any;
  className?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({
  cardTitle,
  subtitle,
  icon,
  withHoverEffect = true,
  withGlow = true,
  glowColor = 'rgba(26, 147, 111, 0.4)',
  borderColor = 'rgba(255, 255, 255, 0.08)',
  children,
  sx,
  className,
  ...props
}) => {
  // Generate a glow effect position
  const glowPosition = {
    top: Math.random() * 100 - 50,
    right: Math.random() * 100 - 50,
  };

  const CardContentWrapper = (
    <AnimatedCard
      className={className}
      sx={sx}
    >
      {withGlow && (
        <GlowEffect
          sx={{
            background: `radial-gradient(circle, ${glowColor} 0%, ${glowColor.replace('0.4', '0')} 70%)`,
            top: glowPosition.top,
            right: glowPosition.right,
          }}
        />
      )}
      
      {(cardTitle || icon) && (
        <CardHeader>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {icon && <Box sx={{ mr: 2 }}>{icon}</Box>}
            <Box>
              {typeof cardTitle === 'string' ? (
                <Typography variant="h6" fontWeight={600} sx={{ letterSpacing: '-0.01em' }}>
                  {cardTitle}
                </Typography>
              ) : (
                cardTitle
              )}
              {subtitle && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>
        </CardHeader>
      )}
      
      <CardContent sx={{ p: 0 }}>
        {children}
      </CardContent>
    </AnimatedCard>
  );

  return withHoverEffect ? <HoverEffect>{CardContentWrapper}</HoverEffect> : CardContentWrapper;
};

export default GlassCard; 