import { z } from "zod";

// Schema for campaign finance data
export const FinanceData = z.object({
  receipts: z.number().nullable(),
  disbursements: z.number().nullable(),
  cashOnHand: z.number().nullable(),
  lastUpdated: z.string().nullable(),
  topDonors: z.array(z.object({
    name: z.string(),
    amount: z.number()
  })).optional()
});

export type FinanceData = z.infer<typeof FinanceData>;

/**
 * Get campaign finance data for a candidate
 * MOCK DATA - replace with real FEC API call
 */
export async function getFinanceData(candidateId: string): Promise<FinanceData> {
  // MOCK DATA - replace with real API call
  const mockData: FinanceData = {
    receipts: 2500000,
    disbursements: 1800000,
    cashOnHand: 700000,
    lastUpdated: "2024-12-31",
    topDonors: [
      { name: "Individual Donor 1", amount: 2800 },
      { name: "Individual Donor 2", amount: 2500 },
      { name: "Individual Donor 3", amount: 2200 },
      { name: "Individual Donor 4", amount: 2000 },
      { name: "Individual Donor 5", amount: 1800 }
    ]
  };

  // Return different data based on candidate ID for variety
  const seed = candidateId.charCodeAt(0) % 3;
  if (seed === 1) {
    mockData.receipts = 1800000;
    mockData.disbursements = 1500000;
    mockData.cashOnHand = 300000;
  } else if (seed === 2) {
    mockData.receipts = 3200000;
    mockData.disbursements = 2100000;
    mockData.cashOnHand = 1100000;
  }

  return mockData;
}

/**
 * Get committee information for a candidate
 * MOCK DATA - replace with real FEC API call
 */
export async function getCommittees(candidateId: string): Promise<Array<{
  name: string;
  role: string;
}>> {
  // MOCK DATA - replace with real API call
  return [
    { name: "Friends of Sample Candidate", role: "Principal Campaign Committee" },
    { name: "Sample PAC", role: "Supporting Committee" }
  ];
}

/**
 * Validate finance data
 */
export function validateFinanceData(data: unknown): FinanceData {
  return FinanceData.parse(data);
}
