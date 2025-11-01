/**
 * Test ID Registry
 * 
 * Centralized registry of test IDs used across E2E tests
 * to ensure consistency and maintainability.
 * 
 * @fileoverview Test ID registry for E2E testing
 * @author Choices Platform Team
 * @created 2025-10-24
 * @updated 2025-10-24
 * @status ACTIVE
 * @version 1.0.0
 */

/**
 * Test ID Registry Class
 * 
 * Provides centralized access to all test IDs used in E2E tests
 * to ensure consistency and easy maintenance.
 */
export class TestIds {
  // Authentication related test IDs
  static readonly AUTH = {
    LOGIN_FORM: 'login-form',
    REGISTER_FORM: 'register-form',
    EMAIL_INPUT: 'email-input',
    PASSWORD_INPUT: 'password-input',
    LOGIN_BUTTON: 'login-button',
    REGISTER_BUTTON: 'register-button',
    LOGOUT_BUTTON: 'logout-button',
    FORGOT_PASSWORD_LINK: 'forgot-password-link',
    RESET_PASSWORD_FORM: 'reset-password-form',
    RESET_PASSWORD_BUTTON: 'reset-password-button'
  } as const;

  // Navigation related test IDs
  static readonly NAVIGATION = {
    MAIN_NAV: 'main-navigation',
    MOBILE_MENU: 'mobile-menu',
    MOBILE_MENU_TOGGLE: 'mobile-menu-toggle',
    USER_MENU: 'user-menu',
    USER_MENU_TOGGLE: 'user-menu-toggle',
    ADMIN_MENU: 'admin-menu',
    ADMIN_MENU_TOGGLE: 'admin-menu-toggle',
    BREADCRUMBS: 'breadcrumbs'
  } as const;

  // Dashboard related test IDs
  static readonly DASHBOARD = {
    DASHBOARD_CONTAINER: 'dashboard-container',
    WELCOME_MESSAGE: 'welcome-message',
    USER_STATS: 'user-stats',
    RECENT_ACTIVITY: 'recent-activity',
    QUICK_ACTIONS: 'quick-actions',
    NOTIFICATIONS: 'notifications',
    NOTIFICATION_BELL: 'notification-bell',
    NOTIFICATION_COUNT: 'notification-count'
  } as const;

  // Profile related test IDs
  static readonly PROFILE = {
    PROFILE_FORM: 'profile-form',
    PROFILE_EDIT_BUTTON: 'profile-edit-button',
    PROFILE_SAVE_BUTTON: 'profile-save-button',
    PROFILE_CANCEL_BUTTON: 'profile-cancel-button',
    NAME_INPUT: 'name-input',
    BIO_INPUT: 'bio-input',
    INTERESTS_INPUT: 'interests-input',
    AVATAR_UPLOAD: 'avatar-upload',
    AVATAR_IMAGE: 'avatar-image',
    PREFERENCES_SECTION: 'preferences-section',
    PRIVACY_SETTINGS: 'privacy-settings',
    NOTIFICATION_SETTINGS: 'notification-settings'
  } as const;

  // Polls related test IDs
  static readonly POLLS = {
    POLLS_CONTAINER: 'polls-container',
    POLL_CREATE_BUTTON: 'poll-create-button',
    POLL_CREATE_FORM: 'poll-create-form',
    POLL_TITLE_INPUT: 'poll-title-input',
    POLL_DESCRIPTION_INPUT: 'poll-description-input',
    POLL_OPTION_INPUT: 'poll-option-input',
    POLL_ADD_OPTION_BUTTON: 'poll-add-option-button',
    POLL_REMOVE_OPTION_BUTTON: 'poll-remove-option-button',
    POLL_SUBMIT_BUTTON: 'poll-submit-button',
    POLL_CANCEL_BUTTON: 'poll-cancel-button',
    POLL_ITEM: 'poll-item',
    POLL_VOTE_BUTTON: 'poll-vote-button',
    POLL_RESULTS: 'poll-results',
    POLL_SHARE_BUTTON: 'poll-share-button',
    POLL_EDIT_BUTTON: 'poll-edit-button',
    POLL_DELETE_BUTTON: 'poll-delete-button'
  } as const;

