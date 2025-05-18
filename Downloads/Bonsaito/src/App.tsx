import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { colors } from '@mui/material';
import './App.css';

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
    primary: {
      main: '#4CAF50', // Vibrant green for primary actions
      light: '#81C784',
      dark: '#388E3C',
    },
    secondary: {
      main: '#FFC107', // Amber for secondary actions
      light: '#FFD54F',
      dark: '#FFA000',
    },
    info: {
      main: '#2196F3', // Blue for informational elements
    },
    success: {
      main: '#66BB6A', // Green for success states
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
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
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 700,
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
    borderRadius: 4, // 4px rounded corners as requested
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
        elevation1: {
          boxShadow: '0 2px 10px 0 rgba(31, 38, 135, 0.05)',
        },
        elevation3: {
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
          transition: 'all 0.3s ease',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          transition: 'all 0.3s ease',
          fontSize: '1rem',
          padding: '8px 16px',
        },
        containedPrimary: {
          background: 'linear-gradient(45deg, #4CAF50, #8BC34A)',
          '&:hover': {
            background: 'linear-gradient(45deg, #43A047, #7CB342)',
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 10px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.05)',
          color: '#333',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 4,
            '& fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.1)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.2)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#4CAF50',
            },
          },
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

          // If data exists, user has completed onboarding
          setIsFirstLogin(!data);
        }
      } catch (error) {
        console.error('Error in onboarding check:', error);
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
    </ThemeProvider>
  );
}

export default App; 