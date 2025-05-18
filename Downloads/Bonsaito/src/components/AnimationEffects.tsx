import React, { ReactNode } from 'react';
import { useSpring, animated, config } from 'react-spring';
import Lottie from 'lottie-react';

// Fade-in animation component
export const FadeIn: React.FC<{
  children: ReactNode;
  delay?: number;
}> = ({ children, delay = 0 }) => {
  const props = useSpring({
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    delay,
    config: config.molasses,
  });

  return <animated.div style={props}>{children}</animated.div>;
};

// Scale animation component
export const ScaleIn: React.FC<{
  children: ReactNode;
  delay?: number;
}> = ({ children, delay = 0 }) => {
  const props = useSpring({
    from: { opacity: 0, transform: 'scale(0.9)' },
    to: { opacity: 1, transform: 'scale(1)' },
    delay,
    config: config.gentle,
  });

  return <animated.div style={props}>{children}</animated.div>;
};

// Hover effect component
export const HoverEffect: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [props, set] = useSpring(() => ({
    transform: 'translateY(0) scale(1)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
    config: config.wobbly,
  }));

  return (
    <animated.div
      style={props}
      onMouseEnter={() => set({ 
        transform: 'translateY(-8px) scale(1.02)',
        boxShadow: '0 16px 48px 0 rgba(0, 0, 0, 0.3)'
      })}
      onMouseLeave={() => set({ 
        transform: 'translateY(0) scale(1)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
      })}
    >
      {children}
    </animated.div>
  );
};

// Shimmer effect component
export const ShimmerEffect: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const props = useSpring({
    from: { backgroundPosition: '-200% 0' },
    to: { backgroundPosition: '200% 0' },
    config: { duration: 2000 },
    loop: true,
  });

  return (
    <animated.div
      style={{
        ...props,
        background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.1), rgba(255,255,255,0))',
        backgroundSize: '200% 100%',
        position: 'relative',
      }}
    >
      {children}
    </animated.div>
  );
};

// Floating animation for elements
export const FloatAnimation: React.FC<{
  children: ReactNode;
  amplitude?: number;
  delay?: number;
}> = ({ children, amplitude = 8, delay = 0 }) => {
  const props = useSpring({
    to: async (next) => {
      while (true) {
        await next({ transform: `translateY(${amplitude}px)` });
        await next({ transform: `translateY(-${amplitude}px)` });
      }
    },
    from: { transform: 'translateY(0px)' },
    config: { duration: 3000 },
    delay,
  });

  return <animated.div style={props}>{children}</animated.div>;
};

// Progress animation that fills from left to right
export const ProgressAnimation: React.FC<{
  value: number; // 0 to 100
  color?: string;
  height?: number;
}> = ({ value, color = '#1a936f', height = 8 }) => {
  const props = useSpring({
    width: `${value}%`,
    from: { width: '0%' },
    config: config.molasses,
  });

  return (
    <div
      style={{
        width: '100%',
        height: `${height}px`,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: `${height}px`,
        overflow: 'hidden',
      }}
    >
      <animated.div
        style={{
          ...props,
          height: '100%',
          backgroundColor: color,
          borderRadius: `${height}px`,
        }}
      />
    </div>
  );
};

// Staggered list animation
export const StaggeredList: React.FC<{
  children: ReactNode[];
  staggerDelay?: number;
}> = ({ children, staggerDelay = 100 }) => {
  return (
    <>
      {React.Children.map(children, (child, index) => (
        <FadeIn key={index} delay={index * staggerDelay}>
          {child}
        </FadeIn>
      ))}
    </>
  );
};

// Slide-in animation
export const SlideIn: React.FC<{
  children: ReactNode;
  direction?: 'left' | 'right' | 'top' | 'bottom';
  delay?: number;
  distance?: number;
}> = ({ children, direction = 'left', delay = 0, distance = 50 }) => {
  const getTransform = () => {
    switch (direction) {
      case 'left':
        return `translateX(-${distance}px)`;
      case 'right':
        return `translateX(${distance}px)`;
      case 'top':
        return `translateY(-${distance}px)`;
      case 'bottom':
        return `translateY(${distance}px)`;
      default:
        return `translateX(-${distance}px)`;
    }
  };

  const props = useSpring({
    from: { opacity: 0, transform: getTransform() },
    to: { opacity: 1, transform: 'translate(0px, 0px)' },
    delay,
    config: config.gentle,
  });

  return <animated.div style={props}>{children}</animated.div>;
};

// Pulse animation
export const PulseAnimation: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const props = useSpring({
    to: async (next) => {
      while (true) {
        await next({ transform: 'scale(1.05)', opacity: 0.8 });
        await next({ transform: 'scale(1)', opacity: 1 });
      }
    },
    from: { transform: 'scale(1)', opacity: 1 },
    config: { duration: 2000 },
  });

  return <animated.div style={props}>{children}</animated.div>;
};

export default {
  FadeIn,
  ScaleIn,
  HoverEffect,
  ShimmerEffect,
  FloatAnimation,
  ProgressAnimation,
  StaggeredList,
  SlideIn,
  PulseAnimation,
}; 