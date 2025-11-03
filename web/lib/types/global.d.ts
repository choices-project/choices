/**
 * Global TypeScript declarations
 * 
 * Adds type definitions for global objects and third-party libraries.
 */

declare global {
  type Window = {
    gtag: (...args: any[]) => void;
  }
}

export {};
