'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback } from 'react';

import { cn } from '@/lib/utils';

type PrefetchLinkProps = React.ComponentProps<typeof Link> & {
  prefetchOnHover?: boolean;
};

export function PrefetchLink({ prefetchOnHover = true, onMouseEnter, ...props }: PrefetchLinkProps) {
  const router = useRouter();

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (prefetchOnHover && typeof props.href === 'string') {
        router.prefetch(props.href);
      }
      if (typeof onMouseEnter === 'function') {
        onMouseEnter(e);
      }
    },
    [prefetchOnHover, props.href, router, onMouseEnter]
  );

  return (
    <Link
      {...props}
      prefetch={false}
      onMouseEnter={handleMouseEnter}
      className={cn(props.className)}
    />
  );
}
