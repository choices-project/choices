import { useEffect } from 'react';

import ScreenReaderSupport from './screen-reader';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

type UseAccessibleDialogOptions = {
  isOpen: boolean;
  dialogRef: React.RefObject<HTMLElement>;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  onClose?: () => void;
  liveMessage?: string;
  ariaLabelId?: string;
};

const isElementVisible = (element: HTMLElement) => {
  const style = window.getComputedStyle(element);
  const hasSize = element.offsetWidth > 0 || element.offsetHeight > 0;
  const hasRect = element.getClientRects().length > 0;
  const isHidden = style.visibility === 'hidden' || style.display === 'none';
  return !isHidden && (hasSize || hasRect);
};

export function useAccessibleDialog({
  isOpen,
  dialogRef,
  initialFocusRef,
  onClose,
  liveMessage,
  ariaLabelId,
}: UseAccessibleDialogOptions) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    const previousActive = document.activeElement as HTMLElement | null;

    if (liveMessage) {
      const politeness = ariaLabelId ? 'assertive' : 'polite';
      ScreenReaderSupport.announce(liveMessage, politeness);
    }

  const resolveFocusableElements = () =>
      Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isElementVisible);

    const focusTarget =
      initialFocusRef?.current ??
      dialog.querySelector<HTMLElement>('[data-autofocus]') ??
      resolveFocusableElements()[0] ??
      dialog;

    focusTarget.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose?.();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusable = resolveFocusableElements();
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) {
        return;
      }
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (activeElement === first || activeElement === dialog) {
          event.preventDefault();
          last.focus();
        }
      } else if (activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);

    return () => {
  dialog.removeEventListener('keydown', handleKeyDown);
  if (previousActive && previousActive.focus) {
        previousActive.focus({ preventScroll: true });
      }
    };
  }, [ariaLabelId, dialogRef, initialFocusRef, isOpen, liveMessage, onClose]);
}


