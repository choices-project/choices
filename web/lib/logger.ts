/**
 * Logger Module
 * 
 * Flexible logger that accepts 1..n arguments and normalizes them for compatibility.
 * This fixes all TS2554 (argument count mismatch) errors without changing call sites.
 */

import { withOptional } from '@/lib/util/objects';

type Meta = Record<string, unknown> | undefined;

function coerce(messageOrErr: unknown, maybeMeta?: unknown) {
  if (messageOrErr instanceof Error) {
    return { msg: messageOrErr.message, meta: { err: messageOrErr, ...(maybeMeta as Meta) } };
  }
  if (typeof messageOrErr === 'string') return { msg: messageOrErr, meta: (maybeMeta as Meta) ?? undefined };
  return { msg: String(messageOrErr), meta: (maybeMeta as Meta) ?? undefined };
}

function logWith(level: 'debug'|'info'|'warn'|'error', ...args: unknown[]) {
  // Accept 1..n args and fold extras into meta for compatibility
  const [first, second, ...rest] = args;
  const base = coerce(first, second);
  const meta = withOptional({}, { ...(base.meta || {}), ...(rest.length ? { extra: rest } : {}) });

  // Replace with your structured logger if you have one
  // eslint-disable-next-line no-console
  console[level](withOptional({ level, msg: base.msg }, { ...('err' in (meta || {}) ? {} : {}), meta }));
}

export const logger = {
  debug: (...a: unknown[]) => logWith('debug', ...a),
  info:  (...a: unknown[]) => logWith('info',  ...a),
  warn:  (...a: unknown[]) => logWith('warn',  ...a),
  error: (...a: unknown[]) => logWith('error', ...a),
  performance: (...a: unknown[]) => logWith('info', ...a), // Performance logs use info level
};

// Back-compat helpers seen across the codebase:
export const devLog = (...a: unknown[]) => logger.debug(...a);
export const logInfo = (...a: unknown[]) => logger.info(...a);
export const logWarn = (...a: unknown[]) => logger.warn(...a);
export const logError = (...a: unknown[]) => logger.error(...a);

// Legacy exports for compatibility
export { devLog as default };