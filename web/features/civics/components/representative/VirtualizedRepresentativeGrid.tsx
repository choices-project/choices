/**
 * Virtualized Representative Grid
 *
 * Renders only visible representative cards in the viewport to prevent
 * 8,600+ DOM nodes on lower-end devices. Uses @tanstack/react-virtual.
 *
 * Created: March 13, 2026
 */

'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRouter } from 'next/navigation';
import React, { useCallback, useRef, useState } from 'react';

import { RepresentativeCard } from '@/features/civics/components/representative/RepresentativeCard';

import { haptic } from '@/lib/haptics';
import logger from '@/lib/utils/logger';

import type { Representative } from '@/types/representative';

const ROW_HEIGHT = 320;
const ROW_GAP = 24;
const COLUMNS_DESKTOP = 4;
const COLUMNS_TABLET = 2;
const COLUMNS_MOBILE = 1;

export const VIRTUALIZATION_THRESHOLD = 50;

function getColumnCount(width: number): number {
  if (width >= 1024) return COLUMNS_DESKTOP;
  if (width >= 768) return COLUMNS_TABLET;
  return COLUMNS_MOBILE;
}

export type VirtualizedRepresentativeGridProps = {
  representatives: Representative[];
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
  onRepresentativeContact?: (rep: Representative) => void;
  onRepresentativeFollow?: (rep: Representative) => void;
  onRepresentativeClick?: (rep: Representative) => void;
  gridClassName?: string;
  /** Scroll container height. Default 60vh. */
  containerHeight?: string | number;
};

export function VirtualizedRepresentativeGrid({
  representatives,
  variant = 'default',
  showActions = false,
  onRepresentativeContact,
  onRepresentativeFollow,
  onRepresentativeClick,
  gridClassName = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  containerHeight = '60vh',
}: VirtualizedRepresentativeGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [columnCount, setColumnCount] = useState(COLUMNS_DESKTOP);

  const handleContact = onRepresentativeContact ?? ((rep: Representative) => {
    logger.info('Contact:', rep.name);
  });
  const handleFollow = onRepresentativeFollow ?? ((rep: Representative) => {
    logger.info('Followed:', rep.name);
  });
  const handlePrefetch = useCallback(
    (id: string | number) => {
      router.prefetch(`/representatives/${id}`);
    },
    [router]
  );

  const rowCount = Math.ceil(representatives.length / columnCount);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT + ROW_GAP,
    overscan: 5,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  const handleResize = useCallback(() => {
    if (parentRef.current) {
      setColumnCount(getColumnCount(parentRef.current.offsetWidth));
    }
  }, []);

  React.useEffect(() => {
    handleResize();
    const ro = new ResizeObserver(handleResize);
    if (parentRef.current) {
      ro.observe(parentRef.current);
    }
    return () => ro.disconnect();
  }, [handleResize]);

  return (
    <div
      ref={parentRef}
      className="overflow-auto rounded-lg border border-border"
      style={{ height: typeof containerHeight === 'number' ? containerHeight : containerHeight }}
      role="list"
      aria-label="Representatives list"
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualRows.map((virtualRow) => {
          const start = virtualRow.index * columnCount;
          const rowItems = representatives.slice(start, start + columnCount);
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className={`grid gap-4 ${gridClassName}`}
            >
              {rowItems.map((representative) => (
                // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- prefetch on hover
                <div key={representative.id} role="listitem" onMouseEnter={() => handlePrefetch(representative.id)}>
                  <RepresentativeCard
                    representative={representative}
                    variant={variant}
                    showActions={showActions}
                    onFollow={handleFollow}
                    onContact={handleContact}
                    onClick={() => {
                      haptic('light');
                      onRepresentativeClick?.(representative);
                    }}
                  />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
