import React, { useState, useEffect, useCallback } from 'react';
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
import SubscriptionPlans from './SubscriptionPlans';
import { generateQuestionsFromMistakes } from '../services/geminiPdfService';
import { toast } from 'react-toastify';
import { createTheme, ThemeProvider } from '@mui/material/styles';

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
  subscriptionPlan?: 'free' | 'pro';
  generatedQuestions?: any[];
  scoreReportFile?: File;
}

// Gradients for each step
const gradients = [
  'linear-gradient(135deg, #0c3b2e 0%, #18514a 100%)', // Step 1
  'linear-gradient(135deg, #0c3b2e 0%, #18514a 100%)', // Step 2
  'linear-gradient(135deg, #0c3b2e 0%, #18514a 100%)', // Step 3
  'linear-gradient(135deg, #0c3b2e 0%, #18514a 100%)', // Step 4
  'linear-gradient(135deg, #0c3b2e 0%, #18514a 100%)', // Step 5
  'linear-gradient(135deg, #0c3b2e 0%, #18514a 100%)', // Step 6
  'linear-gradient(135deg, #0c3b2e 0%, #18514a 100%)', // Step 7
  'linear-gradient(135deg, #0c3b2e 0%, #18514a 100%)', // Step 8
  'linear-gradient(135deg, #0c3b2e 0%, #18514a 100%)', // Step 9 (Subscription)
];

// Custom styles for better text readability based on dark theme best practices
const textStyles = {
  heading: {
    color: 'rgba(255, 255, 255, 0.87)', // High-emphasis text at 87% opacity
    textShadow: '0 1px 2px rgba(0,0,0,0.2)'
  },
  subheading: {
    color: 'rgba(255, 255, 255, 0.87)', // High-emphasis text at 87% opacity
    opacity: 0.9
  },
  body: {
    color: 'rgba(255, 255, 255, 0.7)' // Medium-emphasis text at 70% opacity
  },
  label: {
    color: 'rgba(255, 255, 255, 0.87)',  // High-emphasis text at 87% opacity
    fontWeight: 500
  },
  secondary: {
    color: 'rgba(255, 255, 255, 0.6)' // Secondary text at 60% opacity
  },
  disabled: {
    color: 'rgba(255, 255, 255, 0.38)' // Disabled text at 38% opacity
  },
  accent: {
    color: 'rgba(136, 212, 152, 0.9)' // Desaturated accent color
  }
};

