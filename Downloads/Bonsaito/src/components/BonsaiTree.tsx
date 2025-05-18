import React, { useMemo } from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { useSpring, animated, config, useSprings } from 'react-spring';

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

// Simplified structure - focusing on trunk and foliage pads
interface FoliagePadElement {
  id: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rotation: number;
  // Elements for gradient/layering
  layers: {
    color: string;
    opacity: number;
    scale: number; // To create inner layers
  }[];
}

// New Color Palette based on the target image
const TRUNK_COLOR = '#604E43'; 
const FOLIAGE_HIGHLIGHT_COLOR = '#A1D490';
const FOLIAGE_SHADE_COLOR = '#7CAC6C'; 
const POT_COLOR = '#8D7B6F';

const BonsaiTree: React.FC<BonsaiTreeProps> = ({ skills, totalSkills }) => {
  const theme = useTheme(); // Keep for potential future use or if other elements need it

  // Define SVG dimensions at the component level
  const svgWidth = 400;
  const svgHeight = 450; // Adjusted height for the new design

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
    let numFoliagePads = clamp(categories.length, 1, 3); // 1 to 3 main pads
    if (skills.length === 0) numFoliagePads = 1; // Default to one pad if no skills

    // Pot - Lower, wider, shallower
    const potHeight = 35;
    const potWidth = 120;
    const potY = svgHeight - potHeight - 5; // 5 for feet clearance
    const potFeetHeight = 5;
    const potFeetWidth = 15;
    const potPath = `M${svgWidth/2 - potWidth/2},${potY} h${potWidth} v${potHeight} h-${potWidth} Z`;
    const potFeet = [
      `M${svgWidth/2 - potWidth/2 + 10},${potY + potHeight} h${potFeetWidth} v${potFeetHeight} h-${potFeetWidth} Z`,
      `M${svgWidth/2 + potWidth/2 - 10 - potFeetWidth},${potY + potHeight} h${potFeetWidth} v${potFeetHeight} h-${potFeetWidth} Z`,
    ];

    // Trunk - Single graceful curve, leaning
    const trunkBaseWidth = clamp(18 + overallMasteryRatio * 12, 15, 30);
    const trunkTopWidth = trunkBaseWidth * 0.5;
    const trunkHeight = clamp(90 + overallMasteryRatio * 40, 70, 130);
    
    const trunkStartX = svgWidth / 2;
    const trunkStartY = potY;
    const trunkEndX = trunkStartX + randRange(15, 30) * (Math.random() > 0.5 ? 1 : -1); // Lean
    const trunkEndY = trunkStartY - trunkHeight;

    // Control points for a C-like curve
    const cp1X = trunkStartX + (trunkEndX - trunkStartX) * 0.1 + randRange(-20, 20);
    const cp1Y = trunkStartY - trunkHeight * 0.3;
    const cp2X = trunkStartX + (trunkEndX - trunkStartX) * 0.9 + randRange(-15, 15);
    const cp2Y = trunkStartY - trunkHeight * 0.8;

    // Path for tapering trunk
    const trunkPath = `
      M ${trunkStartX - trunkBaseWidth / 2}, ${trunkStartY}
      C ${cp1X - trunkBaseWidth * 0.4}, ${cp1Y},
        ${cp2X - trunkTopWidth * 0.6}, ${cp2Y},
        ${trunkEndX - trunkTopWidth / 2}, ${trunkEndY}
      L ${trunkEndX + trunkTopWidth / 2}, ${trunkEndY}
      C ${cp2X + trunkTopWidth * 0.6}, ${cp2Y},
        ${cp1X + trunkBaseWidth * 0.4}, ${cp1Y},
        ${trunkStartX + trunkBaseWidth / 2}, ${trunkStartY}
      Z
    `;

    const foliagePads: FoliagePadElement[] = [];
    const padBaseSize = clamp(40 + overallMasteryRatio * 20, 35, 60);

    // Define points along the trunk curve where foliage pads can be placed
    // Simple approach: divide trunk height into sections
    const numPadAttachmentPoints = numFoliagePads;
    const attachmentPoints: Point[] = [];
    for (let i = 0; i < numPadAttachmentPoints; i++) {
        const t = (i + 1) / (numPadAttachmentPoints + 1); // Distribute along 0.25 to 0.75 of trunk height approx.
        // Calculate point on Bezier curve (simplified for this example)
        // A proper calculation would use the Bezier formula based on t
        const pX = lerp(lerp(cp1X, cp2X, t), lerp(trunkStartX, trunkEndX, t), t) + randRange(-10,10) ;
        const pY = lerp(lerp(cp1Y, cp2Y, t), lerp(trunkStartY, trunkEndY, t), t) + randRange(-15,5);
        attachmentPoints.push({x: pX, y: pY });
    }
    if (numFoliagePads === 1) { // Center single pad more towards the top
        attachmentPoints[0] = {x: trunkEndX + randRange(-5,5), y: trunkEndY + randRange(-5,10)};
    }


    for (let i = 0; i < numFoliagePads; i++) {
      const basePoint = attachmentPoints[i % attachmentPoints.length]; // Cycle through attachment points if more pads than points
      const padRx = padBaseSize * randRange(0.9, 1.2);
      const padRy = padBaseSize * randRange(0.7, 1.0);
      const rotation = randRange(-15, 15);

      // Layered effect for foliage pad
      const layers = [
        { color: FOLIAGE_SHADE_COLOR, opacity: 0.8, scale: 1.0 },        // Base, slightly darker
        { color: FOLIAGE_HIGHLIGHT_COLOR, opacity: 0.85, scale: 0.85 }, // Middle highlight
        { color: FOLIAGE_HIGHLIGHT_COLOR, opacity: 0.6, scale: 0.65 }   // Smaller, brighter highlight
      ];

      foliagePads.push({
        id: `foliage-${i}`,
        cx: basePoint.x,
        cy: basePoint.y,
        rx: padRx,
        ry: padRy,
        rotation,
        layers
      });
    }

    return { potPath, potFeet, trunkPath, foliagePads };

  }, [skillsByCategory, overallMasteryRatio, skills.length, svgWidth, svgHeight]);

  // Animations
  const containerAnimation = useSpring({ opacity: 1, from: { opacity: 0 }, config: {...config.gentle, duration: 500} });
  const potAnim = useSpring({ opacity: 1, transform: 'translateY(0px)', from: { opacity: 0, transform: 'translateY(20px)' }, delay: 100, config: config.gentle });
  const trunkAnim = useSpring({ opacity: 1, transform: 'scaleY(1)', from: { opacity: 0, transform: 'scaleY(0.5)' }, delay: 250, config: config.gentle, transformOrigin: 'bottom' });
  
  const foliageAnims = useSprings(
    treeElements.foliagePads.length,
    treeElements.foliagePads.map((pad, i) => ({
      opacity: 1,
      transform: 'scale(1)',
      from: { opacity: 0, transform: 'scale(0.5)' },
      delay: 400 + i * 150,
      config: config.wobbly,
    }))
  );

  return (
    <animated.div style={containerAnimation}>
      <Box 
        sx={{ 
          backgroundImage: 'url(/altar2.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '20px',
          p: 2
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <div className="MuiBox-root css-14lrhfz"></div>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              mb: 4, 
              borderRadius: '20px',
              backgroundColor: 'transparent',
              position: 'relative',
            }}
          >
            <Typography 
              variant="h5" 
              gutterBottom 
              align="center" 
              sx={{ 
                fontWeight: 'bold', 
                color: '#2C1810',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                mb: 3
              }}
            >
              Your Learning Bonsai
            </Typography>
            <Box sx={{ 
              width: '100%', 
              height: svgHeight, 
              position: 'relative', 
              mt: 2,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <svg 
                width="100%" 
                height="100%" 
                viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
                style={{ overflow: 'visible' }}
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Ambient Glow Effect */}
                <defs>
                  <radialGradient id="treeGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                    <stop offset="0%" stopColor="#FFF8E1" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#FFF8E1" stopOpacity="0" />
                  </radialGradient>
                </defs>
                
                <circle 
                  cx={svgWidth / 2} 
                  cy={svgHeight / 2} 
                  r={Math.min(svgWidth, svgHeight) / 2.5} 
                  fill="url(#treeGlow)" 
                />

                {/* Pot */}
                <animated.g style={potAnim}>
                  <path d={treeElements.potPath} fill={POT_COLOR} />
                  {treeElements.potFeet.map((footPath, i) => (
                    <path key={`pot-foot-${i}`} d={footPath} fill={POT_COLOR} />
                  ))}
                </animated.g>

                {/* Trunk with enhanced shadow */}
                <animated.g style={trunkAnim}>
                  <path
                    d={treeElements.trunkPath}
                    fill={TRUNK_COLOR}
                    filter="url(#trunkShadow)"
                  />
                </animated.g>

                {/* Foliage */}
                {treeElements.foliagePads.map((pad, index) => (
                  <animated.g
                    key={pad.id}
                    style={foliageAnims[index]}
                    transform={`rotate(${pad.rotation} ${pad.cx} ${pad.cy})`}
                  >
                    {pad.layers.map((layer, layerIndex) => (
                      <ellipse
                        key={`${pad.id}-layer-${layerIndex}`}
                        cx={pad.cx}
                        cy={pad.cy}
                        rx={pad.rx * layer.scale}
                        ry={pad.ry * layer.scale}
                        fill={layer.color}
                        opacity={layer.opacity}
                        filter="url(#foliageShadow)"
                      />
                    ))}
                  </animated.g>
                ))}

                {/* Enhanced Shadows */}
                <defs>
                  <filter id="trunkShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                    <feOffset dx="2" dy="2" result="offsetblur" />
                    <feComponentTransfer>
                      <feFuncA type="linear" slope="0.3" />
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>

                  <filter id="foliageShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
                    <feOffset dx="1" dy="1" result="offsetblur" />
                    <feComponentTransfer>
                      <feFuncA type="linear" slope="0.2" />
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
              </svg>
            </Box>
          </Paper>
        </Box>
      </Box>
    </animated.div>
  );
};

export default BonsaiTree;

 