import React from 'react';
import { motion } from 'motion/react';

const ease = [0.16, 1, 0.3, 1] as const;

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className,
}) => (
  <motion.div
    className={`w-full relative z-[1] ${className || ''}`}
    initial={{ opacity: 0, y: 32, scale: 0.97, filter: 'blur(10px)' }}
    animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
    exit={{ opacity: 0, y: -24, scale: 0.98, filter: 'blur(8px)' }}
    transition={{ duration: 0.75, ease }}
  >
    {/* Dynamic glowing page transition beam at the very top of the window */}
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-500 via-accent to-fuchsia-400 z-[9999] shadow-[0_0_16px_rgba(167,139,250,0.9)] pointer-events-none"
      initial={{ scaleX: 0, transformOrigin: '0% 50%', opacity: 1 }}
      animate={{ scaleX: [0, 0.65, 1], opacity: [1, 1, 0] }}
      transition={{ duration: 0.95, ease }}
    />
    {children}
  </motion.div>
);
