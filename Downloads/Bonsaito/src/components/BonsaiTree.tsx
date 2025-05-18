import React, { useMemo, useRef } from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { useSpring, animated, config } from 'react-spring';

// Helper functions
const lerp = (a: number, b: number, t: number): number => a * (1 - t) + b * t;
const clamp = (num: number, min: number, max: number): number => Math.min(Math.max(num, min), max);
const randRange = (min: number, max: number): number => Math.random() * (max - min) + min;

interface Skill {
  id: string;
  name: string;
  category: string;
  mastered: boolean;
  masteryLevel: number; // Assuming 0-100
}

interface BonsaiTreeProps {
  skills: Skill[];
  totalSkills: number;
}

interface Point {
  x: number;
  y: number;
}

interface Branch {
  id: string;
  start: Point;
  end: Point;
  control1: Point;
  control2: Point;
  thickness: number;
  angle: number;
  level: number;
  skillsInCategory: Skill[];
  masteryRatio: number;
  subBranches: Branch[]; // Kept for potential future expansion, but not used in this style
  foliagePads: FoliagePad[];
}

interface FoliagePad {
  id: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rotation: number;
  color: string;
  elements: FoliageElement[]; // Multiple ellipses for a fuller look
}

interface FoliageElement {
  id: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  color: string;
  opacity: number;
}

// Color palette matching the image
const TRUNK_COLOR = '#6A4A3C'; // A richer, slightly desaturated brown
const BRANCH_COLOR = '#7B584A';
const LEAF_MASTERED_COLOR = '#2A603B'; // Darker, more saturated green
const LEAF_IN_PROGRESS_COLOR = '#4CAF50'; // Brighter, but still natural green
const LEAF_LOW_PROGRESS_COLOR = '#7DB080'; // Paler green for low mastery
const POT_COLOR_BODY = '#8A7967'; // Muted brownish-gray
const POT_COLOR_RIM = '#9C8B7A';
const POT_FEET_COLOR = '#796A5B';

