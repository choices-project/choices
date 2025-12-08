/** @jest-environment jsdom */

import { act, render, screen } from '@testing-library/react';
import React from 'react';

import { usePollsStore } from '@/lib/stores/pollsStore';

const PollsDisplay = () => {
  const polls = usePollsStore((state) => state.polls);
  const isLoading = usePollsStore((state) => state.isLoading);
  return (
    <div data-testid="polls-display">
      <span data-testid="poll-count">{polls.length}</span>
      <span data-testid="loading">{isLoading ? 'loading' : 'idle'}</span>
      {polls.map((poll) => (
        <div key={poll.id} data-testid={`poll-${poll.id}`}>
          {poll.title}
        </div>
      ))}
    </div>
  );
};

const PollsControls = () => {
  const setFilters = usePollsStore((state) => state.setFilters);
  const clearFilters = usePollsStore((state) => state.clearFilters);
  const setSearchQuery = usePollsStore((state) => state.setSearchQuery);
  return (
    <div>
      <button
        data-testid="set-status-filter"
        onClick={() => setFilters({ status: ['closed'] })}
      >
        Filter Closed
      </button>
      <button data-testid="clear-filters" onClick={() => clearFilters()}>
        Clear Filters
      </button>
      <input
        data-testid="search-input"
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search polls"
      />
    </div>
  );
};

const SearchDisplay = () => {
  const searchQuery = usePollsStore((state) => state.search.query);
  return <div data-testid="search-query">{searchQuery || 'no-query'}</div>;
};

describe('pollsStore integration', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      const state = usePollsStore.getState();
      state.resetPollsState();
      state.setLoading(false);
      state.setError(null);
    });
  });

  afterEach(() => {
    act(() => {
      usePollsStore.getState().resetPollsState();
    });
  });

  describe('poll management', () => {
    it('should display polls count', () => {
      render(<PollsDisplay />);

      expect(screen.getByTestId('poll-count')).toHaveTextContent('0');
    });

    it('should update polls when setPolls is called', () => {
      render(<PollsDisplay />);

      const mockPolls = [
        {
          id: '1',
          title: 'Test Poll 1',
          status: 'published',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Test Poll 2',
          status: 'published',
          created_at: new Date().toISOString(),
        },
      ] as any[];

      act(() => {
        usePollsStore.getState().setPolls(mockPolls);
      });

      expect(screen.getByTestId('poll-count')).toHaveTextContent('2');
      expect(screen.getByTestId('poll-1')).toHaveTextContent('Test Poll 1');
      expect(screen.getByTestId('poll-2')).toHaveTextContent('Test Poll 2');
    });
  });

  describe('filtering', () => {
    it('should update filters when setFilters is called', () => {
      render(
        <>
          <PollsControls />
        </>
      );

      act(() => {
        usePollsStore.getState().setFilters({ status: ['closed'] });
      });

      const filters = usePollsStore.getState().filters;
      expect(filters.status).toContain('closed');
    });

    it('should clear filters when clearFilters is called', () => {
      render(
        <>
          <PollsControls />
        </>
      );

      act(() => {
        usePollsStore.getState().setFilters({ status: ['closed', 'archived'] });
      });

      act(() => {
        usePollsStore.getState().clearFilters();
      });

      const filters = usePollsStore.getState().filters;
      // clearFilters resets to defaults, which includes ['active']
      expect(filters.status).toEqual(['active']);
    });
  });

  describe('search', () => {
    it('should update search query', () => {
      render(
        <>
          <SearchDisplay />
          <PollsControls />
        </>
      );

      expect(screen.getByTestId('search-query')).toHaveTextContent('no-query');

      act(() => {
        usePollsStore.getState().setSearchQuery('test query');
      });

      expect(screen.getByTestId('search-query')).toHaveTextContent('test query');
    });
  });

  describe('loading and error states', () => {
    it('should update loading state', () => {
      render(<PollsDisplay />);

      expect(screen.getByTestId('loading')).toHaveTextContent('idle');

      act(() => {
        usePollsStore.getState().setLoading(true);
      });

      expect(screen.getByTestId('loading')).toHaveTextContent('loading');

      act(() => {
        usePollsStore.getState().setLoading(false);
      });

      expect(screen.getByTestId('loading')).toHaveTextContent('idle');
    });

    it('should update error state', () => {
      const ErrorDisplay = () => {
        const error = usePollsStore((state) => state.error);
        return <div data-testid="error">{error || 'no-error'}</div>;
      };

      render(<ErrorDisplay />);

      expect(screen.getByTestId('error')).toHaveTextContent('no-error');

      act(() => {
        usePollsStore.getState().setError('Test error');
      });

      expect(screen.getByTestId('error')).toHaveTextContent('Test error');

      act(() => {
        usePollsStore.getState().clearError();
      });

      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });
  });
});

