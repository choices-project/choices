export interface AddressLookupResult {
  district: string;
  state: string;
  representatives: Array<any>;
}

export async function lookupAddress(addr: string): Promise<AddressLookupResult> {
  // STUB: return PA federal districts only for now
  return {
    district: "PA-12",
    state: "PA",
    representatives: [] // fill later if needed
  };
}
