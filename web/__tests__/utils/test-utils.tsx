import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AuthProvider } from '@/contexts/AuthContext';

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock data factories
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  username: 'testuser',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

export const createMockPoll = (overrides = {}) => ({
  id: 'test-poll-id',
  title: 'Test Poll',
  description: 'A test poll for testing',
  voting_method: 'single_choice',
  options: [
    { id: 'option-1', text: 'Option 1' },
    { id: 'option-2', text: 'Option 2' }
  ],
  created_by: 'test-user-id',
  created_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + 86400000).toISOString(),
  is_public: true,
  ...overrides
});

export const createMockVote = (overrides = {}) => ({
  id: 'test-vote-id',
  poll_id: 'test-poll-id',
  user_id: 'test-user-id',
  vote_data: { selected_options: ['option-1'] },
  created_at: new Date().toISOString(),
  ...overrides
});

// Test helpers
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0));
};

export const mockApiResponse = (data: any, status = 200) => {
  return Promise.resolve({
    json: () => Promise.resolve(data),
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error'
  });
};

export const mockApiError = (message: string, status = 400) => {
  return Promise.reject(new Error(message));
};

// Re-export everything from testing library
export * from '@testing-library/react';
export { customRender as render };






