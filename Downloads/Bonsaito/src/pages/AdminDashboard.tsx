import React from 'react';
import { Typography, Container, Paper, Grid, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  // Placeholder data and functions
  const handleManageSkills = () => alert('Navigate to Manage Skills page (to be implemented)');
  const handleManageLessons = () => alert('Navigate to Manage Lessons page (to be implemented)');
  const handleManageQuestions = () => alert('Navigate to Manage Questions page (to be implemented)');
  const handleViewUsers = () => alert('Navigate to View Users page (to be implemented)');

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        Admin Dashboard
      </Typography>
      <Grid container spacing={3}>
        {/* Manage Skills Card */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 180, justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" gutterBottom>Manage Skills</Typography>
              <Typography variant="body2" color="textSecondary">
                Create, edit, and delete skills or concepts that lessons and questions are based on.
              </Typography>
            </Box>
            <Button variant="contained" onClick={handleManageSkills} sx={{ mt: 'auto' }}>
              Go to Skills
            </Button>
          </Paper>
        </Grid>

        {/* Manage Lessons Card */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 180, justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" gutterBottom>Manage Lessons</Typography>
              <Typography variant="body2" color="textSecondary">
                Upload videos, link them to skills, and manage lesson content.
              </Typography>
            </Box>
            <Button variant="contained" onClick={handleManageLessons} sx={{ mt: 'auto' }}>
              Go to Lessons
            </Button>
          </Paper>
        </Grid>

        {/* Manage Questions Card */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 180, justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" gutterBottom>Manage Questions</Typography>
              <Typography variant="body2" color="textSecondary">
                Create quizzes, remediation question sets, and manage question banks.
              </Typography>
            </Box>
            <Button variant="contained" onClick={handleManageQuestions} sx={{ mt: 'auto' }}>
              Go to Questions
            </Button>
          </Paper>
        </Grid>
        
        {/* Manage Users Card (Optional) */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 180, justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" gutterBottom>View Users</Typography>
              <Typography variant="body2" color="textSecondary">
                View user progress and manage user accounts.
              </Typography>
            </Box>
            <Button variant="contained" onClick={handleViewUsers} sx={{ mt: 'auto' }}>
              Go to Users
            </Button>
          </Paper>
        </Grid>

      </Grid>
      <Box sx={{mt: 4, display: 'flex', justifyContent: 'center'}}>
        <Button component={RouterLink} to="/dashboard" variant="outlined">
            Back to User Dashboard
        </Button>
      </Box>
    </Container>
  );
};

export default AdminDashboard; 