import React from 'react';
import { motion } from 'framer-motion';

const Logo = ({ className = "", size = "small", animated = true }) => {
  // Sizes mapping
  const sizes = {
    small: { w: 32, h: 32, text: "text-xl" },
    medium: { w: 48, h: 48, text: "text-3xl" },
    large: { w: 80, h: 80, text: "text-6xl" },
  };

  const { w, h, text } = sizes[size] || sizes.small;

  // SVG Path variants for drawing animation
  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { 
      pathLength: 1, 
      opacity: 1,
      transition: { 
        duration: 1.5, 
        ease: "easeInOut",
        repeat: animated ? Infinity : 0,
        repeatType: "reverse",
        repeatDelay: 3
      } 
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* The Icon */}
      <div className="relative flex items-center justify-center">
        {/* Glow Effect */}
        <div className={`absolute inset-0 bg-blue-500/30 blur-xl rounded-full ${size === 'large' ? 'scale-150' : 'scale-110'}`} />
        
        <svg 
          width={w} 
          height={h} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="text-blue-400 relative z-10"
        >
          {/* Shield/Block Shape */}
          <motion.path 
            d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" 
            variants={pathVariants}
            initial="hidden"
            animate="visible"
          />
          {/* Checkmark inside */}
          <motion.path 
            d="M9 12l2 2 4-4" 
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-green-400 stroke-[3px]"
          />
        </svg>
      </div>

      {/* The Text */}
      <div className={`font-bold tracking-tighter ${text}`}>
        <span className="text-white">Tru</span>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Vox</span>
      </div>
    </div>
  );
};

export default Logo;