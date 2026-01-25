'use client';

import {
  MapPinIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  XMarkIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';

import {
  useUserActions,
  useUserCurrentAddress,
  useUserShowAddressForm,
  useUserNewAddress,
  useUserAddressLoading
} from '@/lib/stores';
import {
  useFindByLocation,
  useRepresentativeGlobalLoading
} from '@/lib/stores/representativeStore';
import logger from '@/lib/utils/logger';

import { useI18n } from '@/hooks/useI18n';

type CivicsNavigationProps = {
  onRepresentativesClick: () => void;
  onAddressUpdate?: (address: string) => void;
  currentAddress?: string;
};

export default function CivicsNavigation({
  onRepresentativesClick,
  onAddressUpdate,
  currentAddress
}: CivicsNavigationProps) {
  const { t } = useI18n();
  const { setShowAddressForm, setNewAddress, handleAddressUpdate } = useUserActions();
  const storeCurrentAddress = useUserCurrentAddress();
  const showAddressForm = useUserShowAddressForm();
  const newAddress = useUserNewAddress();
  const addressLoading = useUserAddressLoading();
  const representativeLoading = useRepresentativeGlobalLoading();
  const findByLocation = useFindByLocation();

  // Refs for stable callback props
  const onAddressUpdateRef = useRef(onAddressUpdate);
  useEffect(() => { onAddressUpdateRef.current = onAddressUpdate; }, [onAddressUpdate]);
  const onRepresentativesClickRef = useRef(onRepresentativesClick);
  useEffect(() => { onRepresentativesClickRef.current = onRepresentativesClick; }, [onRepresentativesClick]);

  // Refs for stable store actions
  const setShowAddressFormRef = useRef(setShowAddressForm);
  useEffect(() => { setShowAddressFormRef.current = setShowAddressForm; }, [setShowAddressForm]);
  const setNewAddressRef = useRef(setNewAddress);
  useEffect(() => { setNewAddressRef.current = setNewAddress; }, [setNewAddress]);
  const handleAddressUpdateRef = useRef(handleAddressUpdate);
  useEffect(() => { handleAddressUpdateRef.current = handleAddressUpdate; }, [handleAddressUpdate]);
  const findByLocationRef = useRef(findByLocation);
  useEffect(() => { findByLocationRef.current = findByLocation; }, [findByLocation]);

  const displayAddress = currentAddress ?? storeCurrentAddress;
  const isUpdatingAddress = addressLoading || representativeLoading;
  const modalTitleId = useId();
  const modalDescriptionId = useId();
  const addressInputRef = useRef<HTMLInputElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMobileNavLinkRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuId = useId();

  const openAddressForm = useCallback(() => {
    setShowAddressFormRef.current(true);
  }, []);

  const closeAddressForm = useCallback(() => {
    setShowAddressFormRef.current(false);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((open) => !open);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const handleAddressSubmit = useCallback(async () => {
    const trimmedAddress = newAddress.trim();
    if (!trimmedAddress) {
      return;
    }

    try {
      const districtResult = await handleAddressUpdateRef.current(trimmedAddress);
      const response = await findByLocationRef.current({ address: trimmedAddress });
      if (!response?.success) {
        throw new Error(response?.error ?? t('civics.navigation.errors.fetchFailed'));
      }

      onAddressUpdateRef.current?.(districtResult?.districtDisplay ?? '');
      setNewAddressRef.current('');
      setShowAddressFormRef.current(false);
    } catch (error) {
      logger.error('Address update failed:', error);
    }
  }, [newAddress, t]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;
      const focusTimeout = window.setTimeout(() => {
        firstMobileNavLinkRef.current?.focus();
      }, 0);
      return () => window.clearTimeout(focusTimeout);
    }

    if (previouslyFocusedElementRef.current) {
      previouslyFocusedElementRef.current.focus();
      previouslyFocusedElementRef.current = null;
    }

    return undefined;
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMobileMenu();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeMobileMenu, isMobileMenuOpen]);

  useEffect(() => {
    if (!showAddressForm) {
      return undefined;
    }

    addressInputRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeAddressForm();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showAddressForm, closeAddressForm]);

  return (
    <>
      {/* Main Navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo and main nav */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {t('civics.navigation.header.title')}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {t('civics.navigation.header.subtitle')}
                  </p>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="hidden md:flex space-x-6">
                <button
                  type="button"
                  onClick={onRepresentativesClick}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <UserGroupIcon className="w-5 h-5" />
                  <span>{t('civics.navigation.links.representatives')}</span>
                </button>

                <button
                  type="button"
                  onClick={openAddressForm}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <MapPinIcon className="w-5 h-5" />
                  <span>{t('civics.navigation.links.updateLocation')}</span>
                </button>
              </nav>
            </div>

            {/* Right side - User info and actions */}
            <div className="flex items-center space-x-4">
              {/* Current Location Display */}
              {displayAddress && (
                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                  <MapPinIcon className="w-4 h-4" />
                  <span className="truncate max-w-32">{displayAddress}</span>
                </div>
              )}

              {/* Settings Button */}
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={t('civics.navigation.links.settings')}
              >
                <Cog6ToothIcon className="w-5 h-5" />
              </button>

            {/* Mobile menu toggle */}
            <div className="md:hidden">
              <button
                type="button"
                ref={mobileMenuButtonRef}
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={
                  isMobileMenuOpen
                    ? t('civics.navigation.mobileMenu.close')
                    : t('civics.navigation.mobileMenu.open')
                }
                aria-expanded={isMobileMenuOpen}
                aria-controls={mobileMenuId}
                data-testid="civics-mobile-menu-toggle"
              >
                <span className="sr-only">
                  {isMobileMenuOpen
                    ? t('civics.navigation.mobileMenu.close')
                    : t('civics.navigation.mobileMenu.open')}
                </span>
                {isMobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
            </div>
          </div>
        </div>
      </div>

    {/* Mobile navigation drawer */}
    {isMobileMenuOpen && (
      <div
        className="md:hidden border-b border-gray-200 bg-white shadow-sm"
        id={mobileMenuId}
        role="region"
        aria-label={t('civics.navigation.mobileMenu.regionLabel')}
      >
        <div className="px-4 py-4 space-y-4">
          <div className="space-y-2">
            <button
              type="button"
              ref={firstMobileNavLinkRef}
              onClick={() => {
                onRepresentativesClickRef.current();
                closeMobileMenu();
              }}
              className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span className="flex items-center space-x-2">
                <UserGroupIcon className="h-5 w-5" aria-hidden="true" />
                <span>{t('civics.navigation.links.representatives')}</span>
              </span>
              <span aria-hidden="true">›</span>
            </button>

            <button
              type="button"
              onClick={() => {
                openAddressForm();
                closeMobileMenu();
              }}
              className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span className="flex items-center space-x-2">
                <MapPinIcon className="h-5 w-5" aria-hidden="true" />
                <span>{t('civics.navigation.links.updateLocation')}</span>
              </span>
              <span aria-hidden="true">›</span>
            </button>
          </div>

          <div className="rounded-lg bg-gray-50 p-4 space-y-2">
            <p className="text-sm font-medium text-gray-700">
              {t('civics.navigation.mobileMenu.currentLocation')}
            </p>
            <p className="text-sm text-gray-600">
              {displayAddress ?? t('civics.navigation.mobileMenu.unknownLocation')}
            </p>
            <button
              type="button"
              onClick={() => {
                openAddressForm();
                closeMobileMenu();
              }}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 underline-offset-2"
            >
              {t('civics.navigation.mobileMenu.editAddress')}
            </button>
          </div>

          <div className="text-xs text-gray-500">
            {t('civics.navigation.mobileMenu.accessibilityHint')}
          </div>
        </div>
      </div>
    )}

      {/* Address Update Modal */}
      {showAddressForm && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            role="presentation"
            aria-hidden="true"
            onClick={closeAddressForm}
            data-testid="civics-address-overlay"
          />
          <div
            className="fixed inset-0 flex items-center justify-center z-50 px-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            aria-describedby={modalDescriptionId}
          >
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
              <button
                type="button"
                onClick={closeAddressForm}
                aria-label={t('civics.navigation.modal.close')}
                className="absolute right-4 top-4 rounded-full p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
              <div className="text-center mb-6">
                <h2 id={modalTitleId} className="text-xl font-bold text-gray-900 mb-2">
                  {t('civics.navigation.modal.title')}
                </h2>
                <p id={modalDescriptionId} className="text-gray-600">
                  {t('civics.navigation.modal.description')}
                </p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                void handleAddressSubmit();
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('civics.navigation.modal.addressLabel')}
                  </label>
                  <input
                    ref={addressInputRef}
                    type="text"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder={t('civics.navigation.modal.addressPlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={isUpdatingAddress || newAddress.trim().length === 0}
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {isUpdatingAddress
                      ? t('civics.navigation.modal.submitLoading')
                      : t('civics.navigation.modal.submit')}
                  </button>

                  <button
                    type="button"
                    onClick={closeAddressForm}
                    className="px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    {t('common.actions.cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
