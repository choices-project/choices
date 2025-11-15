/* eslint-disable @typescript-eslint/no-explicit-any */

export type PostgrestResult<T = any> = {
  data: T;
  error: null;
  count?: number | null;
};

export const createPostgrestBuilder = <T = any>(response: PostgrestResult<T>) => {
  const promise = Promise.resolve(response) as any;
  const builder: any = promise;

  const chain = () => builder;

  builder.select = jest.fn(chain);
  builder.eq = jest.fn(chain);
  builder.neq = jest.fn(chain);
  builder.in = jest.fn(chain);
  builder.or = jest.fn(chain);
  builder.overlaps = jest.fn(chain);
  builder.order = jest.fn(chain);
  builder.limit = jest.fn(chain);
  builder.gte = jest.fn(chain);
  builder.lte = jest.fn(chain);
  builder.insert = jest.fn(chain);
  builder.update = jest.fn(chain);
  builder.delete = jest.fn(chain);

  builder.range = jest.fn(() => Promise.resolve(response));
  builder.single = jest.fn(() => Promise.resolve(response));
  builder.maybeSingle = jest.fn(() => Promise.resolve(response));

  return builder;
};

