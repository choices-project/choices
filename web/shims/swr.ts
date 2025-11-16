/* Minimal SWR shim for type-checking and simple usage in non-critical pages. */
import { useEffect, useState } from 'react';

type Fetcher<T> = (key: string) => Promise<T>;

type SWRResponse<T> = {
  data: T | undefined;
  error: unknown;
  mutate: () => Promise<void>;
};

export default function useSWR<T = unknown>(key: string | null, fetcher?: Fetcher<T>): SWRResponse<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<unknown>(undefined);

  const mutate = async () => {
    if (!key || !fetcher) return;
    try {
      const result = await fetcher(key);
      setData(result);
    } catch (err) {
      setError(err);
    }
  };

  useEffect(() => {
    void mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data, error, mutate };
}


