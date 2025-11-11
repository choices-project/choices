import type { BaseStore } from './types';

type ImmerSet<T> = (recipe: (draft: T) => void) => void;

export const createBaseStoreActions = <T extends { isLoading: boolean; error: string | null }>(
  set: ImmerSet<T>,
): Pick<BaseStore, 'setLoading' | 'setError' | 'clearError'> => ({
  setLoading: (loading) =>
    set((state) => {
      state.isLoading = loading;
    }),
  setError: (error) =>
    set((state) => {
      state.error = error;
    }),
  clearError: () =>
    set((state) => {
      state.error = null;
    }),
});