  // Hashtags related test IDs
  static readonly HASHTAGS = {
    HASHTAG_INPUT: 'hashtag-input',
    HASHTAG_SUGGESTIONS: 'hashtag-suggestions',
    HASHTAG_ITEM: 'hashtag-item',
    HASHTAG_REMOVE_BUTTON: 'hashtag-remove-button',
    TRENDING_HASHTAGS: 'trending-hashtags',
    HASHTAG_SEARCH: 'hashtag-search',
    HASHTAG_FILTER: 'hashtag-filter'
  } as const;

  // Admin related test IDs
  static readonly ADMIN = {
    ADMIN_DASHBOARD: 'admin-dashboard',
    ADMIN_SIDEBAR: 'admin-sidebar',
    ADMIN_CONTENT: 'admin-content',
    USER_MANAGEMENT: 'user-management',
    USER_TABLE: 'user-table',
    USER_ROW: 'user-row',
    USER_EDIT_BUTTON: 'user-edit-button',
    USER_DELETE_BUTTON: 'user-delete-button',
    USER_BAN_BUTTON: 'user-ban-button',
    USER_UNBAN_BUTTON: 'user-unban-button',
    CONTENT_MODERATION: 'content-moderation',
    MODERATION_QUEUE: 'moderation-queue',
    APPROVE_BUTTON: 'approve-button',
    REJECT_BUTTON: 'reject-button',
    SYSTEM_SETTINGS: 'system-settings',
    FEATURE_FLAGS: 'feature-flags',
    ANALYTICS: 'analytics',
    REPORTS: 'reports',
    // Additional admin test IDs
    USER_LIST: 'user-list',
    POLL_LIST: 'poll-list',
    OVERVIEW_TAB: 'overview-tab',
    ANALYTICS_TAB: 'analytics-tab',
    DASHBOARD: 'admin-dashboard'
  } as const;

  // Forms related test IDs
  static readonly FORMS = {
    FORM_CONTAINER: 'form-container',
    FORM_SUBMIT_BUTTON: 'form-submit-button',
    FORM_CANCEL_BUTTON: 'form-cancel-button',
    FORM_RESET_BUTTON: 'form-reset-button',
    FORM_ERROR_MESSAGE: 'form-error-message',
    FORM_SUCCESS_MESSAGE: 'form-success-message',
    FORM_LOADING: 'form-loading',
    FORM_VALIDATION_ERROR: 'form-validation-error'
  } as const;

  // Modals related test IDs
  static readonly MODALS = {
    MODAL_CONTAINER: 'modal-container',
    MODAL_OVERLAY: 'modal-overlay',
    MODAL_CLOSE_BUTTON: 'modal-close-button',
    MODAL_HEADER: 'modal-header',
    MODAL_BODY: 'modal-body',
    MODAL_FOOTER: 'modal-footer',
    MODAL_CONFIRM_BUTTON: 'modal-confirm-button',
    MODAL_CANCEL_BUTTON: 'modal-cancel-button'
  } as const;

  // Loading states related test IDs
  static readonly LOADING = {
    LOADING_SPINNER: 'loading-spinner',
    LOADING_OVERLAY: 'loading-overlay',
    LOADING_MESSAGE: 'loading-message',
    SKELETON_LOADER: 'skeleton-loader',
    PROGRESS_BAR: 'progress-bar'
  } as const;

  // Error states related test IDs
  static readonly ERRORS = {
    ERROR_MESSAGE: 'error-message',
    ERROR_CONTAINER: 'error-container',
    ERROR_RETRY_BUTTON: 'error-retry-button',
    ERROR_DISMISS_BUTTON: 'error-dismiss-button',
    NETWORK_ERROR: 'network-error',
    VALIDATION_ERROR: 'validation-error',
    SERVER_ERROR: 'server-error'
  } as const;

