import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  Skeleton,
  Paper,
  Alert,
  Button,
  ChipProps
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HistoryIcon from '@mui/icons-material/History';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { supabase } from '../supabaseClient';
import { format } from 'date-fns';

interface TestHistory {
  id: string;
  name: string;
  date: string;
  correctAnswers: number;
  totalQuestions: number;
  source: string;
}

interface TestHistoryListProps {
  maxItems?: number;
  showTitle?: boolean;
}

const TestHistoryList: React.FC<TestHistoryListProps> = ({ 
  maxItems = 5,
  showTitle = true
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [testHistory, setTestHistory] = useState<TestHistory[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTestHistory = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError('User not logged in');
          return;
        }
        
        // Get completed tests with aggregated data
        const { data, error } = await supabase
          .from('practice_questions')
          .select('*')
          .eq('user_id', user.id)
          .eq('completed', true)
          .order('completed_at', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        // Group by source and completed_at date (using the date part only)
        const testGroups: Record<string, any[]> = {};
        data.forEach(item => {
          const date = item.completed_at ? new Date(item.completed_at).toDateString() : 'Unknown';
          const key = `${item.source || 'unknown'}-${date}`;
          
          if (!testGroups[key]) {
            testGroups[key] = [];
          }
          
          testGroups[key].push(item);
        });
        
        // Convert grouped data to TestHistory items
        const historyItems: TestHistory[] = Object.entries(testGroups).map(([key, items]) => {
          const [source, dateStr] = key.split('-');
          const date = dateStr !== 'Unknown' ? new Date(dateStr) : new Date();
          const correctAnswers = items.filter(item => item.correct === true).length;
          
          return {
            id: key,
            name: getTestName(source, date),
            date: items[0].completed_at || date.toISOString(),
            correctAnswers,
            totalQuestions: items.length,
            source
          };
        });
        
        // Sort by date (newest first) and limit to maxItems
        historyItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTestHistory(historyItems.slice(0, maxItems));
      } catch (err: any) {
        console.error('Error fetching test history:', err);
        setError(err.message || 'Failed to load test history');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTestHistory();
  }, [maxItems]);
  
  // Generate a human-readable test name
  const getTestName = (source: string, date: Date): string => {
    switch (source) {
      case 'skill_quiz':
        return 'Skill Assessment Quiz';
      case 'onboarding':
        return 'Initial Assessment';
      case 'upload':
        return 'SAT Score Report Upload';
      default:
        return 'Practice Test';
    }
  };
  
  // Get color for performance chip
  const getPerformanceColor = (correct: number, total: number): ChipProps['color'] => {
    const percentage = (correct / total) * 100;
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'info';
    if (percentage >= 40) return 'warning';
    return 'error';
  };
  
  if (isLoading) {
    return (
      <Box sx={{ mt: 2 }}>
        {showTitle && (
          <Typography variant="h6" gutterBottom>
            Test History
          </Typography>
        )}
        {Array.from(new Array(3)).map((_, index) => (
          <Box key={index} sx={{ mb: 2 }}>
            <Skeleton variant="rectangular" height={60} />
          </Box>
        ))}
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }
  
  if (testHistory.length === 0) {
    return (
      <Box sx={{ mt: 2 }}>
        {showTitle && (
          <Typography variant="h6" gutterBottom>
            Test History
          </Typography>
        )}
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="textSecondary">
            No test history available yet.
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Complete practice tests or upload score reports to see your history here.
          </Typography>
        </Paper>
      </Box>
    );
  }
  
  return (
    <Box sx={{ mt: 2 }}>
      {showTitle && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <HistoryIcon sx={{ mr: 1 }} />
          <Typography variant="h6">
            Test History
          </Typography>
        </Box>
      )}
      
      <List>
        {testHistory.map((test, index) => (
          <React.Fragment key={test.id}>
            {index > 0 && <Divider component="li" />}
            <ListItem 
              alignItems="flex-start"
              sx={{ 
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                }
              }}
            >
              <ListItemIcon>
                <AssignmentIcon />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1">
                      {test.name}
                    </Typography>
                    <Chip 
                      size="small"
                      label={`${test.correctAnswers}/${test.totalQuestions}`}
                      color={getPerformanceColor(test.correctAnswers, test.totalQuestions)}
                    />
                  </Box>
                }
                secondary={
                  <>
                    <Typography
                      component="span"
                      variant="body2"
                      color="textSecondary"
                    >
                      {format(new Date(test.date), 'PPP')}
                    </Typography>
                    {test.correctAnswers === test.totalQuestions && (
                      <Chip 
                        size="small" 
                        icon={<EmojiEventsIcon fontSize="small" />} 
                        label="Perfect Score" 
                        sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                        color="success"
                      />
                    )}
                  </>
                }
              />
            </ListItem>
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default TestHistoryList; 