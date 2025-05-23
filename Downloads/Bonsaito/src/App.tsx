import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
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
import { ThemeContextProvider } from './contexts/ThemeContext';
import { supabase } from './supabaseClient';

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
    <ThemeContextProvider>
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
    </ThemeContextProvider>
  );
}

export default App; 