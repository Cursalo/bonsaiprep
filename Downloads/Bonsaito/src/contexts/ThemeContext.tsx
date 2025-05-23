import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createTheme, Theme, ThemeProvider } from '@mui/material/styles';

// Theme mode type
type ThemeMode = 'light' | 'dark';

// Tree background options
export type TreeBackgroundOption = 'altar' | 'plain' | 'nature' | 'minimal';

// Theme context interface
interface ThemeContextType {
  themeMode: ThemeMode;
  toggleTheme: () => void;
  treeBackground: TreeBackgroundOption;
  setTreeBackground: (background: TreeBackgroundOption) => void;
  theme: Theme;
}

// Create the context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Custom hook to use theme context
export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeContextProvider');
  }
  return context;
};

// Base color palette
const colors = {
  primary: {
    main: '#1a936f',
    light: '#88d498',
    dark: '#114b5f',
  },
  secondary: {
    main: '#f3e9d2',
    light: '#f8f1e0',
    dark: '#e3d9c2',
  },
  success: {
    main: '#88d498',
    light: '#a6e3b0',
    dark: '#6bbb7b',
  },
  info: {
    main: '#3d5a80',
    light: '#98c1d9',
    dark: '#2c4260',
  }
};

// Create dark theme
const createDarkTheme = () => createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: colors.primary.light,
      light: '#a6e3b0',
      dark: colors.primary.dark,
      contrastText: '#ffffff',
    },
    secondary: {
      main: colors.secondary.main,
      light: colors.secondary.light,
      dark: colors.secondary.dark,
      contrastText: '#114b5f',
    },
    background: {
      default: '#121212',
      paper: 'rgba(33, 33, 33, 0.95)',
    },
    text: {
      primary: 'rgba(255, 255, 255, 0.87)',
      secondary: 'rgba(255, 255, 255, 0.6)',
    },
    success: {
      main: colors.success.main,
      contrastText: '#ffffff',
    },
    info: {
      main: colors.info.light,
      contrastText: '#ffffff',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
  },
  typography: {
    fontFamily: '"DM Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.025em' },
    h2: { fontWeight: 700, letterSpacing: '-0.025em' },
    h3: { fontWeight: 700, letterSpacing: '-0.025em' },
    h4: { fontWeight: 600, letterSpacing: '-0.01em' },
    h5: { fontWeight: 500 },
    h6: { fontWeight: 500 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(24, 24, 24, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'all 0.3s ease',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(30, 30, 30, 0.6)',
          backdropFilter: 'blur(10px)',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(12, 59, 46, 0.8)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          transition: 'all 0.3s ease',
        },
        contained: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.3)',
          },
        },
      },
    },
  },
});

// Create light theme
const createLightTheme = () => createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colors.primary.main,
      light: colors.primary.light,
      dark: colors.primary.dark,
      contrastText: '#ffffff',
    },
    secondary: {
      main: colors.secondary.dark,
      light: colors.secondary.main,
      dark: '#d4c1a2',
      contrastText: '#114b5f',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
    },
    success: {
      main: colors.success.dark,
      contrastText: '#ffffff',
    },
    info: {
      main: colors.info.main,
      contrastText: '#ffffff',
    },
    divider: 'rgba(0, 0, 0, 0.12)',
  },
  typography: {
    fontFamily: '"DM Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.025em' },
    h2: { fontWeight: 700, letterSpacing: '-0.025em' },
    h3: { fontWeight: 700, letterSpacing: '-0.025em' },
    h4: { fontWeight: 600, letterSpacing: '-0.01em' },
    h5: { fontWeight: 500 },
    h6: { fontWeight: 500 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#ffffff',
          borderRadius: 12,
          border: '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(45deg, #1a936f, #114b5f)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          transition: 'all 0.3s ease',
        },
        contained: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          },
        },
      },
    },
  },
});

// Tree background configurations
export const treeBackgroundConfigs = {
  altar: {
    name: 'Sacred Altar',
    backgroundImage: '/altar4.png',
    backgroundColor: 'transparent',
  },
  plain: {
    name: 'Clean White',
    backgroundImage: 'none',
    backgroundColor: '#ffffff',
  },
  nature: {
    name: 'Natural Garden',
    backgroundImage: '/altar2.png',
    backgroundColor: 'transparent',
  },
  minimal: {
    name: 'Minimal Dark',
    backgroundImage: 'none',
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
  },
};

// Theme provider component
interface ThemeContextProviderProps {
  children: ReactNode;
}

export const ThemeContextProvider: React.FC<ThemeContextProviderProps> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [treeBackground, setTreeBackground] = useState<TreeBackgroundOption>('plain');

  // Load preferences from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('themeMode') as ThemeMode;
    const savedTreeBackground = localStorage.getItem('treeBackground') as TreeBackgroundOption;
    
    if (savedTheme) {
      setThemeMode(savedTheme);
    }
    if (savedTreeBackground) {
      setTreeBackground(savedTreeBackground);
    }
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem('treeBackground', treeBackground);
  }, [treeBackground]);

  const toggleTheme = () => {
    setThemeMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Create theme based on current mode
  const theme = themeMode === 'light' ? createLightTheme() : createDarkTheme();

  const value = {
    themeMode,
    toggleTheme,
    treeBackground,
    setTreeBackground,
    theme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}; 