'use client';

import { useEffect } from 'react';

import PasskeyLogin from '@/features/auth/components/PasskeyLogin';
import PasskeyRegister from '@/features/auth/components/PasskeyRegister';
import {
  useInitializeBiometricState,
  useBiometricError,
  useBiometricSuccess,
  useUserActions,
} from '@/features/auth/lib/store';

export default function AuthAccessHarnessPage() {
  useInitializeBiometricState({ fetchCredentials: false });

  const biometricError = useBiometricError();
  const biometricSuccess = useBiometricSuccess();

  const {
    setBiometricSupported,
    setBiometricAvailable,
    setBiometricCredentials,
    resetBiometric,
  } = useUserActions();

  useEffect(() => {
    setBiometricSupported(true);
    setBiometricAvailable(true);
    setBiometricCredentials(false);
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.authAccessHarness = 'ready';
    }

    return () => {
      resetBiometric();
      if (typeof document !== 'undefined') {
        delete document.documentElement.dataset.authAccessHarness;
      }
    };
  }, [resetBiometric, setBiometricAvailable, setBiometricCredentials, setBiometricSupported]);

  return (
    <main
      data-testid="auth-access-harness"
      className="mx-auto flex max-w-3xl flex-col gap-6 p-6"
    >
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold">Auth Access Harness</h1>
        <p className="text-sm text-slate-600">
          Use this page to exercise passkey registration and authentication flows in E2E tests.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <PasskeyRegister className="shadow-sm" />
        <PasskeyLogin className="shadow-sm" />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-medium">Harness State</h2>
        <dl className="mt-2 space-y-1 text-sm">
          <div className="flex justify-between gap-2">
            <dt>Biometric Success</dt>
            <dd data-testid="auth-access-success">{String(Boolean(biometricSuccess))}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Biometric Error</dt>
            <dd data-testid="auth-access-error">{biometricError ?? 'none'}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}


