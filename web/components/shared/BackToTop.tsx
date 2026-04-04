'use client';

import { ArrowUp } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

import { cn } from '@/lib/utils';

const SCROLL_THRESHOLD = 400;

type BackToTopProps = {
  /** Optional container ref; if not provided, uses window */
  containerRef?: React.RefObject<HTMLElement | null>;
  /** Minimum scroll offset (px) before button appears */
  threshold?: number;
  /** Additional class names */
  className?: string;
  /** Accessible label */
  ariaLabel?: string;
};

/**
 * Floating "back to top" button that appears when the user scrolls past a threshold.
 * Uses smooth scroll (from globals.css) when clicking.
 */
export function BackToTop({
  containerRef,
  threshold = SCROLL_THRESHOLD,
  className,
  ariaLabel = 'Scroll back to top',
}: BackToTopProps) {
  const [visible, setVisible] = useState(false);

  const scrollToTop = useCallback(() => {
    if (containerRef?.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [containerRef]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const target = containerRef?.current ?? window;

    const checkScroll = () => {
      const scrollTop =
        target === window
          ? window.scrollY
          : (target as HTMLElement).scrollTop;
      setVisible(scrollTop > threshold);
    };

    checkScroll();
    target.addEventListener('scroll', checkScroll, { passive: true });
    return () => target.removeEventListener('scroll', checkScroll);
  }, [containerRef, threshold]);

  if (!visible) return null;

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={scrollToTop}
      className={cn(
        'fixed bottom-6 right-6 z-40 h-11 w-11 rounded-full shadow-lg transition-opacity',
        'min-h-[44px] min-w-[44px]',
        className,
      )}
      aria-label={ariaLabel}
    >
      <ArrowUp className="h-5 w-5" aria-hidden />
    </Button>
  );
}
