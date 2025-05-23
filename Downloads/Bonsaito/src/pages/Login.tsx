import React, { useState } from 'react';
import { Container, TextField, Button, Typography, Box, Alert, AppBar, Toolbar, useTheme } from '@mui/material';
import { supabase } from '../supabaseClient'; // Uncommented and assuming it's in the parent directory
import { useNavigate } from 'react-router-dom';
import { useThemeContext } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const { themeMode } = useThemeContext();

  // Background style that adapts to theme
  const getBackgroundStyle = () => {
    if (themeMode === 'light') {
      return {
        backgroundColor: '#fafafa',
        minHeight: '100vh',
        transition: 'background-color 0.3s ease',
      };
    }
    
    return {
      backgroundColor: '#121212',
      minHeight: '100vh',
      transition: 'background-color 0.3s ease',
    };
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      setMessage('Login successful! Redirecting to dashboard...');
      setTimeout(() => navigate('/dashboard'), 1500); 
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    }
    setLoading(false);
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({ 
        email, 
        password,
        // options: {
        //   emailRedirectTo: window.location.origin, // Or your specific redirect page
        // }
      });
      if (signUpError) throw signUpError;
      setMessage('Signup successful! Check your email for verification.');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    }
    setLoading(false);
  };

  return (
    <Box sx={getBackgroundStyle()}>
      {/* Navigation */}
      <AppBar position="fixed" elevation={0}>
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
          
          {/* Theme Toggle */}
          <ThemeToggle />
        </Toolbar>
      </AppBar>

      <Container maxWidth="xs" sx={{ pt: 12, pb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ 
          color: theme.palette.text.primary,
          fontWeight: 'bold',
          mb: 4
        }}>
          Login / Sign Up
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        <Box component="form" onSubmit={handleLogin} sx={{ mb: 4 }}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading} sx={{ mt: 2 }}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
          <Button onClick={handleSignup} variant="outlined" color="secondary" fullWidth disabled={loading} sx={{ mt: 1 }}>
            {loading ? 'Signing up...' : 'Sign Up'}
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default Login; 