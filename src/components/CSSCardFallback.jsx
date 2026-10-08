import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function CSSCardFallback({ methodId, accentColor }) {
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  
  const springConfig = { damping: 25, stiffness: 200, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);
  
  // Parallax tilt
  const rotateX = useTransform(smoothY, [0, 1], [10, -10]);
  const rotateY = useTransform(smoothX, [0, 1], [-10, 10]);

  // Flip rotation based on method
  const flipAngle = methodId === 'official' ? 0 : methodId === 'discounted' ? 180 : 360;
  
  // Combine base tilt with flip
  const combinedRotateY = useTransform(rotateY, (r) => r + flipAngle);

  const onMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };
  const onMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <div 
      className="css-card-container" 
      onMouseMove={onMouseMove} 
      onMouseLeave={onMouseLeave}
    >
      <motion.div 
        className="css-card-body"
        style={{ rotateX, rotateY: combinedRotateY }}
      >
        <div className={`css-card-face css-card-front ${methodId === 'trial' ? 'is-trial' : ''}`}>
          {methodId !== 'trial' ? (
            <>
              <div className="css-card-chip" />
              <div className="css-card-logo">OFFICIAL ACCESS</div>
            </>
          ) : (
            <div className="css-card-trial">TRIAL</div>
          )}
          <div className="css-card-sheen" style={{
            transform: useTransform(smoothX, [0, 1], ['translateX(-100%)', 'translateX(100%)'])
          }} />
        </div>
        
        <div className="css-card-face css-card-back">
          <div className="css-card-foil" />
          <div className="css-card-glyph">%</div>
        </div>
      </motion.div>
    </div>
  );
}
