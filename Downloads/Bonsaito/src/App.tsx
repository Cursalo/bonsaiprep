import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { colors } from '@mui/material';
import './App.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import pages
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UploadReport from './pages/UploadReport';
import Lessons from './pages/Lessons';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

// Import components
import ProtectedRoute from './components/ProtectedRoute';
import OnboardingFlow from './components/OnboardingFlow';

// Import providers
import { SkillsProvider } from './components/SkillsProvider';
import { supabase } from './supabaseClient';

// Create a responsive theme with DM Sans font and modern styling
const theme = responsiveFontSizes(createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1a936f', // Phthalo green for primary actions
      light: '#88d498',
      dark: '#114b5f',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f3e9d2', // Cream for secondary actions
      light: '#f8f1e0',
      dark: '#e3d9c2',
      contrastText: '#114b5f',
    },
    info: {
      main: '#3d5a80', // Blue for informational elements
      contrastText: '#ffffff',
    },
    success: {
      main: '#88d498', // Light green for success states
      contrastText: '#114b5f',
    },
    background: {
      default: '#0c3b2e', // Phthalo green background
      paper: 'rgba(255, 255, 255, 0.1)', // Transparent for glass effect
    },
    text: {
      primary: '#f8f9fa',
      secondary: '#dae1e7',
    },
  },
  typography: {
    fontFamily: [
      'DM Sans',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 700,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8, // 8px rounded corners as requested
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        .shimmer-effect {
          background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.1), rgba(255,255,255,0));
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        
        .fade-in {
          animation: fadeIn 0.6s ease forwards;
        }
      `,
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        },
        elevation1: {
          boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.1)',
        },
        elevation3: {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          overflow: 'hidden',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: '0 16px 48px 0 rgba(0, 0, 0, 0.3)',
            background: 'rgba(255, 255, 255, 0.15)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          fontSize: '1rem',
          padding: '10px 20px',
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
            transform: 'translateX(-100%)',
            transition: 'transform 0.6s ease',
          },
          '&:hover::after': {
            transform: 'translateX(100%)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(45deg, #1a936f, #114b5f)',
          '&:hover': {
            background: 'linear-gradient(45deg, #114b5f, #1a936f)',
            transform: 'translateY(-3px)',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(45deg, #f3e9d2, #e3d9c2)',
          color: '#114b5f',
          '&:hover': {
            background: 'linear-gradient(45deg, #e3d9c2, #f3e9d2)',
            transform: 'translateY(-3px)',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
          },
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
            transform: 'translateY(-3px)',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(12, 59, 46, 0.8)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.2)',
          color: '#f8f9fa',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'all 0.3s ease',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
              borderWidth: '1px',
              transition: 'all 0.3s ease',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.4)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#1a936f',
              borderWidth: '2px',
            },
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(255, 255, 255, 0.7)',
          },
          '& .MuiInputBase-input': {
            color: '#f8f9fa',
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'all 0.3s ease',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: 'rgba(12, 59, 46, 0.9)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.2)',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: '0.8rem',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: 'rgba(24, 81, 74, 0.95)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: 8,
          boxShadow: '0 16px 48px 0 rgba(0, 0, 0, 0.3)',
        },
      },
    },
  },
}));

function App() {
  const [isFirstLogin, setIsFirstLogin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if this is a first-time login
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          console.log("Checking onboarding status for user:", user.id);
          
          try {
            // Check if user has completed onboarding
            const { data, error } = await supabase
              .from('user_onboarding')
              .select('id')
              .eq('user_id', user.id)
              .single();
  
            if (error && error.code !== 'PGRST116') {
              // PGRST116 is "no rows returned" error code
              console.error('Error checking onboarding status:', error);
            }
  
            console.log("Onboarding status check result:", { data, error });
            
            // If data exists, user has completed onboarding
            setIsFirstLogin(!data);
          } catch (queryError) {
            console.error('Exception in onboarding status query:', queryError);
            // Default to not showing onboarding on error
            setIsFirstLogin(false);
          }
        } else {
          console.log("No user found, not checking onboarding status");
          setIsFirstLogin(false);
        }
      } catch (error) {
        console.error('Error in onboarding check:', error);
        setIsFirstLogin(false);
      } finally {
        setLoading(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  // Early return during loading state
  if (loading) {
    return null; // Or a loading spinner if preferred
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SkillsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<OnboardingFlow />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              {/* Redirect to onboarding if first login */}
              <Route 
                path="/dashboard" 
                element={
                  isFirstLogin === true 
                    ? <Navigate to="/onboarding" replace /> 
                    : <Dashboard />
                } 
              />
              <Route path="/upload" element={<UploadReport />} />
              <Route path="/lessons" element={<Lessons />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SkillsProvider>
      <ToastContainer position="bottom-right" autoClose={5000} />
    </ThemeProvider>
  );
}

export default App; 