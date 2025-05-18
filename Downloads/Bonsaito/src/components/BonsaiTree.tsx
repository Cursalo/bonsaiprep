import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Paper, useTheme, Tooltip } from '@mui/material';
import { useSpring, animated, config } from 'react-spring';

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

// Helper functions
const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;
const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);
const randRange = (min: number, max: number) => Math.random() * (max - min) + min;

// Define interfaces for branch and leaf objects
interface BranchPoint {
  x: number;
  y: number;
}

interface Branch {
  id: string;
  category: string;
  start: BranchPoint;
  end: BranchPoint;
  control1: BranchPoint;
  control2: BranchPoint;
  thickness: number;
  angle: number;
  masteryRatio: number;
  skills: Skill[];
}

interface LeafCoordinates {
  x: number;
  y: number;
  size: number;
  angle: number;
  isRecentlyMastered: boolean;
}

const BonsaiTree: React.FC<BonsaiTreeProps> = ({ skills, totalSkills }) => {
  const theme = useTheme();
  const svgRef = useRef<SVGSVGElement>(null);
  const [recentlyMastered, setRecentlyMastered] = useState<string[]>([]);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [animation, setAnimation] = useState<boolean>(false);
  const [firstRender, setFirstRender] = useState<boolean>(true);

  // Reference to track previous skills for comparison
  const prevSkillsRef = useRef<Skill[]>([]);
  
  // Calculate mastery percentage
  const masteredSkills = skills.filter(skill => skill.mastered);
  const masteryPercentage = Math.round((masteredSkills.length / totalSkills) * 100);
  
  // Spring animations
  const percentageProps = useSpring({
    number: masteryPercentage,
    from: { number: 0 },
    config: { tension: 120, friction: 14 },
    delay: 300,
  });

  const treeContainerProps = useSpring({
    from: { opacity: 0, transform: 'translateY(30px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    config: config.gentle,
  });

  // Group skills by category
  const skillsByCategory = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  // Track skills that were recently mastered
  useEffect(() => {
    // Only run effect if not first render
    if (!firstRender) {
      const prevMasteredIds = prevSkillsRef.current
        .filter(skill => skill.mastered)
        .map(skill => skill.id);
      
      const currentMasteredIds = skills
        .filter(skill => skill.mastered)
        .map(skill => skill.id);
      
      // Find newly mastered skills
      const newlyMastered = currentMasteredIds.filter(id => !prevMasteredIds.includes(id));
      
      if (newlyMastered.length > 0) {
        setRecentlyMastered(newlyMastered);
        setAnimation(true);
        
        // Reset animation state after animation completes
        const timer = setTimeout(() => {
          setAnimation(false);
        }, 3000);
        
        return () => clearTimeout(timer);
      }
    } else {
      setFirstRender(false);
    }
    // Update reference
    prevSkillsRef.current = [...skills];
  }, [skills, firstRender]);

  // Calculate tree health/vitality based on mastery
  const treeVitality = {
    // Trunk color darkens as tree matures
    trunkBaseColor: masteryPercentage < 30 
      ? '#8D6E63' // Lighter brown for younger tree
      : masteryPercentage < 70
        ? '#795548' // Medium brown
        : '#5D4037', // Dark rich brown for mature tree
        
    // Set trunk dimensions based on growth
    trunkWidth: clamp(25 + (masteryPercentage / 5), 25, 35),
    trunkHeight: clamp(140 + masteryPercentage, 150, 220),
    
    // Pot style based on growth
    potWidth: clamp(90 + (masteryPercentage / 3), 90, 110),
    potHeight: clamp(40 + (masteryPercentage / 10), 40, 50),
    
    // Leaf base color becomes more vibrant with mastery
    leafBaseColor: masteryPercentage < 30 
      ? '#A5D6A7' // Pale green for low mastery
      : masteryPercentage < 60 
        ? '#66BB6A' // Medium green
        : '#4CAF50', // Vibrant green for high mastery
    
    // Overall size scaling factor
    scale: clamp(0.8 + (masteryPercentage / 100), 0.8, 1.2)
  };

  // Generate branches
  const generateBranches = (): Branch[] => {
    const categories = Object.keys(skillsByCategory);
    const branches: Branch[] = [];
    
    // If no categories, return empty array
    if (categories.length === 0) return branches;
    
    // Determine the main trunk end point (where it starts to curve)
    const trunkEndY = 300 - treeVitality.trunkHeight * 0.7;
    const trunkTop = { x: 150, y: trunkEndY };
    
    // Calculate branch points based on categories
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      const skills = skillsByCategory[category];
      
      // Skip empty categories
      if (!skills || skills.length === 0) continue;
      
      // Calculate the angle and position for this branch
      const totalCategories = categories.length;
      let angle;
      
      if (totalCategories === 1) {
        // Single category - branch goes straight up
        angle = -Math.PI/2;
      } else if (i === 0) {
        // First branch - goes left
        angle = -Math.PI/2 - randRange(0.2, 0.6);
      } else if (i === totalCategories - 1) {
        // Last branch - goes right
        angle = -Math.PI/2 + randRange(0.2, 0.6);
      } else {
        // Middle branches - distributed between
        const normalizedIndex = i / (totalCategories - 1);
        angle = lerp(-Math.PI/2 - 0.5, -Math.PI/2 + 0.5, normalizedIndex);
        // Add slight randomness
        angle += randRange(-0.1, 0.1);
      }
      
      // Calculate mastery for this category
      const categorySkills = skillsByCategory[category] || [];
      const masteredInCategory = categorySkills.filter(s => s.mastered).length;
      const categoryMasteryRatio = categorySkills.length > 0 
        ? masteredInCategory / categorySkills.length 
        : 0;
      
      // Set branch length based on category mastery and skill count
      const minLength = 40 + (skills.length * 2);
      const maxLength = 100 + (skills.length * 3);
      const branchLength = lerp(minLength, maxLength, categoryMasteryRatio);
      
      // Calculate branch curve control points
      const branchDirection = { 
        x: Math.cos(angle),
        y: Math.sin(angle)
      };
      
      // Branch end point
      const endPoint = {
        x: trunkTop.x + branchDirection.x * branchLength,
        y: trunkTop.y + branchDirection.y * branchLength
      };
      
      // Control points for natural curve - adjust these for different branch shapes
      const controlPoint1 = {
        x: trunkTop.x + branchDirection.x * branchLength * 0.3,
        y: trunkTop.y + branchDirection.y * branchLength * 0.2 - 10
      };
      
      const controlPoint2 = {
        x: trunkTop.x + branchDirection.x * branchLength * 0.7, 
        y: trunkTop.y + branchDirection.y * branchLength * 0.6 - 15
      };
      
      // Calculate thickness based on mastery and size
      const thickness = 6 * (0.6 + (categoryMasteryRatio * 0.4));
      
      // Generate branch object
      branches.push({
        id: `branch-${i}`,
        category,
        start: trunkTop,
        end: endPoint,
        control1: controlPoint1,
        control2: controlPoint2,
        thickness,
        angle,
        masteryRatio: categoryMasteryRatio,
        skills: skills,
      });
      
      // If we have many categories, limit the number of branches
      if (branches.length >= 3) break;
    }
    
    return branches;
  };
  
  const branches = generateBranches();

  // Generate leaf coordinates for a branch
  const generateLeafCoordinates = (branch: Branch, skill: Skill, index: number): LeafCoordinates => {
    const skills = branch.skills;
    const totalSkills = skills.length;
    
    // Get a t-value [0-1] along the curve based on the skill index
    // We want to distribute skills evenly
    const t = clamp(0.3 + ((index + 1) / (totalSkills + 1)) * 0.7, 0.3, 0.95);

    // Calculate point on the cubic bezier curve
    const p0 = branch.start;
    const p1 = branch.control1;
    const p2 = branch.control2;
    const p3 = branch.end;
    
    // Calculate position on the cubic bezier curve
    // Formula: P = (1-t)^3 * P0 + 3(1-t)^2 * t * P1 + 3(1-t) * t^2 * P2 + t^3 * P3
    const t1 = 1 - t;
    const t1_2 = t1 * t1;
    const t1_3 = t1_2 * t1;
    const t_2 = t * t;
    const t_3 = t_2 * t;
    
    const x = t1_3 * p0.x + 3 * t1_2 * t * p1.x + 3 * t1 * t_2 * p2.x + t_3 * p3.x;
    const y = t1_3 * p0.y + 3 * t1_2 * t * p1.y + 3 * t1 * t_2 * p2.y + t_3 * p3.y;
    
    // Calculate the curve tangent to decide the leaf direction
    const tangentX = -3 * t1_2 * p0.x + 3 * t1_2 * p1.x - 6 * t1 * t * p1.x + 
                 6 * t1 * t * p2.x - 3 * t_2 * p2.x + 3 * t_2 * p3.x;
    const tangentY = -3 * t1_2 * p0.y + 3 * t1_2 * p1.y - 6 * t1 * t * p1.y + 
                 6 * t1 * t * p2.y - 3 * t_2 * p2.y + 3 * t_2 * p3.y;
    
    // Normalize the tangent
    const tangentLength = Math.sqrt(tangentX * tangentX + tangentY * tangentY);
    const normalizedTangentX = tangentX / tangentLength;
    const normalizedTangentY = tangentY / tangentLength;
    
    // Calculate perpendicular vector
    const perpX = -normalizedTangentY;
    const perpY = normalizedTangentX;
    
    // Spread leaves on both sides of the branch
    // Alternate sides for a more natural look
    const side = index % 2 === 0 ? 1 : -1;
    
    // Offset from the curve
    const offset = ((skill.masteryLevel / 100) * 5) + 5;
    
    // Base position on the curve
    let baseX = x + side * perpX * offset;
    let baseY = y + side * perpY * offset;
    
    // Add some random variation for a more natural look
    baseX += randRange(-3, 3);
    baseY += randRange(-3, 3);
    
    // Calculate leaf size based on mastery level
    const baseSize = 6;
    const masteryBonus = skill.mastered ? 4 : (skill.masteryLevel / 25);
    const size = baseSize + masteryBonus;
    
    return {
      x: baseX,
      y: baseY,
      size,
      // Add angle information for leaf orientation
      angle: Math.atan2(perpY, perpX) + (side * Math.PI / 4),
      isRecentlyMastered: recentlyMastered.includes(skill.id) && skill.mastered
    };
  };
  
  // SVG path for leaf shape instead of circles
  const getLeafPath = (x: number, y: number, size: number, angle: number) => {
    // Rotate the leaf to point in the correct direction
    return `
      <g transform="translate(${x}, ${y}) rotate(${angle * 180 / Math.PI}) scale(${size / 10})">
        <path d="M0,0 C1,-3 3,-5 5,-5 C8,-5 10,-2 10,2 C10,5 8,8 5,8 C2,8 0,5 0,3 C0,5 -2,8 -5,8 C-8,8 -10,5 -10,2 C-10,-2 -8,-5 -5,-5 C-3,-5 -1,-3 0,0 Z" />
      </g>
    `;
  };
  
  // Animation update
  useEffect(() => {
    if (!svgRef.current || branches.length === 0) return;
    
    // Skip animation if it's the first render
    if (firstRender) return;

    if (animation) {
      // Add the SVG animation
      const svg = svgRef.current;
      
      // Animate trunk growing
      const trunk = svg.querySelector('#tree-trunk');
      if (trunk) {
        trunk.classList.add('animate-grow');
        trunk.addEventListener('animationend', () => {
          trunk.classList.remove('animate-grow');
        }, { once: true });
      }
      
      // Animate branches
      branches.forEach((branch, i) => {
        const branchElement = svg.querySelector(`#${branch.id}`);
        if (branchElement) {
          branchElement.classList.add('animate-grow');
          branchElement.style.animationDelay = `${i * 0.2}s`;
          branchElement.addEventListener('animationend', () => {
            branchElement.classList.remove('animate-grow');
          }, { once: true });
        }
      });
      
      // Animate leaves
      recentlyMastered.forEach(skillId => {
        const leafElement = svg.querySelector(`#leaf-${skillId}`);
        if (leafElement) {
          leafElement.classList.add('animate-leaf-grow');
          leafElement.addEventListener('animationend', () => {
            leafElement.classList.remove('animate-leaf-grow');
          }, { once: true });
        }
      });
    }
  }, [animation, branches, recentlyMastered, firstRender]);

  return (
    <animated.div style={treeContainerProps}>
      <Paper 
        elevation={3} 
        className="glass-morphism"
        sx={{ 
          p: 4, 
          mb: 4, 
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '4px',
          transition: 'all 0.5s ease',
        }}
      >
        <Typography 
          variant="h5" 
          gutterBottom 
          align="center" 
          sx={{ 
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 'bold', 
            color: theme.palette.primary.main,
            mb: 3
          }}
        >
          Your Bonsai Learning Tree
        </Typography>
        
        <Box sx={{ 
          textAlign: 'center', 
          mb: 3,
          animation: animation ? 'pulse 2s ease-in-out' : 'none',
        }}>
          <animated.div style={{
            display: 'inline-block',
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: theme.palette.primary.main,
            animation: animation ? 'colorShift 2s ease-in-out' : 'none',
          }}>
            {percentageProps.number.to(n => `${Math.floor(n)}%`)}
          </animated.div>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Skills Mastered
          </Typography>
        </Box>
        
        <Box sx={{ 
          width: '100%', 
          height: 450,
          position: 'relative',
          borderRadius: 2,
          overflow: 'hidden',
          transition: 'all 0.5s ease',
        }}>
          {/* Background gradient */}
          <Box sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '30%',
            background: 'linear-gradient(to top, rgba(232, 245, 233, 0.6) 0%, rgba(232, 245, 233, 0) 100%)',
            zIndex: 1
          }} />
          
          {/* Light effect */}
          <Box sx={{
            position: 'absolute',
            top: 20,
            right: 25,
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,236,179,0.3) 0%, rgba(255,236,179,0) 70%)',
            zIndex: 1
          }} />
          
          {/* Tree SVG */}
          <Box sx={{
            width: '100%',
            height: '100%',
            position: 'relative',
            zIndex: 2,
            transform: `scale(${treeVitality.scale})`,
            transition: 'transform 1s ease-in-out',
          }}>
            <svg 
              ref={svgRef}
              width="100%" 
              height="100%" 
              viewBox="0 0 300 450" 
              overflow="visible"
              style={{ marginTop: '-20px' }}
            >
              <defs>
                {/* Gradients for tree elements */}
                <radialGradient id="potGradient" cx="50%" cy="30%" r="70%" fx="50%" fy="30%">
                  <stop offset="0%" stopColor="#8D6E63" />
                  <stop offset="90%" stopColor="#5D4037" />
                </radialGradient>
                
                <linearGradient id="trunkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={treeVitality.trunkBaseColor} />
                  <stop offset="50%" stopColor="#6D4C41" />
                  <stop offset="100%" stopColor={treeVitality.trunkBaseColor} />
                </linearGradient>
                
                {/* Gradients for each branch */}
                {branches.map((branch, i) => (
                  <linearGradient 
                    key={`branch-gradient-${i}`}
                    id={`branchGradient-${i}`} 
                    x1="0%" 
                    y1="0%" 
                    x2="100%" 
                    y2="0%" 
                    gradientUnits="userSpaceOnUse"
                    gradientTransform={`rotate(${branch.angle * 180 / Math.PI})`}
                  >
                    <stop offset="0%" stopColor="#6D4C41" />
                    <stop offset="100%" stopColor="#8D6E63" />
                  </linearGradient>
                ))}
                
                {/* Leaf filter for glow effect */}
                <filter id="leaf-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                
                {/* Animation keyframes */}
                <style type="text/css">
                  {`
                    @keyframes leafGrow {
                      0% { transform: scale(0); opacity: 0; }
                      60% { transform: scale(1.5); opacity: 1; }
                      100% { transform: scale(1); opacity: 1; }
                    }
                    
                    @keyframes branchGrow {
                      0% { stroke-dashoffset: 1000; }
                      100% { stroke-dashoffset: 0; }
                    }
                    
                    @keyframes pulse {
                      0% { opacity: 0.5; transform: scale(1); }
                      50% { opacity: 1; transform: scale(1.1); }
                      100% { opacity: 0.5; transform: scale(1); }
                    }
                    
                    .animate-grow {
                      stroke-dasharray: 1000;
                      stroke-dashoffset: 1000;
                      animation: branchGrow 1.5s ease-in-out forwards;
                    }
                    
                    .animate-leaf-grow {
                      animation: leafGrow 0.8s ease-out forwards;
                    }
                    
                    .leaf-pulse {
                      animation: pulse 2s infinite;
                    }
                  `}
                </style>
              </defs>
              
              {/* Pot/Base */}
              <g>
                <ellipse 
                  cx="150" 
                  cy="380" 
                  rx={treeVitality.potWidth} 
                  ry="15" 
                  fill="#A1887F" 
                />
                <path 
                  d={`
                    M${150 - treeVitality.potWidth}, 380 
                    L${150 - treeVitality.potWidth * 0.8}, ${380 + treeVitality.potHeight}
                    L${150 + treeVitality.potWidth * 0.8}, ${380 + treeVitality.potHeight}
                    L${150 + treeVitality.potWidth}, 380
                  `}
                  fill="url(#potGradient)"
                />
                <ellipse 
                  cx="150" 
                  cy={380 + treeVitality.potHeight} 
                  rx={treeVitality.potWidth * 0.8} 
                  ry="6" 
                  fill="#5D4037" 
                />
              </g>
              
              {/* Trunk */}
              <g>
                <path
                  id="tree-trunk"
                  d={`
                    M${150 - treeVitality.trunkWidth * 0.25}, 380
                    C${150 - treeVitality.trunkWidth * 0.4}, ${380 - treeVitality.trunkHeight * 0.3}
                     ${150 - treeVitality.trunkWidth * 0.2}, ${380 - treeVitality.trunkHeight * 0.7}
                     ${150}, ${380 - treeVitality.trunkHeight}
                  `}
                  fill="none"
                  stroke="url(#trunkGradient)"
                  strokeWidth={treeVitality.trunkWidth}
                  strokeLinecap="round"
                />
              </g>
              
              {/* Branches */}
              {branches.map((branch, index) => (
                <g key={branch.id}>
                  <path
                    id={branch.id}
                    d={`
                      M${branch.start.x}, ${branch.start.y}
                      C${branch.control1.x}, ${branch.control1.y}
                       ${branch.control2.x}, ${branch.control2.y}
                       ${branch.end.x}, ${branch.end.y}
                    `}
                    fill="none"
                    stroke={`url(#branchGradient-${index})`}
                    strokeWidth={branch.thickness}
                    strokeLinecap="round"
                  />
                  
                  {/* Skills as leaves */}
                  {branch.skills.map((skill, skillIndex) => {
                    const leaf = generateLeafCoordinates(branch, skill, skillIndex);
                    return (
                      <foreignObject
                        key={`leaf-${skill.id}`}
                        id={`leaf-${skill.id}`}
                        x={leaf.x - 20}
                        y={leaf.y - 20}
                        width={40}
                        height={40}
                        style={{
                          overflow: 'visible',
                          transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={() => setShowTooltip(skill.id)}
                        onMouseLeave={() => setShowTooltip(null)}
                      >
                        <svg 
                          width="40" 
                          height="40" 
                          viewBox="-20 -20 40 40"
                          style={{
                            overflow: 'visible',
                            filter: leaf.isRecentlyMastered ? 'url(#leaf-glow)' : 'none',
                          }}
                        >
                          {/* Leaf shape */}
                          <g transform={`rotate(${leaf.angle * 180 / Math.PI})`}>
                            <path
                              d="M0,0 C1,-5 5,-10 10,-10 C15,-8 15,0 10,5 C5,10 0,8 0,5 C0,8 -5,10 -10,5 C-15,0 -15,-8 -10,-10 C-5,-10 -1,-5 0,0 Z"
                              fill={skill.mastered ? theme.palette.primary.main : treeVitality.leafBaseColor}
                              opacity={skill.mastered ? 1 : 0.5 + (skill.masteryLevel / 200)}
                              className={leaf.isRecentlyMastered ? 'leaf-pulse' : ''}
                              transform={`scale(${leaf.size / 20})`}
                            />
                          </g>
                        </svg>
                      </foreignObject>
                    );
                  })}
                </g>
              ))}
              
              {/* Skill name tooltips */}
              {showTooltip && skills.map(skill => {
                if (skill.id === showTooltip) {
                  // Find this skill's branch and position
                  for (const branch of branches) {
                    const skillIndex = branch.skills.findIndex((s: Skill) => s.id === skill.id);
                    if (skillIndex >= 0) {
                      const leaf = generateLeafCoordinates(branch, skill, skillIndex);
                      return (
                        <g key={`tooltip-${skill.id}`}>
                          <rect
                            x={leaf.x - 60}
                            y={leaf.y - 50}
                            width="120"
                            height="30"
                            rx="4"
                            ry="4"
                            fill="rgba(255,255,255,0.9)"
                            stroke={theme.palette.primary.main}
                            strokeWidth="1"
                          />
                          <text
                            x={leaf.x}
                            y={leaf.y - 30}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill={theme.palette.text.primary}
                            fontSize="10"
                            fontFamily="DM Sans, sans-serif"
                          >
                            {skill.name}
                          </text>
                          {skill.mastered && (
                            <text
                              x={leaf.x}
                              y={leaf.y - 40}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill={theme.palette.success.main}
                              fontSize="8"
                              fontFamily="DM Sans, sans-serif"
                              fontWeight="bold"
                            >
                              MASTERED
                            </text>
                          )}
                        </g>
                      );
                    }
                  }
                }
                return null;
              })}
            </svg>
          </Box>
          
          {/* Tree legend */}
          <Box 
            sx={{ 
              position: 'absolute', 
              bottom: 15, 
              right: 15,
              background: 'rgba(255,255,255,0.8)', 
              p: 1.5,
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(8px)',
              zIndex: 10
            }}
          >
            <Typography 
              variant="caption" 
              display="block" 
              sx={{ 
                fontWeight: 'bold', 
                mb: 0.5, 
                fontFamily: 'DM Sans, sans-serif'
              }}
            >
              Your Learning Growth
            </Typography>
            <Typography 
              variant="caption" 
              display="block"
              sx={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              <Box 
                component="span" 
                sx={{ 
                  display: 'inline-block', 
                  width: 10, 
                  height: 10, 
                  borderRadius: '50%', 
                  backgroundColor: theme.palette.primary.main,
                  mr: 1
                }}
              />
              Mastered Skills
            </Typography>
            <Typography 
              variant="caption" 
              display="block"
              sx={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              <Box 
                component="span" 
                sx={{ 
                  display: 'inline-block', 
                  width: 10, 
                  height: 10, 
                  borderRadius: '50%', 
                  backgroundColor: treeVitality.leafBaseColor,
                  opacity: 0.7,
                  mr: 1
                }}
              />
              Skills In Progress
            </Typography>
          </Box>
        </Box>
        
        <Typography 
          align="center" 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mt: 2,
            fontFamily: 'DM Sans, sans-serif',
            animation: animation ? 'fadeIn 1s ease-in-out' : 'none'
          }}
        >
          You've mastered {masteredSkills.length} skills so far! Keep growing!
        </Typography>
      </Paper>
    </animated.div>
  );
};

export default BonsaiTree;

 