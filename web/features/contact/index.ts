/**
 * Contact Feature Exports
 *
 * Central export point for contact-related components and hooks.
 */

export { default as ContactModal } from './components/ContactModal';
export { default as BulkContactModal } from './components/BulkContactModal';
export { default as ContactRepresentativesSection } from './components/ContactRepresentativesSection';
export { default as ContactSubmissionForm } from './components/ContactSubmissionForm';

export { useContactMessages, useContactThreads } from './hooks/useContactMessages';
export { useMessageTemplates } from './hooks/useMessageTemplates';