const BonsaiTree: React.FC<BonsaiTreeProps> = ({ skills, totalSkills }) => {
  const theme = useTheme();

  const masteredSkillsCount = useMemo(() => {
    return skills.filter(skill => skill.mastered).length;
  }, [skills]);

  const overallMasteryRatio = useMemo(() => {
    return totalSkills > 0 ? masteredSkillsCount / totalSkills : 0;
  }, [masteredSkillsCount, totalSkills]);

  const skillsByCategory = useMemo(() => {
    return skills.reduce((acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill);
      return acc;
    }, {} as Record<string, Skill[]>);
  }, [skills]);

  const treeElements = useMemo(() => {
    const categories = Object.keys(skillsByCategory);
    let numCategories = categories.length;
    if (numCategories === 0) return { trunkPath: '', branches: [], pot: { body: '', rim: '', feet: [] } };

    // Limit to max 3-4 main foliage areas for the target image style
    const MAX_MAIN_FOLIAGE_AREAS = 3;
    const visibleCategories = categories.slice(0, MAX_MAIN_FOLIAGE_AREAS);
    numCategories = visibleCategories.length;

    const svgWidth = 300;
    const svgHeight = 400;
    const potBaseY = svgHeight - 30; // Leave space for feet
    const potBodyHeight = 40;
    const potRimHeight = 10;
    const potWidth = 130;
    const potFeetHeight = 8;
    const potFeetWidth = 20;

    const pot = {
      body: `M${svgWidth/2 - potWidth/2},${potBaseY} L${svgWidth/2 - potWidth/2 + 15},${potBaseY - potBodyHeight} L${svgWidth/2 + potWidth/2 - 15},${potBaseY - potBodyHeight} L${svgWidth/2 + potWidth/2},${potBaseY} Z`,
      rim: `M${svgWidth/2 - potWidth/2 + 10},${potBaseY - potBodyHeight} Q${svgWidth/2},${potBaseY - potBodyHeight - potRimHeight} ${svgWidth/2 + potWidth/2 - 10},${potBaseY - potBodyHeight} H${svgWidth/2 - potWidth/2 + 10} Z`,
      feet: [
        `M${svgWidth/2 - potWidth/2 + 15},${potBaseY} h${potFeetWidth} v${potFeetHeight} h-${potFeetWidth} Z`,
        `M${svgWidth/2 + potWidth/2 - 15 - potFeetWidth},${potBaseY} h${potFeetWidth} v${potFeetHeight} h-${potFeetWidth} Z`,
      ]
    };

    const trunkStartPoint: Point = { x: svgWidth / 2, y: potBaseY - potBodyHeight - potRimHeight / 2 };    
    const trunkBaseActualHeight = clamp(120 + overallMasteryRatio * 60, 100, 180);
    const trunkTopPoint: Point = { x: trunkStartPoint.x + randRange(-10, 10), y: trunkStartPoint.y - trunkBaseActualHeight }; // Slight lean at top
    const trunkWidthAtBase = clamp(25 + overallMasteryRatio * 20, 20, 45);
    const trunkWidthAtTop = clamp(trunkWidthAtBase * 0.5, 10, trunkWidthAtBase * 0.7);

    // S-curve trunk design
    const controlPoint1X = trunkStartPoint.x + randRange(20, 40) * (Math.random() > 0.5 ? 1 : -1);
    const controlPoint1Y = trunkStartPoint.y - trunkBaseActualHeight * 0.3;
    const controlPoint2X = trunkTopPoint.x + randRange(15, 30) * (Math.random() > 0.5 ? 1 : -1);
    const controlPoint2Y = trunkStartPoint.y - trunkBaseActualHeight * 0.7;

    const trunkPath = `M ${trunkStartPoint.x - trunkWidthAtBase/2}, ${trunkStartPoint.y}
      C ${controlPoint1X - trunkWidthAtBase*0.4}, ${controlPoint1Y},
        ${controlPoint2X - trunkWidthAtTop*0.6}, ${controlPoint2Y},
        ${trunkTopPoint.x - trunkWidthAtTop/2}, ${trunkTopPoint.y}
      L ${trunkTopPoint.x + trunkWidthAtTop/2}, ${trunkTopPoint.y}
      C ${controlPoint2X + trunkWidthAtTop*0.6}, ${controlPoint2Y},
        ${controlPoint1X + trunkWidthAtBase*0.4}, ${controlPoint1Y},
        ${trunkStartPoint.x + trunkWidthAtBase/2}, ${trunkStartPoint.y} Z`;

    const generatedBranches: Branch[] = [];
    const branchAngles = numCategories === 1 ? [-Math.PI/2] :
                         numCategories === 2 ? [-Math.PI/2 - 0.8, -Math.PI/2 + 0.8] :
                         [-Math.PI/2 - 1.0, -Math.PI/2, -Math.PI/2 + 1.0]; // For 3 branches

    visibleCategories.forEach((category, index) => {
      const categorySkills = skillsByCategory[category];
      const masteredInCategory = categorySkills.filter(s => s.mastered).length;
      const categoryMasteryRatio = categorySkills.length > 0 ? masteredInCategory / categorySkills.length : 0;

      const angle = branchAngles[index] + randRange(-0.15, 0.15);
      const len = clamp(50 + categorySkills.length * 5 + categoryMasteryRatio * 20, 40, 90);
      const thick = clamp(trunkWidthAtTop * 0.6 + categoryMasteryRatio * 5, 5, trunkWidthAtTop * 0.9);
      
      // Branch start slightly up the trunk for visual separation
      const branchStartRelY = trunkBaseActualHeight * (0.1 + index * 0.15); // Stagger start points
      const bStart: Point = {
          x: lerp(trunkStartPoint.x, trunkTopPoint.x, branchStartRelY / trunkBaseActualHeight) + randRange(-5,5) ,
          y: trunkStartPoint.y - branchStartRelY + randRange(-5,5) ,
      };
      const bEnd: Point = { x: bStart.x + Math.cos(angle) * len, y: bStart.y + Math.sin(angle) * len };
      const bCp1: Point = { x: bStart.x + Math.cos(angle + 0.5) * len * 0.4, y: bStart.y + Math.sin(angle + 0.5) * len * 0.4 };
      const bCp2: Point = { x: bEnd.x - Math.cos(angle - 0.3) * len * 0.3, y: bEnd.y - Math.sin(angle - 0.3) * len * 0.3 };

      const foliagePads: FoliagePad[] = [];
      const numPadClusters = 1; // One main pad per branch
      for (let i = 0; i < numPadClusters; i++) {
        const padBasePoint = bEnd; // Center pad around branch end
        const basePadRx = clamp(25 + categorySkills.length * 2.5 + categoryMasteryRatio * 15, 20, 45);
        const basePadRy = clamp(20 + categorySkills.length * 2 + categoryMasteryRatio * 10, 15, 35);
        const padElements: FoliageElement[] = [];

        const numEllipsesInPad = 5 + Math.floor(categoryMasteryRatio * 5); // More ellipses for higher mastery = denser
        for (let j = 0; j < numEllipsesInPad; j++) {
          const rx = basePadRx * randRange(0.5, 1.0);
          const ry = basePadRy * randRange(0.5, 1.0);
          const cx = padBasePoint.x + randRange(-basePadRx * 0.4, basePadRx * 0.4);
          const cy = padBasePoint.y + randRange(-basePadRy * 0.4, basePadRy * 0.4);
          
          let color = LEAF_LOW_PROGRESS_COLOR;
          if (categoryMasteryRatio > 0.66) color = LEAF_MASTERED_COLOR;
          else if (categoryMasteryRatio > 0.33) color = LEAF_IN_PROGRESS_COLOR;

          padElements.push({
            id: `fe-${category}-${index}-${i}-${j}`,
            cx, cy, rx, ry,
            color,
            opacity: randRange(0.6, 0.95)
          });
        }
        foliagePads.push({
          id: `pad-${category}-${index}-${i}`,
          cx: padBasePoint.x, cy: padBasePoint.y, // These are indicative, actual shape from elements
          rx: basePadRx, ry: basePadRy,          // These are indicative
          rotation: randRange(-10, 10),
          color: 'transparent', // Pad container is transparent, elements have color
          elements: padElements
        });
      }

      generatedBranches.push({
        id: `branch-${category}-${index}`, start: bStart, end: bEnd, control1: bCp1, control2: bCp2,
        thickness: thick, angle, level: 0, skillsInCategory: categorySkills,
        masteryRatio: categoryMasteryRatio, subBranches: [], foliagePads
      });
    });
    return { trunkPath, branches: generatedBranches, pot };
  }, [skillsByCategory, overallMasteryRatio, theme.palette.grey]);

  // Create all animations at the top level
  const containerAnimation = useSpring({ opacity: 1, from: { opacity: 0 }, config: config.molasses });
  const potAnimation = useSpring({ 
    opacity: 1, 
    transform: 'scale(1)', 
    from: { opacity: 0, transform: 'scale(0.8)' }, 
    config: config.gentle, 
    delay: 200 
  });
  
  const trunkAnimation = useSpring({ 
    opacity: 1, 
    transform: 'scale(1)', 
    from: { opacity: 0, transform: 'scale(0.8)' }, 
    config: config.gentle, 
    delay: 400 
  });
  
  // Pre-calculate branch animations for each branch
  const branchAnimations = treeElements.branches.map((branch, index) => 
    useSpring({
      opacity: 1, 
      transform: 'scale(1)', 
      from: { opacity: 0, transform: 'scale(0.8)' }, 
      config: config.gentle, 
      delay: 600 + index * 200
    })
  );

  return (
    <animated.div style={containerAnimation}>
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: '20px', backgroundColor: '#f7f7f7' }}>
        <Typography variant="h5" gutterBottom align="center" sx={{ fontWeight: 'bold', color: '#555' }}>
          Your Growth Tree
        </Typography>
        <Box sx={{ width: '100%', height: 350, position: 'relative', mt: 2 }}>
          <svg width="100%" height="100%" viewBox="0 0 300 400" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="trunkStrokeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={TRUNK_COLOR} />
                <stop offset="50%" stopColor={TRUNK_COLOR} />
                <stop offset="100%" stopColor={TRUNK_COLOR} />
              </linearGradient>
               <filter id="subtleShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="1" dy="2" stdDeviation="1" floodColor="#000" floodOpacity="0.2"/>
              </filter>
            </defs>

            {/* Pot */}
            <animated.g style={potAnimation}>
              <path d={treeElements.pot.body} fill={POT_COLOR_BODY} filter="url(#subtleShadow)"/>
              <path d={treeElements.pot.rim} fill={POT_COLOR_RIM} />
              {treeElements.pot.feet.map((footPath, i) => (
                <path key={`pot-foot-${i}`} d={footPath} fill={POT_FEET_COLOR} />
              ))}
            </animated.g>

            {/* Trunk */}
            <animated.path
              d={treeElements.trunkPath}
              fill="url(#trunkStrokeGradient)" // Using the solid color gradient for fill
              stroke={TRUNK_COLOR} // Stroke for definition
              strokeWidth="1.5"
              style={trunkAnimation}
              filter="url(#subtleShadow)"
            />
            
            {treeElements.branches.map((branch, branchIndex) => (
              <animated.g key={branch.id} style={branchAnimations[branchIndex]}>
                <path 
                  d={`M ${branch.start.x} ${branch.start.y} C ${branch.control1.x} ${branch.control1.y}, ${branch.control2.x} ${branch.control2.y}, ${branch.end.x} ${branch.end.y}`}
                  stroke={BRANCH_COLOR}
                  strokeWidth={branch.thickness}
                  fill="none"
                  strokeLinecap="round"
                  filter="url(#subtleShadow)"
                />
                {branch.foliagePads.map(pad => (
                  <g key={pad.id} transform={`rotate(${pad.rotation} ${pad.cx} ${pad.cy})`}>
                    {pad.elements.map(el => (
                      <ellipse
                        key={el.id}
                        cx={el.cx}
                        cy={el.cy}
                        rx={el.rx}
                        ry={el.ry}
                        fill={el.color}
                        opacity={el.opacity}
                        filter="url(#subtleShadow)"
                      />
                    ))}
                  </g>
                ))}
              </animated.g>
            ))}
          </svg>
        </Box>
        <Typography variant="body1" align="center" sx={{ mt: 3, color: '#666' }}>
          You've mastered {masteredSkillsCount} skills so far! Keep growing!
        </Typography>
      </Paper>
    </animated.div>
  );
};

export default BonsaiTree;

 