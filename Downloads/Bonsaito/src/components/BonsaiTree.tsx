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
  
  const masteredSkillsCount = useMemo(() => {
    return skills.filter(skill => skill.mastered).length;
  }, [skills]);

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

  // Simplified branch generation
  const branches = useMemo(() => {
    const categories = Object.keys(skillsByCategory);
    const numCategories = categories.length;
    if (numCategories === 0) return [];

    return categories.map((category, index) => {
      const categorySkills = skillsByCategory[category];
      const masteredInCategory = categorySkills.filter(s => s.mastered).length;
      
      // Base angle distribution
      let angle;
      if (numCategories === 1) {
        angle = -Math.PI / 2; // Straight up
      } else if (numCategories === 2) {
        angle = -Math.PI / 2 + (index === 0 ? -0.6 : 0.6); // Left and right
      } else {
         // Distribute branches: one more central, others to sides
        if (index === 0 && numCategories % 2 !== 0) { // Middle branch for odd numbers
            angle = -Math.PI / 2;
        } else {
            const sideIndex = numCategories % 2 === 0 ? index : (index > 0 ? index -1 : index);
            const effectiveNumCategories = numCategories % 2 === 0 ? numCategories : numCategories -1;
            const angleOffset = (Math.PI / 2.5) / (effectiveNumCategories > 1 ? effectiveNumCategories -1 : 1);
            angle = -Math.PI / 2 + (sideIndex - (effectiveNumCategories-1)/2) * angleOffset * 1.8;

        }
      }
      
      const branchLength = 60 + (categorySkills.length * 5); // Adjusted length
      
      return {
        category,
        x1: 150,
        y1: 300, // Trunk top
        x2: 150 + Math.cos(angle) * branchLength,
        y2: 300 + Math.sin(angle) * branchLength,
        skills: categorySkills,
        masteredCount: masteredInCategory,
        totalCount: categorySkills.length,
        angle,
        thickness: 15 + (categorySkills.length * 0.5) // Dynamic thickness
      };
    });
  }, [skillsByCategory]);

  return (
    <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: '20px', backgroundColor: '#f7f7f7' }}>
      <Typography variant="h5" gutterBottom align="center" sx={{ fontWeight: 'bold', color: '#555' }}>
        Your Growth Tree
      </Typography>
      
      <Box sx={{ 
        width: '100%', 
        height: 350, // Adjusted height
        position: 'relative',
        mt: 2
      }}>
        <svg width="100%" height="100%" viewBox="0 0 300 400">
          {/* Pot */}
          <path d="M100,380 Q150,395 200,380 L190,350 Q150,360 110,350 Z" fill="#A08C7D" />
          <rect x="105" y="340" width="90" height="15" rx="5" ry="5" fill="#B5A090" />

          {/* Tree trunk */}
          <path 
            d="M140,340 C135,280 140,220 150,180 C160,220 165,280 160,340 Z" 
            fill="#8B5A2B" 
          />
          
          {/* Branches and Leaves */}
          {branches.map((branch, index) => (
            <g key={`branch-${index}`}>
              <line
                x1={branch.x1}
                y1={branch.y1}
                x2={branch.x2}
                y2={branch.y2}
                stroke="#8B5A2B"
                strokeWidth={branch.thickness}
                strokeLinecap="round"
              />
              
              {branch.skills.map((skill, skillIndex) => {
                // Position leaves along the branch
                const numLeaves = branch.skills.length;
                const t = (skillIndex + 1) / (numLeaves + 1); // Distribute along branch
                
                const leafX = branch.x1 * (1-t) + branch.x2 * t;
                const leafY = branch.y1 * (1-t) + branch.y2 * t;

                // Offset leaves slightly from the branch
                const offsetAngle = branch.angle + (Math.PI / 2) * (skillIndex % 2 === 0 ? 1 : -1);
                const offsetDistance = 10 + (skill.masteryLevel / 20);


                const finalX = leafX + Math.cos(offsetAngle) * offsetDistance;
                const finalY = leafY + Math.sin(offsetAngle) * offsetDistance;
                
                const leafColor = skill.mastered ? '#2E7D32' : '#66BB6A'; // Darker green for mastered

                // Simple oval leaves for now, matching general shape
                return (
                  <ellipse
                    key={`skill-${skill.id}`}
                    cx={finalX}
                    cy={finalY}
                    rx="12" // Leaf width
                    ry="8"  // Leaf height
                    fill={leafColor}
                    transform={`rotate(${branch.angle * (180 / Math.PI) + (skillIndex % 2 === 0 ? 30 : -30)}, ${finalX}, ${finalY})`}
                  >
                    <title>{skill.name} ({skill.mastered ? 'Mastered' : `Level: ${skill.masteryLevel}`})</title>
                  </ellipse>
                );
              })}
            </g>
          ))}
        </svg>
      </Box>
      <Typography variant="body1" align="center" sx={{ mt: 2, color: '#666' }}>
        You've mastered {masteredSkillsCount} skills so far! Keep growing!
      </Typography>
    </Paper>
  );
};

export default BonsaiTree;

 