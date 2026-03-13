'use client';

import { Loader2 } from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

type ButtonVariant = 'primary' | 'green' | 'pink' | 'yellow';

type VoteSubmitButtonProps = {
  isSubmitting: boolean;
  disabled: boolean;
  onClick: () => void;
  icon?: LucideIcon;
  label?: string;
  submittingLabel?: string;
  variant?: ButtonVariant;
  'data-testid'?: string;
}

const variantStyles: Record<ButtonVariant, { enabled: string; disabled: string }> = {
  primary: {
    enabled: 'bg-primary text-primary-foreground hover:bg-primary/90',
    disabled: 'bg-muted text-muted-foreground cursor-not-allowed',
  },
  green: {
    enabled: 'bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600',
    disabled: 'bg-muted text-muted-foreground cursor-not-allowed',
  },
  pink: {
    enabled: 'bg-pink-600 text-white hover:bg-pink-700',
    disabled: 'bg-muted text-muted-foreground cursor-not-allowed',
  },
  yellow: {
    enabled: 'bg-yellow-600 text-white hover:bg-yellow-700',
    disabled: 'bg-muted text-muted-foreground cursor-not-allowed',
  },
};

export function VoteSubmitButton({
  isSubmitting,
  disabled,
  onClick,
  icon: Icon,
  label = 'Submit Vote',
  submittingLabel = 'Submitting...',
  variant = 'primary',
  'data-testid': dataTestId,
}: VoteSubmitButtonProps) {
  const styles = variantStyles[variant];
  const isButtonDisabled = disabled || isSubmitting;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isButtonDisabled}
      data-testid={dataTestId}
      className={`
        flex items-center space-x-2 px-8 py-3 rounded-lg font-medium transition-colors
        ${isButtonDisabled ? styles.disabled : styles.enabled}
      `}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          {submittingLabel}
        </>
      ) : (
        <>
          {Icon && <Icon className="h-5 w-5" aria-hidden="true" />}
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
