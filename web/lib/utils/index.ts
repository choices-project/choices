// Re-export all utilities from the utils directory
export * from './utils';
export { logger, logError } from './logger';
export * from './browser-utils';
export * from '../util/clean';
export * from '../util/guards';
export * from '../util/property-mapping';
export * from './civics-cache';
export * from './client-session';
export * from './error-handler';
export * from './format-utils';
// Removed unused alias export for getHttpUserAgent to reduce surface area
export * from './mock-data';
export * from './network-optimizer';
export * from './performance-monitor';
export * from './ssr-safe';
export * from './api-logger';
export * from './privacy-guard'; // 🔒 Privacy utilities
