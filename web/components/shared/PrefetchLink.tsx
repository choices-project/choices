'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useCallback, useMemo } from 'react';

import { cn } from '@/lib/utils';

type PrefetchLinkProps = React.ComponentProps<typeof Link> & {
  prefetchOnHover?: boolean;
};

function resolveHrefString(href: PrefetchLinkProps['href']): string {
  if (typeof href === 'string') {
    return href;
  }
  if (href && typeof href === 'object' && 'pathname' in href && href.pathname) {
    const pathname = href.pathname;
    const search = 'search' in href && href.search ? String(href.search) : '';
    const hash = 'hash' in href && href.hash ? String(href.hash) : '';
    return `${pathname}${search}${hash}`;
  }
  return '';
}

export function PrefetchLink({
  prefetchOnHover = true,
  onMouseEnter,
  onClick,
  href,
  ...props
}: PrefetchLinkProps) {
  const router = useRouter();
  const pathname = usePathname();
  const targetHref = useMemo(() => resolveHrefString(href), [href]);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (prefetchOnHover && targetHref) {
        router.prefetch(targetHref);
      }
      if (typeof onMouseEnter === 'function') {
        onMouseEnter(e);
      }
    },
    [prefetchOnHover, targetHref, router, onMouseEnter],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e);
      if (e.defaultPrevented) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
        return;
      }
      if (!targetHref) {
        return;
      }

      const [targetPath] = targetHref.split(/[?#]/);
      const [currentPath] = (pathname ?? '').split(/[?#]/);
      if (targetPath === currentPath) {
        return;
      }

      e.preventDefault();
      router.push(targetHref);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
      }
    },
    [onClick, targetHref, pathname, router],
  );

  return (
    <Link
      {...props}
      href={href}
      prefetch={false}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      className={cn(props.className)}
    />
  );
}
