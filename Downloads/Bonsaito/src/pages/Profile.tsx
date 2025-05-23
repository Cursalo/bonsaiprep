import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Chip,
  Avatar,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Person as PersonIcon,
  School as SchoolIcon,
  GpsFixed as TargetIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useThemeContext } from '../contexts/ThemeContext';
import { toast } from 'react-toastify';

interface UserOnboardingData {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  age: number;
  country: string;
  city: string;
  sat_score: number | null;
  target_sat_score: number;
  motivation: string;
  score_report_text: string;
  score_report_url: string | null;
  has_score_report: boolean;
  subscription_plan: string;
  created_at: string;
  updated_at: string;
}

const Profile: React.FC = () => {
  const [profileData, setProfileData] = useState<UserOnboardingData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<UserOnboardingData>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { themeMode } = useThemeContext();
  const navigate = useNavigate();

  // Text styles for theme awareness
  const getTextStyles = (themeMode: 'light' | 'dark') => ({
    heading: {
      color: themeMode === 'light' ? 'rgba(0, 0, 0, 0.87)' : 'rgba(255, 255, 255, 0.87)',
    },
    body: {
      color: themeMode === 'light' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
    },
    secondary: {
      color: themeMode === 'light' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)',
    },
    accent: {
      color: themeMode === 'light' ? '#1a936f' : '#88d498',
    },
  });

  // Background style
  const getBackgroundStyle = () => ({
    backgroundColor: themeMode === 'light' ? '#fafafa' : '#121212',
    minHeight: '100vh',
    py: 4,
  });

  // Fetch user profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/login');
          return;
        }

        const { data, error } = await supabase
          .from('user_onboarding')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No onboarding data found
            setError('No profile data found. Please complete the onboarding process.');
          } else {
            console.error('Error fetching profile data:', error);
            setError('Failed to load profile data.');
          }
        } else {
          setProfileData(data);
          setEditData(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [navigate]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditData(profileData || {});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(profileData || {});
  };

  const handleSave = async () => {
    if (!profileData) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_onboarding')
        .update({
          first_name: editData.first_name,
          last_name: editData.last_name,
          age: editData.age,
          country: editData.country,
          city: editData.city,
          sat_score: editData.sat_score,
          target_sat_score: editData.target_sat_score,
          motivation: editData.motivation,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileData.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast.error('Failed to update profile');
      } else {
        setProfileData({ ...profileData, ...editData });
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserOnboardingData, value: any) => {
    setEditData({ ...editData, [field]: value });
  };

  const getMotivationColor = (motivation: string) => {
    const colors = {
      'College Admissions': '#2196F3',
      'Scholarship Opportunities': '#FF9800',
      'Personal Achievement': '#4CAF50',
      'Retaking to Improve Score': '#9C27B0',
      'Parent/Teacher Requirement': '#F44336',
    };
    return colors[motivation as keyof typeof colors] || '#757575';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Box sx={getBackgroundStyle()}>
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress />
          </Box>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={getBackgroundStyle()}>
        <Container maxWidth="md">
          <Alert severity="error" sx={{ mt: 4 }}>
            {error}
            <Box sx={{ mt: 2 }}>
              <Button 
                variant="contained" 
                onClick={() => navigate('/onboarding')}
                sx={{ mr: 1 }}
              >
                Complete Onboarding
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </Button>
            </Box>
          </Alert>
        </Container>
      </Box>
    );
  }

  if (!profileData) return null;

  return (
    <Box sx={getBackgroundStyle()}>
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              mx: 'auto',
              mb: 2,
              bgcolor: getTextStyles(themeMode).accent.color,
              fontSize: '2rem',
            }}
          >
            {profileData.first_name?.charAt(0)}{profileData.last_name?.charAt(0)}
          </Avatar>
          <Typography variant="h4" sx={getTextStyles(themeMode).heading}>
            {profileData.first_name} {profileData.last_name}
          </Typography>
          <Typography variant="subtitle1" sx={getTextStyles(themeMode).secondary}>
            Member since {formatDate(profileData.created_at)}
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          {!isEditing ? (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEdit}
              sx={{
                bgcolor: getTextStyles(themeMode).accent.color,
                '&:hover': {
                  bgcolor: themeMode === 'light' ? '#114b5f' : '#a6e3b0',
                },
              }}
            >
              Edit Profile
            </Button>
          ) : (
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving}
                sx={{
                  bgcolor: getTextStyles(themeMode).accent.color,
                  '&:hover': {
                    bgcolor: themeMode === 'light' ? '#114b5f' : '#a6e3b0',
                  },
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </Button>
            </Box>
          )}
        </Box>

        <Grid container spacing={3}>
          {/* Personal Information */}
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              height: '100%',
              backgroundColor: themeMode === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(30, 30, 30, 0.8)',
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ ...getTextStyles(themeMode).heading, mb: 2, display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ mr: 1 }} />
                  Personal Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Name"
                      secondary={
                        isEditing ? (
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <TextField
                              size="small"
                              label="First Name"
                              value={editData.first_name || ''}
                              onChange={(e) => handleInputChange('first_name', e.target.value)}
                            />
                            <TextField
                              size="small"
                              label="Last Name"
                              value={editData.last_name || ''}
                              onChange={(e) => handleInputChange('last_name', e.target.value)}
                            />
                          </Box>
                        ) : (
                          `${profileData.first_name} ${profileData.last_name}`
                        )
                      }
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText
                      primary="Age"
                      secondary={
                        isEditing ? (
                          <TextField
                            size="small"
                            type="number"
                            value={editData.age || ''}
                            onChange={(e) => handleInputChange('age', parseInt(e.target.value))}
                            sx={{ mt: 1 }}
                          />
                        ) : (
                          `${profileData.age} years old`
                        )
                      }
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <LocationIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Location"
                      secondary={
                        isEditing ? (
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <TextField
                              size="small"
                              label="Country"
                              value={editData.country || ''}
                              onChange={(e) => handleInputChange('country', e.target.value)}
                            />
                            <TextField
                              size="small"
                              label="City"
                              value={editData.city || ''}
                              onChange={(e) => handleInputChange('city', e.target.value)}
                            />
                          </Box>
                        ) : (
                          `${profileData.city}, ${profileData.country}`
                        )
                      }
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* SAT Information */}
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              height: '100%',
              backgroundColor: themeMode === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(30, 30, 30, 0.8)',
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ ...getTextStyles(themeMode).heading, mb: 2, display: 'flex', alignItems: 'center' }}>
                  <SchoolIcon sx={{ mr: 1 }} />
                  SAT Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <AssessmentIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Current SAT Score"
                      secondary={
                        isEditing ? (
                          <TextField
                            size="small"
                            type="number"
                            label="SAT Score"
                            value={editData.sat_score || ''}
                            onChange={(e) => handleInputChange('sat_score', parseInt(e.target.value))}
                            sx={{ mt: 1 }}
                            InputProps={{ inputProps: { min: 400, max: 1600 } }}
                          />
                        ) : (
                          profileData.sat_score ? `${profileData.sat_score}/1600` : 'Not provided'
                        )
                      }
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <TargetIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Target SAT Score"
                      secondary={
                        isEditing ? (
                          <TextField
                            size="small"
                            type="number"
                            label="Target Score"
                            value={editData.target_sat_score || ''}
                            onChange={(e) => handleInputChange('target_sat_score', parseInt(e.target.value))}
                            sx={{ mt: 1 }}
                            InputProps={{ inputProps: { min: 400, max: 1600 } }}
                          />
                        ) : (
                          `${profileData.target_sat_score}/1600`
                        )
                      }
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <TrendingUpIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Score Improvement Needed"
                      secondary={
                        profileData.sat_score 
                          ? `${profileData.target_sat_score - profileData.sat_score} points`
                          : 'Complete your first practice test to see improvement goals'
                      }
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Motivation & Goals */}
          <Grid item xs={12}>
            <Card sx={{ 
              backgroundColor: themeMode === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(30, 30, 30, 0.8)',
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ ...getTextStyles(themeMode).heading, mb: 2 }}>
                  Motivation & Goals
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {isEditing ? (
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Motivation"
                    value={editData.motivation || ''}
                    onChange={(e) => handleInputChange('motivation', e.target.value)}
                  />
                ) : (
                  <Box>
                    <Chip
                      label={profileData.motivation}
                      sx={{
                        bgcolor: getMotivationColor(profileData.motivation),
                        color: 'white',
                        fontWeight: 'bold',
                        mb: 2,
                      }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Account Information */}
          <Grid item xs={12}>
            <Card sx={{ 
              backgroundColor: themeMode === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(30, 30, 30, 0.8)',
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ ...getTextStyles(themeMode).heading, mb: 2 }}>
                  Account Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Subscription Plan"
                      secondary={
                        <Chip
                          label={profileData.subscription_plan?.toUpperCase() || 'FREE'}
                          color={profileData.subscription_plan === 'pro' ? 'primary' : 'default'}
                          size="small"
                        />
                      }
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText
                      primary="Score Report"
                      secondary={
                        profileData.has_score_report 
                          ? 'Score report uploaded' 
                          : 'No score report uploaded'
                      }
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText
                      primary="Last Updated"
                      secondary={formatDate(profileData.updated_at)}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/onboarding')}
            sx={{ mr: 2 }}
          >
            Redo Onboarding
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/dashboard')}
            sx={{
              bgcolor: getTextStyles(themeMode).accent.color,
              '&:hover': {
                bgcolor: themeMode === 'light' ? '#114b5f' : '#a6e3b0',
              },
            }}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default Profile; 