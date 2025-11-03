export function mapLegacyToUnified<T extends Record<string, unknown>>(
  obj: T,
  mapping: Record<string, string>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) out[mapping[k] ?? k] = v;
  return out;
}