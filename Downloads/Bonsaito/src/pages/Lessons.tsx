import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Paper, 
  Tabs, 
  Tab, 
  CircularProgress,
  Button,
  Divider,
  Alert
} from '@mui/material';
import { Link } from 'react-router-dom';
import VideoLesson from '../components/VideoLesson';
import { useSkills } from '../components/SkillsProvider';

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  duration: number;
  skillId: string;
  skillName: string;
  tutor: {
    name: string;
    title: string;
    avatar?: string;
  };
  completed: boolean;
}

const Lessons: React.FC = () => {
  const { skills } = useSkills();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('recommended');
  const [completedVideos, setCompletedVideos] = useState<string[]>([]);

  // Fetch videos on component mount
  useEffect(() => {
    // In a real app, we would call the API to get videos
    // Mock data for development
    const mockVideos: Video[] = [
      {
        id: 'v1',
        title: 'Mastering Semicolons in Complex Sentences',
        description: 'Learn when and how to use semicolons to join independent clauses and in lists with internal commas.',
        thumbnail: 'https://via.placeholder.com/640x360?text=Semicolons',
        videoUrl: 'https://example.com/videos/semicolons.mp4',
        duration: 380, // 6:20
        skillId: 'sec-pun-semi',
        skillName: 'Semicolon Usage',
        tutor: {
          name: 'Dr. Emily Chen',
          title: 'English Professor, Stanford University',
          avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
        },
        completed: false
      },
      {
        id: 'v2',
        title: 'Fixing Run-on Sentences: Simple Strategies',
        description: 'Learn three reliable methods for fixing run-on sentences and comma splices in your writing.',
        thumbnail: 'https://via.placeholder.com/640x360?text=Run-on+Sentences',
        videoUrl: 'https://example.com/videos/runonsentences.mp4',
        duration: 412, // 6:52
        skillId: 'sec-sent-run',
        skillName: 'Fixing Run-on Sentences',
        tutor: {
          name: 'James Wilson',
          title: 'SAT Verbal Coach, 15+ years experience',
          avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
        },
        completed: false
      },
      {
        id: 'v3',
        title: 'Mastering Quadratic Equations',
        description: 'Learn multiple approaches to solving quadratic equations, including factoring, completing the square, and the quadratic formula.',
        thumbnail: 'https://via.placeholder.com/640x360?text=Quadratic+Equations',
        videoUrl: 'https://example.com/videos/quadratics.mp4',
        duration: 623, // 10:23
        skillId: 'math-alg-quad',
        skillName: 'Quadratic Equations',
        tutor: {
          name: 'Dr. Robert Martinez',
          title: 'Math Department Chair, PrepAcademy',
          avatar: 'https://randomuser.me/api/portraits/men/67.jpg'
        },
        completed: false
      },
      {
        id: 'v4',
        title: 'Exponents and Radicals Simplified',
        description: 'Master the rules of exponents and learn to simplify radical expressions efficiently.',
        thumbnail: 'https://via.placeholder.com/640x360?text=Exponents+and+Radicals',
        videoUrl: 'https://example.com/videos/exponents.mp4',
        duration: 545, // 9:05
        skillId: 'math-alg-exp',
        skillName: 'Exponents and Radicals',
        tutor: {
          name: 'Sarah Johnson',
          title: 'Math Specialist, Khan Academy Contributor',
          avatar: 'https://randomuser.me/api/portraits/women/22.jpg'
        },
        completed: false
      },
      {
        id: 'v5',
        title: 'Verb Tense Consistency: Common Pitfalls',
        description: 'Learn to maintain consistent verb tenses in your writing and avoid common tense-shifting errors.',
        thumbnail: 'https://via.placeholder.com/640x360?text=Verb+Tense+Consistency',
        videoUrl: 'https://example.com/videos/verbtenses.mp4',
        duration: 325, // 5:25
        skillId: 'sec-gram-tense',
        skillName: 'Verb Tense Consistency',
        tutor: {
          name: 'Dr. Emily Chen',
          title: 'English Professor, Stanford University',
          avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
        },
        completed: false
      }
    ];

    // Sort videos to prioritize those for weaker skills
    const sortedVideos = [...mockVideos].sort((a, b) => {
      const skillA = skills.find(s => s.id === a.skillId);
      const skillB = skills.find(s => s.id === b.skillId);
      
      // If skill not found or mastered, put at end
      if (!skillA || skillA.mastered) return 1;
      if (!skillB || skillB.mastered) return -1;
      
      // Sort by mastery level (lower first)
      return skillA.masteryLevel - skillB.masteryLevel;
    });
    
    setVideos(sortedVideos);
    setLoading(false);
  }, [skills]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  const handleVideoComplete = (videoId: string) => {
    // Mark video as completed
    setCompletedVideos(prev => [...prev, videoId]);
    
    // Update video list
    setVideos(prevVideos => 
      prevVideos.map(video => 
        video.id === videoId ? { ...video, completed: true } : video
      )
    );
    
    // In a real app, we would update the user's progress in the backend
  };

  // Filter videos based on active tab
  const filteredVideos = videos.filter(video => {
    if (activeTab === 'recommended') {
      const skill = skills.find(s => s.id === video.skillId);
      return skill && !skill.mastered;
    } else if (activeTab === 'completed') {
      return completedVideos.includes(video.id) || video.completed;
    } else if (activeTab === 'all') {
      return true;
    }
    return false;
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Your Video Lessons
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Watch expert-led video lessons tailored to your skill gaps. Each video is crafted by top tutors to help you master specific SAT skills.
      </Typography>
      
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Recommended For You" value="recommended" />
          <Tab label="Completed" value="completed" />
          <Tab label="All Lessons" value="all" />
        </Tabs>
      </Paper>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredVideos.length > 0 ? (
        <Grid container spacing={4}>
          {filteredVideos.map(video => (
            <Grid item xs={12} key={video.id}>
              <VideoLesson
                id={video.id}
                title={video.title}
                description={video.description}
                thumbnail={video.thumbnail}
                videoUrl={video.videoUrl}
                duration={video.duration}
                tutor={video.tutor}
                skillName={video.skillName}
                completed={completedVideos.includes(video.id) || video.completed}
                onComplete={handleVideoComplete}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', my: 6 }}>
          {activeTab === 'recommended' ? (
            <Alert severity="success" sx={{ mb: 3 }}>
              Great job! You've mastered all your current skills. Take another practice test to uncover more areas to improve.
            </Alert>
          ) : activeTab === 'completed' ? (
            <Alert severity="info" sx={{ mb: 3 }}>
              You haven't completed any video lessons yet. Start watching to grow your skills.
            </Alert>
          ) : (
            <Alert severity="warning" sx={{ mb: 3 }}>
              No video lessons are available at this time.
            </Alert>
          )}
          
          <Button 
            variant="contained" 
            component={Link} 
            to="/upload"
            size="large"
            sx={{ mt: 2 }}
          >
            Upload a New Practice Test
          </Button>
        </Box>
      )}
      
      <Divider sx={{ my: 6 }} />
      
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Want to track your progress?
        </Typography>
        <Typography variant="body1" paragraph>
          Check your Bonsai Tree on the dashboard to see how your skills are growing.
        </Typography>
        <Button 
          variant="outlined" 
          component={Link} 
          to="/dashboard"
        >
          View Your Bonsai Tree
        </Button>
      </Box>
    </Container>
  );
};

export default Lessons; 