  // Success states related test IDs
  static readonly SUCCESS = {
    SUCCESS_MESSAGE: 'success-message',
    SUCCESS_CONTAINER: 'success-container',
    SUCCESS_DISMISS_BUTTON: 'success-dismiss-button',
    SUCCESS_ICON: 'success-icon'
  } as const;

  // Accessibility related test IDs
  static readonly A11Y = {
    SKIP_LINK: 'skip-link',
    MAIN_CONTENT: 'main-content',
    LANDMARK_NAV: 'landmark-nav',
    LANDMARK_MAIN: 'landmark-main',
    LANDMARK_ASIDE: 'landmark-aside',
    LANDMARK_FOOTER: 'landmark-footer',
    FOCUS_TRAP: 'focus-trap',
    ARIA_LIVE_REGION: 'aria-live-region'
  } as const;

  // Performance related test IDs
  static readonly PERFORMANCE = {
    PERFORMANCE_MARKER: 'performance-marker',
    RENDER_TIME: 'render-time',
    LOAD_TIME: 'load-time',
    INTERACTION_TIME: 'interaction-time'
  } as const;

  // Security related test IDs
  static readonly SECURITY = {
    CSRF_TOKEN: 'csrf-token',
    SECURITY_HEADER: 'security-header',
    AUTH_TOKEN: 'auth-token',
    SESSION_ID: 'session-id'
  } as const;

  // Analytics related test IDs
  static readonly ANALYTICS = {
    ANALYTICS_TRACKER: 'analytics-tracker',
    TRACKING_PIXEL: 'tracking-pixel',
    EVENT_TRIGGER: 'event-trigger',
    METRIC_COUNTER: 'metric-counter'
  } as const;

  // Internationalization related test IDs
  static readonly I18N = {
    LANGUAGE_SELECTOR: 'language-selector',
    CURRENCY_SELECTOR: 'currency-selector',
    TIMEZONE_SELECTOR: 'timezone-selector',
    LOCALE_DISPLAY: 'locale-display'
  } as const;

  // WebAuthn related test IDs
  static readonly WEBAUTHN = {
    WEBAUTHN_BUTTON: 'webauthn-button',
    WEBAUTHN_REGISTER: 'webauthn-register',
    WEBAUTHN_AUTHENTICATE: 'webauthn-authenticate',
    WEBAUTHN_CREDENTIALS: 'webauthn-credentials',
    WEBAUTHN_ADD_CREDENTIAL: 'webauthn-add-credential',
    WEBAUTHN_REMOVE_CREDENTIAL: 'webauthn-remove-credential',
    FEATURES: 'webauthn-features',
    // Additional properties for PasskeyControls
    login: 'webauthn-login',
    prompt: 'webauthn-prompt',
    biometricButton: 'webauthn-biometric-button',
    crossDeviceButton: 'webauthn-cross-device-button',
    qr: 'webauthn-qr',
    authPrompt: 'webauthn-auth-prompt',
    biometricPrompt: 'webauthn-biometric-prompt',
    networkError: 'webauthn-network-error',
    serverError: 'webauthn-server-error'
  } as const;

  // Feedback related test IDs
  static readonly FEEDBACK = {
    FEEDBACK_FORM: 'feedback-form',
    FEEDBACK_RATING: 'feedback-rating',
    FEEDBACK_COMMENT: 'feedback-comment',
    FEEDBACK_SUBMIT: 'feedback-submit',
    FEEDBACK_SUCCESS: 'feedback-success'
  } as const;

