import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  TextField, 
  Stepper, 
  Step, 
  StepLabel, 
  Paper, 
  Grid, 
  Autocomplete, 
  FormControl, 
  FormControlLabel, 
  RadioGroup, 
  Radio, 
  Slider, 
  CircularProgress,
  TextareaAutosize,
  Checkbox
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useSpring, animated } from 'react-spring';
import { supabase } from '../supabaseClient';
import PdfUploader from './PdfUploader';

// Country data with flags (simplified version for this example)
const countries = [
  { code: 'US', label: 'United States', flag: '🇺🇸' },
  { code: 'CA', label: 'Canada', flag: '🇨🇦' },
  { code: 'GB', label: 'United Kingdom', flag: '🇬🇧' },
  { code: 'AU', label: 'Australia', flag: '🇦🇺' },
  { code: 'IN', label: 'India', flag: '🇮🇳' },
  { code: 'CN', label: 'China', flag: '🇨🇳' },
  { code: 'JP', label: 'Japan', flag: '🇯🇵' },
  { code: 'DE', label: 'Germany', flag: '🇩🇪' },
  { code: 'FR', label: 'France', flag: '🇫🇷' },
  { code: 'IT', label: 'Italy', flag: '🇮🇹' },
  { code: 'ES', label: 'Spain', flag: '🇪🇸' },
  { code: 'MX', label: 'Mexico', flag: '🇲🇽' },
  { code: 'BR', label: 'Brazil', flag: '🇧🇷' },
  { code: 'ZA', label: 'South Africa', flag: '🇿🇦' },
  { code: 'RU', label: 'Russia', flag: '🇷🇺' },
  // Add more countries as needed
];

// City data (would be fetched based on country selection in a real implementation)
const getCitiesByCountry = (countryCode: string) => {
  const citiesByCountry: { [key: string]: string[] } = {
    'US': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'],
    'CA': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa', 'Edmonton'],
    'GB': ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Edinburgh'],
    'AU': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast'],
    'IN': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata'],
    // Add more cities as needed
  };
  return citiesByCountry[countryCode] || [];
};

// Motivation options
const motivations = [
  'Get into a top college',
  'Qualify for scholarships',
  'Improve overall academic standing',
  'Boost Math score',
  'Boost Reading/Writing score',
  'Personal goal',
  'Parent requirement',
  'School requirement',
  'Other'
];

interface OnboardingData {
  firstName: string;
  lastName: string;
  age: string;
  country: string | null;
  city: string | null;
  satScore: string;
  targetSatScore: number;
  motivation: string;
  scoreReport: string;
  hasSatScoreReport: boolean;
  scoreReportUrl?: string;
}

// Gradients for each step
const gradients = [
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', // Step 1
  'linear-gradient(135deg, #c2e9fb 0%, #a1c4fd 100%)', // Step 2
  'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', // Step 3
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', // Step 4
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // Step 5
  'linear-gradient(135deg, #96fbc4 0%, #f9f586 100%)', // Step 6
  'linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%)', // Step 7
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Step 8
];

