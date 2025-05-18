import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Radio, 
  RadioGroup, 
  FormControlLabel, 
  FormControl, 
  Divider, 
  Chip, 
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import { supabase } from '../supabaseClient';
import { GeneratedQuestion } from '../services/geminiPdfService';

interface PracticeQuestionsProps {
  userId: string;
}

const PracticeQuestions: React.FC<PracticeQuestionsProps> = ({ userId }) => {
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch practice questions for the user
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('practice_questions')
          .select('*')
          .eq('user_id', userId)
          .eq('completed', false)
          .order('created_at', { ascending: true });

        if (error) throw error;
        
        if (data && data.length > 0) {
          // Extract question data from the records
          const extractedQuestions = data.map(record => record.question_data as GeneratedQuestion);
          setQuestions(extractedQuestions);
        } else {
          // No questions found
          setError('No practice questions found. Upload an SAT report to generate questions.');
        }
      } catch (error: any) {
        console.error('Error fetching practice questions:', error);
        setError(error.message || 'Failed to load practice questions');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchQuestions();
    }
  }, [userId]);

  // Get the current question
  const currentQuestion = questions[currentQuestionIndex];

  // Handle answer selection
  const handleAnswerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedAnswer(event.target.value);
  };

  // Check the answer
  const checkAnswer = () => {
    if (!selectedAnswer || !currentQuestion) return;
    
    setSubmitting(true);
    
    const correctAnswerLetter = currentQuestion.answer?.split(')')[0].trim() || '';
    const isCorrect = selectedAnswer.startsWith(correctAnswerLetter);
    
    setIsAnswerCorrect(isCorrect);
    setShowExplanation(true);
    
    // Update the question status in the database
    updateQuestionStatus(isCorrect);
  };

  // Update question status in the database
  const updateQuestionStatus = async (isCorrect: boolean) => {
    try {
      const { data, error } = await supabase
        .from('practice_questions')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
          correct: isCorrect,
          user_answer: selectedAnswer
        })
        .eq('user_id', userId)
        .eq('question_data->id', currentQuestion.id);
      
      if (error) throw error;
      
      setSubmitting(false);
    } catch (error: any) {
      console.error('Error updating question status:', error);
      setSubmitting(false);
    }
  };

  // Move to the next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer('');
      setShowExplanation(false);
      setIsAnswerCorrect(null);
    }
  };

  // Reset to try the same question again
  const handleTryAgain = () => {
    setSelectedAnswer('');
    setShowExplanation(false);
    setIsAnswerCorrect(null);
  };

  // Render difficulty chip with appropriate color
  const renderDifficultyChip = (difficulty: string) => {
    let color: 'success' | 'warning' | 'error' = 'success';
    
    switch (difficulty.toLowerCase()) {
      case 'easy':
        color = 'success';
        break;
      case 'medium':
        color = 'warning';
        break;
      case 'hard':
        color = 'error';
        break;
      default:
        color = 'success';
    }
    
    return (
      <Chip 
        label={difficulty} 
        color={color} 
        size="small" 
        sx={{ fontWeight: 'bold' }} 
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  if (questions.length === 0) {
    return (
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          No practice questions available
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Upload your SAT score report to generate personalized practice questions.
        </Typography>
        <Button variant="contained" color="primary" href="/upload">
          Upload Score Report
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 6 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Practice Questions ({currentQuestionIndex + 1}/{questions.length})
      </Typography>
      
      {currentQuestion && (
        <Card elevation={3} sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Chip 
                label={currentQuestion.topic} 
                color="primary" 
                sx={{ fontWeight: 'medium' }} 
              />
              {currentQuestion.difficulty && renderDifficultyChip(currentQuestion.difficulty)}
            </Box>
            
            <Typography variant="h6" component="div" gutterBottom sx={{ fontWeight: 'bold' }}>
              {currentQuestion.text}
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              <FormControl component="fieldset" sx={{ width: '100%' }}>
                <RadioGroup
                  name="answer-options"
                  value={selectedAnswer}
                  onChange={handleAnswerChange}
                >
                  {currentQuestion.options?.map((option, index) => (
                    <FormControlLabel
                      key={index}
                      value={option}
                      control={
                        <Radio 
                          disabled={showExplanation}
                          sx={{ 
                            '&.Mui-checked': { 
                              color: showExplanation && option === currentQuestion.answer 
                                ? 'success.main' 
                                : undefined 
                            }
                          }}
                        />
                      }
                      label={option}
                      sx={{
                        mt: 1,
                        p: 1,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                        backgroundColor: showExplanation && option === currentQuestion.answer 
                          ? 'rgba(76, 175, 80, 0.1)' 
                          : showExplanation && option === selectedAnswer && option !== currentQuestion.answer 
                            ? 'rgba(244, 67, 54, 0.1)' 
                            : undefined,
                        transition: 'all 0.2s ease-in-out'
                      }}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Box>
            
            {showExplanation && (
              <Box sx={{ mt: 4 }}>
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  {isAnswerCorrect ? (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      Correct! Great job!
                    </Alert>
                  ) : (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      Not quite right. The correct answer is {currentQuestion.answer}.
                    </Alert>
                  )}
                </Box>
                
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Explanation:
                </Typography>
                <Typography variant="body1" paragraph>
                  {currentQuestion.explanation}
                </Typography>
              </Box>
            )}
          </CardContent>
          
          <CardActions sx={{ p: 2, pt: 0 }}>
            {!showExplanation ? (
              <Button 
                variant="contained" 
                color="primary" 
                onClick={checkAnswer}
                disabled={!selectedAnswer || submitting}
                fullWidth
                sx={{ mt: 2 }}
              >
                {submitting ? <CircularProgress size={24} /> : 'Check Answer'}
              </Button>
            ) : (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {!isAnswerCorrect && (
                  <Grid item xs={12} sm={6}>
                    <Button 
                      variant="outlined" 
                      onClick={handleTryAgain}
                      fullWidth
                    >
                      Try Again
                    </Button>
                  </Grid>
                )}
                <Grid item xs={12} sm={isAnswerCorrect ? 12 : 6}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex >= questions.length - 1}
                    fullWidth
                  >
                    {currentQuestionIndex >= questions.length - 1 ? 'Completed!' : 'Next Question'}
                  </Button>
                </Grid>
              </Grid>
            )}
          </CardActions>
        </Card>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Your progress is automatically saved.
        </Typography>
      </Box>
    </Box>
  );
};

export default PracticeQuestions; 