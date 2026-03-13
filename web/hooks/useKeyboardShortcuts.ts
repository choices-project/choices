'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';

type ShortcutHandler = () => void;

type KeyboardShortcuts = {
  onSearch?: ShortcutHandler;
};

export function useKeyboardShortcuts({ onSearch }: KeyboardShortcuts = {}) {
  const router = useRouter();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger when typing in inputs, textareas, or contenteditable
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    ) {
      return;
    }

    // Don't trigger when modifier keys (besides shift) are held
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    switch (event.key) {
      case '/':
        event.preventDefault();
        onSearch?.();
        break;
      case 'n':
        if (!event.shiftKey) {
          router.push('/polls/create');
        }
        break;
      case 'h':
        router.push('/feed');
        break;
      case 'p':
        router.push('/polls');
        break;
      case 'c':
        router.push('/civics');
        break;
      case '?':
        // Show keyboard shortcuts help - could trigger a dialog
        break;
    }
  }, [router, onSearch]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
