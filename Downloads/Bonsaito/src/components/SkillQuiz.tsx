import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Radio, 
  RadioGroup, 
  FormControlLabel, 
  LinearProgress,
  Divider,
  Alert
} from '@mui/material';
import { useSkills } from './SkillsProvider';

interface Question {
  id: string;
  text: string;
  options: { id: string; text: string }[];
  skillId: string;
  skillName: string;
}

interface QuizResponse {
  questionId: string;
  selectedOption: string;
  isCorrect: boolean;
}

interface SkillQuizProps {
  onComplete: (results: { skillId: string; score: number }[]) => void;
  onClose: () => void;
}

const SkillQuiz: React.FC<SkillQuizProps> = ({ onComplete, onClose }) => {
  const { skills, updateSkillProgress } = useSkills();
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Generate quiz questions based on user's skill weaknesses
  useEffect(() => {
    // In a real app, we would call an API to get questions based on skills
    // For now, we'll generate some mock questions for skills with lower mastery
    
    const weakSkills = skills.filter(skill => skill.masteryLevel < 80);
    const quizSkills = weakSkills.length > 0 ? weakSkills : skills.slice(0, 3);
    
    // Create 2 questions for each selected skill
    const generatedQuestions: Question[] = [];
    
    quizSkills.forEach(skill => {
      // Generate 2 questions per skill
      for (let i = 0; i < 2; i++) {
        generatedQuestions.push({
          id: `q-${skill.id}-${i}`,
          text: `Sample question ${i+1} for ${skill.name}. This is where a real SAT-style question would be displayed, targeting this specific skill.`,
          options: [
            { id: 'A', text: 'Sample answer option A' },
            { id: 'B', text: 'Sample answer option B' },
            { id: 'C', text: 'Sample answer option C' },
            { id: 'D', text: 'Sample answer option D' }
          ],
          skillId: skill.id,
          skillName: skill.name
        });
      }
    });
    
    // Shuffle questions
    const shuffledQuestions = [...generatedQuestions].sort(() => Math.random() - 0.5);
    
    // Limit to 10 questions maximum
    setQuizQuestions(shuffledQuestions.slice(0, 10));
    setLoading(false);
  }, [skills]);

  const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(event.target.value);
  };

  const handleNext = () => {
    if (!selectedOption) return;

    // Record response
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const isCorrect = Math.random() < 0.5; // Randomly determine if correct (mock behavior)
    
    setResponses([
      ...responses, 
      {
        questionId: currentQuestion.id,
        selectedOption,
        isCorrect
      }
    ]);

    // Reset selected option
    setSelectedOption('');

    // Move to next question or complete quiz
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      completeQuiz();
    }
  };

  const completeQuiz = () => {
    setQuizCompleted(true);
    
    // Calculate scores by skill
    const skillScores: { [key: string]: { correct: number; total: number } } = {};
    
    // Initialize skill scores
    quizQuestions.forEach(question => {
      if (!skillScores[question.skillId]) {
        skillScores[question.skillId] = { correct: 0, total: 0 };
      }
    });
    
    // Count correct answers by skill
    responses.forEach((response, index) => {
      const question = quizQuestions[index];
      skillScores[question.skillId].total++;
      
      if (response.isCorrect) {
        skillScores[question.skillId].correct++;
      }
    });
    
    // Calculate percentage scores and update skills
    const results = Object.entries(skillScores).map(([skillId, { correct, total }]) => {
      const score = Math.round((correct / total) * 100);
      
      // Update skill progress in context
      updateSkillProgress(skillId, score);
      
      return { skillId, score };
    });
    
    // Call the onComplete callback with results
    onComplete(results);
  };

  if (loading) {
    return <LinearProgress />;
  }

  if (quizQuestions.length === 0) {
    return (
      <Alert severity="info">
        No quiz questions are available at this time.
      </Alert>
    );
  }

  if (quizCompleted) {
    // Results will be shown by parent component
    return null;
  }

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        Custom Skill Quiz
      </Typography>
      
      <LinearProgress 
        variant="determinate" 
        value={progress} 
        sx={{ mb: 3, height: 10, borderRadius: 5 }}
      />
      
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Question {currentQuestionIndex + 1} of {quizQuestions.length}
      </Typography>
      
      <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block' }}>
        Testing skill: {currentQuestion.skillName}
      </Typography>
      
      <Divider sx={{ mb: 3 }} />
      
      <Typography variant="body1" sx={{ mb: 3 }}>
        {currentQuestion.text}
      </Typography>
      
      <RadioGroup
        value={selectedOption}
        onChange={handleOptionChange}
        sx={{ mb: 3 }}
      >
        {currentQuestion.options.map(option => (
          <FormControlLabel
            key={option.id}
            value={option.id}
            control={<Radio />}
            label={`${option.id}. ${option.text}`}
            sx={{ mb: 1 }}
          />
        ))}
      </RadioGroup>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          disabled={currentQuestionIndex === 0}
          onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
        >
          Previous
        </Button>
        <Button
          variant="contained"
          disabled={!selectedOption}
          onClick={handleNext}
        >
          {currentQuestionIndex === quizQuestions.length - 1 ? 'Complete Quiz' : 'Next'}
        </Button>
      </Box>
    </Paper>
  );
};

export default SkillQuiz; 