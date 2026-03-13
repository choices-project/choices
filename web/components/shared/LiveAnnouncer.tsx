'use client';

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

type AnnounceOptions = {
  politeness?: 'polite' | 'assertive';
};

type LiveAnnouncerContextType = {
  announce: (message: string, options?: AnnounceOptions) => void;
};

const LiveAnnouncerContext = createContext<LiveAnnouncerContextType>({
  announce: () => { /* noop default */ },
});

export function useLiveAnnouncer() {
  return useContext(LiveAnnouncerContext);
}

export function LiveAnnouncerProvider({ children }: { children: React.ReactNode }) {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const announce = useCallback((message: string, options?: AnnounceOptions) => {
    const politeness = options?.politeness ?? 'polite';
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (politeness === 'assertive') {
      setAssertiveMessage('');
    } else {
      setPoliteMessage('');
    }

    requestAnimationFrame(() => {
      if (politeness === 'assertive') {
        setAssertiveMessage(message);
      } else {
        setPoliteMessage(message);
      }
    });

    timeoutRef.current = setTimeout(() => {
      setPoliteMessage('');
      setAssertiveMessage('');
    }, 5000);
  }, []);

  return (
    <LiveAnnouncerContext.Provider value={{ announce }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        role="status"
        className="sr-only"
      >
        {politeMessage}
      </div>
      <div
        aria-live="assertive"
        aria-atomic="true"
        role="alert"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </LiveAnnouncerContext.Provider>
  );
}
