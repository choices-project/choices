export function mapLegacyToUnified<T extends Record<string, any>>(
  obj: T,
  mapping: Record<string, string>
) {
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) out[mapping[k] ?? k] = v;
  return out;
}