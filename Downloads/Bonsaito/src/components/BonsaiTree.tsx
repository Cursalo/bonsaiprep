import React, { useMemo } from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';

interface Skill {
  id: string;
  name: string;
  category: string;
  mastered: boolean;
  masteryLevel: number;
}

interface BonsaiTreeProps {
  skills: Skill[];
  totalSkills: number;
}

const BonsaiTree: React.FC<BonsaiTreeProps> = ({ skills, totalSkills }) => {
  const theme = useTheme();
  
  // Calculate mastery percentage
  const masteryPercentage = useMemo(() => {
    const masteredSkills = skills.filter(skill => skill.mastered).length;
    return Math.round((masteredSkills / totalSkills) * 100);
  }, [skills, totalSkills]);

  // Group skills by category
  const skillsByCategory = useMemo(() => {
    return skills.reduce((acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = [];
      }
      acc[skill.category].push(skill);
      return acc;
    }, {} as Record<string, Skill[]>);
  }, [skills]);

  // Map categories to branches
  const branches = useMemo(() => {
    return Object.entries(skillsByCategory).map(([category, skills], index) => {
      const angle = (index * (Math.PI / (Object.keys(skillsByCategory).length - 1))) - Math.PI/2;
      const masteredInCategory = skills.filter(s => s.mastered).length;
      const branchLength = Math.max(30, (masteredInCategory / skills.length) * 100);
      
      return {
        category,
        x1: 150,
        y1: 300,
        x2: 150 + Math.cos(angle) * branchLength,
        y2: 300 + Math.sin(angle) * branchLength,
        skills,
        masteredCount: masteredInCategory,
        totalCount: skills.length,
        angle
      };
    });
  }, [skillsByCategory]);

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" gutterBottom align="center">
        Your Bonsai Learning Tree
      </Typography>
      
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="h4" color="primary">
          {masteryPercentage}%
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Skills Mastered
        </Typography>
      </Box>
      
      <Box sx={{ 
        width: '100%', 
        height: 400, 
        position: 'relative',
        borderRadius: 2
      }}>
        <svg width="100%" height="100%" viewBox="0 0 300 400">
          {/* Tree trunk */}
          <rect x="145" y="300" width="10" height="80" fill="#8B4513" />
          
          {/* Base/Ground */}
          <ellipse cx="150" cy="380" rx="40" ry="10" fill="#8D6E63" />
          
          {/* Branches */}
          {branches.map((branch, index) => (
            <g key={index}>
              <line
                x1={branch.x1}
                y1={branch.y1}
                x2={branch.x2}
                y2={branch.y2}
                stroke="#8B4513"
                strokeWidth={4 * (branch.masteredCount / branch.totalCount + 0.1)}
              />
              
              {/* Leaves/Skills */}
              {branch.skills.map((skill, skillIndex) => {
                const skillAngle = branch.angle + (skillIndex - branch.skills.length/2) * 0.2;
                const distance = 20 + skillIndex * 5;
                const x = branch.x1 + Math.cos(skillAngle) * distance;
                const y = branch.y1 + Math.sin(skillAngle) * distance;
                
                return (
                  <g key={`skill-${skill.id}`}>
                    <circle
                      cx={x}
                      cy={y}
                      r={skill.mastered ? 8 : 5}
                      fill={skill.mastered ? theme.palette.primary.main : '#A5D6A7'}
                      opacity={skill.mastered ? 1 : 0.7}
                    >
                      <title>{skill.name}</title>
                    </circle>
                  </g>
                );
              })}
            </g>
          ))}
          
          {/* Tree root base */}
          <path 
            d="M135,380 Q120,390 110,380 Q130,370 150,380 Q170,370 190,380 Q180,390 165,380" 
            fill="#5D4037" 
          />
        </svg>
        
        {/* Tree legend */}
        <Box 
          sx={{ 
            position: 'absolute', 
            bottom: 10, 
            right: 10,
            backgroundColor: 'rgba(255,255,255,0.7)', 
            p: 1,
            borderRadius: 1
          }}
        >
          <Typography variant="caption" display="block">
            <Box component="span" sx={{ 
              display: 'inline-block', 
              width: 10, 
              height: 10, 
              borderRadius: '50%', 
              backgroundColor: theme.palette.primary.main,
              mr: 1
            }}/>
            Mastered Skills
          </Typography>
          <Typography variant="caption" display="block">
            <Box component="span" sx={{ 
              display: 'inline-block', 
              width: 10, 
              height: 10, 
              borderRadius: '50%', 
              backgroundColor: '#A5D6A7',
              opacity: 0.7,
              mr: 1
            }}/>
            Skills In Progress
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default BonsaiTree;

 