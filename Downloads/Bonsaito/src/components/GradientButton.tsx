import React, { forwardRef } from 'react';
import { Button, ButtonProps } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useThemeContext } from '../contexts/ThemeContext';

// Define button variant types for minimal design
type MinimalVariant = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'info' 
  | 'warning' 
  | 'danger';

// Styled component for the Button with minimal design
const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 8,
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '1rem',
  padding: '10px 20px',
  position: 'relative',
  transition: 'all 0.2s ease-in-out',
  boxShadow: 'none',
  '&:hover': {
    boxShadow: 'none',
    transform: 'translateY(-1px)',
  },
  '&:active': {
    transform: 'translateY(0px)',
  },
}));

export interface GradientButtonProps extends ButtonProps {
  gradient?: MinimalVariant;
  withShimmer?: boolean;
  withRipple?: boolean;
  rounded?: boolean;
  elevated?: boolean;
  to?: string; // For router links
}

const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>((props, ref) => {
  const {
    gradient = 'primary',
    withShimmer = false,
    withRipple = true,
    rounded = false,
    elevated = false,
    children,
    variant = 'contained',
    sx,
    ...rest
  } = props;

  const { themeMode } = useThemeContext();

  // Get colors based on the variant and theme mode
  const getButtonColors = (): {
    background: string;
    color: string;
    hoverBackground: string;
    border?: string;
  } => {
    const isLight = themeMode === 'light';
    
    const colors = {
      primary: {
        contained: {
          background: isLight ? '#1a936f' : '#88d498',
          color: isLight ? '#ffffff' : '#000000',
          hoverBackground: isLight ? '#114b5f' : '#a6e3b0',
        },
        outlined: {
          background: 'transparent',
          color: isLight ? '#1a936f' : '#88d498',
          border: isLight ? '#1a936f' : '#88d498',
          hoverBackground: isLight ? 'rgba(26, 147, 111, 0.08)' : 'rgba(136, 212, 152, 0.08)',
        },
        text: {
          background: 'transparent',
          color: isLight ? '#1a936f' : '#88d498',
          hoverBackground: isLight ? 'rgba(26, 147, 111, 0.08)' : 'rgba(136, 212, 152, 0.08)',
        }
      },
      secondary: {
        contained: {
          background: isLight ? '#6c757d' : '#adb5bd',
          color: '#ffffff',
          hoverBackground: isLight ? '#5a6268' : '#95a0a8',
        },
        outlined: {
          background: 'transparent',
          color: isLight ? '#6c757d' : '#adb5bd',
          border: isLight ? '#6c757d' : '#adb5bd',
          hoverBackground: isLight ? 'rgba(108, 117, 125, 0.08)' : 'rgba(173, 181, 189, 0.08)',
        },
        text: {
          background: 'transparent',
          color: isLight ? '#6c757d' : '#adb5bd',
          hoverBackground: isLight ? 'rgba(108, 117, 125, 0.08)' : 'rgba(173, 181, 189, 0.08)',
        }
      },
      success: {
        contained: {
          background: isLight ? '#28a745' : '#6bbb7b',
          color: '#ffffff',
          hoverBackground: isLight ? '#218838' : '#5aa069',
        },
        outlined: {
          background: 'transparent',
          color: isLight ? '#28a745' : '#6bbb7b',
          border: isLight ? '#28a745' : '#6bbb7b',
          hoverBackground: isLight ? 'rgba(40, 167, 69, 0.08)' : 'rgba(107, 187, 123, 0.08)',
        },
        text: {
          background: 'transparent',
          color: isLight ? '#28a745' : '#6bbb7b',
          hoverBackground: isLight ? 'rgba(40, 167, 69, 0.08)' : 'rgba(107, 187, 123, 0.08)',
        }
      },
      info: {
        contained: {
          background: isLight ? '#17a2b8' : '#98c1d9',
          color: '#ffffff',
          hoverBackground: isLight ? '#138496' : '#7fb3d4',
        },
        outlined: {
          background: 'transparent',
          color: isLight ? '#17a2b8' : '#98c1d9',
          border: isLight ? '#17a2b8' : '#98c1d9',
          hoverBackground: isLight ? 'rgba(23, 162, 184, 0.08)' : 'rgba(152, 193, 217, 0.08)',
        },
        text: {
          background: 'transparent',
          color: isLight ? '#17a2b8' : '#98c1d9',
          hoverBackground: isLight ? 'rgba(23, 162, 184, 0.08)' : 'rgba(152, 193, 217, 0.08)',
        }
      },
      warning: {
        contained: {
          background: isLight ? '#ffc107' : '#ffcb77',
          color: isLight ? '#000000' : '#000000',
          hoverBackground: isLight ? '#e0a800' : '#ffb84d',
        },
        outlined: {
          background: 'transparent',
          color: isLight ? '#ffc107' : '#ffcb77',
          border: isLight ? '#ffc107' : '#ffcb77',
          hoverBackground: isLight ? 'rgba(255, 193, 7, 0.08)' : 'rgba(255, 203, 119, 0.08)',
        },
        text: {
          background: 'transparent',
          color: isLight ? '#ffc107' : '#ffcb77',
          hoverBackground: isLight ? 'rgba(255, 193, 7, 0.08)' : 'rgba(255, 203, 119, 0.08)',
        }
      },
      danger: {
        contained: {
          background: isLight ? '#dc3545' : '#e76f51',
          color: '#ffffff',
          hoverBackground: isLight ? '#c82333' : '#d4593e',
        },
        outlined: {
          background: 'transparent',
          color: isLight ? '#dc3545' : '#e76f51',
          border: isLight ? '#dc3545' : '#e76f51',
          hoverBackground: isLight ? 'rgba(220, 53, 69, 0.08)' : 'rgba(231, 111, 81, 0.08)',
        },
        text: {
          background: 'transparent',
          color: isLight ? '#dc3545' : '#e76f51',
          hoverBackground: isLight ? 'rgba(220, 53, 69, 0.08)' : 'rgba(231, 111, 81, 0.08)',
        }
      }
    };

    return colors[gradient][variant as keyof typeof colors[typeof gradient]];
  };

  const buttonColors = getButtonColors();

  return (
    <StyledButton
      ref={ref}
      variant={variant}
      disableRipple={!withRipple}
      sx={{
        ...sx,
        borderRadius: rounded ? '50px' : 8,
        backgroundColor: buttonColors.background,
        color: buttonColors.color,
        borderColor: variant === 'outlined' ? buttonColors.border : undefined,
        '&:hover': {
          backgroundColor: buttonColors.hoverBackground,
          borderColor: variant === 'outlined' ? buttonColors.border : undefined,
          transform: 'translateY(-1px)',
          boxShadow: elevated && variant === 'contained' 
            ? (themeMode === 'light' 
                ? '0 4px 12px rgba(0, 0, 0, 0.1)' 
                : '0 4px 12px rgba(0, 0, 0, 0.3)') 
            : 'none',
        },
        '&:active': {
          transform: 'translateY(0px)',
          boxShadow: 'none',
        },
      }}
      {...rest}
    >
      {children}
    </StyledButton>
  );
});

GradientButton.displayName = 'GradientButton';

export default GradientButton; 