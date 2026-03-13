'use client';

import { User, Pencil, Settings, Shield } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { PrefetchLink } from '@/components/shared/PrefetchLink';

import { cn } from '@/lib/utils';

const navItems = [
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/profile/edit', label: 'Edit', icon: Pencil },
  { href: '/profile/preferences', label: 'Preferences', icon: Settings },
  { href: '/account/privacy', label: 'Privacy & Data', icon: Shield },
] as const;

export default function ProfileSubNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Profile navigation" className="mb-6">
      <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <PrefetchLink
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors min-h-[44px]',
                isActive
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {item.label}
            </PrefetchLink>
          );
        })}
      </div>
    </nav>
  );
}
