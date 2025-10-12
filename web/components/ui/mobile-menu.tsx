'use client';

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface MobileMenuProps {
  className?: string;
}

export function MobileMenu({ className = '' }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`md:hidden ${className}`}>
      <button
        className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 rounded-md p-2"
        aria-label="Toggle mobile menu"
        data-testid="mobile-menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="h-6 w-6" aria-hidden="true" />
        ) : (
          <Menu className="h-6 w-6" aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50">
          <div className="px-4 py-2 space-y-2">
            <a
              href="/feed"
              className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
            >
              Feed
            </a>
            <a
              href="/polls"
              className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
              data-testid="polls-nav"
            >
              Polls
            </a>
            <a
              href="/dashboard"
              className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
              data-testid="dashboard-nav"
            >
              Dashboard
            </a>
            <div className="border-t border-gray-200 pt-2 mt-2">
              <a
                href="/login"
                className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
              >
                Sign In
              </a>
              <a
                href="/register"
                className="block px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
