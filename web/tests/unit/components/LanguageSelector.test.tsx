/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import LanguageSelector from '@/components/shared/LanguageSelector';

jest.mock('@/hooks/useI18n', () => ({
  useI18n: jest.fn(),
}));

jest.mock('@/lib/stores/appStore', () => ({
  useAppActions: jest.fn(),
}));

type I18nModule = typeof import('@/hooks/useI18n');
type AppStoreModule = typeof import('@/lib/stores/appStore');

const mockedI18n = jest.requireMock('@/hooks/useI18n') as {
  [K in keyof I18nModule]: jest.Mock;
};

const mockedAppStore = jest.requireMock('@/lib/stores/appStore') as {
  [K in keyof AppStoreModule]: jest.Mock;
};

describe('LanguageSelector', () => {
  const changeLanguage = jest.fn();
  const updateSettings = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockedI18n.useI18n.mockReturnValue({
      t: (key: string) => key,
      currentLanguage: 'en',
      changeLanguage,
    });

    mockedAppStore.useAppActions.mockReturnValue({
      updateSettings,
    });
  });

  it('updates language via i18n hook and app store settings', async () => {
    render(<LanguageSelector variant="compact" />);

    // Open the compact selector dropdown
    fireEvent.click(screen.getByRole('button', { name: /english/i }));

    // Choose Spanish (es)
    const spanishOption = screen.getByRole('button', { name: /español/i });
    fireEvent.click(spanishOption);

    expect(changeLanguage).toHaveBeenCalledWith('es');
    expect(updateSettings).toHaveBeenCalledWith({ language: 'es' });
  });

  it('renders native names when requested', () => {
    render(<LanguageSelector showNativeNames variant="buttons" />);

    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Español')).toBeInTheDocument();
  });
});


