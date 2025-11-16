/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import FilingAssistant from '@/components/candidate/FilingAssistant';

jest.mock('@/lib/utils/logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
  }
}));

describe('FilingAssistant', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  it('renders requirement details from enveloped responses', async () => {
    const requirement = {
      found: true,
      requirement: {
        eligibility: {
          age: 30,
          citizenship: ['US'],
          residency: ['State']
        },
        filingFees: {
          amount: 500,
          currency: 'USD',
          acceptedMethods: ['card']
        },
        requiredForms: ['Form A']
      }
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: requirement
      })
    }) as unknown as typeof global.fetch;

    render(<FilingAssistant level="federal" office="Senator" />);

    await waitFor(() => {
      expect(screen.getByText(/Eligibility Requirements/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Form A/i)).toBeInTheDocument();
  });
});