  // Civic actions related test IDs
  static readonly CIVIC_ACTIONS = {
    CIVIC_ACTIONS_CONTAINER: 'civic-actions-container',
    ACTION_CREATE_BUTTON: 'action-create-button',
    ACTION_FORM: 'action-form',
    ACTION_TITLE_INPUT: 'action-title-input',
    ACTION_DESCRIPTION_INPUT: 'action-description-input',
    ACTION_TYPE_SELECT: 'action-type-select',
    ACTION_PRIORITY_SELECT: 'action-priority-select',
    ACTION_DUE_DATE_INPUT: 'action-due-date-input',
    ACTION_SUBMIT_BUTTON: 'action-submit-button',
    ACTION_ITEM: 'action-item',
    ACTION_EDIT_BUTTON: 'action-edit-button',
    ACTION_DELETE_BUTTON: 'action-delete-button',
    ACTION_COMPLETE_BUTTON: 'action-complete-button'
  } as const;

  // Contact messaging related test IDs
  static readonly CONTACT = {
    CONTACT_FORM: 'contact-form',
    CONTACT_RECIPIENT_SELECT: 'contact-recipient-select',
    CONTACT_SUBJECT_INPUT: 'contact-subject-input',
    CONTACT_MESSAGE_INPUT: 'contact-message-input',
    CONTACT_PRIORITY_SELECT: 'contact-priority-select',
    CONTACT_SUBMIT_BUTTON: 'contact-submit-button',
    CONTACT_THREAD: 'contact-thread',
    CONTACT_MESSAGE: 'contact-message',
    CONTACT_REPLY_BUTTON: 'contact-reply-button'
  } as const;

  /**
   * Get all test IDs as a flat object
   * @returns Object containing all test IDs
   */
  static getAllTestIds(): Record<string, string> {
    const allIds: Record<string, string> = {};
    
    // Flatten all test ID categories
    Object.entries(TestIds).forEach(([category, ids]) => {
      if (typeof ids === 'object' && ids !== null) {
        Object.entries(ids).forEach(([key, value]) => {
          allIds[`${category}.${key}`] = value as string;
        });
      }
    });
    
    return allIds;
  }

  /**
   * Validate test ID exists
   * @param testId - Test ID to validate
   * @returns boolean - True if test ID exists
   */
  static isValidTestId(testId: string): boolean {
    const allIds = TestIds.getAllTestIds();
    return Object.values(allIds).includes(testId);
  }

  /**
   * Get test ID by category and key
   * @param category - Test ID category
   * @param key - Test ID key
   * @returns string | undefined - Test ID value or undefined
   */
  static getTestId(category: string, key: string): string | undefined {
    const categoryIds = (TestIds as any)[category];
    if (categoryIds && typeof categoryIds === 'object') {
      const value = categoryIds[key];
      return typeof value === 'string' ? value : undefined;
    }
    return undefined;
  }

  /**
   * Generate dynamic test IDs for admin functions
   */
  static readonly admin = {
    // Static properties
    userList: 'user-list',
    pollList: 'poll-list',
    overviewTab: 'overview-tab',
    analyticsTab: 'analytics-tab',
    dashboard: 'admin-dashboard',
    // Dynamic methods
    promoteUser: (userId: string) => `promote-user-${userId}`,
    banUser: (userId: string) => `ban-user-${userId}`,
    unbanUser: (userId: string) => `unban-user-${userId}`,
    editUser: (userId: string) => `edit-user-${userId}`,
    deleteUser: (userId: string) => `delete-user-${userId}`
  };

  /**
   * Login related test IDs
   */
  static readonly login = {
    submit: 'login-submit',
    form: 'login-form',
    email: 'login-email',
    password: 'login-password'
  };

  /**
   * Login form test ID
   */
  static readonly loginForm = 'login-form';

  /**
   * Login error test ID
   */
  static readonly loginError = 'login-error';

  /**
   * Submit button test ID
   */
  static readonly submitButton = 'login-submit';

  /**
   * Login hydration sentinel for E2E tests
   */
  static readonly loginHydrated = 'login-hydrated';
}

/**
 * Default export for convenience
 */
export default TestIds;

/**
 * Alias for easier access
 */
export const T = TestIds;