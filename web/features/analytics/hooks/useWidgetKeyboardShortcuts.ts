/**
 * Widget Keyboard Shortcuts Hook
 * 
 * Handles keyboard shortcuts for widget dashboard:
 * - Cmd/Ctrl + Z: Undo
 * - Cmd/Ctrl + Shift + Z: Redo
 * - Cmd/Ctrl + S: Save
 * - Esc: Cancel editing
 * 
 * Created: November 5, 2025
 * Status: PRODUCTION
 */

import { useEffect } from 'react';

import { useWidgetStore } from '../stores/widgetStore';

// ============================================================================
// KEYBOARD SHORTCUTS HOOK
// ============================================================================

export function useWidgetKeyboardShortcuts(
  isEditing: boolean,
  onSave?: () => void,
  onCancel?: () => void
) {
  const { undo, redo, canUndo, canRedo } = useWidgetStore();

  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? event.metaKey : event.ctrlKey;

      // Cmd/Ctrl + Z: Undo
      if (modKey && event.key === 'z' && !event.shiftKey && canUndo()) {
        event.preventDefault();
        undo();
        return;
      }

      // Cmd/Ctrl + Shift + Z: Redo
      if (modKey && event.key === 'z' && event.shiftKey && canRedo()) {
        event.preventDefault();
        redo();
        return;
      }

      // Cmd/Ctrl + Y: Redo (Windows alternative)
      if (modKey && event.key === 'y' && !isMac && canRedo()) {
        event.preventDefault();
        redo();
        return;
      }

      // Cmd/Ctrl + S: Save
      if (modKey && event.key === 's') {
        event.preventDefault();
        onSave?.();
        return;
      }

      // Esc: Cancel editing
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, undo, redo, canUndo, canRedo, onSave, onCancel]);
}

// ============================================================================
// EXPORT
// ============================================================================

export default useWidgetKeyboardShortcuts;

