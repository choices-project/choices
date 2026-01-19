import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { AddressLookupForm } from '@/features/civics/components/AddressLookupForm';
import enMessages from '@/messages/en.json';

jest.mock('@/features/civics/components/VoterRegistrationCTA', () => ({
  VoterRegistrationCTA: () => <div data-testid="voter-registration-cta" />
}));

jest.mock('@/lib/core/feature-flags', () => ({
  isFeatureEnabled: () => true
}));

const mockHandleAddressUpdate = jest.fn().mockResolvedValue(undefined);
const mockFindByLocation = jest.fn().mockResolvedValue({ success: true });
const mockFetchElections = jest.fn();
const mockFetchVoterRegistration = jest.fn().mockResolvedValue(undefined);
const mockClearError = jest.fn();
const resolveMessage = (key: string) =>
  key.split('.').reduce((acc: any, part: string) => (acc ? acc[part] : undefined), enMessages);

jest.mock('@/lib/stores', () => ({
  useUserActions: () => ({ handleAddressUpdate: mockHandleAddressUpdate }),
  useUserAddressLoading: () => false,
  useFetchElectionsForDivisions: () => mockFetchElections,
  useUserDivisionIds: () => [],
  useFetchVoterRegistrationForState: () => mockFetchVoterRegistration,
  useVoterRegistration: () => ({}),
  useVoterRegistrationLoading: () => false,
  useVoterRegistrationError: () => null,
  useUserCurrentState: () => ''
}));

jest.mock('@/lib/stores/representativeStore', () => ({
  useFindByLocation: () => mockFindByLocation,
  useRepresentativeGlobalLoading: () => false,
  useRepresentativeError: () => null,
  useClearError: () => mockClearError
}));

jest.mock('@/hooks/useI18n', () => ({
  useI18n: () => ({
    t: (key: string, values?: Record<string, unknown>) => {
      const template = resolveMessage(key);
      if (typeof template !== 'string') {
        return key;
      }
      if (!values) {
        return template;
      }
      return template.replace(/\{(\w+)\}/g, (_: string, token: string) =>
        Object.prototype.hasOwnProperty.call(values, token) ? String(values[token]) : `{${token}}`
      );
    },
    currentLanguage: 'en',
    changeLanguage: jest.fn()
  })
}));

describe('AddressLookupForm', () => {
const originalPrompt = window.prompt;
const originalRequestSubmit = HTMLFormElement.prototype.requestSubmit;
const requestSubmitMock = jest.fn();

beforeAll(() => {
  Object.defineProperty(HTMLFormElement.prototype, 'requestSubmit', {
    configurable: true,
    value: requestSubmitMock
  });
});

afterAll(() => {
  Object.defineProperty(HTMLFormElement.prototype, 'requestSubmit', {
    configurable: true,
    value: originalRequestSubmit
  });
});

  beforeEach(() => {
    jest.useFakeTimers();
    window.prompt = jest.fn();
    requestSubmitMock.mockClear();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    window.prompt = originalPrompt;
  });

  it('submits form when different address prompt returns value', () => {
    (window.prompt as jest.Mock).mockReturnValue('123 Main St');

    render(<AddressLookupForm />);

    fireEvent.click(screen.getByTestId('address-lookup-different-address'));
    jest.runOnlyPendingTimers();

    expect(window.prompt).toHaveBeenCalled();
    expect(requestSubmitMock).toHaveBeenCalled();
  });

  it('does not submit when prompt is cancelled', () => {
    (window.prompt as jest.Mock).mockReturnValue(null);

    render(<AddressLookupForm />);

    fireEvent.click(screen.getByTestId('address-lookup-different-address'));
    jest.runOnlyPendingTimers();

    expect(requestSubmitMock).not.toHaveBeenCalled();
  });
});

