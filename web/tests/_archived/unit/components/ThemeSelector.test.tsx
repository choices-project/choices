/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import ThemeSelector from '@/components/shared/ThemeSelector';

jest.mock('@/lib/stores/appStore', () => ({
  useAppActions: jest.fn(),
  useTheme: jest.fn(),
  useResolvedTheme: jest.fn(),
}));

jest.mock('@/lib/accessibility/screen-reader', () => ({
  ScreenReaderSupport: {
    announce: jest.fn(),
  },
}));

jest.mock('@/lib/utils/logger', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockLogger,
    logger: mockLogger,
  };
});

const mockedAppStore = jest.requireMock('@/lib/stores/appStore') as {
  useAppActions: jest.Mock;
  useTheme: jest.Mock;
  useResolvedTheme: jest.Mock;
};

const mockedScreenReader = jest.requireMock('@/lib/accessibility/screen-reader') as {
  ScreenReaderSupport: {
    announce: jest.Mock;
  };
};

describe('ThemeSelector', () => {
  const setTheme = jest.fn();
  const updateSystemTheme = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockedAppStore.useTheme.mockReturnValue('system');
    mockedAppStore.useResolvedTheme.mockReturnValue('light');
    mockedAppStore.useAppActions.mockReturnValue({
      setTheme,
      updateSystemTheme,
    });
  });

  describe('Dropdown variant', () => {
    it('renders with current theme', () => {
      mockedAppStore.useTheme.mockReturnValue('dark');
      render(<ThemeSelector variant="dropdown" />);

      expect(screen.getByText('Dark')).toBeInTheDocument();
      expect(screen.getByLabelText('Select theme')).toBeInTheDocument();
    });

    it('shows system theme with resolved theme in parentheses', () => {
      mockedAppStore.useTheme.mockReturnValue('system');
      mockedAppStore.useResolvedTheme.mockReturnValue('dark');
      render(<ThemeSelector variant="dropdown" />);

      expect(screen.getByText('System')).toBeInTheDocument();
      expect(screen.getByText('(dark)')).toBeInTheDocument();
    });

    it('opens dropdown menu when clicked', () => {
      render(<ThemeSelector variant="dropdown" />);

      const button = screen.getByLabelText('Select theme');
      fireEvent.click(button);

      expect(screen.getByRole('listbox', { name: 'Theme options' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /light/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /dark/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /system/i })).toBeInTheDocument();
    });

    it('calls setTheme when option is selected', async () => {
      render(<ThemeSelector variant="dropdown" />);

      const button = screen.getByLabelText('Select theme');
      fireEvent.click(button);

      const darkOption = screen.getByRole('option', { name: /dark/i });
      fireEvent.click(darkOption);

      await waitFor(() => {
        expect(setTheme).toHaveBeenCalledWith('dark');
      });
    });

    it('closes dropdown after selection', async () => {
      render(<ThemeSelector variant="dropdown" />);

      const button = screen.getByLabelText('Select theme');
      fireEvent.click(button);

      const darkOption = screen.getByRole('option', { name: /dark/i });
      fireEvent.click(darkOption);

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('closes dropdown on Escape key', () => {
      render(<ThemeSelector variant="dropdown" />);

      const button = screen.getByLabelText('Select theme');
      fireEvent.click(button);

      expect(screen.getByRole('listbox')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('shows checkmark for selected theme', () => {
      mockedAppStore.useTheme.mockReturnValue('dark');
      render(<ThemeSelector variant="dropdown" />);

      const button = screen.getByLabelText('Select theme');
      fireEvent.click(button);

      const darkOption = screen.getByRole('option', { name: /dark/i });
      expect(darkOption).toHaveAttribute('aria-selected', 'true');
      expect(darkOption).toHaveTextContent('✓');
    });

    it('announces theme change to screen reader', async () => {
      render(<ThemeSelector variant="dropdown" />);

      const button = screen.getByLabelText('Select theme');
      fireEvent.click(button);

      const darkOption = screen.getByRole('option', { name: /dark/i });
      fireEvent.click(darkOption);

      await waitFor(() => {
        expect(mockedScreenReader.ScreenReaderSupport.announce).toHaveBeenCalledWith(
          'Theme changed to Dark',
          'polite',
        );
      });
    });
  });

  describe('Compact variant', () => {
    it('renders compact selector', () => {
      render(<ThemeSelector variant="compact" />);

      const button = screen.getByLabelText('Select theme');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('System');
    });

    it('opens dropdown menu when clicked', () => {
      render(<ThemeSelector variant="compact" />);

      const button = screen.getByLabelText('Select theme');
      fireEvent.click(button);

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('calls setTheme when option is selected', async () => {
      render(<ThemeSelector variant="compact" />);

      const button = screen.getByLabelText('Select theme');
      fireEvent.click(button);

      const lightOption = screen.getByRole('option', { name: /light/i });
      fireEvent.click(lightOption);

      await waitFor(() => {
        expect(setTheme).toHaveBeenCalledWith('light');
      });
    });
  });

  describe('Buttons variant', () => {
    it('renders all theme options as buttons', () => {
      render(<ThemeSelector variant="buttons" />);

      expect(screen.getByText('Light')).toBeInTheDocument();
      expect(screen.getByText('Dark')).toBeInTheDocument();
      expect(screen.getByText('System')).toBeInTheDocument();
    });

    it('highlights active theme button', () => {
      mockedAppStore.useTheme.mockReturnValue('dark');
      render(<ThemeSelector variant="buttons" />);

      const darkButton = screen.getByText('Dark').closest('button');
      expect(darkButton).toHaveClass('bg-blue-600');
    });

    it('calls setTheme when button is clicked', async () => {
      render(<ThemeSelector variant="buttons" />);

      const lightButton = screen.getByText('Light').closest('button');
      fireEvent.click(lightButton!);

      await waitFor(() => {
        expect(setTheme).toHaveBeenCalledWith('light');
      });
    });

    it('shows label when showLabel is true', () => {
      render(<ThemeSelector variant="buttons" showLabel />);

      expect(screen.getByText('Theme')).toBeInTheDocument();
    });

    it('hides label when showLabel is false', () => {
      render(<ThemeSelector variant="buttons" showLabel={false} />);

      expect(screen.queryByText('Theme')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has live region for screen reader announcements', () => {
      render(<ThemeSelector variant="dropdown" />);

      const liveRegion = screen.getByTestId('theme-selector-live-message');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('role', 'status');
      expect(liveRegion).toHaveClass('sr-only');
    });

    it('has proper ARIA attributes on dropdown button', () => {
      render(<ThemeSelector variant="dropdown" />);

      const button = screen.getByLabelText('Select theme');
      expect(button).toHaveAttribute('aria-haspopup', 'listbox');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('updates aria-expanded when dropdown opens', () => {
      render(<ThemeSelector variant="dropdown" />);

      const button = screen.getByLabelText('Select theme');
      fireEvent.click(button);

      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('has proper role and aria-selected on options', () => {
      render(<ThemeSelector variant="dropdown" />);

      const button = screen.getByLabelText('Select theme');
      fireEvent.click(button);

      const options = screen.getAllByRole('option');
      options.forEach((option) => {
        expect(option).toHaveAttribute('aria-selected');
      });
    });
  });

  describe('Error handling', () => {
    it('handles setTheme errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      setTheme.mockImplementation(() => {
        throw new Error('Theme change failed');
      });

      render(<ThemeSelector variant="dropdown" />);

      const button = screen.getByLabelText('Select theme');
      fireEvent.click(button);

      const darkOption = screen.getByRole('option', { name: /dark/i });
      fireEvent.click(darkOption);

      await waitFor(() => {
        expect(mockedScreenReader.ScreenReaderSupport.announce).toHaveBeenCalledWith(
          'Failed to change theme',
          'assertive',
        );
      });

      consoleError.mockRestore();
    });
  });
});

