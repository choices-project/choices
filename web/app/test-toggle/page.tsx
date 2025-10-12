'use client';

import React, { useState } from 'react';

export default function TestTogglePage() {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <h1 className="text-2xl font-bold">Test Toggle</h1>
        
        <button
          type="button"
          onClick={() => {
            alert('BUTTON CLICKED!');
            console.log('Button clicked!');
            setIsSignUp(!isSignUp);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded"
          data-testid="test-toggle"
        >
          {isSignUp ? 'Switch to Sign In' : 'Switch to Sign Up'}
        </button>
        
        {isSignUp && (
          <div className="bg-green-100 p-4 rounded">
            <p>Sign Up Mode Active!</p>
          </div>
        )}
      </div>
    </div>
  );
}
