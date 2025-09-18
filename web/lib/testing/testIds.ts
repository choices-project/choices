/**
 * Centralized Test ID Registry
 * 
 * Single source of truth for all data-testid attributes used in E2E tests.
 * Use this registry to ensure consistent test IDs across the application.
 * 
 * Created: 2024-12-19
 * Updated: 2025-01-17
 */

export const T = {
  login: {
    email: 'login-email',
    password: 'login-password',
    submit: 'login-submit',
    webauthn: 'login-webauthn',
    register: 'register-link',
    forgotPassword: 'forgot-password-link',
    error: 'login-error',
  },

  pollCreate: {
    title: 'poll-title',
    description: 'poll-description',
    category: 'category',
    votingMethod: 'voting-method',
    privacyLevel: 'privacy-level',

    // Timing (tests expect dashed ids)
    startTime: 'start-time',
    endTime: 'end-time',

    // Dynamic options — tests expect "option-3" shape:
    optionInput: (i: number) => `option-${i}`,
    addOption: 'add-option-button',
    removeOption: (i: number) => `remove-option-${i}-button`,

    // Buttons
    submit: 'create-poll-button',
    reset: 'reset-form-button',

    // Validation error containers (explicit ids used by specs)
    titleError: 'title-error',
    votingMethodError: 'voting-method-error',
    optionsError: 'options-error',
    timingError: 'timing-error',
  },

  pollVote: {
    container: 'poll-vote-container',
    option: (i: number) => `poll-option-${i}`,
    submit: 'vote-submit',
    results: 'results-container',
  },

  webauthn: {
    register: 'register-passkey-button',
    login: 'login-passkey-button',
    prompt: 'webauthn-prompt',
    authPrompt: 'webauthn-auth-prompt',
    biometricButton: 'biometric-auth-button',
    biometricPrompt: 'biometric-prompt',
    crossDeviceButton: 'cross-device-auth-button',
    qr: 'qr-code',
    serverError: 'server-error',
    networkError: 'network-error',
  },

  admin: {
    usersTab: 'admin-users-tab',
    pollsTab: 'admin-polls-tab',
    accessDenied: 'admin-access-denied',
    userList: 'admin-user-list',
    pollList: 'admin-poll-list',
    banUser: (id: string) => `admin-ban-user-${id}`,
    promoteUser: (id: string) => `admin-promote-user-${id}`,
  },

  onboarding: {
    container: 'onb-container',
    start: 'onb-start',
    next: 'onb-next',
    finish: 'onb-finish',
    privacyAllow: 'onb-privacy-allow',
    privacyDeny: 'onb-privacy-deny',
    category: (slug: string) => `onb-cat-${slug}`,
    step: (step: number) => `onb-step-${step}`,
  },
} as const;