const OnboardingFlow: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [processingReport, setProcessingReport] = useState(false);
  
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
    hasSatScoreReport: false,
    generatedQuestions: [],
    scoreReportFile: undefined
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

  // Create a theme override for form inputs to ensure proper contrast
  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: 'rgba(136, 212, 152, 0.9)',
      },
      text: {
        primary: 'rgba(255, 255, 255, 0.87)',
        secondary: 'rgba(255, 255, 255, 0.6)',
      },
      background: {
        paper: 'rgba(30, 30, 30, 0.8)',
        default: 'rgba(18, 18, 18, 0.95)',
      },
    },
    components: {
      MuiInputBase: {
        styleOverrides: {
          input: {
            color: 'rgba(255, 255, 255, 0.87)',
          },
          root: {
            backgroundColor: 'rgba(30, 30, 30, 0.4)',
          }
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(136, 212, 152, 0.5)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(136, 212, 152, 0.8)',
            },
          },
          notchedOutline: {
            borderColor: 'rgba(255, 255, 255, 0.23)',
          },
        },
      },
      MuiFormLabel: {
        styleOverrides: {
          root: {
            color: 'rgba(255, 255, 255, 0.6)',
            '&.Mui-focused': {
              color: 'rgba(136, 212, 152, 0.8)',
            },
          },
        },
      },
    },
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
        
      case 8: // Subscription Plan
        return !!data.subscriptionPlan; // Valid if a plan is selected
      
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (!validateStep()) return;
    
    setDirection('forward');
    
    // Special handling for the score report step to generate questions
    if (activeStep === 6) {
      if ((data.scoreReport && !data.generatedQuestions?.length) || 
          (data.scoreReportFile && !data.generatedQuestions?.length)) {
        try {
          setProcessingReport(true);
          
          // Generate questions from the score report text or file
          let questions;
          if (data.scoreReportFile) {
            questions = await generateQuestionsFromMistakes(data.scoreReportFile);
          } else if (data.scoreReport) {
            questions = await generateQuestionsFromMistakes(data.scoreReport);
          }
          
          setData({ ...data, generatedQuestions: questions });
          setProcessingReport(false);
        } catch (error) {
          console.error("Error generating questions:", error);
          setProcessingReport(false);
        }
      }
    }
    
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
    console.log("Starting onboarding submission process");
    setLoading(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      console.log("Current user:", user);
      
      if (!user) {
        toast.error('You must be logged in to complete onboarding');
        return;
      }
      
      // Check if user already has an onboarding entry
      console.log("Checking for existing onboarding entry for user:", user.id);
      let existingData = null;
      
      try {
        const response = await supabase
          .from('user_onboarding')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        existingData = response.data;
        const checkError = response.error;
          
        console.log("Existing onboarding data check result:", { existingData, checkError });
        
        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking for existing onboarding record:', checkError);
          toast.error('Error saving your information');
          setLoading(false);
          return;
        }
      } catch (checkError) {
        console.error('Exception checking for existing onboarding record:', checkError);
        toast.error('Error connecting to the database');
        setLoading(false);
        return;
      }
      
      // Store file if it exists
      let fileUrl = data.scoreReportUrl;
      
      if (data.scoreReportFile && !data.scoreReportUrl) {
        const filePath = `${user.id}/${Date.now()}_${data.scoreReportFile.name}`;
        const { error: storageError } = await supabase.storage
          .from('score-reports')
          .upload(filePath, data.scoreReportFile);
          
        if (storageError) {
          console.error('Error uploading file:', storageError);
          toast.error('Error uploading your score report');
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('score-reports')
            .getPublicUrl(filePath);
            
          fileUrl = publicUrl;
        }
      }
      
      // Store onboarding data to Supabase
      const onboardingData = {
        user_id: user.id,
        first_name: data.firstName,
        last_name: data.lastName,
        age: parseInt(data.age),
        country: data.country || '',
        city: data.city || '',
        sat_score: data.satScore ? parseInt(data.satScore) : null,
        target_sat_score: data.targetSatScore,
        motivation: data.motivation,
        score_report_text: data.scoreReport,
        score_report_url: fileUrl,
        has_score_report: data.hasSatScoreReport,
        subscription_plan: data.subscriptionPlan || 'free'
      };
      
      // Insert or update user onboarding data
      let dbError;
      if (existingData) {
        const { error } = await supabase
          .from('user_onboarding')
          .update(onboardingData)
          .eq('id', existingData.id);
        dbError = error;
      } else {
        const { error } = await supabase
          .from('user_onboarding')
          .insert([onboardingData]);
        dbError = error;
      }
      
      if (dbError) {
        console.error('Error saving onboarding data:', dbError);
        toast.error('Error saving your information');
        setLoading(false);
        return;
      }
      
      // Generate practice questions if there's a score report
      if (data.scoreReport) {
        try {
          // Generate practice questions from the score report text
          const questions = await generateQuestionsFromMistakes(data.scoreReport);
          
          if (questions && questions.length > 0) {
            // Store questions in practice_questions table
            const { error: questionsError } = await supabase
              .from('practice_questions')
              .insert(
                questions.map(q => ({
                  user_id: user.id,
                  question_data: q,
                  source: 'onboarding',
                  completed: false
                }))
              );
              
            if (questionsError) {
              console.error('Error storing practice questions:', questionsError);
            } else {
              console.log(`Successfully created ${questions.length} practice questions for the user`);
            }
          }
        } catch (aiError) {
          console.error('Error generating practice questions:', aiError);
        }
      }
      
      toast.success('Onboarding completed successfully!');
      
      // Redirect to dashboard - add delay to ensure toast is visible and state is updated
      setTimeout(() => {
        // Force navigation with window.location for a full page refresh in case of router issues
        window.location.href = '/dashboard';
      }, 1000);
      
      return; // Early return to prevent further execution
    } catch (error) {
      console.error('Error in onboarding submission:', error);
      toast.error('Error saving your information');
    } finally {
      setLoading(false);
    }
  };

  // Add a useDropzone hook for file handling
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
    },
    onDrop: acceptedFiles => {
      if (acceptedFiles.length > 0) {
        setData({ ...data, scoreReportFile: acceptedFiles[0] });
      }
    }
  });

  // Render different step content based on activeStep
  const getStepContent = () => {
    switch (activeStep) {
      case 0: // Name
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h4" align="center" gutterBottom sx={textStyles.heading}>
                Let's get to know you better
              </Typography>
              <Typography variant="body1" align="center" paragraph sx={textStyles.body}>
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
              <Typography variant="h4" align="center" gutterBottom sx={textStyles.heading}>
                How old are you?
              </Typography>
              <Typography variant="body1" align="center" paragraph sx={textStyles.body}>
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
              <Typography variant="h4" align="center" gutterBottom sx={textStyles.heading}>
                Where are you located?
              </Typography>
              <Typography variant="body1" align="center" paragraph sx={textStyles.body}>
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
              <Typography variant="h4" align="center" gutterBottom sx={textStyles.heading}>
                What's your current SAT score?
              </Typography>
              <Typography variant="body1" align="center" paragraph sx={textStyles.body}>
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
              <Typography variant="h4" align="center" gutterBottom sx={textStyles.heading}>
                What's your target SAT score?
              </Typography>
              <Typography variant="body1" align="center" paragraph sx={textStyles.body}>
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
              <Typography variant="h6" sx={{ ...textStyles.subheading, color: '#88d498' }}>
                Target Score: {data.targetSatScore}
              </Typography>
            </Grid>
            <Grid item xs={12} sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" sx={textStyles.body}>
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
              <Typography variant="h4" align="center" gutterBottom sx={textStyles.heading}>
                What's your primary motivation for improving your SAT score?
              </Typography>
              <Typography variant="body1" align="center" paragraph sx={textStyles.body}>
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
              <Typography variant="h4" align="center" gutterBottom sx={textStyles.heading}>
                Copy & Paste your SAT Score Report
              </Typography>
              <Typography variant="body1" align="center" paragraph sx={textStyles.body}>
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
              <Typography variant="h6" align="center" sx={{ ...textStyles.subheading, mt: 3, mb: 2 }}>
                OR
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1" align="center" sx={{ ...textStyles.body, mb: 2 }}>
                Upload your SAT score report PDF
              </Typography>
              <Box
                sx={{
                  border: '2px dashed rgba(136, 212, 152, 0.6)',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'rgba(18, 18, 18, 0.4)', // Using recommended dark theme surface color
                  '&:hover': {
                    borderColor: 'rgba(136, 212, 152, 0.8)',
                    background: 'rgba(30, 58, 52, 0.4)' // Slightly lighter on hover
                  }
                }}
                {...getRootProps()}
              >
                <input {...getInputProps()} />
                <CloudUploadIcon fontSize="large" sx={{ color: 'rgba(136, 212, 152, 0.8)', mb: 2 }} />
                <Typography variant="body1" gutterBottom sx={textStyles.body}>
                  Drag & drop a PDF file here, or click to select a file
                </Typography>
                <Typography variant="body2" sx={textStyles.secondary}>
                  Supports PDF files only
                </Typography>
                {data.scoreReportFile && (
                  <Box sx={{ 
                    mt: 2, 
                    p: 1, 
                    bgcolor: 'rgba(30, 58, 52, 0.4)', 
                    borderRadius: 1,
                    border: '1px solid rgba(136, 212, 152, 0.3)'
                  }}>
                    <Typography variant="body2" sx={textStyles.body}>
                      Selected: {data.scoreReportFile.name}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>
            {processingReport && (
              <Grid item xs={12} sx={{ textAlign: 'center', mt: 2 }}>
                <CircularProgress size={30} sx={{ color: 'rgba(136, 212, 152, 0.8)' }} />
                <Typography variant="body2" sx={textStyles.secondary}>
                  Processing your report to generate personalized practice questions...
                </Typography>
              </Grid>
            )}
          </Grid>
        );
      
      case 7: // Review & Submit
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h4" align="center" gutterBottom sx={textStyles.heading}>
                Review Your Information
              </Typography>
              <Typography variant="body1" align="center" paragraph sx={textStyles.body}>
                Please verify that everything is correct before proceeding.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ 
                p: 3, 
                background: 'rgba(24, 24, 24, 0.7)', // Slightly lighter than the main surface for elevation
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                borderRadius: 2
              }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={textStyles.label}>Name:</Typography>
                    <Typography variant="body1" gutterBottom sx={textStyles.body}>{data.firstName} {data.lastName}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={textStyles.label}>Age:</Typography>
                    <Typography variant="body1" gutterBottom sx={textStyles.body}>{data.age}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={textStyles.label}>Location:</Typography>
                    <Typography variant="body1" gutterBottom sx={textStyles.body}>
                      {data.city}, {data.country}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={textStyles.label}>Current SAT Score:</Typography>
                    <Typography variant="body1" gutterBottom sx={textStyles.body}>
                      {data.hasSatScoreReport ? 'To be provided later' : data.satScore}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={textStyles.label}>Target SAT Score:</Typography>
                    <Typography variant="body1" gutterBottom sx={textStyles.body}>{data.targetSatScore}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={textStyles.label}>Motivation:</Typography>
                    <Typography variant="body1" gutterBottom sx={textStyles.body}>{data.motivation}</Typography>
                  </Grid>
                  {data.scoreReport && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" sx={textStyles.label}>SAT Score Report:</Typography>
                      <Paper variant="outlined" sx={{ 
                        p: 2, 
                        maxHeight: '100px', 
                        overflow: 'auto',
                        background: 'rgba(30, 30, 30, 0.8)', // Even lighter surface for nested elevation
                        borderColor: 'rgba(136, 212, 152, 0.2)'
                      }}>
                        <Typography variant="body2" sx={{ 
                          whiteSpace: 'pre-wrap',
                          ...textStyles.body,
                          fontSize: '0.85rem'
                        }}>
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
      
      case 8: // Subscription
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h4" align="center" gutterBottom sx={textStyles.heading}>
                Choose Your Plan
              </Typography>
              <Typography variant="body1" align="center" paragraph sx={textStyles.body}>
                Select the subscription plan that works best for you.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <SubscriptionPlans 
                onSelectPlan={(planType) => {
                  setData({ ...data, subscriptionPlan: planType });
                }} 
              />
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
    'Review',
    'Subscription'
  ];

  // Background style for current step
  const getBackgroundStyle = () => {
    return {
      background: 'linear-gradient(135deg, #121212 0%, #1e3a34 100%)', // Using recommended dark theme surface color
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
          background: 'linear-gradient(135deg, #121212 0%, #1e3a34 100%)' // Using recommended dark theme surface color
        }}
      >
        <CircularProgress size={60} sx={{ color: 'rgba(136, 212, 152, 0.9)' }} />
        <Typography variant="h6" sx={{ mt: 3, ...textStyles.heading }}>
          Saving your information and preparing your custom experience...
        </Typography>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={getBackgroundStyle()}>
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: { xs: 2, sm: 4 }, 
              borderRadius: 2, 
              background: 'rgba(33, 33, 33, 0.95)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              color: 'rgba(255, 255, 255, 0.87)'
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
              <Typography variant="body2" sx={textStyles.body}>
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
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.87)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.08)'
                  }
                }}
                style={{ opacity: activeStep === 0 ? 0 : 1 }}
              >
                Back
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button 
                  variant="contained" 
                  onClick={handleSubmit}
                  endIcon={<CheckCircleOutlineIcon />}
                  sx={{
                    background: 'linear-gradient(90deg, #1a936f 0%, #114b5f 100%)',
                    color: 'rgba(255, 255, 255, 0.95)',
                    fontWeight: 500,
                    padding: '10px 24px',
                    '&:hover': {
                      background: 'linear-gradient(90deg, #114b5f 0%, #1a936f 100%)',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
                    }
                  }}
                >
                  Complete & Go to Dashboard
                </Button>
              ) : (
                <Button 
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForwardIcon />}
                  disabled={activeStep === 6 && processingReport}
                  sx={{
                    background: 'linear-gradient(90deg, #1a936f 0%, #114b5f 100%)',
                    color: 'rgba(255, 255, 255, 0.95)',
                    fontWeight: 500,
                    padding: '10px 24px',
                    '&:hover': {
                      background: 'linear-gradient(90deg, #114b5f 0%, #1a936f 100%)',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
                    },
                    '&.Mui-disabled': {
                      background: 'rgba(136, 212, 152, 0.2)',
                      color: 'rgba(255, 255, 255, 0.38)'
                    }
                  }}
                >
                  Next
                </Button>
              )}
            </Box>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default OnboardingFlow; 