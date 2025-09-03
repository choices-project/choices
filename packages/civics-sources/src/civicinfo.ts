import { z } from "zod";

// Schema for civic info response
export const CivicInfoResponse = z.object({
  normalizedAddress: z.string(),
  divisions: z.array(z.object({
    id: z.string(),
    label: z.string()
  })),
  posts: z.array(z.object({
    id: z.string(),
    label: z.string()
  })),
  officials: z.array(z.object({
    name: z.string(),
    party: z.string().optional(),
    title: z.string()
  }))
});

export type CivicInfoResponse = z.infer<typeof CivicInfoResponse>;

/**
 * Lookup address to find electoral districts and representatives
 * MOCK DATA - replace with real Google Civic Info API call
 */
export async function lookupAddress(addr: string): Promise<CivicInfoResponse> {
  // MOCK DATA - replace with real API call
  const normalizedAddress = addr.trim();
  
  // Return PA districts for any PA address
  if (normalizedAddress.toLowerCase().includes('pennsylvania') || 
      normalizedAddress.toLowerCase().includes('pa') ||
      normalizedAddress.toLowerCase().includes('philadelphia') ||
      normalizedAddress.toLowerCase().includes('pittsburgh')) {
    
    return {
      normalizedAddress,
      divisions: [
        { id: "ocd-division/country:us/state:pa", label: "Pennsylvania" }
      ],
      posts: [
        { id: "us-senate-pa", label: "US Senate (PA)" },
        { id: "us-house-pa-03", label: "US House PA-03" },
        { id: "us-house-pa-05", label: "US House PA-05" },
        { id: "us-house-pa-07", label: "US House PA-07" },
        { id: "us-house-pa-12", label: "US House PA-12" }
      ],
      officials: [
        { name: "Alex Johnson", party: "Democratic", title: "US Senator" },
        { name: "Jordan Davis", party: "Democratic", title: "US Representative PA-03" },
        { name: "Taylor Brown", party: "Democratic", title: "US Representative PA-05" },
        { name: "Riley Garcia", party: "Democratic", title: "US Representative PA-07" },
        { name: "Dana Incumbent", party: "Democratic", title: "US Representative PA-12" }
      ]
    };
  }
  
  // Default response for non-PA addresses
  return {
    normalizedAddress,
    divisions: [
      { id: "ocd-division/country:us", label: "United States" }
    ],
    posts: [],
    officials: []
  };
}

/**
 * Validate civic info response
 */
export function validateCivicInfoResponse(data: unknown): CivicInfoResponse {
  return CivicInfoResponse.parse(data);
}
