export function invariant(cond: unknown, msg?: string): asserts cond {
  if (!cond) throw new Error(msg ?? 'Invariant failed');
}

export function assertPresent<T>(v: T, name = 'value'): asserts v is NonNullable<T> {
  if (v === null || v === undefined) throw new Error(`${name} is required`);
}

export function setNow<T>(setter: React.Dispatch<React.SetStateAction<T | null>>, value: T) {
  setter(() => value);
}