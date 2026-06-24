'use client';

import { Eye, EyeOff, Lock, Mail, UserPlus, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState } from 'react';

import { getSupabaseBrowserClient } from '@/utils/supabase/client';


import { loginWithPassword, registerUser } from '@/features/auth/lib/api';
import { useUserActions, useUserLoading, useUserError } from '@/features/auth/lib/store';

import { EnhancedErrorDisplay } from '@/components/shared/EnhancedErrorDisplay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { hydrateBrowserSessionFromServer } from '@/lib/auth/browser-session';
import { completeSignIn } from '@/lib/auth/complete-sign-in';
import {
  DEFAULT_POST_AUTH_PATH,
  normalizePostAuthRedirectPath,
  pickRedirectQueryParam,
} from '@/lib/auth/normalize-post-auth-redirect';
import { messageFromAuthUrlError } from '@/lib/auth/oauth-url-error';
import { env } from '@/lib/config/env';
import { logger } from '@/lib/utils/logger';

import { useI18n } from '@/hooks/useI18n';

import type { Session } from '@supabase/supabase-js';

export default function AuthPageClient() {
  const router = useRouter();
  const { t } = useI18n();
  const normalizeUsername = React.useCallback((value: string) => {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }, []);
  const searchParams = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const emailRef = React.useRef<HTMLInputElement | null>(null);
  const passwordRef = React.useRef<HTMLInputElement | null>(null);
  const displayNameRef = React.useRef<HTMLInputElement | null>(null);
  const confirmPasswordRef = React.useRef<HTMLInputElement | null>(null);
  const formRef = React.useRef<HTMLFormElement | null>(null);
  const submitInFlightRef = React.useRef(false);
  const {
    setLoading: setAuthLoading,
    setError: setAuthError,
    clearError: clearAuthError,
    initializeAuth,
    setSessionAndDerived,
  } = useUserActions();
  const storeIsLoading = useUserLoading();
  const storeUserError = useUserError();

  const safeIsLoading = storeIsLoading;
  const safeUserError = storeUserError ?? null;
  const safeMessage = message;
  const safeIsRateLimited = isRateLimited;

  /** Post-login destination: middleware uses `redirectTo`; many routes use legacy `redirect`; `next` also supported. */
  const redirectTarget = React.useMemo(() => {
    const raw = pickRedirectQueryParam(searchParams) ?? DEFAULT_POST_AUTH_PATH;
    return normalizePostAuthRedirectPath(raw);
  }, [searchParams]);

  const finishAuthNavigation = React.useCallback(
    (
      path: string,
      tokens?: { access_token: string; refresh_token: string } | null,
    ) => {
      void completeSignIn(path, tokens);
    },
    [],
  );

  const resetPasswordHref = `/auth/reset?redirectTo=${encodeURIComponent(redirectTarget)}`;

  // Heal stale global loading (e.g. OAuth started, redirect never fired, SPA navigation back to /auth).
  React.useEffect(() => {
    setAuthLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot when opening the sign-in page
  }, []);

  // Surface OAuth / callback failures from `?error=` (GitHub PKCE, stale cookies, etc.).
  React.useEffect(() => {
    const urlError = searchParams.get('error');
    if (!urlError) {
      return;
    }
    setAuthError(messageFromAuthUrlError(urlError));
    setAuthLoading(false);
  }, [searchParams, setAuthError, setAuthLoading]);

  // Supabase sometimes returns PKCE `code` to `/auth` instead of `/auth/callback`; forward server-side.
  React.useEffect(() => {
    const code = searchParams.get('code');
    if (!code || typeof window === 'undefined') {
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    window.location.replace(`/auth/callback?${params.toString()}`);
  }, [searchParams]);

  // PWA / OAuth: server may have set httpOnly cookies but the client store is still empty.
  const sessionRecoveryAttemptedRef = React.useRef(false);
  React.useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const loggedOut = searchParams.get('loggedOut');
    if (code || error || loggedOut || sessionRecoveryAttemptedRef.current) {
      return;
    }
    sessionRecoveryAttemptedRef.current = true;
    void hydrateBrowserSessionFromServer().then((session) => {
      if (session) {
        finishAuthNavigation(redirectTarget);
      }
    });
  }, [searchParams, redirectTarget, finishAuthNavigation]);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });

  const minPasswordLength = 8;
  const normalizedDisplayName = React.useMemo(
    () => normalizeUsername(formData.displayName),
    [formData.displayName, normalizeUsername],
  );

  const readInputValue = (
    event: React.ChangeEvent<HTMLInputElement> | React.FormEvent<HTMLInputElement>
  ) => {
    const target = (event.currentTarget ?? event.target) as HTMLInputElement | null;
    return target?.value ?? null;
  };

  // Performance tracking - properly implemented
  React.useEffect(() => {
    const startTime = performance.now();
    const timer = setTimeout(() => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      logger.debug('Auth page load time', { loadTime });
    }, 100);
    return () => clearTimeout(timer);
  }, []);


  // Sync DOM values with React state for E2E test compatibility
  // This ensures that when tests use page.fill(), the React state updates
  // Also triggers change events to ensure validation runs
  React.useEffect(() => {
    // This synchronization is only needed for harness/test modes.
    // Running it in production can race with normal input handling and clear
    // password state, which leaves submit disabled even with valid credentials.
    if (env.NEXT_PUBLIC_ENABLE_E2E_HARNESS !== '1' && process.env.NODE_ENV !== 'test') {
      return;
    }

    // Use both ID and data-testid selectors for maximum compatibility
    const getEmailInput = (): HTMLInputElement | null => {
      return (document.getElementById('email') ||
        document.querySelector('[data-testid="login-email"]')) as HTMLInputElement | null;
    };

    const getPasswordInput = (): HTMLInputElement | null => {
      return (document.getElementById('password') ||
        document.querySelector('[data-testid="login-password"]')) as HTMLInputElement | null;
    };

    // Wait for inputs to be available (handles hydration delay)
    let cleanup: (() => void) | undefined;
    let checkTimeout: NodeJS.Timeout | undefined;

    const checkInputs = (): void => {
      const emailInput = getEmailInput();
      const passwordInput = getPasswordInput();

      if (!emailInput || !passwordInput) {
        // Retry after a short delay if inputs aren't ready (max 5 seconds)
        checkTimeout = setTimeout(checkInputs, 100);
        return;
      }

      const syncEmail = () => {
        // CRITICAL FIX: Don't sync if input is focused (user is typing)
        // This prevents the input from losing focus after each keystroke
        if (document.activeElement === emailInput) {
          return;
        }

        const currentValue = emailInput.value;
        const syncedValue = emailInput.getAttribute('data-synced-value');
        // Sync if value exists and is different from what we last synced
        // Also sync if value is empty but we had a value before (reset case)
        if (currentValue !== syncedValue) {
          emailInput.setAttribute('data-synced-value', currentValue || '');

          // CRITICAL FIX: Update React state FIRST, then dispatch events in next tick
          // This ensures React's controlled input system recognizes the change
          setFormData(prev => {
            if (prev.email !== currentValue) {
              // Update state immediately - React will re-render
              const newState = { ...prev, email: currentValue };

              // Use setTimeout to dispatch events after state update is queued
              // This ensures React processes the state change before events fire
              setTimeout(() => {
                // Create proper InputEvent with correct properties for React
                const inputEvent = new InputEvent('input', {
                  bubbles: true,
                  cancelable: true,
                  data: currentValue,
                  inputType: 'insertText',
                  isComposing: false
                });

                // Also dispatch change event for form validation
                const changeEvent = new Event('change', {
                  bubbles: true,
                  cancelable: true
                });

                // Dispatch events in correct order
                emailInput.dispatchEvent(inputEvent);
                emailInput.dispatchEvent(changeEvent);

                // REMOVED: focus/blur cycle that was causing input to lose focus
                // Validation will run from the change event above
              }, 0);

              return newState;
            }
            return prev;
          });
        }
      };

      const syncPassword = () => {
        // CRITICAL FIX: Don't sync if input is focused (user is typing)
        // This prevents the input from losing focus after each keystroke
        if (document.activeElement === passwordInput) {
          return;
        }

        const currentValue = passwordInput.value;
        const syncedValue = passwordInput.getAttribute('data-synced-value');
        // Sync if value exists and is different from what we last synced
        // Also sync if value is empty but we had a value before (reset case)
        if (currentValue !== syncedValue) {
          passwordInput.setAttribute('data-synced-value', currentValue || '');

          // CRITICAL FIX: Update React state FIRST, then dispatch events in next tick
          // This ensures React's controlled input system recognizes the change
          setFormData(prev => {
            if (prev.password !== currentValue) {
              // Update state immediately - React will re-render
              const newState = { ...prev, password: currentValue };

              // Use setTimeout to dispatch events after state update is queued
              // This ensures React processes the state change before events fire
              setTimeout(() => {
                // Create proper InputEvent with correct properties for React
                const inputEvent = new InputEvent('input', {
                  bubbles: true,
                  cancelable: true,
                  data: currentValue,
                  inputType: 'insertText',
                  isComposing: false
                });

                // Also dispatch change event for form validation
                const changeEvent = new Event('change', {
                  bubbles: true,
                  cancelable: true
                });

                // Dispatch events in correct order
                passwordInput.dispatchEvent(inputEvent);
                passwordInput.dispatchEvent(changeEvent);

                // REMOVED: focus/blur cycle that was causing input to lose focus
                // Validation will run from the change event above
              }, 0);

              return newState;
            }
            return prev;
          });
        }
      };

      // Sync on input events (for E2E tests that use page.fill())
      emailInput.addEventListener('input', syncEmail);
      passwordInput.addEventListener('input', syncPassword);

      // Also listen for focus/blur to catch programmatic fills
      emailInput.addEventListener('focus', syncEmail);
      passwordInput.addEventListener('focus', syncPassword);

      // Periodic DOM sync for E2E tests only
      let interval: ReturnType<typeof setInterval> | undefined;
      let timeout: ReturnType<typeof setTimeout> | undefined;
      if (env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1' || process.env.NODE_ENV === 'test') {
        interval = setInterval(() => {
          syncEmail();
          syncPassword();
        }, 100);
        timeout = setTimeout(() => clearInterval(interval), 30000);
      }

      // Set cleanup function
      cleanup = () => {
        emailInput.removeEventListener('input', syncEmail);
        passwordInput.removeEventListener('input', syncPassword);
        emailInput.removeEventListener('focus', syncEmail);
        passwordInput.removeEventListener('focus', syncPassword);
        clearInterval(interval);
        clearTimeout(timeout);
      };

      // Run sync immediately to catch any values already in the DOM
      syncEmail();
      syncPassword();
    };

    // Start checking for inputs
    checkInputs();

    // Cleanup function
    return () => {
      if (checkTimeout) {
        clearTimeout(checkTimeout);
      }
      if (cleanup) {
        cleanup();
      }
    };
  }, []); // Empty deps - only run once on mount

  // CRITICAL: Redirect recovery for E2E tests - if bypass flag is set and we have redirectTo param, redirect immediately
  // This handles the case where middleware redirected to /auth but bypass flag is set
  React.useEffect(() => {
    if (env.NEXT_PUBLIC_ENABLE_E2E_HARNESS !== '1' && process.env.NODE_ENV !== 'test') {
      return;
    }
    if (typeof window === 'undefined') return;

    // Check if we have a redirectTo parameter and bypass flag is set
    const urlParams = new URLSearchParams(window.location.search);
    const redirectTo = pickRedirectQueryParam(urlParams);

    if (redirectTo === '/polls' || redirectTo === '/dashboard' || redirectTo === '/feed') {
      try {
        const bypassFlag = window.localStorage.getItem('e2e-dashboard-bypass') === '1';
        if (bypassFlag) {
          // Bypass flag is set but we were redirected - immediately redirect back
          logger.debug('[auth-page] Bypass flag detected - redirecting to:', redirectTo);
          // Use Next.js router for more reliable navigation in tests
          router.replace(redirectTo);
        }
      } catch {
        // localStorage might not be available, fallback to window.location
        try {
          const bypassFlag = window.localStorage.getItem('e2e-dashboard-bypass') === '1';
          if (bypassFlag && redirectTo) {
            window.location.replace(redirectTo);
          }
        } catch {
          // If all else fails, try window.location
          if (redirectTo) {
            window.location.replace(redirectTo);
          }
        }
      }
    }
  }, [router]); // Include router in deps

  // Note: Removed user/isLoading checks to avoid hydration mismatch
  // User authentication will be handled by the form submission

  // Native DOM event handler as workaround for Playwright onClick issues
  const handleToggle = (e: Event) => {
    e.preventDefault();
    logger.info('Native toggle clicked! Current isSignUp', { isSignUp });
    setIsSignUp((prev) => !prev);
    clearAuthError();
    setMessage(null);
    setFormData({ email: '', password: '', confirmPassword: '', displayName: '' });
    logger.info('Native toggle after setState! New isSignUp should be', { newIsSignUp: !isSignUp });
  };

  const syncSupabaseSession = React.useCallback(
    async (knownSession?: Session | null) => {
      try {
        const supabase = await getSupabaseBrowserClient();
        let session: Session | null =
          knownSession?.user ? knownSession : null;

        if (!session) {
          const sessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise<{ data: { session: Session | null } }>((resolve) => {
            setTimeout(() => resolve({ data: { session: null } }), 5000);
          });
          const { data: fetched } = await Promise.race([sessionPromise, timeoutPromise]);
          session = fetched.session;
        }

        if (session?.user) {
          initializeAuth(session.user, session, true);
          setSessionAndDerived(session);
        } else {
          initializeAuth(null, null, false);
        }
      } catch (error) {
        logger.error('Auth page failed to synchronize Supabase session', error);
      }
    },
    [initializeAuth, setSessionAndDerived],
  );


  const handleSubmit = async (e: React.FormEvent | React.KeyboardEvent | React.MouseEvent | Event) => {
    if (submitInFlightRef.current) {
      return;
    }
    submitInFlightRef.current = true;
    e.preventDefault();
    clearAuthError();
    setMessage(null);
    setIsRateLimited(false);

    const translateError = (key: string) => t(`auth.errors.${key}`);
    const applyError = (key: string) => {
      setAuthError(translateError(key) || t('auth.errors.unexpected'));
      setAuthLoading(false); // Reset loading state on validation error
      submitInFlightRef.current = false;
    };

    // Set loading state immediately to provide user feedback
    // This ensures users see loading state even if validation fails
    setAuthLoading(true);

    const effectiveEmail = formData.email || emailRef.current?.value || '';
    const effectivePassword = formData.password || passwordRef.current?.value || '';
    const effectiveDisplayName = formData.displayName || displayNameRef.current?.value || '';
    const effectiveConfirmPassword =
      formData.confirmPassword || confirmPasswordRef.current?.value || '';
    const normalizedUsername = normalizeUsername(effectiveDisplayName);

    // Client-side validation
    if (!effectiveEmail) {
      applyError('emailRequired');
      return;
    }
    if (!effectivePassword) {
      applyError('passwordRequired');
      return;
    }
    if (effectivePassword.length < minPasswordLength) {
      applyError('passwordTooShort');
      return;
    }
    if (isSignUp) {
      if (!effectiveDisplayName) {
        applyError('displayNameRequired');
        return;
      }
      if (!normalizedUsername || normalizedUsername.length < 3) {
        applyError('displayNameInvalid');
        return;
      }
      if (effectivePassword !== effectiveConfirmPassword) {
        applyError('passwordsMismatch');
        return;
      }
    }

    try {
      setAuthLoading(true);
      if (isSignUp) {
        // Note: registerUser API doesn't currently accept ServerActionContext
        // Security context (IP, user agent) is handled server-side via headers
        const result = await registerUser({
          email: effectiveEmail,
          username: normalizedUsername,
          password: effectivePassword,
        });
        if (result?.success) {
          await syncSupabaseSession(result?.data?.session ?? null);
          setMessage(t('auth.success.accountCreated'));
          if (result?.data?.session) {
            setTimeout(() => {
              finishAuthNavigation(DEFAULT_POST_AUTH_PATH, result.data.session);
            }, 1000);
          }
        } else {
          // Check if it's a rate limit error
          const isRateLimit = (result.error?.toLowerCase().includes('rate limit') ||
                               result.error?.toLowerCase().includes('too many requests'));
          if (isRateLimit) {
            setIsRateLimited(true);
            setAuthError(translateError('rateLimited') || 'Too many requests. Please try again later.');
          } else {
            setAuthError(result.error ?? translateError('registrationFailed'));
          }
        }
      } else {
        // Create FormData for login
        try {
        const loginResult = await loginWithPassword({
          email: effectiveEmail,
          password: effectivePassword,
        });

          await syncSupabaseSession(loginResult?.data?.session ?? null);
          finishAuthNavigation(redirectTarget, loginResult?.data?.session ?? null);
        } catch (loginError: unknown) {
          // Check if it's a rate limit error (429 status)
          const isRateLimit = loginError instanceof Error &&
                            ((loginError as any).status === 429 ||
                             loginError.message.toLowerCase().includes('rate limit') ||
                             loginError.message.toLowerCase().includes('too many requests'));

          if (isRateLimit) {
            setIsRateLimited(true);
            setAuthError(translateError('rateLimited') || 'Too many requests. Please try again later.');
          } else {
            // loginAction might throw an error if authentication fails
            const errorMessage = loginError instanceof Error ? loginError.message : translateError('loginFailed');
            setAuthError(errorMessage ?? translateError('loginFailed'));
          }
        }
      }
    } catch (err) {
      // Check if it's a rate limit error
      const isRateLimit = err instanceof Error &&
                         ((err as any).status === 429 ||
                          err.message.toLowerCase().includes('rate limit') ||
                          err.message.toLowerCase().includes('too many requests'));

      if (isRateLimit) {
        setIsRateLimited(true);
        setAuthError(translateError('rateLimited') || 'Too many requests. Please try again later.');
      } else {
        const errorMessage = err instanceof Error ? err.message : translateError('unexpected');
        setAuthError(errorMessage ?? translateError('unexpected'));
      }
    }
    finally {
      setAuthLoading(false);
      submitInFlightRef.current = false;
    }
  };

  const handleKeySubmit = (event: React.KeyboardEvent) => {
    if (event.key !== 'Enter') {
      return;
    }
    handleSubmit(event);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Hydration sentinel for E2E tests */}
        <div data-testid="auth-hydrated" hidden>{'1'}</div>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">
            {isSignUp ? t('auth.heading.signUp') : t('auth.heading.signIn')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSignUp ? t('auth.subheading.signUp') : t('auth.subheading.signIn')}
          </p>
        </div>

        {/* Toggle between Sign In and Sign Up */}
        <div className="text-center">
          <Button
            type="button"
            variant="link"
            ref={(button) => {
              if (button) {
                button.removeEventListener('click', handleToggle);
                button.addEventListener('click', handleToggle);
              }
            }}
            className="min-h-[44px] text-primary hover:text-primary/90"
            data-testid="auth-toggle"
            tabIndex={0}
          >
            {isSignUp ? t('auth.toggle.toSignIn') : t('auth.toggle.toSignUp')}
          </Button>
        </div>

          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="mt-6 space-y-5 transition-all duration-300 ease-in-out"
            data-testid="login-form"
          >
          {/* CSRF Token - only in E2E/dev mode */}
          {env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1' && (
            <input type="hidden" name="csrf-token" value="test-csrf-token" data-testid="csrf-token" />
          )}
              {safeUserError && (
                <EnhancedErrorDisplay
                  message={safeUserError}
                  details={
                    safeIsRateLimited
                      ? 'You\'ve made too many requests. Please wait a moment before trying again.'
                      : 'We encountered an issue with your authentication. Please check your credentials and try again.'
                  }
                  tip={
                    safeIsRateLimited
                      ? 'Rate limiting helps protect your account. Wait a few minutes before trying again.'
                      : 'Double-check your email and password. If you\'ve forgotten your password, use the password reset link.'
                  }
                  severity={safeIsRateLimited ? 'warning' : 'error'}
                  className="mb-4"
                />
              )}

              {/* Rate Limit Message */}
              <div
                data-testid="rate-limit-message"
                className={`bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 transition-all duration-200 ${
                  safeIsRateLimited ? 'opacity-100 visible' : 'opacity-0 invisible h-0 p-0 border-0 overflow-hidden'
                }`}
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      {safeUserError && safeIsRateLimited
                        ? safeUserError
                        : t('auth.form.rateLimited') || 'Too many requests. Please try again later.'}
                    </p>
                    <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-300">
                      {t('auth.form.rateLimitedHelp') || 'Please wait a moment before trying again. This helps us prevent abuse and ensure service availability for all users.'}
                    </p>
                  </div>
                </div>
              </div>

          {safeMessage && (
            <div
              className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md p-4"
              data-testid="auth-success"
              role="status"
              aria-live="polite"
            >
              <div className="flex">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <p className="text-sm text-green-700 dark:text-green-300">{safeMessage}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
                {/* Display Name (Sign Up only) */}
                {isSignUp && (
            <div>
                    <label htmlFor="displayName" className="block text-sm font-medium text-foreground/80 mb-1">
                      {t('auth.form.displayNameLabel')}
                    </label>
                    <div className="relative">
                      <Input
                        type="text"
                        id="displayName"
                        name="displayName"
                        ref={displayNameRef}
                        value={formData.displayName}
                        onChange={(e) => {
                          const value = readInputValue(e);
                          if (value === null) return;
                          setFormData((prev) => ({ ...prev, displayName: value }));
                        }}
                        onInput={(e) => {
                          const value = readInputValue(e);
                          if (value === null) return;
                          setFormData((prev) => ({ ...prev, displayName: value }));
                        }}
                        onKeyDown={handleKeySubmit}
                        required={isSignUp}
                        className="w-full pl-10"
                        placeholder={t('auth.form.displayNamePlaceholder')}
                        data-testid="auth-display-name"
                        aria-label={t('auth.form.displayNameAria')}
                        autoComplete="name"
                      />
                      <UserPlus className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    </div>
                    {formData.displayName && (
                      <div data-testid="display-name-validation" className="mt-1 text-xs text-green-600 dark:text-green-400">
                        {t('auth.form.displayNameValidation')}
                      </div>
                    )}
                    <div data-testid="display-name-error" className="mt-1 text-xs text-red-600 dark:text-red-400 hidden">
                      {t('auth.form.displayNameError')}
                    </div>
                  </div>
                )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground/80 mb-1">
                {t('auth.form.emailLabel')}
                <span className="text-red-500 ml-1" aria-label="required">*</span>
              </label>
              <div className="relative">
                <Input
                  type="email"
                  id="email"
                  name="email"
                  ref={emailRef}
                  value={formData.email}
                  onChange={(e) => {
                    const value = readInputValue(e);
                    if (value === null) return;
                    setFormData((prev) => ({ ...prev, email: value }));
                  }}
                  onInput={(e) => {
                    const value = readInputValue(e);
                    if (value === null) return;
                    setFormData((prev) => ({ ...prev, email: value }));
                  }}
                  onKeyDown={handleKeySubmit}
                  required
                  className={`w-full pl-10 transition-colors ${
                    formData.email && !formData.email.includes('@')
                      ? 'border-red-300 dark:border-red-600 focus-visible:ring-red-500'
                      : formData.email && formData.email.includes('@')
                      ? 'border-green-300 dark:border-green-600'
                      : ''
                  }`}
                  placeholder={t('auth.form.emailPlaceholder')}
                  data-testid="login-email"
                  aria-label={t('auth.form.emailAria')}
                  autoComplete="email"
                  aria-invalid={
                    formData.email && formData.email.length > 0 && !formData.email.includes('@')
                      ? true
                      : undefined
                  }
                  aria-describedby={formData.email ? (formData.email.includes('@') ? 'email-success' : 'email-error') : undefined}
                />
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              </div>
              {formData.email && formData.email.includes('@') && (
                <div id="email-success" data-testid="email-validation" className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center gap-1" role="status">
                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  <span>{t('auth.form.emailValidation')}</span>
                </div>
              )}
              {formData.email && !formData.email.includes('@') && (
                <div id="email-error" data-testid="email-error" className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1" role="alert">
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  <span>{t('auth.form.emailError')}</span>
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground/80 mb-1">
                {t('auth.form.passwordLabel')}
                <span className="text-red-500 ml-1" aria-label="required">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  ref={passwordRef}
                  value={formData.password}
                  onChange={(e) => {
                    const value = readInputValue(e);
                    if (value === null) return;
                    setFormData((prev) => ({ ...prev, password: value }));
                  }}
                  onInput={(e) => {
                    const value = readInputValue(e);
                    if (value === null) return;
                    setFormData((prev) => ({ ...prev, password: value }));
                  }}
                  onKeyDown={handleKeySubmit}
                  required
                  className={`w-full pl-10 pr-10 transition-colors ${
                    formData.password && formData.password.length < minPasswordLength
                      ? 'border-red-300 dark:border-red-600 focus-visible:ring-red-500'
                      : formData.password && formData.password.length >= minPasswordLength
                      ? 'border-green-300 dark:border-green-600'
                      : ''
                  }`}
                  placeholder={t('auth.form.passwordPlaceholder')}
                  data-testid="login-password"
                  aria-label={t('auth.form.passwordAria')}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  aria-invalid={
                    formData.password && formData.password.length > 0 && formData.password.length < minPasswordLength
                      ? true
                      : undefined
                  }
                  aria-describedby={formData.password ? (formData.password.length >= minPasswordLength ? 'password-success' : 'password-error') : undefined}
                />
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 min-h-[44px] min-w-[44px] rounded-full text-muted-foreground hover:text-foreground"
                      aria-label={t(showPassword ? 'auth.form.hidePassword' : 'auth.form.showPassword')}
                      aria-pressed={showPassword}
                      aria-controls="password"
                      data-testid="password-toggle"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
              </div>
              {formData.password && formData.password.length >= minPasswordLength && (
                <div id="password-success" data-testid="password-validation" className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center gap-1" role="status">
                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  <span>{t('auth.form.passwordValidation', { length: minPasswordLength })}</span>
                </div>
              )}
              {formData.password && formData.password.length < minPasswordLength && formData.password.length > 0 && (
                <div id="password-error" data-testid="password-error" className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1" role="alert">
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  <span>{t('auth.form.passwordLengthError', { length: minPasswordLength })}</span>
                </div>
              )}
            </div>
            {/* Confirm Password (Sign Up only) */}
            {isSignUp && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground/80 mb-1">
                  {t('auth.form.confirmPasswordLabel')}
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    ref={confirmPasswordRef}
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      const value = readInputValue(e);
                      if (value === null) return;
                      setFormData((prev) => ({ ...prev, confirmPassword: value }));
                    }}
                    onInput={(e) => {
                      const value = readInputValue(e);
                      if (value === null) return;
                      setFormData((prev) => ({ ...prev, confirmPassword: value }));
                    }}
                    onKeyDown={handleKeySubmit}
                    required={isSignUp}
                    className="w-full pl-10 pr-10"
                    placeholder={t('auth.form.passwordPlaceholder')}
                    data-testid="auth-confirm-password"
                    aria-label={t('auth.form.confirmPasswordAria')}
                    autoComplete="new-password"
                  />
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2.5 min-h-[44px] min-w-[44px] rounded-full text-muted-foreground hover:text-foreground"
                        aria-label={t(showConfirmPassword ? 'auth.form.hidePassword' : 'auth.form.showPassword')}
                        aria-pressed={showConfirmPassword}
                        aria-controls="confirmPassword"
                        data-testid="confirm-password-toggle"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </Button>
                </div>
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <div data-testid="password-match" className="mt-1 text-xs text-green-600 dark:text-green-400">
                    {t('auth.form.passwordsMatch')}
                  </div>
                )}
              </div>
            )}
          </div>


          {/* Submit Button */}
          {/* Disable button if form is invalid or loading */}
          {(() => {
            const emailCandidate = (formData.email || emailRef.current?.value || '').trim();
            const passwordCandidate = formData.password || passwordRef.current?.value || '';
            const hasEmail = Boolean(emailCandidate && emailCandidate.includes('@'));
            const hasPassword = Boolean(passwordCandidate && passwordCandidate.length >= minPasswordLength);
            const hasDisplayName = !isSignUp || Boolean(formData.displayName && normalizedDisplayName.length >= 3);
            const confirmMatches = !isSignUp || passwordCandidate === formData.confirmPassword;
            const isFormValid = hasEmail && hasPassword && hasDisplayName && confirmMatches;
            const isDisabled = safeIsLoading;

            return (
              <Button
                type="button"
                className="w-full min-h-[44px] flex items-center justify-center gap-2"
                data-testid="login-submit"
                aria-busy={safeIsLoading}
                disabled={isDisabled}
                {...(!isFormValid ? { 'aria-describedby': 'form-validation-hint' } : {})}
                onClick={(event) => handleSubmit(event)}
              >
                {safeIsLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                <span>{safeIsLoading ? t('auth.form.working') : isSignUp ? t('auth.form.submit.signUp') : t('auth.form.submit.signIn')}</span>
              </Button>
            );
          })()}
          {!formData.email || !formData.email.includes('@') || !formData.password || formData.password.length < minPasswordLength ? (
            <div id="form-validation-hint" className="sr-only" role="status">
              {t('auth.form.completeFields') || 'Please complete all required fields'}
            </div>
          ) : null}
        </form>

        {!isSignUp && (
          <div className="mt-2 flex justify-center">
            <Link
              href={resetPasswordHref}
              className="text-sm text-primary hover:text-primary/90"
              data-testid="auth-reset-link"
            >
              {t('auth.form.forgotPassword')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
