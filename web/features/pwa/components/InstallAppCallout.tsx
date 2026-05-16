'use client';

import React from 'react';

import { Button } from '@/components/ui/button';

import { usePWAInstallation, usePWAActions } from '@/lib/stores/pwaStore';

function detectInstallPlatform(): 'ios' | 'mac' | 'android' | 'desktop' {
  if (typeof navigator === 'undefined') {
    return 'desktop';
  }
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) {
    return 'ios';
  }
  if (/Android/.test(ua)) {
    return 'android';
  }
  if (/Macintosh|Mac OS X/.test(ua)) {
    return 'mac';
  }
  return 'desktop';
}

function installInstructions(platform: ReturnType<typeof detectInstallPlatform>): string {
  switch (platform) {
    case 'ios':
      return 'Tap Share in Safari, then “Add to Home Screen”.';
    case 'mac':
      return 'In Safari or Chrome: use the menu (⋯ or File) → “Install Choices” or “Add to Dock”.';
    case 'android':
      return 'Tap the browser menu (⋮) → “Install app” or “Add to Home screen”.';
    default:
      return 'Use your browser’s install icon in the address bar, or the menu → “Install Choices”.';
  }
}

/**
 * Lightweight install help on /auth when not already running as an installed PWA.
 */
export default function InstallAppCallout() {
  const installation = usePWAInstallation();
  const { installPWA } = usePWAActions();
  const [isStandalone, setIsStandalone] = React.useState(true);
  const platform = React.useMemo(() => detectInstallPlatform(), []);

  React.useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);
  }, []);

  if (isStandalone || installation.isInstalled) {
    return null;
  }

  const canNativePrompt = Boolean(installation.installPrompt);

  return (
    <section
      className="mt-6 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
      aria-label="Install Choices app"
    >
      <p className="font-medium text-foreground">Install the Choices app</p>
      <p className="mt-1">{installInstructions(platform)}</p>
      {canNativePrompt ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => void installPWA()}
        >
          Install now
        </Button>
      ) : null}
    </section>
  );
}
