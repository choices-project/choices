'use client';

import { motion, useReducedMotion } from 'framer-motion';
import React from 'react';

import { cn } from '@/lib/utils';

type AnimatedCardProps = {
  children: React.ReactNode;
  className?: string;
  index?: number;
  onClick?: () => void;
};

export function AnimatedCard({ children, className, index = 0, onClick }: AnimatedCardProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    if (onClick) {
      return (
        <div
          className={cn(className)}
          onClick={onClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onClick();
            }
          }}
        >
          {children}
        </div>
      );
    }
    return <div className={cn(className)}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{
        duration: 0.2,
        delay: index * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      {...(onClick ? { whileTap: { scale: 0.98 } } : {})}
      className={cn(className)}
      onClick={onClick}
      {...(onClick
        ? {
            role: 'button' as const,
            tabIndex: 0,
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            },
          }
        : {})}
    >
      {children}
    </motion.div>
  );
}
