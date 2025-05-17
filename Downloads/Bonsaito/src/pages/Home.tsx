import React from 'react';
import { Typography, Container, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ textAlign: 'center', mt: 8 }}>
      <Typography variant="h2" component="h1" gutterBottom>
        Welcome to BonsaiLMS
      </Typography>
      <Typography variant="h5" color="textSecondary" paragraph>
        Nurture your skills and watch your knowledge grow.
      </Typography>
      <Box sx={{ mt: 4 }}>
        <Button component={RouterLink} to="/lessons" variant="contained" color="primary" sx={{ mr: 2 }}>
          Explore Lessons
        </Button>
        <Button component={RouterLink} to="/login" variant="outlined" color="primary">
          Login
        </Button>
      </Box>
    </Container>
  );
};

export default Home; 