const OnboardingFlow: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  
  // Form data
  const [data, setData] = useState<OnboardingData>({
    firstName: '',
    lastName: '',
    age: '',
    country: null,
    city: null,
    satScore: '',
    targetSatScore: 1200,
    motivation: '',
    scoreReport: '',
    hasSatScoreReport: false
  });

  // Validation states
  const [errors, setErrors] = useState({
    firstName: false,
    lastName: false,
    age: false,
    country: false,
    city: false,
    satScore: false,
    motivation: false
  });

  // Animation for step transitions
  const fadeProps = useSpring({
    from: { 
      opacity: 0, 
      transform: `translateX(${direction === 'forward' ? '50px' : '-50px'})` 
    },
    to: { 
      opacity: 1, 
      transform: 'translateX(0px)' 
    },
    config: { tension: 280, friction: 60 }
  });

  // Load saved progress from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('onboardingData');
    const savedStep = localStorage.getItem('onboardingStep');
    
    if (savedData) {
      setData(JSON.parse(savedData));
    }
    
    if (savedStep) {
      setActiveStep(parseInt(savedStep, 10));
    }
  }, []);

  // Save progress to localStorage whenever data or step changes
  useEffect(() => {
    localStorage.setItem('onboardingData', JSON.stringify(data));
    localStorage.setItem('onboardingStep', activeStep.toString());
  }, [data, activeStep]);

  // Update cities when country changes
  useEffect(() => {
    if (data.country) {
      const countryData = countries.find(c => c.label === data.country);
      if (countryData) {
        setCities(getCitiesByCountry(countryData.code));
      }
    }
  }, [data.country]);

  const validateStep = () => {
    switch (activeStep) {
      case 0: // First Name & Last Name
        const firstNameError = !data.firstName.trim();
        const lastNameError = !data.lastName.trim();
        setErrors({...errors, firstName: firstNameError, lastName: lastNameError});
        return !firstNameError && !lastNameError;
      
      case 1: // Age
        const ageError = !data.age || isNaN(parseInt(data.age)) || parseInt(data.age) < 13 || parseInt(data.age) > 100;
        setErrors({...errors, age: ageError});
        return !ageError;
      
      case 2: // Country & City
        const countryError = !data.country;
        const cityError = !data.city;
        setErrors({...errors, country: countryError, city: cityError});
        return !countryError && !cityError;
      
      case 3: // SAT Score
        if (data.hasSatScoreReport) return true; // Skip validation if they'll upload/paste later
        const satScoreError = !data.satScore || isNaN(parseInt(data.satScore)) || 
                            parseInt(data.satScore) < 400 || parseInt(data.satScore) > 1600;
        setErrors({...errors, satScore: satScoreError});
        return !satScoreError;
      
      case 4: // Target SAT Score
        return true; // Always valid since slider has defaults
      
      case 5: // Motivation
        const motivationError = !data.motivation;
        setErrors({...errors, motivation: motivationError});
        return !motivationError;
      
      case 6: // SAT Score Report
        return true; // Optional, so always valid
      
      case 7: // Review
        return true; // Just a review, so always valid
      
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep()) return;
    
    setDirection('forward');
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setDirection('backward');
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData({ ...data, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }
      
      // Store data in Supabase
      const { error } = await supabase.from('user_onboarding').insert([
        {
          user_id: user.id,
          first_name: data.firstName,
          last_name: data.lastName,
          age: parseInt(data.age),
          country: data.country,
          city: data.city,
          sat_score: data.satScore ? parseInt(data.satScore) : null,
          target_sat_score: data.targetSatScore,
          motivation: data.motivation,
          score_report: data.scoreReport,
        }
      ]);
      
      if (error) throw error;
      
      // Clear localStorage after successful submission
      localStorage.removeItem('onboardingData');
      localStorage.removeItem('onboardingStep');
      
      // Navigate to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Render different step content based on activeStep
  const getStepContent = () => {
    switch (activeStep) {
      case 0: // Name
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h4" align="center" gutterBottom>
                Let's get to know you better
              </Typography>
              <Typography variant="body1" align="center" color="textSecondary" paragraph>
                We'll personalize your learning experience based on your information.
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={data.firstName}
                onChange={handleInputChange}
                error={errors.firstName}
                helperText={errors.firstName ? 'First name is required' : ''}
                variant="outlined"
                autoFocus
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={data.lastName}
                onChange={handleInputChange}
                error={errors.lastName}
                helperText={errors.lastName ? 'Last name is required' : ''}
                variant="outlined"
              />
            </Grid>
          </Grid>
        );
      
      case 1: // Age
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h4" align="center" gutterBottom>
                How old are you?
              </Typography>
              <Typography variant="body1" align="center" color="textSecondary" paragraph>
                We use this to customize content appropriate for your age group.
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} sx={{ mx: 'auto' }}>
              <TextField
                fullWidth
                label="Age"
                name="age"
                type="number"
                value={data.age}
                onChange={handleInputChange}
                error={errors.age}
                helperText={errors.age ? 'Please enter a valid age (13-100)' : ''}
                variant="outlined"
                InputProps={{ inputProps: { min: 13, max: 100 } }}
              />
            </Grid>
          </Grid>
        );
      
      case 2: // Location
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h4" align="center" gutterBottom>
                Where are you located?
              </Typography>
              <Typography variant="body1" align="center" color="textSecondary" paragraph>
                We'll use this to provide region-specific resources and recommendations.
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={countries}
                getOptionLabel={(option) => `${option.flag} ${option.label}`}
                onChange={(_, newValue) => {
                  setData({ 
                    ...data, 
                    country: newValue ? newValue.label : null,
                    city: null // Reset city when country changes
                  });
                }}
                value={countries.find(c => c.label === data.country) || null}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Country"
                    error={errors.country}
                    helperText={errors.country ? 'Country is required' : ''}
                    variant="outlined"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={cities}
                getOptionLabel={(option) => option}
                onChange={(_, newValue) => {
                  setData({ ...data, city: newValue });
                }}
                value={data.city}
                disabled={!data.country}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="City"
                    error={errors.city}
                    helperText={errors.city ? 'City is required' : ''}
                    variant="outlined"
                  />
                )}
              />
            </Grid>
          </Grid>
        );
      
      case 3: // Current SAT Score
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h4" align="center" gutterBottom>
                What's your current SAT score?
              </Typography>
              <Typography variant="body1" align="center" color="textSecondary" paragraph>
                If you haven't taken the SAT yet or don't know your score, we'll help you upload or enter it later.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={data.hasSatScoreReport} 
                    onChange={(e) => setData({ ...data, hasSatScoreReport: e.target.checked })}
                  />
                }
                label="I'll upload/paste my SAT score report later"
              />
            </Grid>
            <Grid item xs={12} sm={8} sx={{ mx: 'auto' }}>
              <TextField
                fullWidth
                label="SAT Score"
                name="satScore"
                type="number"
                value={data.satScore}
                onChange={handleInputChange}
                error={errors.satScore && !data.hasSatScoreReport}
                helperText={errors.satScore && !data.hasSatScoreReport ? 'Please enter a valid SAT score (400-1600)' : ''}
                variant="outlined"
                disabled={data.hasSatScoreReport}
                InputProps={{ inputProps: { min: 400, max: 1600 } }}
              />
            </Grid>
          </Grid>
        );
      
      case 4: // Target SAT Score
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h4" align="center" gutterBottom>
                What's your target SAT score?
              </Typography>
              <Typography variant="body1" align="center" color="textSecondary" paragraph>
                Setting a goal helps us customize your learning path.
              </Typography>
            </Grid>
            <Grid item xs={12} md={8} sx={{ mx: 'auto' }}>
              <Box sx={{ px: 3 }}>
                <Slider
                  value={data.targetSatScore}
                  min={1000}
                  max={1600}
                  step={10}
                  marks={[
                    { value: 1000, label: '1000' },
                    { value: 1200, label: '1200' },
                    { value: 1400, label: '1400' },
                    { value: 1600, label: '1600' }
                  ]}
                  onChange={(_, newValue) => 
                    setData({ ...data, targetSatScore: newValue as number })
                  }
                  valueLabelDisplay="on"
                />
              </Box>
            </Grid>
            <Grid item xs={12} sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary">
                Target Score: {data.targetSatScore}
              </Typography>
            </Grid>
            <Grid item xs={12} sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" color="textSecondary">
                Or choose a preset target:
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Button 
                  variant={data.targetSatScore === 1000 ? "contained" : "outlined"} 
                  sx={{ mx: 1 }}
                  onClick={() => setData({ ...data, targetSatScore: 1000 })}
                >
                  1000
                </Button>
                <Button 
                  variant={data.targetSatScore === 1200 ? "contained" : "outlined"}
                  sx={{ mx: 1 }}
                  onClick={() => setData({ ...data, targetSatScore: 1200 })}
                >
                  1200
                </Button>
                <Button 
                  variant={data.targetSatScore === 1400 ? "contained" : "outlined"}
                  sx={{ mx: 1 }}
                  onClick={() => setData({ ...data, targetSatScore: 1400 })}
                >
                  1400
                </Button>
                <Button 
                  variant={data.targetSatScore === 1550 ? "contained" : "outlined"}
                  sx={{ mx: 1 }}
                  onClick={() => setData({ ...data, targetSatScore: 1550 })}
                >
                  1500+
                </Button>
              </Box>
            </Grid>
          </Grid>
        );
      
      case 5: // Motivation
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h4" align="center" gutterBottom>
                What's your primary motivation for improving your SAT score?
              </Typography>
              <Typography variant="body1" align="center" color="textSecondary" paragraph>
                This helps us understand your goals and tailor our guidance.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControl component="fieldset" error={errors.motivation}>
                <RadioGroup
                  name="motivation"
                  value={data.motivation}
                  onChange={handleInputChange}
                >
                  {motivations.map((motivation) => (
                    <FormControlLabel
                      key={motivation}
                      value={motivation}
                      control={<Radio />}
                      label={motivation}
                    />
                  ))}
                </RadioGroup>
                {errors.motivation && (
                  <Typography variant="caption" color="error">
                    Please select a motivation
                  </Typography>
                )}
              </FormControl>
            </Grid>
          </Grid>
        );
      
      case 6: // SAT Score Report (Copy/Paste)
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h4" align="center" gutterBottom>
                Copy & Paste your SAT Score Report
              </Typography>
              <Typography variant="body1" align="center" color="textSecondary" paragraph>
                This will help us analyze your strengths and weaknesses in detail.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={8}
                name="scoreReport"
                value={data.scoreReport}
                onChange={handleInputChange}
                placeholder="Paste the content from your SAT score report PDF here..."
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" align="center" sx={{ mt: 3, mb: 2 }}>
                OR
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1" align="center" sx={{ mb: 2 }}>
                Upload your SAT score report PDF
              </Typography>
              <PdfUploader 
                onUploadComplete={(url) => {
                  // Store the URL in case we need it later
                  setData({ ...data, scoreReportUrl: url });
                }}
                onTextExtracted={(text) => {
                  // Automatically fill the text area with extracted text
                  setData({ ...data, scoreReport: text });
                }}
              />
            </Grid>
          </Grid>
        );
      
      case 7: // Review & Submit
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h4" align="center" gutterBottom>
                Review Your Information
              </Typography>
              <Typography variant="body1" align="center" color="textSecondary" paragraph>
                Please verify that everything is correct before submitting.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Name:</Typography>
                    <Typography variant="body1" gutterBottom>{data.firstName} {data.lastName}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Age:</Typography>
                    <Typography variant="body1" gutterBottom>{data.age}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Location:</Typography>
                    <Typography variant="body1" gutterBottom>
                      {data.city}, {data.country}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Current SAT Score:</Typography>
                    <Typography variant="body1" gutterBottom>
                      {data.hasSatScoreReport ? 'To be provided later' : data.satScore}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Target SAT Score:</Typography>
                    <Typography variant="body1" gutterBottom>{data.targetSatScore}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Motivation:</Typography>
                    <Typography variant="body1" gutterBottom>{data.motivation}</Typography>
                  </Grid>
                  {data.scoreReport && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2">SAT Score Report:</Typography>
                      <Paper variant="outlined" sx={{ p: 2, maxHeight: '100px', overflow: 'auto' }}>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {data.scoreReport.length > 200 
                            ? data.scoreReport.substring(0, 200) + '...' 
                            : data.scoreReport}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        );
      
      default:
        return null;
    }
  };

  // Steps for the stepper
  const steps = [
    'Name',
    'Age',
    'Location',
    'Current Score',
    'Target Score',
    'Motivation',
    'Score Report',
    'Review'
  ];

  // Background style for current step
  const getBackgroundStyle = () => {
    return {
      background: gradients[activeStep],
      backgroundSize: '200% 200%',
      animation: 'gradient 15s ease infinite',
      height: '100%',
      minHeight: '100vh',
      transition: 'background 0.5s ease-in-out',
      display: 'flex',
      flexDirection: 'column',
      '@keyframes gradient': {
        '0%': { backgroundPosition: '0% 50%' },
        '50%': { backgroundPosition: '100% 50%' },
        '100%': { backgroundPosition: '0% 50%' }
      }
    } as React.CSSProperties;
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '100vh',
          background: gradients[7]
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 3 }}>
          Saving your information...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={getBackgroundStyle()}>
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: { xs: 2, sm: 4 }, 
            borderRadius: 2, 
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.2)'
          }}
        >
          <Stepper 
            activeStep={activeStep} 
            alternativeLabel
            sx={{ mb: 4, display: { xs: 'none', md: 'flex' } }}
          >
            {steps.map((label: string) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {/* Mobile stepper status */}
          <Box sx={{ mb: 4, display: { xs: 'block', md: 'none' }, textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              Step {activeStep + 1} of {steps.length}: {steps[activeStep]}
            </Typography>
          </Box>
          
          <animated.div style={fadeProps}>
            <Box sx={{ minHeight: '300px', mb: 4 }}>
              {getStepContent()}
            </Box>
          </animated.div>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2 }}>
            <Button
              color="inherit"
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<ArrowBackIcon />}
              sx={{ opacity: activeStep === 0 ? 0 : 1 }}
            >
              Back
            </Button>
            
            {activeStep === steps.length - 1 ? (
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleSubmit}
                endIcon={<CheckCircleOutlineIcon />}
              >
                Submit
              </Button>
            ) : (
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleNext}
                endIcon={<ArrowForwardIcon />}
              >
                Next
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default OnboardingFlow; 