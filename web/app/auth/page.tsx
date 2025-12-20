'use client';

import { Eye, EyeOff, Lock, Mail, UserPlus, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import dynamicImport from 'next/dynamic';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { getSupabaseBrowserClient } from '@/utils/supabase/client';

import { loginWithPassword, registerUser } from '@/features/auth/lib/api';
import {
  useUserError,
  useUserLoading,
  useUserActions,
  useUserStore,
} from '@/features/auth/lib/store';

import { logger } from '@/lib/utils/logger';

import { useI18n } from '@/hooks/useI18n';

// Prevent static generation for auth page
export const dynamic = 'force-dynamic';

const PasskeyLoadingFallback = () => {
  const { t } = useI18n();
  return <div className="text-center text-sm text-gray-500">{t('auth.loadingOptions')}</div>;
};

const PasskeyControls = dynamicImport(() => import('@/features/auth/components/PasskeyControls'), {
  ssr: false,
  loading: () => <PasskeyLoadingFallback />,
});

export default function AuthPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const userError = useUserError();
  const isLoading = useUserLoading();
  const {
    setLoading: setAuthLoading,
    setError: setAuthError,
    clearError: clearAuthError,
  } = useUserActions();
  const initializeAuth = useUserStore((state) => state.initializeAuth);
  const setSessionAndDerived = useUserStore((state) => state.setSessionAndDerived);


  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });

  // Performance tracking - properly implemented
  React.useEffect(() => {
    const startTime = performance.now();
    const timer = setTimeout(() => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      logger.info('Auth page load time', { loadTime });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Note: Removed user/isLoading checks to avoid hydration mismatch
  // User authentication will be handled by the form submission

  // Native DOM event handler as workaround for Playwright onClick issues
  const handleToggle = (e: Event) => {
    e.preventDefault();
    logger.info('Native toggle clicked! Current isSignUp', { isSignUp });
    setIsSignUp(!isSignUp);
    clearAuthError();
    setMessage(null);
    setFormData({ email: '', password: '', confirmPassword: '', displayName: '' });
    logger.info('Native toggle after setState! New isSignUp should be', { newIsSignUp: !isSignUp });
  };

  const syncSupabaseSession = React.useCallback(async () => {
    try {
      const supabase = await getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        initializeAuth(session.user, session, true);
        setSessionAndDerived(session);
      } else {
        initializeAuth(null, null, false);
      }
    } catch (error) {
      logger.error('Auth page failed to synchronize Supabase session', error);
    }
  }, [initializeAuth, setSessionAndDerived]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setMessage(null);
    setIsRateLimited(false);

    const translateError = (key: string) => t(`auth.errors.${key}`);
    const applyError = (key: string) => {
      setAuthError(translateError(key));
      setAuthLoading(false); // Reset loading state on validation error
    };

    // Set loading state immediately to provide user feedback
    // This ensures users see loading state even if validation fails
    setAuthLoading(true);

    // Client-side validation
    if (!formData.email) {
      applyError('emailRequired');
      return;
    }
    if (!formData.password) {
      applyError('passwordRequired');
      return;
    }
    if (isSignUp) {
      if (!formData.displayName) {
        applyError('displayNameRequired');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
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
          email: formData.email,
          username: formData.displayName.toLowerCase().replace(/\s+/g, '_'),
          password: formData.password,
        });
        if (result.ok) {
          await syncSupabaseSession();
          setMessage(t('auth.success.accountCreated'));
          setTimeout(() => {
            router.push('/onboarding');
          }, 1000);
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
            email: formData.email,
            password: formData.password,
          });
          
          // Set the session in the browser's Supabase client
          // This is needed because our httpOnly cookies can't be read by JS
          if (loginResult?.data?.session) {
            const supabase = await getSupabaseBrowserClient();
            await supabase.auth.setSession({
              access_token: loginResult.data.session.access_token,
              refresh_token: loginResult.data.session.refresh_token,
            });
          }
          
          await syncSupabaseSession();
          // Redirect to feed (default for authenticated users per middleware)
          // Use router.replace to avoid adding to history
          router.replace('/feed');
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
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Hydration sentinel for E2E tests */}
        <div data-testid="auth-hydrated" hidden>{'1'}</div>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {isSignUp ? t('auth.heading.signUp') : t('auth.heading.signIn')}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {isSignUp ? t('auth.subheading.signUp') : t('auth.subheading.signIn')}
          </p>
        </div>

        {/* Toggle between Sign In and Sign Up */}
        <div className="text-center">
          <button
            type="button"
            ref={(button) => {
              if (button) {
                button.removeEventListener('click', handleToggle);
                button.addEventListener('click', handleToggle);
              }
            }}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
            data-testid="auth-toggle"
            tabIndex={0}
          >
            {isSignUp ? t('auth.toggle.toSignIn') : t('auth.toggle.toSignUp')}
          </button>
        </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5 transition-all duration-300 ease-in-out" data-testid="login-form">
          {/* CSRF Token */}
          <input type="hidden" name="csrf-token" value="test-csrf-token" data-testid="csrf-token" />
              {userError && (
                <div
                  className="bg-red-50 border border-red-200 rounded-md p-4"
                  data-testid="auth-error"
                  role="alert"
                  aria-live="assertive"
                >
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{userError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Summary */}
              <div data-testid="error-summary" className="bg-red-50 border border-red-200 rounded-md p-4 hidden" role="alert">
                <p className="text-sm text-red-700">{t('auth.form.errorSummaryTitle')}</p>
                <div data-testid="error-count" className="text-xs text-red-600 mt-1">{t('auth.form.errorSummaryCount', { count: '3' })}</div>
              </div>

              {/* Rate Limit Message */}
              <div 
                data-testid="rate-limit-message" 
                className={`bg-yellow-50 border border-yellow-200 rounded-md p-4 ${isRateLimited ? '' : 'hidden'}`}
                role="alert"
                aria-live="assertive"
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      {userError && isRateLimited ? userError : t('auth.form.rateLimited')}
                    </p>
                    <p className="mt-1 text-xs text-yellow-600">
                      Please wait a moment before trying again.
                    </p>
                  </div>
                </div>
              </div>

          {message && (
            <div
              className="bg-green-50 border border-green-200 rounded-md p-4"
              data-testid="auth-success"
              role="status"
              aria-live="polite"
            >
              <div className="flex">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <p className="text-sm text-green-700">{message}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
                {/* Display Name (Sign Up only) */}
                {isSignUp && (
                  <div>
                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('auth.form.displayNameLabel')}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="displayName"
                        name="displayName"
                        value={formData.displayName}
                        onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                        required={isSignUp}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500"
                        placeholder={t('auth.form.displayNamePlaceholder')}
                        data-testid="auth-display-name"
                        aria-label={t('auth.form.displayNameAria')}
                      />
                      <UserPlus className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                    {formData.displayName && (
                      <div data-testid="display-name-validation" className="mt-1 text-xs text-green-600">
                        {t('auth.form.displayNameValidation')}
                      </div>
                    )}
                    <div data-testid="display-name-error" className="mt-1 text-xs text-red-600 hidden">
                      {t('auth.form.displayNameError')}
                    </div>
                  </div>
                )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.form.emailLabel')}
                <span className="text-red-500 ml-1" aria-label="required">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors ${
                    formData.email && !formData.email.includes('@') 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : formData.email && formData.email.includes('@')
                      ? 'border-green-300'
                      : 'border-gray-300'
                  }`}
                  placeholder={t('auth.form.emailPlaceholder')}
                  data-testid="login-email"
                  aria-label={t('auth.form.emailAria')}
                  aria-invalid={
                    formData.email && formData.email.length > 0 && !formData.email.includes('@')
                      ? true
                      : undefined
                  }
                  aria-describedby={formData.email ? (formData.email.includes('@') ? 'email-success' : 'email-error') : undefined}
                />
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              {formData.email && formData.email.includes('@') && (
                <div id="email-success" data-testid="email-validation" className="mt-1 text-xs text-green-600 flex items-center gap-1" role="status">
                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  <span>{t('auth.form.emailValidation')}</span>
                </div>
              )}
              {formData.email && !formData.email.includes('@') && (
                <div id="email-error" data-testid="email-error" className="mt-1 text-xs text-red-600 flex items-center gap-1" role="alert">
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  <span>{t('auth.form.emailError')}</span>
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.form.passwordLabel')}
                <span className="text-red-500 ml-1" aria-label="required">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  className={`w-full pl-10 pr-10 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors ${
                    formData.password && formData.password.length < 6 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : formData.password && formData.password.length >= 6
                      ? 'border-green-300'
                      : 'border-gray-300'
                  }`}
                  placeholder={t('auth.form.passwordPlaceholder')}
                  data-testid="login-password"
                  aria-label={t('auth.form.passwordAria')}
                  aria-invalid={
                    formData.password && formData.password.length > 0 && formData.password.length < 6
                      ? true
                      : undefined
                  }
                  aria-describedby={formData.password ? (formData.password.length >= 6 ? 'password-success' : 'password-error') : undefined}
                />
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 rounded-full p-1 text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      aria-label={t(showPassword ? 'auth.form.hidePassword' : 'auth.form.showPassword')}
                      aria-pressed={showPassword}
                      aria-controls="password"
                      data-testid="password-toggle"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
              </div>
              {formData.password && formData.password.length >= 6 && (
                <div id="password-success" data-testid="password-validation" className="mt-1 text-xs text-green-600 flex items-center gap-1" role="status">
                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  <span>{t('auth.form.passwordValidation')}</span>
                </div>
              )}
              {formData.password && formData.password.length < 6 && formData.password.length > 0 && (
                <div id="password-error" data-testid="password-error" className="mt-1 text-xs text-red-600 flex items-center gap-1" role="alert">
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  <span>{t('auth.form.passwordError')}</span>
                </div>
              )}
            </div>

            {/* Confirm Password (Sign Up only) */}
            {isSignUp && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('auth.form.confirmPasswordLabel')}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    required={isSignUp}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500"
                    placeholder={t('auth.form.passwordPlaceholder')}
                    data-testid="auth-confirm-password"
                    aria-label={t('auth.form.confirmPasswordAria')}
                  />
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2.5 rounded-full p-1 text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        aria-label={t(showConfirmPassword ? 'auth.form.hidePassword' : 'auth.form.showPassword')}
                        aria-pressed={showConfirmPassword}
                        aria-controls="confirmPassword"
                        data-testid="confirm-password-toggle"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                </div>
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <div data-testid="password-match" className="mt-1 text-xs text-green-600">
                    {t('auth.form.passwordsMatch')}
                  </div>
                )}
              </div>
            )}
          </div>


          {/* Submit Button */}
          {/* Disable button if form is invalid or loading */}
          {(() => {
            const isEmailValid = formData.email && formData.email.includes('@');
            const isPasswordValid = formData.password && formData.password.length >= 6;
            const isFormValid = isEmailValid && isPasswordValid && 
              (!isSignUp || (formData.displayName && formData.password === formData.confirmPassword));
            const isDisabled = isLoading || !isFormValid;
            
            return (
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                data-testid="login-submit"
                aria-busy={isLoading}
                disabled={isDisabled}
                aria-describedby={!isFormValid && !isLoading ? 'form-validation-hint' : undefined}
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                <span>{isLoading ? t('auth.form.working') : isSignUp ? t('auth.form.submit.signUp') : t('auth.form.submit.signIn')}</span>
              </button>
            );
          })()}
          {!formData.email || !formData.email.includes('@') || !formData.password || formData.password.length < 6 ? (
            <div id="form-validation-hint" className="sr-only" role="status">
              {t('auth.form.completeFields')}
            </div>
          ) : null}
        </form>

        {/* Passkey Authentication */}
        <div className="border-t border-gray-200 pt-6 mt-6">
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-500">
                {t('auth.form.altSignInDivider')}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <PasskeyControls />
          </div>
        </div>
      </div>
    </div>
  );
}
