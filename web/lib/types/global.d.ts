/**
 * Global TypeScript declarations
 * 
 * Adds type definitions for global objects and third-party libraries.
 */

import '@testing-library/jest-dom';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export {};
