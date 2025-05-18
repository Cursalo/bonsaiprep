import React, { ReactNode } from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useSpring, animated } from 'react-spring';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 8,
  padding: theme.spacing(2),
  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  overflow: 'hidden',
  position: 'relative',
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
  // Animation properties for hover effect
  const [animProps, set] = useSpring(() => ({
    transform: 'translateY(0) scale(1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    borderColor: borderColor,
    config: { mass: 1, tension: 280, friction: 60 },
  }));

  // Generate a glow effect position
  const glowPosition = {
    top: Math.random() * 100 - 50,
    right: Math.random() * 100 - 50,
  };

  const handleMouseEnter = () => {
    if (withHoverEffect) {
      set({
        transform: 'translateY(-8px) scale(1.02)',
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.3)',
        borderColor: 'rgba(255, 255, 255, 0.15)',
      });
    }
  };

  const handleMouseLeave = () => {
    if (withHoverEffect) {
      set({
        transform: 'translateY(0) scale(1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        borderColor: borderColor,
      });
    }
  };

  return (
    <AnimatedCard
      className={className}
      sx={sx}
      style={{
        transform: withHoverEffect ? animProps.transform : 'translateY(0) scale(1)',
        boxShadow: withHoverEffect ? animProps.boxShadow : '0 8px 32px rgba(0, 0, 0, 0.2)',
        borderColor: withHoverEffect ? animProps.borderColor : borderColor,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
};

export default GlassCard; 