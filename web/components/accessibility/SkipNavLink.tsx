import type { PropsWithChildren } from 'react';

type SkipNavLinkProps = {
  href?: string;
  label?: string;
};

export function SkipNavLink({
  href = '#main-content',
  label = 'Skip to main content',
  children,
}: PropsWithChildren<SkipNavLinkProps>) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[1000] focus:rounded-md focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white"
    >
      {children ?? label}
    </a>
  );
}

export function SkipNavTarget({ children }: PropsWithChildren) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      suppressHydrationWarning
    >
      {children}
    </main>
  );
}

