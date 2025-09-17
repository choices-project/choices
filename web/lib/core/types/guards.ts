/**
 * Type guards for safe handling of unknown types
 * Used primarily in cryptographic and data validation contexts
 */

export function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

export function isScalar(x: unknown): x is string | number | bigint | boolean {
  const t = typeof x;
  return t === 'string' || t === 'number' || t === 'bigint' || t === 'boolean';
}

export function isString(x: unknown): x is string { 
  return typeof x === 'string'; 
}

export function isNumber(x: unknown): x is number { 
  return typeof x === 'number' && !Number.isNaN(x); 
}

export function isBoolean(x: unknown): x is boolean { 
  return typeof x === 'boolean'; 
}

export function isBigInt(x: unknown): x is bigint { 
  return typeof x === 'bigint'; 
}

export function isArray<T = unknown>(x: unknown): x is T[] { 
  return Array.isArray(x); 
}

export function isDateString(x: unknown): x is string {
  return isString(x) && !Number.isNaN(Date.parse(x));
}

export function isUint8Array(x: unknown): x is Uint8Array {
  return x instanceof Uint8Array;
}

export function isArrayBuffer(x: unknown): x is ArrayBuffer {
  return x instanceof ArrayBuffer;
}

// Cryptographic-specific guards
export function isHashProof(x: unknown): x is { kind: 'hash'; input: Uint8Array; hash: Uint8Array } {
  return (
    isRecord(x) &&
    x.kind === 'hash' &&
    isUint8Array(x.input) &&
    isUint8Array(x.hash)
  );
}

export function isRangeProof(x: unknown): x is { kind: 'range'; value: bigint; min: bigint; max: bigint } {
  return (
    isRecord(x) &&
    x.kind === 'range' &&
    isBigInt(x.value) &&
    isBigInt(x.min) &&
    isBigInt(x.max)
  );
}

export function isCommitmentProof(x: unknown): x is { kind: 'commit'; C: Uint8Array; r: Uint8Array } {
  return (
    isRecord(x) &&
    x.kind === 'commit' &&
    isUint8Array(x.C) &&
    isUint8Array(x.r)
  );
}

export type Proof = 
  | { kind: 'hash'; input: Uint8Array; hash: Uint8Array }
  | { kind: 'range'; value: bigint; min: bigint; max: bigint }
  | { kind: 'commit'; C: Uint8Array; r: Uint8Array };

export function isProof(x: unknown): x is Proof {
  return isHashProof(x) || isRangeProof(x) || isCommitmentProof(x);
}

// Error handling utilities
export class TypeGuardError extends Error {
  constructor(message: string, public readonly value: unknown) {
    super(message);
    this.name = 'TypeGuardError';
  }
}

export function assertIsString(x: unknown, context = 'value'): asserts x is string {
  if (!isString(x)) {
    throw new TypeGuardError(`${context} must be a string, got ${typeof x}`, x);
  }
}

export function assertIsNumber(x: unknown, context = 'value'): asserts x is number {
  if (!isNumber(x)) {
    throw new TypeGuardError(`${context} must be a number, got ${typeof x}`, x);
  }
}

export function assertIsBigInt(x: unknown, context = 'value'): asserts x is bigint {
  if (!isBigInt(x)) {
    throw new TypeGuardError(`${context} must be a bigint, got ${typeof x}`, x);
  }
}

export function assertIsArray<T>(x: unknown, context = 'value'): asserts x is T[] {
  if (!isArray<T>(x)) {
    throw new TypeGuardError(`${context} must be an array, got ${typeof x}`, x);
  }
}

export function assertIsRecord(x: unknown, context = 'value'): asserts x is Record<string, unknown> {
  if (!isRecord(x)) {
    throw new TypeGuardError(`${context} must be a record, got ${typeof x}`, x);
  }
}

// ---------- Converters ----------
export function toBigInt(x: unknown, field = 'value'): bigint {
  if (isBigInt(x)) return x;
  if (isNumber(x)) return BigInt(Math.trunc(x));
  if (isString(x)) {
    const s = x.trim();
    if (/^0x[0-9a-fA-F]+$/.test(s)) return BigInt(s);
    if (/^[+-]?\d+$/.test(s)) return BigInt(s);
  }
  throw new TypeGuardError(`Expected bigint-compatible value for ${field}`, x);
}

export function toDate(x: unknown, field = 'value'): Date {
  if (x instanceof Date && !isNaN(x.valueOf())) return x;
  if (isNumber(x) || isString(x)) {
    const d = new Date(x);
    if (!isNaN(d.valueOf())) return d;
  }
  throw new TypeGuardError(`Expected Date-compatible value for ${field}`, x);
}

export function toU8(x: unknown, field = 'value'): Uint8Array {
  if (x instanceof Uint8Array) return x;
  if (isArray<number>(x)) {
    const ok = x.every((n) => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 255);
    if (ok) return new Uint8Array(x);
  }
  if (isString(x)) {
    // try hex
    if (/^0x[0-9a-fA-F]*$/.test(x)) return parseHexU8(x);
    // try base64
    try {
      const binStr = atob(x);
      const arr = new Uint8Array(binStr.length);
      for (let i = 0; i < binStr.length; i++) arr[i] = binStr.charCodeAt(i);
      return arr;
    } catch {/* fallthrough */}
  }
  throw new TypeGuardError(`Expected Uint8Array-compatible value for ${field}`, x);
}

export function parseHexU8(hex: string): Uint8Array {
  let s = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (s.length % 2) s = '0' + s;
  if (!/^[0-9a-fA-F]*$/.test(s)) throw new TypeGuardError('Invalid hex string', hex);
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < s.length; i += 2) out[i/2] = parseInt(s.slice(i, i+2), 16);
  return out;
}

// Exhaustiveness helper
export function assertNever(x: never): never {
  throw new Error(`Unreachable variant: ${JSON.stringify(x)}`);
}
