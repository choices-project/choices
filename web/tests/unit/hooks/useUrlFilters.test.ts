/**
 * @jest-environment jsdom
 */

import { act, renderHook } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';

import { useUrlFilters } from '@/hooks/useUrlFilters';

const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: () => '/polls',
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: jest.fn(),
}));

const mockedUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;

function searchParamsFrom(query: string) {
  return new URLSearchParams(query);
}

describe('useUrlFilters', () => {
  const defaults = {
    status: undefined as string | undefined,
    category: undefined as string | undefined,
    q: undefined as string | undefined,
  };

  beforeEach(() => {
    mockReplace.mockReset();
    mockedUseSearchParams.mockReturnValue(searchParamsFrom('') as ReturnType<typeof useSearchParams>);
  });

  it('does not replace when the query is already empty', () => {
    const { result } = renderHook(() => useUrlFilters(defaults));

    act(() => {
      result.current.setFilters({
        status: undefined,
        category: undefined,
        q: undefined,
      });
    });

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('replaces once when a filter is added', () => {
    const { result } = renderHook(() => useUrlFilters(defaults));

    act(() => {
      result.current.setFilters({ status: 'active' });
    });

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/polls?status=active', { scroll: false });
  });
});
