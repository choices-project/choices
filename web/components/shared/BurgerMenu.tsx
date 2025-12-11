'use client';

import { 
  X, 
  Heart, 
  Users, 
  Code, 
  BookOpen, 
  Bug, 
  Share2,
  Settings,
  User,
  LogOut,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import Image from 'next/image';
import React, { useMemo, useState } from 'react';

import { logger } from '@/lib/utils/logger';

import { useI18n } from '@/hooks/useI18n';

type BurgerMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
}

export default function BurgerMenu({ isOpen, onClose, user }: BurgerMenuProps) {
  const { t } = useI18n();
  const [activeSection, setActiveSection] = useState<'main' | 'contribute' | 'settings'>('main');

  const mainMenuItems = useMemo(() => [
    {
      id: 'profile',
      label: t('navigation.menu.profile'),
      icon: <User className="w-5 h-5" />,
      action: () => logger.info('Profile clicked')
    },
    {
      id: 'settings',
      label: t('navigation.menu.settings'),
      icon: <Settings className="w-5 h-5" />,
      action: () => setActiveSection('settings')
    },
    {
      id: 'contribute',
      label: t('navigation.menu.contribute'),
      icon: <Heart className="w-5 h-5" />,
      action: () => setActiveSection('contribute'),
      badge: t('navigation.menu.badgeNew')
    }
  ], [t]);

  const contributionOptions = useMemo(() => [
    {
      id: 'code',
      title: t('navigation.menu.contribute.code.title'),
      description: t('navigation.menu.contribute.code.description'),
      icon: <Code className="w-6 h-6" />,
      color: 'bg-green-100 text-green-600',
      skills: [
        t('navigation.menu.contribute.code.skills.react'),
        t('navigation.menu.contribute.code.skills.typescript'),
        t('navigation.menu.contribute.code.skills.nodejs')
      ],
      action: () => window.open('https://github.com/choices-project/choices', '_blank')
    },
    {
      id: 'documentation',
      title: t('navigation.menu.contribute.documentation.title'),
      description: t('navigation.menu.contribute.documentation.description'),
      icon: <BookOpen className="w-6 h-6" />,
      color: 'bg-blue-100 text-blue-600',
      skills: [
        t('navigation.menu.contribute.documentation.skills.writing'),
        t('navigation.menu.contribute.documentation.skills.technicalDocs'),
        t('navigation.menu.contribute.documentation.skills.tutorials')
      ],
      action: () => window.open('https://github.com/choices-project/choices/issues?q=is:issue+is:open+label:documentation', '_blank')
    },
    {
      id: 'testing',
      title: t('navigation.menu.contribute.testing.title'),
      description: t('navigation.menu.contribute.testing.description'),
      icon: <Bug className="w-6 h-6" />,
      color: 'bg-purple-100 text-purple-600',
      skills: [
        t('navigation.menu.contribute.testing.skills.testing'),
        t('navigation.menu.contribute.testing.skills.qa'),
        t('navigation.menu.contribute.testing.skills.userFeedback')
      ],
      action: () => window.open('https://github.com/choices-project/choices/issues?q=is:issue+is:open+label:bug', '_blank')
    },
    {
      id: 'community',
      title: t('navigation.menu.contribute.community.title'),
      description: t('navigation.menu.contribute.community.description'),
      icon: <Users className="w-6 h-6" />,
      color: 'bg-orange-100 text-orange-600',
      skills: [
        t('navigation.menu.contribute.community.skills.community'),
        t('navigation.menu.contribute.community.skills.socialMedia'),
        t('navigation.menu.contribute.community.skills.events')
      ],
      action: () => window.open('https://discord.gg/choices', '_blank')
    },
    {
      id: 'sharing',
      title: t('navigation.menu.contribute.sharing.title'),
      description: t('navigation.menu.contribute.sharing.description'),
      icon: <Share2 className="w-6 h-6" />,
      color: 'bg-pink-100 text-pink-600',
      skills: [
        t('navigation.menu.contribute.sharing.skills.socialMedia'),
        t('navigation.menu.contribute.sharing.skills.contentCreation'),
        t('navigation.menu.contribute.sharing.skills.outreach')
      ],
      action: () => logger.info('Share clicked')
    }
  ], [t]);

  const settingsItems = useMemo(() => [
    {
      id: 'privacy',
      label: t('navigation.menu.settings.privacy'),
      icon: <Settings className="w-5 h-5" />,
      action: () => logger.info('Privacy settings')
    },
    {
      id: 'notifications',
      label: t('navigation.menu.settings.notifications'),
      icon: <Users className="w-5 h-5" />,
      action: () => logger.info('Notifications')
    },
    {
      id: 'account',
      label: t('navigation.menu.settings.account'),
      icon: <User className="w-5 h-5" />,
      action: () => logger.info('Account settings')
    }
  ], [t]);

  const renderMainMenu = () => (
    <div className="space-y-4">
      {/* User Info */}
      {user && (
        <div className="p-4 bg-gray-50 rounded-lg mb-4">
          <div className="flex items-center space-x-3">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name ?? 'User avatar'}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
            )}
            <div>
              <div className="font-medium text-gray-900">
                {user.name ?? t('navigation.menu.userFallback')}
              </div>
              <div className="text-sm text-gray-500">
                {user.email}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="space-y-2">
        {mainMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={item.action}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-3">
              {item.icon}
              <span className="font-medium text-gray-900">{item.label}</span>
              {item.badge && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  {item.badge}
                </span>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        ))}
      </div>

      {/* Logout */}
      <div className="pt-4 border-t border-gray-200">
        <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors text-red-600">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">{t('navigation.logout')}</span>
        </button>
      </div>
    </div>
  );

  const renderContributeMenu = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <button
          onClick={() => setActiveSection('main')}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 rotate-180" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">
          {t('navigation.menu.contribute.title')}
        </h2>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-green-800">
          <strong>{t('navigation.menu.contribute.description')}</strong> 
          {' '}
          {t('navigation.menu.contribute.mission')}
        </p>
      </div>

      {/* Contribution Options */}
      <div className="space-y-3">
        {contributionOptions.map((option) => (
          <button
            key={option.id}
            onClick={option.action}
            className="w-full p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors text-left"
          >
            <div className="flex items-start space-x-3">
              <div className={`w-10 h-10 ${option.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                {option.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {option.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {option.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {option.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </div>
          </button>
        ))}
      </div>

      {/* Note about financial contributions */}
      <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-800">
          <strong>{t('navigation.menu.contribute.financialNote.label')}</strong>
          {' '}
          {t('navigation.menu.contribute.financialNote.text')}
        </p>
      </div>
    </div>
  );

  const renderSettingsMenu = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <button
          onClick={() => setActiveSection('main')}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 rotate-180" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">
          {t('navigation.settings')}
        </h2>
      </div>

      {/* Settings Items */}
      <div className="space-y-2">
        {settingsItems.map((item) => (
          <button
            key={item.id}
            onClick={item.action}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-3">
              {item.icon}
              <span className="font-medium text-gray-900">{item.label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        ))}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
        role="presentation"
        aria-hidden="true"
      />
      
      {/* Menu */}
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform">
        <div className="p-6 h-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900">
              {activeSection === 'main' && t('navigation.menu.title')}
              {activeSection === 'contribute' && t('navigation.menu.contribute.title')}
              {activeSection === 'settings' && t('navigation.settings')}
            </h1>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label={t('navigation.menu.close')}
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          {activeSection === 'main' && renderMainMenu()}
          {activeSection === 'contribute' && renderContributeMenu()}
          {activeSection === 'settings' && renderSettingsMenu()}
        </div>
      </div>
    </>
  );
}