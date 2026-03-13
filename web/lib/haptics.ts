type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const patterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10],
  warning: [25, 50, 25],
  error: [50, 100, 50, 100, 50],
};

export function haptic(pattern: HapticPattern = 'light'): void {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  
  try {
    navigator.vibrate(patterns[pattern]);
  } catch {
    // Silently fail on unsupported devices
  }
}

export function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}
