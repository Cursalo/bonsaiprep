import React, { ElementType, forwardRef } from 'react';
import { Button, ButtonProps } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useSpring, animated } from 'react-spring';

// Define gradient types
type GradientType = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'info' 
  | 'warning' 
  | 'danger'
  | 'phthalo';

// Define gradient styles
const gradients = {
  primary: 'linear-gradient(45deg, #1a936f, #114b5f)',
  secondary: 'linear-gradient(45deg, #f3e9d2, #e3d9c2)',
  success: 'linear-gradient(45deg, #88d498, #1a936f)',
  info: 'linear-gradient(45deg, #3d5a80, #98c1d9)',
  warning: 'linear-gradient(45deg, #ffcb77, #f3e9d2)',
  danger: 'linear-gradient(45deg, #e76f51, #f4a261)',
  phthalo: 'linear-gradient(45deg, #0c3b2e, #18514a)',
};

// Hover gradients (inverted)
const hoverGradients = {
  primary: 'linear-gradient(45deg, #114b5f, #1a936f)',
  secondary: 'linear-gradient(45deg, #e3d9c2, #f3e9d2)',
  success: 'linear-gradient(45deg, #1a936f, #88d498)',
  info: 'linear-gradient(45deg, #98c1d9, #3d5a80)',
  warning: 'linear-gradient(45deg, #f3e9d2, #ffcb77)',
  danger: 'linear-gradient(45deg, #f4a261, #e76f51)',
  phthalo: 'linear-gradient(45deg, #18514a, #0c3b2e)',
};

// Text colors for each gradient
const textColors = {
  primary: '#ffffff',
  secondary: '#114b5f',
  success: '#ffffff',
  info: '#ffffff',
  warning: '#114b5f',
  danger: '#ffffff',
  phthalo: '#ffffff',
};

// Styled component for the Button
const StyledButton = styled(Button)({
  borderRadius: 8,
  textTransform: 'none',
  fontWeight: 600,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  fontSize: '1rem',
  padding: '10px 20px',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
});

// Animated div for the shimmer effect
const AnimatedDiv = animated(styled('div')({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
  transform: 'translateX(-100%)',
  zIndex: 0,
}));

export interface GradientButtonProps extends ButtonProps {
  gradient?: GradientType;
  withShimmer?: boolean;
  withRipple?: boolean;
  rounded?: boolean;
  elevated?: boolean;
  component?: React.ElementType;
}

const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>((props, ref) => {
  const {
    gradient = 'primary',
    withShimmer = true,
    withRipple = true,
    rounded = false,
    elevated = true,
    children,
    sx,
    component,
    ...rest
  } = props;

  // Animation for shimmer effect
  const shimmerProps = useSpring({
    to: async (next) => {
      if (withShimmer) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await next({ transform: 'translateX(100%)', config: { duration: 1000 } });
        await next({ transform: 'translateX(-100%)', config: { duration: 0 } });
      }
    },
    from: { transform: 'translateX(-100%)' },
    loop: withShimmer,
    reset: true,
  });

  // Hover animation
  const [hoverProps, setHover] = useSpring(() => ({
    transform: 'scale(1) translateY(0px)',
    background: gradients[gradient],
    boxShadow: elevated ? '0 4px 12px rgba(0, 0, 0, 0.2)' : 'none',
    config: { mass: 1, tension: 280, friction: 20 },
  }));

  const handleMouseEnter = () => {
    setHover({
      transform: 'scale(1.05) translateY(-3px)',
      background: hoverGradients[gradient],
      boxShadow: elevated ? '0 8px 16px rgba(0, 0, 0, 0.3)' : 'none',
    });
  };

  const handleMouseLeave = () => {
    setHover({
      transform: 'scale(1) translateY(0px)',
      background: gradients[gradient],
      boxShadow: elevated ? '0 4px 12px rgba(0, 0, 0, 0.2)' : 'none',
    });
  };

  return (
    <StyledButton
      ref={ref}
      disableRipple={!withRipple}
      {...(component && { component })}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        ...sx,
        borderRadius: rounded ? '50px' : 8,
        color: textColors[gradient],
        position: 'relative',
      }}
      {...rest}
    >
      <animated.div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: hoverProps.background,
        transform: hoverProps.transform,
        boxShadow: hoverProps.boxShadow,
        borderRadius: 'inherit',
        zIndex: 0,
      }} />
      <span style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </span>
      {withShimmer && <AnimatedDiv style={shimmerProps} />}
    </StyledButton>
  );
});

GradientButton.displayName = 'GradientButton';

export default GradientButton; 