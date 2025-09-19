'use client';

import React from 'react';
import Link from 'next/link';
import { useSupabaseAuth } from '@/contexts/AuthContext';
import { PasskeyControls } from '../../../components/auth/PasskeyControls';

export default function AuthPage() {
  const { user, isLoading } = useSupabaseAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome back!</h1>
          <p className="text-gray-600 mb-6">You are already logged in.</p>
          <Link 
            href="/"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication</h1>
        <p className="text-gray-600 mb-6">Please log in to continue.</p>
        
        <div className="mb-6">
          <Link 
            href="/login"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Login
          </Link>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">WebAuthn / Passkey Authentication</h2>
          <PasskeyControls />
        </div>
      </div>
    </div>
  );
}

