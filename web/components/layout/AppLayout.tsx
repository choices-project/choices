'use client';

import React, { useState } from 'react';
import { Menu, Heart, TrendingUp, MapPin } from 'lucide-react';
import BurgerMenu from '../navigation/BurgerMenu';
import LiveVotingFeed from '../viral/LiveVotingFeed';

interface AppLayoutProps {
  children: React.ReactNode;
  currentPage?: 'viral' | 'civics' | 'profile' | 'other';
}

export default function AppLayout({ children, currentPage = 'viral' }: AppLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigationItems = [
    {
      id: 'viral',
      label: 'Live Voting',
      icon: <TrendingUp className="w-5 h-5" />,
      href: '/viral',
      isActive: currentPage === 'viral'
    },
    {
      id: 'civics',
      label: 'My Candidates',
      icon: <MapPin className="w-5 h-5" />,
      href: '/civics',
      isActive: currentPage === 'civics'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Choices</h1>
                <p className="text-xs text-gray-500">Democratic Equalizer</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigationItems.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    item.isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === 'viral' ? (
          <LiveVotingFeed />
        ) : (
          children
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20">
        <div className="flex items-center justify-around py-2">
          {navigationItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                item.isActive
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </a>
          ))}
        </div>
      </nav>

      {/* Burger Menu */}
      <BurgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        user={{
          name: 'User',
          email: 'user@example.com'
        }}
      />

      {/* Add padding for mobile bottom nav */}
      <div className="md:hidden h-16" />
    </div>
  );
}
