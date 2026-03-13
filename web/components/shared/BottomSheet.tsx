'use client';

import { AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import React, { useCallback } from 'react';

import { cn } from '@/lib/utils';

import type { PanInfo } from 'framer-motion';

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  title?: string;
};

export function BottomSheet({ open, onClose, children, className, title }: BottomSheetProps) {
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 300], [1, 0]);
  const shouldReduceMotion = useReducedMotion();

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.y > 100 || info.velocity.y > 500) {
        onClose();
      }
    },
    [onClose]
  );

  const springTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: 'spring' as const, damping: 30, stiffness: 300 };

  if (!open) return null;

  if (shouldReduceMotion) {
    return (
      <>
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={onClose}
          role="presentation"
        />
        <div
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-auto rounded-t-2xl bg-background shadow-xl',
            className
          )}
        >
          <div className="flex justify-center pt-3 pb-2">
            <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
          </div>
          {title && (
            <div className="px-6 pb-2">
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            </div>
          )}
          <div className="px-6 pb-8">{children}</div>
        </div>
      </>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className={cn(
              'fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-auto rounded-t-2xl bg-background shadow-xl',
              className
            )}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={springTransition}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{ y, opacity }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
            </div>

            {title && (
              <div className="px-6 pb-2">
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
              </div>
            )}

            <div className="px-6 pb-8">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
