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
    initial={{ opacity: 0, scale: 0.99, filter: 'blur(6px)' }}
    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
    exit={{ opacity: 0, scale: 0.99, filter: 'blur(6px)' }}
    transition={{ duration: 0.65, ease }}
  >
    {/* Dynamic glowing page transition beam at the very top of the window */}
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] bg-[#7950e8] z-[9999] shadow-[0_0_16px_rgba(121,80,232,0.8)] pointer-events-none"
      initial={{ scaleX: 0, transformOrigin: '0% 50%', opacity: 1 }}
      animate={{ scaleX: [0, 0.65, 1], opacity: [1, 1, 0] }}
      transition={{ duration: 0.95, ease }}
    />
    {children}
  </motion.div>
);
