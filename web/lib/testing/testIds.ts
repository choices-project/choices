/**
 * Test IDs Registry - MVP VERSION
 * 
 * Complete test ID registry for MVP functionality
 */

export const T = {
  // Auth related
  loginButton: 'login-button',
  registerButton: 'register-button',
  logoutButton: 'logout-button',
  
  // Poll related
  createPollButton: 'create-poll-button',
  voteButton: 'vote-button',
  pollTitle: 'poll-title',
  
  // Navigation
  navigation: 'navigation',
  userMenu: 'user-menu',
  
  // Admin
  admin: {
    accessDenied: 'admin-access-denied',
    usersTab: 'admin-users-tab',
    pollsTab: 'admin-polls-tab',
    userList: 'admin-user-list',
    pollList: 'admin-poll-list',
    promoteUser: (userId: string) => `admin-promote-user-${userId}`,
    banUser: (userId: string) => `admin-ban-user-${userId}`,
  },
  
  // Login/Register
  login: {
    email: 'login-email',
    password: 'login-password',
    submit: 'login-submit',
  },
  
  // WebAuthn
  webauthn: {
    register: 'webauthn-register',
    login: 'webauthn-login',
    prompt: 'webauthn-prompt',
    biometricButton: 'webauthn-biometric-button',
    crossDeviceButton: 'webauthn-cross-device-button',
    qr: 'webauthn-qr',
    authPrompt: 'webauthn-auth-prompt',
    biometricPrompt: 'webauthn-biometric-prompt',
    networkError: 'webauthn-network-error',
    serverError: 'webauthn-server-error',
  },
  
  // Poll Creation
  pollCreate: {
    title: 'poll-create-title',
    titleError: 'poll-create-title-error',
    description: 'poll-create-description',
    category: 'poll-create-category',
    votingMethod: 'poll-create-voting-method',
    votingMethodError: 'poll-create-voting-method-error',
    optionInput: (index: number) => `poll-create-option-input-${index}`,
    removeOption: (index: number) => `poll-create-remove-option-${index}`,
    addOption: 'poll-create-add-option',
    optionsError: 'poll-create-options-error',
    startTime: 'poll-create-start-time',
    endTime: 'poll-create-end-time',
    timingError: 'poll-create-timing-error',
    privacyLevel: 'poll-create-privacy-level',
    submit: 'poll-create-submit',
    reset: 'poll-create-reset',
  },
  
  // Generic
  submitButton: 'submit-button',
  cancelButton: 'cancel-button',
  loadingSpinner: 'loading-spinner'
} as const;

export type TestId = typeof T[keyof typeof T];
