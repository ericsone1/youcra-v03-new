import React from 'react';
import { motion } from 'framer-motion';

export default function PageWrapper({ children }) {
  const variants = {
    initial: { x: 60, opacity: 0, scale: 0.96 },
    animate: { x: 0, opacity: 1, scale: 1 },
    exit: { x: -60, opacity: 0, scale: 0.96 },
  };

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.6 }}
      className="min-h-full w-full will-change-transform"
    >
      {children}
    </motion.div>
  );
} 