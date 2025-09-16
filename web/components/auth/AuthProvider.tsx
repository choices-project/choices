'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { devLog } from '@/lib/logger';

interface User {
  id: string;
  email: string;
  stable_id: string;
  verification_tier: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithPasskey: () => Promise<void>;
  registerPasskey: (username?: string, displayName?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isWebAuthnSupported: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const isWebAuthnSupported = typeof window !== 'undefined' && 
    window.PublicKeyCredential && 
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        devLog('User authenticated:', userData);
      } else {
        setUser(null);
        devLog('User not authenticated');
      }
    } catch (error) {
      devLog('Auth check error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const userData = await response.json();
      setUser(userData);
      devLog('User signed in:', userData);
    } catch (error) {
      devLog('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const userData = await response.json();
      setUser(userData);
      devLog('User signed up:', userData);
    } catch (error) {
      devLog('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      setUser(null);
      devLog('User signed out');
      router.push('/');
    } catch (error) {
      devLog('Sign out error:', error);
      // Still clear user state even if API call fails
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signInWithPasskey = async () => {
    if (!isWebAuthnSupported) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    try {
      setLoading(true);
      
      // Start WebAuthn authentication
      const beginResponse = await fetch('/api/auth/webauthn/authenticate/begin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userVerification: 'required'
        }),
        credentials: 'include',
      });

      if (!beginResponse.ok) {
        const errorData = await beginResponse.json();
        throw new Error(errorData.error || 'Failed to start authentication');
      }

      const credentialOptions = await beginResponse.json();

      // Get credential
      const credential = await navigator.credentials.get({
        publicKey: {
          ...credentialOptions,
          userVerification: 'required'
        }
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Authentication was cancelled or failed');
      }

      // Complete authentication
      const completeResponse = await fetch('/api/auth/webauthn/authenticate/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: {
            id: credential.id,
            rawId: Array.from(new Uint8Array(credential.rawId)),
            response: {
              authenticatorData: Array.from(new Uint8Array((credential.response as AuthenticatorAssertionResponse).authenticatorData)),
              clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON)),
              signature: Array.from(new Uint8Array((credential.response as AuthenticatorAssertionResponse).signature)),
              userHandle: (credential.response as AuthenticatorAssertionResponse).userHandle 
                ? Array.from(new Uint8Array((credential.response as AuthenticatorAssertionResponse).userHandle!))
                : null
            },
            type: credential.type
          }
        }),
        credentials: 'include',
      });

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json();
        throw new Error(errorData.error || 'Authentication failed');
      }

      const userData = await completeResponse.json();
      setUser(userData);
      devLog('User signed in with passkey:', userData);
    } catch (error) {
      devLog('Passkey sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const registerPasskey = async (username?: string, displayName?: string) => {
    if (!isWebAuthnSupported) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    try {
      setLoading(true);
      
      // Start WebAuthn registration
      const beginResponse = await fetch('/api/auth/webauthn/register/begin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          displayName,
        }),
        credentials: 'include',
      });

      if (!beginResponse.ok) {
        const errorData = await beginResponse.json();
        throw new Error(errorData.error || 'Failed to start registration');
      }

      const credentialOptions = await beginResponse.json();

      // Create credential
      const credential = await navigator.credentials.create({
        publicKey: {
          ...credentialOptions,
          authenticatorSelection: {
            ...credentialOptions.authenticatorSelection,
            userVerification: 'required'
          }
        }
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to create credential');
      }

      // Complete registration
      const completeResponse = await fetch('/api/auth/webauthn/register/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: {
            id: credential.id,
            rawId: Array.from(new Uint8Array(credential.rawId)),
            response: {
              attestationObject: Array.from(new Uint8Array((credential.response as AuthenticatorAttestationResponse).attestationObject)),
              clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON))
            },
            type: credential.type
          }
        }),
        credentials: 'include',
      });

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json();
        throw new Error(errorData.error || 'Failed to complete registration');
      }

      const result = await completeResponse.json();
      devLog('Passkey registered:', result);
      
      // Refresh user data to get updated credentials
      await refreshUser();
    } catch (error) {
      devLog('Passkey registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithPasskey,
    registerPasskey,
    refreshUser,
    isAuthenticated: !!user,
    isWebAuthnSupported,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthProvider;
