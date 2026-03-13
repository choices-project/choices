'use client';

import {
  BarChart3,
  FileText,
  Home,
  Landmark,
  Plus,
  Search,
  Settings,
  User,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';

const RECENT_SEARCHES_KEY = 'choices-recent-searches';
const MAX_RECENT_SEARCHES = 5;

type SearchItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  keywords?: string[];
};

const navigationItems: SearchItem[] = [
  { label: 'Feed', href: '/feed', icon: <Home className="mr-2 h-4 w-4" />, keywords: ['home', 'timeline'] },
  { label: 'Polls', href: '/polls', icon: <FileText className="mr-2 h-4 w-4" />, keywords: ['vote', 'survey'] },
  { label: 'Civics', href: '/civics', icon: <Landmark className="mr-2 h-4 w-4" />, keywords: ['government', 'representatives'] },
  { label: 'Profile', href: '/profile', icon: <User className="mr-2 h-4 w-4" />, keywords: ['account', 'me'] },
  { label: 'Preferences', href: '/profile/preferences', icon: <Settings className="mr-2 h-4 w-4" />, keywords: ['settings', 'options'] },
  { label: 'Analytics', href: '/analytics', icon: <BarChart3 className="mr-2 h-4 w-4" />, keywords: ['stats', 'data', 'metrics'] },
];

const actionItems: SearchItem[] = [
  { label: 'Create New Poll', href: '/polls/create', icon: <Plus className="mr-2 h-4 w-4" />, keywords: ['new', 'add', 'survey'] },
  { label: 'Find Representatives', href: '/civics', icon: <Users className="mr-2 h-4 w-4" />, keywords: ['search', 'government', 'congress'] },
];

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentSearch(label: string) {
  try {
    const existing = getRecentSearches();
    const updated = [label, ...existing.filter((s) => s !== label)].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable
  }
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, [open]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      // Open with / when not typing in an input
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (
          target.tagName !== 'INPUT' &&
          target.tagName !== 'TEXTAREA' &&
          target.tagName !== 'SELECT' &&
          !target.isContentEditable
        ) {
          e.preventDefault();
          setOpen(true);
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const runCommand = useCallback(
    (item: SearchItem) => {
      setOpen(false);
      addRecentSearch(item.label);
      router.push(item.href);
    },
    [router],
  );

  const handleRecentSelect = useCallback(
    (label: string) => {
      const allItems = [...navigationItems, ...actionItems];
      const match = allItems.find((item) => item.label === label);
      if (match) {
        runCommand(match);
      }
    },
    [runCommand],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        aria-label="Open command palette"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search…</span>
        <kbd className="pointer-events-none ml-1 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {recentSearches.length > 0 && (
            <>
              <CommandGroup heading="Recent Searches">
                {recentSearches.map((label) => {
                  const match = [...navigationItems, ...actionItems].find((i) => i.label === label);
                  return (
                    <CommandItem key={label} onSelect={() => handleRecentSelect(label)}>
                      {match?.icon ?? <Search className="mr-2 h-4 w-4" />}
                      <span>{label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          <CommandGroup heading="Navigation">
            {navigationItems.map((item) => (
              <CommandItem
                key={item.href}
                {...(item.keywords ? { keywords: item.keywords } : {})}
                onSelect={() => runCommand(item)}
              >
                {item.icon}
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Actions">
            {actionItems.map((item) => (
              <CommandItem
                key={item.href}
                {...(item.keywords ? { keywords: item.keywords } : {})}
                onSelect={() => runCommand(item)}
              >
                {item.icon}
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
