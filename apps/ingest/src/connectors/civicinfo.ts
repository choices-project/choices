export interface AddressLookupResult {
  normalizedAddress: string;
  divisions: Array<{
    id: string;
    label: string;
  }>;
  posts: Array<{
    id: string;
    label: string;
  }>;
  officials: Array<any>; // fill later if needed
}

export async function lookupAddress(addr: string): Promise<AddressLookupResult> {
  // STUB: return PA federal districts only for now
  return {
    normalizedAddress: addr,
    divisions: [
      { id: "ocd-division/country:us/state:pa", label: "Pennsylvania" }
    ],
    posts: [
      { id: "us-senate-pa", label: "US Senate (PA)" },
      { id: "us-house-pa-12", label: "US House PA-12" }
    ],
    officials: [] // fill later if needed
  };
}
