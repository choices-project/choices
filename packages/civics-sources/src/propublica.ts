import { z } from "zod";

// Schema for vote data
export const VoteRecord = z.object({
  roll: z.string().optional(),
  date: z.string().optional(),
  title: z.string().optional(),
  position: z.enum(["Yea", "Nay", "Present", "Not Voting"]).optional(),
  result: z.string().optional()
});

export type VoteRecord = z.infer<typeof VoteRecord>;

/**
 * Get recent votes for a specific member
 * MOCK DATA - replace with real ProPublica Congress API call
 */
export async function getRecentVotesForMember(memberId: string): Promise<VoteRecord[]> {
  // MOCK DATA - replace with real API call
  const mockVotes: VoteRecord[] = [
    {
      roll: "H.R. 1234",
      date: "2024-12-01",
      title: "Appropriations Act of 2024",
      position: "Yea",
      result: "Passed"
    },
    {
      roll: "H.R. 5678",
      date: "2024-12-05",
      title: "Defense Authorization Act",
      position: "Nay",
      result: "Passed"
    },
    {
      roll: "H.R. 9012",
      date: "2024-12-12",
      title: "Healthcare Transparency Bill",
      position: "Yea",
      result: "Failed"
    },
    {
      roll: "S. 3456",
      date: "2024-12-15",
      title: "Infrastructure Investment Act",
      position: "Yea",
      result: "Passed"
    },
    {
      roll: "H.R. 7890",
      date: "2024-12-20",
      title: "Education Funding Bill",
      position: "Nay",
      result: "Failed"
    }
  ];

  // Return different votes based on member ID for variety
  const seed = memberId.charCodeAt(0) % 3;
  return mockVotes.slice(seed, seed + 3);
}

/**
 * Get bill information
 * MOCK DATA - replace with real ProPublica Congress API call
 */
export async function getBillInfo(billId: string): Promise<{
  title: string;
  summary: string;
  sponsor: string;
  status: string;
}> {
  // MOCK DATA - replace with real API call
  return {
    title: "Sample Bill Title",
    summary: "This is a sample bill summary for demonstration purposes.",
    sponsor: "Sample Sponsor",
    status: "Introduced"
  };
}

/**
 * Validate vote record
 */
export function validateVoteRecord(data: unknown): VoteRecord {
  return VoteRecord.parse(data);
}
