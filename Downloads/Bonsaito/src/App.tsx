import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import './App.css';

// Import pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import UploadReport from './pages/UploadReport';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Lessons from './pages/Lessons';
import AdminDashboard from './pages/AdminDashboard';

// Import components
import ProtectedRoute from './components/ProtectedRoute';

// Import providers
import SkillsProvider from './components/SkillsProvider';

// Theme configuration
const theme = createTheme({
  palette: {
    primary: {
      main: '#4CAF50', // Green for the Bonsai theme
    },
    secondary: {
      main: '#FFC107', // Amber for accents
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      'Poppins',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SkillsProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/upload" element={<UploadReport />} />
              <Route path="/lessons" element={<Lessons />} />
              {/* Add other routes that need protection here, e.g., profile, etc. */}
            </Route>
            {/* Admin Route - can also be protected or have its own role-based protection */}
            <Route path="/admin" element={<AdminDashboard />} /> 
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </SkillsProvider>
    </ThemeProvider>
  );
}

export default App; 