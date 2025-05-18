import React, { useMemo, useEffect, useState } from 'react';
import { Box, Typography, Paper, useTheme, Tooltip } from '@mui/material';

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
  const [animation, setAnimation] = useState<boolean>(false);
  const [recentlyMastered, setRecentlyMastered] = useState<string[]>([]);
  
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

  // Track skills that were recently mastered
  useEffect(() => {
    const previouslyMastered = recentlyMastered;
    const currentlyMastered = skills.filter(skill => skill.mastered).map(skill => skill.id);
    
    // Find newly mastered skills
    const newlyMastered = currentlyMastered.filter(id => !previouslyMastered.includes(id));
    
    if (newlyMastered.length > 0) {
      setRecentlyMastered(currentlyMastered);
      setAnimation(true);
      
      // Reset animation state after animation completes
      const timer = setTimeout(() => {
        setAnimation(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [skills, recentlyMastered]);

  // Calculate tree health/vitality based on mastery
  const treeVitality = useMemo(() => {
    const healthPercentage = masteryPercentage;
    
    // Define tree colors based on health
    const leafBaseColor = healthPercentage < 30 
      ? '#A5D6A7' // Pale green for low mastery
      : healthPercentage < 60 
        ? '#81C784' // Medium green
        : '#4CAF50'; // Vibrant green for high mastery
        
    const trunkColor = healthPercentage < 40
      ? '#8D6E63' // Lighter brown for younger tree
      : healthPercentage < 70
        ? '#795548' // Medium brown
        : '#5D4037'; // Dark rich brown for mature tree
        
    // Calculate trunk width based on total mastered skills
    const trunkWidth = 10 + (masteryPercentage / 10);
    
    // Calculate trunk height - grows as tree masters more skills
    const trunkHeight = 80 + (masteryPercentage / 2);
    
    return { 
      leafBaseColor, 
      trunkColor, 
      trunkWidth, 
      trunkHeight,
      canopy: 100 + masteryPercentage * 1.5 // Size of the canopy grows with mastery
    };
  }, [masteryPercentage]);

  // Map categories to branches
  const branches = useMemo(() => {
    return Object.entries(skillsByCategory).map(([category, skills], index) => {
      const numCategories = Object.keys(skillsByCategory).length;
      // Distribute branches in a more natural, asymmetric way
      let angle;
      if (numCategories === 1) {
        angle = -Math.PI/2; // Just one branch pointing up
      } else if (numCategories === 2) {
        angle = (index === 0) ? -Math.PI/2 - 0.5 : -Math.PI/2 + 0.5;
      } else {
        // Distribute branches over about 200 degrees (not a full circle)
        const angleRange = Math.PI * 1.1; // ~200 degrees
        const angleOffset = -Math.PI/2 - angleRange/2; // Center around top
        angle = angleOffset + (index * (angleRange / (numCategories - 1)));
      }
      
      const masteredInCategory = skills.filter(s => s.mastered).length;
      const categoryProgress = skills.length > 0 ? masteredInCategory / skills.length : 0;
      
      // Branch length based on category progress and total skills in category
      const baseLength = 30 + (skills.length * 3); // Base length depends on how many skills
      const progressBoost = 70 * categoryProgress; // Additional length from mastery
      const branchLength = baseLength + progressBoost;
      
      // Add a slight curve to the branches for more natural look
      const curveControl = {
        x: 150 + Math.cos(angle) * (branchLength * 0.3),
        y: 300 + Math.sin(angle) * (branchLength * 0.3) - 15 // Pull control point up a bit
      };
      
      return {
        category,
        // Start point (trunk)
        x1: 150,
        y1: 300,
        // End point
        x2: 150 + Math.cos(angle) * branchLength,
        y2: 300 + Math.sin(angle) * branchLength,
        // Control point for curve
        cX: curveControl.x,
        cY: curveControl.y,
        skills,
        masteredCount: masteredInCategory,
        totalCount: skills.length,
        angle,
        thickness: 3 + (masteredInCategory / 2) // Branch thickness grows with mastery
      };
    });
  }, [skillsByCategory]);

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        mb: 4, 
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 2,
        transition: 'all 0.5s ease',
        background: `linear-gradient(to bottom, ${theme.palette.background.paper} 0%, ${theme.palette.background.paper} 70%, #f0f4c3 100%)`,
      }}
    >
      <Typography variant="h5" gutterBottom align="center" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
        Your Bonsai Learning Tree
      </Typography>
      
      <Box sx={{ 
        textAlign: 'center', 
        mb: 2,
        animation: animation ? 'pulse 2s ease-in-out' : 'none',
        '@keyframes pulse': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' }
        }
      }}>
        <Typography 
          variant="h4" 
          color="primary" 
          sx={{ 
            fontWeight: 'bold',
            animation: animation ? 'colorShift 2s ease-in-out' : 'none',
            '@keyframes colorShift': {
              '0%': { color: theme.palette.primary.main },
              '50%': { color: theme.palette.success.main },
              '100%': { color: theme.palette.primary.main }
            }
          }}
        >
          {masteryPercentage}%
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Skills Mastered
        </Typography>
      </Box>
      
      <Box sx={{ 
        width: '100%', 
        height: 450, // Increased height
        position: 'relative',
        borderRadius: 2,
        overflow: 'hidden',
      }}>
        {/* Sun or moon based on theme */}
        <Box sx={{
          position: 'absolute',
          top: 30,
          right: 30,
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: theme.palette.mode === 'dark' 
            ? 'radial-gradient(circle, #f9f9f9 30%, rgba(255,255,255,0.5) 70%)' 
            : 'radial-gradient(circle, #FFEB3B 30%, rgba(255,235,59,0.2) 75%)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 0 20px 5px rgba(255,255,255,0.2)'
            : '0 0 30px 10px rgba(255,235,59,0.3)',
        }}/>
        
        <svg width="100%" height="100%" viewBox="0 0 300 450" overflow="visible">
          {/* Add some clouds or birds depending on theme */}
          {theme.palette.mode !== 'dark' && (
            <>
              <ellipse cx="50" cy="80" rx="30" ry="15" fill="rgba(255,255,255,0.7)" />
              <ellipse cx="65" cy="75" rx="25" ry="18" fill="rgba(255,255,255,0.8)" />
              <ellipse cx="80" cy="85" rx="20" ry="12" fill="rgba(255,255,255,0.9)" />
              
              <ellipse cx="230" cy="60" rx="25" ry="13" fill="rgba(255,255,255,0.8)" />
              <ellipse cx="250" cy="55" rx="20" ry="15" fill="rgba(255,255,255,0.9)" />
              <ellipse cx="270" cy="63" rx="18" ry="10" fill="rgba(255,255,255,0.7)" />
            </>
          )}
          
          {/* Ground with gradient */}
          <ellipse cx="150" cy="400" rx="120" ry="20" fill="url(#groundGradient)" />
          <defs>
            <radialGradient id="groundGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="#8D6E63" />
              <stop offset="90%" stopColor="#5D4037" />
            </radialGradient>
          </defs>
          
          {/* Tree trunk with gradient */}
          <rect 
            x={150 - treeVitality.trunkWidth/2} 
            y={300} 
            width={treeVitality.trunkWidth} 
            height={treeVitality.trunkHeight} 
            fill="url(#trunkGradient)" 
          />
          <defs>
            <linearGradient id="trunkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={treeVitality.trunkColor} />
              <stop offset="50%" stopColor="#8B4513" />
              <stop offset="100%" stopColor={treeVitality.trunkColor} />
            </linearGradient>
          </defs>
          
          {/* Tree roots */}
          <path 
            d={`
              M${145},${300 + treeVitality.trunkHeight} 
              Q${120},${320 + treeVitality.trunkHeight} ${100},${310 + treeVitality.trunkHeight} 
              Q${130},${300 + treeVitality.trunkHeight} ${150},${300 + treeVitality.trunkHeight}
              
              M${155},${300 + treeVitality.trunkHeight} 
              Q${180},${315 + treeVitality.trunkHeight} ${200},${305 + treeVitality.trunkHeight} 
              Q${170},${295 + treeVitality.trunkHeight} ${150},${300 + treeVitality.trunkHeight}
              
              M${150},${300 + treeVitality.trunkHeight} 
              Q${140},${330 + treeVitality.trunkHeight} ${130},${340 + treeVitality.trunkHeight}
              
              M${150},${300 + treeVitality.trunkHeight} 
              Q${160},${325 + treeVitality.trunkHeight} ${170},${335 + treeVitality.trunkHeight}
            `} 
            fill="none"
            stroke={treeVitality.trunkColor}
            strokeWidth="3"
          />
          
          {/* Moss or small plants at base of tree */}
          <ellipse cx="140" cy={300 + treeVitality.trunkHeight - 5} rx="12" ry="5" fill="#81C784" opacity="0.7" />
          <ellipse cx="160" cy={300 + treeVitality.trunkHeight - 3} rx="15" ry="4" fill="#81C784" opacity="0.6" />
          
          {/* Branches as curved paths */}
          {branches.map((branch, index) => (
            <g key={index}>
              <path
                d={`M${branch.x1},${branch.y1} Q${branch.cX},${branch.cY} ${branch.x2},${branch.y2}`}
                stroke="url(#branchGradient)"
                strokeWidth={branch.thickness}
                fill="none"
                strokeLinecap="round"
                className={animation ? 'branch-grow' : ''}
                style={{
                  animation: animation ? `growBranch 2s ease-out` : 'none',
                }}
              />
              <defs>
                <linearGradient id={`branchGradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8B4513" />
                  <stop offset="100%" stopColor="#A1887F" />
                </linearGradient>
              </defs>
              
              {/* Category name on branch */}
              <text 
                x={branch.x2} 
                y={branch.y2 - 10}
                textAnchor={branch.angle < -Math.PI/2 || branch.angle > Math.PI/2 ? "end" : "start"}
                fill={theme.palette.text.secondary}
                fontSize="10"
                fontWeight="bold"
                style={{ pointerEvents: 'none' }}
                transform={`rotate(${branch.angle * (180/Math.PI) + (branch.angle < -Math.PI/2 || branch.angle > Math.PI/2 ? 180 : 0)}, ${branch.x2}, ${branch.y2})`}
              >
                {branch.category}
              </text>
              
              {/* Leaves/Skills */}
              {branch.skills.map((skill, skillIndex) => {
                const spacing = 0.2;
                const skillAngle = branch.angle + (skillIndex - branch.skills.length/2) * spacing;
                const distanceRatio = (skillIndex + 1) / branch.skills.length;
                const distance = 20 + distanceRatio * branch.totalCount * 6;
                
                // Position along the curved branch path
                const t = distanceRatio * 0.8 + 0.2; // parameterized position along path (0.2 to 1)
                const x = branch.x1 * (1-t)*(1-t) + 2*branch.cX*(1-t)*t + branch.x2*t*t;
                const y = branch.y1 * (1-t)*(1-t) + 2*branch.cY*(1-t)*t + branch.y2*t*t;
                
                // Add a small random offset for more natural look
                const randomOffsetX = (Math.random() - 0.5) * 10;
                const randomOffsetY = (Math.random() - 0.5) * 10;
                
                // Calculate size based on mastery level
                const baseSize = 5;
                const masteryBonus = skill.mastered ? 3 : (skill.masteryLevel / 20);
                const size = baseSize + masteryBonus;
                
                // Determine if this skill was recently mastered
                const isRecentlyMastered = recentlyMastered.includes(skill.id) && skill.mastered;
                
                return (
                  <g key={`skill-${skill.id}`}>
                    {/* Leaf glow effect for mastered skills */}
                    {skill.mastered && (
                      <circle
                        cx={x + randomOffsetX}
                        cy={y + randomOffsetY}
                        r={size + 2}
                        fill="none"
                        stroke={theme.palette.primary.main}
                        strokeWidth="1"
                        opacity={isRecentlyMastered ? 0.8 : 0.3}
                        style={{
                          animation: isRecentlyMastered && animation ? 'glowPulse 2s infinite' : 'none',
                          animationDelay: `${skillIndex * 0.1}s`,
                          filter: isRecentlyMastered ? 'drop-shadow(0 0 3px rgba(76, 175, 80, 0.6))' : 'none'
                        }}
                      />
                    )}
                    
                    {/* Leaf/Skill node */}
                    <Tooltip title={skill.name} arrow placement="top">
                      <circle
                        cx={x + randomOffsetX}
                        cy={y + randomOffsetY}
                        r={size}
                        fill={skill.mastered ? theme.palette.primary.main : treeVitality.leafBaseColor}
                        opacity={skill.mastered ? 1 : 0.5 + (skill.masteryLevel / 200)}
                        style={{
                          cursor: 'pointer',
                          transition: 'r 0.3s, fill 0.3s, opacity 0.3s',
                          animation: isRecentlyMastered && animation ? 'leafGrow 2s ease-out' : 'none',
                          animationDelay: `${skillIndex * 0.1}s`
                        }}
                      />
                    </Tooltip>
                  </g>
                );
              })}
            </g>
          ))}
        </svg>
        
        {/* Tree legend */}
        <Box 
          sx={{ 
            position: 'absolute', 
            bottom: 10, 
            right: 10,
            backgroundColor: 'rgba(255,255,255,0.8)', 
            p: 1.5,
            borderRadius: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <Typography variant="caption" display="block" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            Your Learning Growth
          </Typography>
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
              backgroundColor: treeVitality.leafBaseColor,
              opacity: 0.7,
              mr: 1
            }}/>
            Skills In Progress
          </Typography>
        </Box>
        
        {/* Add global animation keyframes */}
        <style type="text/css">
          {`
            @keyframes leafGrow {
              0% { transform: scale(0.5); opacity: 0.3; }
              50% { transform: scale(1.5); opacity: 0.9; }
              100% { transform: scale(1); opacity: 1; }
            }
            
            @keyframes growBranch {
              0% { stroke-dashoffset: 300; }
              100% { stroke-dashoffset: 0; }
            }
            
            @keyframes glowPulse {
              0% { opacity: 0.3; }
              50% { opacity: 0.8; }
              100% { opacity: 0.3; }
            }
          `}
        </style>
      </Box>
    </Paper>
  );
};

export default BonsaiTree;

 