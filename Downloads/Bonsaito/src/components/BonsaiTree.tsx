import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Paper, useTheme, Tooltip } from '@mui/material';
import { useSpring, animated, config, useSpringRef, useChain } from 'react-spring';

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
  level: number;
  skills: Skill[];
  subBranches: Branch[];
}

interface LeafCoordinates {
  x: number;
  y: number;
  size: number;
  angle: number;
  isRecentlyMastered: boolean;
  hue: number;
}

const BonsaiTree: React.FC<BonsaiTreeProps> = ({ skills, totalSkills }) => {
  const theme = useTheme();
  const svgRef = useRef<SVGSVGElement>(null);
  const [recentlyMastered, setRecentlyMastered] = useState<string[]>([]);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [animation, setAnimation] = useState<boolean>(false);
  const [firstRender, setFirstRender] = useState<boolean>(true);
  const [hoveredBranch, setHoveredBranch] = useState<string | null>(null);
  
  // Reference to track previous skills for comparison
  const prevSkillsRef = useRef<Skill[]>([]);
  
  // Calculate mastery percentage
  const masteredSkills = skills.filter(skill => skill.mastered);
  const masteryPercentage = Math.round((masteredSkills.length / totalSkills) * 100);
  
  // Spring animation refs for chaining
  const trunkSpringRef = useSpringRef();
  const branchSpringRef = useSpringRef();
  const leafSpringRef = useSpringRef();

  // Spring animations
  const percentageProps = useSpring({
    number: masteryPercentage,
    from: { number: 0 },
    config: { tension: 120, friction: 14 },
    delay: 300,
  });

  const trunkProps = useSpring({
    ref: trunkSpringRef,
    from: { strokeDashoffset: 1000, opacity: 0.7 },
    to: { strokeDashoffset: 0, opacity: 1 },
    config: { tension: 80, friction: 15, duration: 1500 },
  });

  const branchProps = useSpring({
    ref: branchSpringRef,
    from: { strokeDashoffset: 1000, opacity: 0.5 },
    to: { strokeDashoffset: 0, opacity: 1 },
    config: { tension: 70, friction: 14, duration: 1200 },
  });

  const leafProps = useSpring({
    ref: leafSpringRef,
    from: { scale: 0, opacity: 0 },
    to: { scale: 1, opacity: 1 },
    config: { tension: 200, friction: 20, duration: 800 },
  });

  // Chain the animations
  useChain(
    firstRender 
      ? [trunkSpringRef, branchSpringRef, leafSpringRef] 
      : [], 
    firstRender 
      ? [0, 0.5, 0.8] 
      : []
  );

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
    trunkWidth: clamp(30 + (masteryPercentage / 4), 30, 45),
    trunkHeight: clamp(160 + masteryPercentage, 160, 250),
    
    // Pot style based on growth
    potWidth: clamp(100 + (masteryPercentage / 3), 100, 120),
    potHeight: clamp(45 + (masteryPercentage / 10), 45, 55),
    
    // Leaf colors become more vibrant with mastery
    leafBaseColor: masteryPercentage < 30 
      ? 'hsl(120, 50%, 75%)' // Light green for low mastery
      : masteryPercentage < 60 
        ? 'hsl(130, 60%, 65%)' // Medium green
        : 'hsl(140, 70%, 55%)', // Vibrant green for high mastery
    
    // Overall size scaling factor
    scale: clamp(0.85 + (masteryPercentage / 100), 0.85, 1.25)
  };

  // Generate branches with a more natural, realistic pattern
  const generateBranches = (): Branch[] => {
    const categories = Object.keys(skillsByCategory);
    const mainBranches: Branch[] = [];
    
    // If no categories, return empty array
    if (categories.length === 0) return mainBranches;
    
    // Determine the main trunk end point (where it starts to curve)
    const trunkEndY = 300 - treeVitality.trunkHeight * 0.8;
    const trunkTop = { x: 150, y: trunkEndY };
    
    // Main branch distribution angles based on number of categories
    const totalCategories = categories.length;
    const baseAngles = [];
    
    if (totalCategories === 1) {
      // Single category - branch goes mostly upward
      baseAngles.push(-Math.PI/2);
    } else if (totalCategories === 2) {
      // Two categories - split left and right
      baseAngles.push(-Math.PI/2 - 0.4);
      baseAngles.push(-Math.PI/2 + 0.4);
    } else {
      // Distribute branches in a fan pattern
      for (let i = 0; i < totalCategories; i++) {
        const angle = lerp(-Math.PI/2 - 0.8, -Math.PI/2 + 0.8, i / (totalCategories - 1));
        baseAngles.push(angle);
      }
    }
    
    // Create main branches
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      const skills = skillsByCategory[category];
      
      // Skip empty categories
      if (!skills || skills.length === 0) continue;
      
      // Calculate angle with small random variation
      const baseAngle = baseAngles[i];
      const angle = baseAngle + randRange(-0.1, 0.1);
      
      // Calculate mastery for this category
      const categorySkills = skillsByCategory[category] || [];
      const masteredInCategory = categorySkills.filter(s => s.mastered).length;
      const categoryMasteryRatio = categorySkills.length > 0 
        ? masteredInCategory / categorySkills.length 
        : 0;
      
      // Set branch length based on category mastery and skill count
      const minLength = 80 + (skills.length * 3);
      const maxLength = 120 + (skills.length * 4);
      const branchLength = lerp(minLength, maxLength, categoryMasteryRatio);
      
      // Branch direction vector
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
      
      // Thickness based on mastery and size
      const thickness = 8 * (0.7 + (categoryMasteryRatio * 0.5));
      
      const mainBranch: Branch = {
        id: `branch-${i}`,
        category,
        start: trunkTop,
        end: endPoint,
        control1: controlPoint1,
        control2: controlPoint2,
        thickness,
        angle,
        masteryRatio: categoryMasteryRatio,
        level: 0,
        skills: [],
        subBranches: []
      };
      
      // Generate sub-branches
      const subBranches = generateSubBranches(mainBranch, skills, 3, 1);
      mainBranch.subBranches = subBranches;
      
      mainBranches.push(mainBranch);
    }
    
    return mainBranches;
  };
  
  // Generate sub-branches recursively
  const generateSubBranches = (parentBranch: Branch, skills: Skill[], maxBranches: number, level: number): Branch[] => {
    if (level > 3 || skills.length === 0) return []; // Limit the recursion depth
    
    const branches: Branch[] = [];
    const numBranches = Math.min(maxBranches, skills.length);
    const skillsPerBranch = Math.ceil(skills.length / numBranches);
    
    for (let i = 0; i < numBranches; i++) {
      // Get skills for this branch
      const startIdx = i * skillsPerBranch;
      const endIdx = Math.min(startIdx + skillsPerBranch, skills.length);
      const branchSkills = skills.slice(startIdx, endIdx);
      
      if (branchSkills.length === 0) continue;
      
      // Calculate mastery for this set of skills
      const masteredInBranch = branchSkills.filter(s => s.mastered).length;
      const branchMasteryRatio = masteredInBranch / branchSkills.length;
      
      // Generate the sub-branch
      const baseAngle = parentBranch.angle;
      
      // Alternate sides for more natural look
      const sideAngle = i % 2 === 0 ? randRange(0.3, 0.7) : randRange(-0.7, -0.3);
      
      // As we go deeper, branches extend more horizontally
      const levelFactor = level * 0.2;
      const newAngle = baseAngle + sideAngle * (1 + levelFactor);
      
      // Calculate branch length (diminishing with level)
      const scaleFactor = 1 - (level * 0.2);
      const branchLength = (40 + (branchSkills.length * 5)) * scaleFactor;
      
      // Branch direction
      const branchDirection = {
        x: Math.cos(newAngle),
        y: Math.sin(newAngle)
      };
      
      // For sub-branches, start from a point along the parent branch
      const t = 0.6 + (i / numBranches) * 0.4; // Start point along parent branch
      const p0 = parentBranch.start;
      const p1 = parentBranch.control1;
      const p2 = parentBranch.control2;
      const p3 = parentBranch.end;
      
      // Calculate position on the parent's bezier curve
      const t1 = 1 - t;
      const t1_2 = t1 * t1;
      const t1_3 = t1_2 * t1;
      const t_2 = t * t;
      const t_3 = t_2 * t;
      
      const startX = t1_3 * p0.x + 3 * t1_2 * t * p1.x + 3 * t1 * t_2 * p2.x + t_3 * p3.x;
      const startY = t1_3 * p0.y + 3 * t1_2 * t * p1.y + 3 * t1 * t_2 * p2.y + t_3 * p3.y;
      const start = { x: startX, y: startY };
      
      // End point
      const end = {
        x: start.x + branchDirection.x * branchLength,
        y: start.y + branchDirection.y * branchLength
      };
      
      // Control points for natural curve
      const control1 = {
        x: start.x + branchDirection.x * branchLength * 0.3,
        y: start.y + branchDirection.y * branchLength * 0.2 - 5
      };
      
      const control2 = {
        x: start.x + branchDirection.x * branchLength * 0.7,
        y: start.y + branchDirection.y * branchLength * 0.6 - 8
      };
      
      // Thickness diminishes with level
      const thicknessScale = 1 - (level * 0.25);
      const thickness = parentBranch.thickness * 0.6 * thicknessScale;
      
      const branch: Branch = {
        id: `${parentBranch.id}-sub-${i}`,
        category: parentBranch.category,
        start,
        end,
        control1,
        control2,
        thickness,
        angle: newAngle,
        masteryRatio: branchMasteryRatio,
        level,
        skills: branchSkills,
        subBranches: []
      };
      
      // Generate further sub-branches if we haven't reached max level
      if (level < 3 && branchSkills.length > 1) {
        const furtherSubBranches = generateSubBranches(
          branch, 
          branchSkills, 
          Math.max(2, branchSkills.length - 1), 
          level + 1
        );
        branch.subBranches = furtherSubBranches;
      }
      
      branches.push(branch);
    }
    
    return branches;
  };
  
  // Generate main branches
  const mainBranches = generateBranches();

  // Function to render all branches recursively
  const renderBranches = (branches: Branch[]) => {
    return branches.flatMap((branch, index) => [
      <g 
        key={branch.id} 
        onMouseEnter={() => setHoveredBranch(branch.id)}
        onMouseLeave={() => setHoveredBranch(null)}
      >
        <animated.path
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
          style={{
            transform: hoveredBranch === branch.id 
              ? 'scale(1.05)' 
              : 'scale(1)',
            transformOrigin: `${branch.start.x}px ${branch.start.y}px`,
            transition: 'transform 0.3s ease',
            ...branchProps
          }}
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
                filter: leaf.isRecentlyMastered ? 'url(#leaf-glow)' : 'none',
                transform: hoveredBranch === branch.id 
                  ? 'scale(1.1) rotate(5deg)' 
                  : 'scale(1) rotate(0deg)',
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
                }}
              >
                <animated.g 
                  transform={`rotate(${leaf.angle * 180 / Math.PI})`}
                  style={{
                    ...leafProps
                  }}
                >
                  <path
                    d="M0,-2 C3,-10 8,-15 12,-15 C18,-15 20,-8 15,0 C10,8 5,10 0,5 C-5,10 -10,8 -15,0 C-20,-8 -18,-15 -12,-15 C-8,-15 -3,-10 0,-2 Z"
                    fill={skill.mastered 
                      ? theme.palette.primary.main 
                      : `hsl(${120 + (skill.masteryLevel / 5)}, ${50 + skill.masteryLevel / 2}%, ${70 - skill.masteryLevel / 3}%)`
                    }
                    opacity={skill.mastered ? 1 : 0.6 + (skill.masteryLevel / 250)}
                    className={leaf.isRecentlyMastered ? 'leaf-pulse' : ''}
                    transform={`scale(${leaf.size / 25})`}
                  />
                  {/* Leaf vein */}
                  <path
                    d="M0,-2 L0,5 M-8,-8 Q0,-2 8,-8"
                    fill="none"
                    stroke={skill.mastered 
                      ? `rgba(255,255,255,0.5)` 
                      : `rgba(255,255,255,0.3)`
                    }
                    strokeWidth="0.8"
                    transform={`scale(${leaf.size / 25})`}
                    opacity={0.8}
                  />
                </animated.g>
              </svg>
            </foreignObject>
          );
        })}
        
        {/* Render sub-branches recursively */}
        {branch.subBranches && renderBranches(branch.subBranches)}
      </g>
    ]);
  };

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
    const baseSize = 7;
    const masteryBonus = skill.mastered ? 4 : (skill.masteryLevel / 25);
    const size = baseSize + masteryBonus;

    // Leaf color hue varies slightly based on mastery
    const hue = 120 + (skill.masteryLevel / 5);
    
    return {
      x: baseX,
      y: baseY,
      size,
      // Add angle information for leaf orientation
      angle: Math.atan2(perpY, perpX) + (side * Math.PI / 8),
      isRecentlyMastered: recentlyMastered.includes(skill.id) && skill.mastered,
      hue
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
    if (!svgRef.current || mainBranches.length === 0) return;
    
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
      mainBranches.forEach((branch, i) => {
        const branchElement = svg.querySelector(`#${branch.id}`);
        if (branchElement) {
          branchElement.classList.add('animate-grow');
          branchElement.setAttribute('style', `animation-delay: ${i * 0.2}s`);
          branchElement.addEventListener('animationend', () => {
            branchElement.classList.remove('animate-grow');
            branchElement.removeAttribute('style');
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
  }, [animation, mainBranches, recentlyMastered, firstRender]);

  // Render tooltip for skills
  const renderTooltip = () => {
    if (!showTooltip) return null;
    
    const skill = skills.find(s => s.id === showTooltip);
    if (!skill) return null;
    
    // Find leaf position for this skill
    let tooltipX = 0;
    let tooltipY = 0;
    let found = false;
    
    // Recursive search function
    const findSkillInBranches = (branches: Branch[]) => {
      for (const branch of branches) {
        const skillIndex = branch.skills.findIndex(s => s.id === skill.id);
        if (skillIndex >= 0) {
          const leaf = generateLeafCoordinates(branch, skill, skillIndex);
          tooltipX = leaf.x;
          tooltipY = leaf.y;
          found = true;
          return true;
        }
        
        // Check sub-branches
        if (branch.subBranches && branch.subBranches.length > 0) {
          if (findSkillInBranches(branch.subBranches)) {
            return true;
          }
        }
      }
      return false;
    };
    
    findSkillInBranches(mainBranches);
    
    if (!found) return null;
    
    return (
      <g key={`tooltip-${skill.id}`}>
        <rect
          x={tooltipX - 60}
          y={tooltipY - 50}
          width="120"
          height="36"
          rx="6"
          ry="6"
          fill="rgba(255,255,255,0.95)"
          stroke={theme.palette.primary.main}
          strokeWidth="1"
          filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.2))"
        />
        <text
          x={tooltipX}
          y={tooltipY - 30}
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
            x={tooltipX}
            y={tooltipY - 40}
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
  };

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
          borderRadius: '8px',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(245,250,245,0.9))',
          boxShadow: '0 8px 32px rgba(31,38,135,0.15)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.18)',
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
          height: 500,
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
            height: '40%',
            background: 'linear-gradient(to top, rgba(232, 245, 233, 0.7) 0%, rgba(232, 245, 233, 0) 100%)',
            zIndex: 1
          }} />
          
          {/* Sun/light effect */}
          <Box sx={{
            position: 'absolute',
            top: 20,
            right: 25,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,236,179,0.3) 0%, rgba(255,236,179,0) 70%)',
            zIndex: 1,
            animation: 'pulse 8s infinite ease-in-out',
            '@keyframes pulse': {
              '0%': { opacity: 0.5, transform: 'scale(1)' },
              '50%': { opacity: 0.8, transform: 'scale(1.1)' },
              '100%': { opacity: 0.5, transform: 'scale(1)' }
            }
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
              viewBox="0 0 300 500" 
              overflow="visible"
              style={{ marginTop: '-40px' }}
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
                
                {/* Shadow gradient */}
                <radialGradient id="shadowGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                  <stop offset="0%" stopColor="rgba(0,0,0,0.2)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                </radialGradient>
                
                {/* Gradients for each branch */}
                {mainBranches.map((branch, i) => (
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
                      0% { opacity: 0.8; transform: scale(1); }
                      50% { opacity: 1; transform: scale(1.1); }
                      100% { opacity: 0.8; transform: scale(1); }
                    }
                    
                    @keyframes float {
                      0% { transform: translateY(0); }
                      50% { transform: translateY(-5px); }
                      100% { transform: translateY(0); }
                    }
                    
                    @keyframes sway {
                      0% { transform: rotate(0deg); }
                      25% { transform: rotate(1deg); }
                      75% { transform: rotate(-1deg); }
                      100% { transform: rotate(0deg); }
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
                    
                    .sway-slow {
                      transform-origin: bottom;
                      animation: sway 8s ease-in-out infinite;
                    }
                    
                    .sway-medium {
                      transform-origin: bottom;
                      animation: sway 6s ease-in-out infinite;
                    }
                    
                    .float-animation {
                      animation: float 5s ease-in-out infinite;
                    }
                  `}
                </style>
              </defs>
              
              {/* Shadow beneath the pot */}
              <ellipse 
                cx="150" 
                cy={385 + treeVitality.potHeight} 
                rx={treeVitality.potWidth * 0.9} 
                ry="8" 
                fill="url(#shadowGradient)"
                opacity="0.5"
              />
              
              {/* Pot/Base */}
              <g className="float-animation">
                <ellipse 
                  cx="150" 
                  cy="385" 
                  rx={treeVitality.potWidth} 
                  ry="15" 
                  fill="#A1887F" 
                />
                <path 
                  d={`
                    M${150 - treeVitality.potWidth}, 385 
                    L${150 - treeVitality.potWidth * 0.8}, ${385 + treeVitality.potHeight}
                    L${150 + treeVitality.potWidth * 0.8}, ${385 + treeVitality.potHeight}
                    L${150 + treeVitality.potWidth}, 385
                  `}
                  fill="url(#potGradient)"
                />
                <ellipse 
                  cx="150" 
                  cy={385 + treeVitality.potHeight} 
                  rx={treeVitality.potWidth * 0.8} 
                  ry="6" 
                  fill="#5D4037" 
                />
                
                {/* Soil/moss in pot */}
                <ellipse 
                  cx="150" 
                  cy="383" 
                  rx={treeVitality.potWidth * 0.85} 
                  ry="13" 
                  fill="#3E2723" 
                />
                <ellipse 
                  cx="150" 
                  cy="382" 
                  rx={treeVitality.potWidth * 0.8} 
                  ry="12" 
                  fill="#33691E" 
                  opacity="0.4"
                />
              </g>
              
              {/* Trunk */}
              <g className="sway-slow">
                <animated.path
                  id="tree-trunk"
                  d={`
                    M${150 - treeVitality.trunkWidth * 0.25}, 385
                    C${150 - treeVitality.trunkWidth * 0.3}, ${385 - treeVitality.trunkHeight * 0.3}
                     ${150 - treeVitality.trunkWidth * 0.1}, ${385 - treeVitality.trunkHeight * 0.7}
                     ${150}, ${385 - treeVitality.trunkHeight}
                  `}
                  fill="none"
                  stroke="url(#trunkGradient)"
                  strokeWidth={treeVitality.trunkWidth}
                  strokeLinecap="round"
                  style={trunkProps}
                />
                
                {/* Secondary smaller trunk for more realism */}
                <animated.path
                  d={`
                    M${150 + treeVitality.trunkWidth * 0.15}, 385
                    C${150 + treeVitality.trunkWidth * 0.2}, ${385 - treeVitality.trunkHeight * 0.25}
                     ${150 + treeVitality.trunkWidth * 0.05}, ${385 - treeVitality.trunkHeight * 0.5}
                     ${150 + treeVitality.trunkWidth * 0.05}, ${385 - treeVitality.trunkHeight * 0.65}
                  `}
                  fill="none"
                  stroke="url(#trunkGradient)"
                  strokeWidth={treeVitality.trunkWidth * 0.6}
                  strokeLinecap="round"
                  style={trunkProps}
                />
              
                {/* Branches */}
                {renderBranches(mainBranches)}
              </g>
              
              {/* Skill name tooltips */}
              {renderTooltip()}
            </svg>
          </Box>
          
          {/* Tree legend */}
          <Box 
            sx={{ 
              position: 'absolute', 
              bottom: 15, 
              right: 15,
              background: 'rgba(255,255,255,0.9)', 
              p: 1.5,
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.5)',
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

 