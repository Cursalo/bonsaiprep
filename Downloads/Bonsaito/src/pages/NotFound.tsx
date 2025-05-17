import React from 'react';
import { Typography, Container, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 8 }}>
      <Typography variant="h1" component="h1" gutterBottom>
        404
      </Typography>
      <Typography variant="h5" color="textSecondary" paragraph>
        Oops! The page you're looking for doesn't exist.
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        It might have been moved or deleted.
      </Typography>
      <Box sx={{ mt: 4 }}>
        <Button component={RouterLink} to="/" variant="contained" color="primary">
          Go to Homepage
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound; 