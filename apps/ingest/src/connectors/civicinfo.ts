export async function lookupAddress(addr: string) {
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
