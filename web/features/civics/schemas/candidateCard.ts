import { z } from "zod";

export const CandidateCardV1 = z.object({
  personId: z.string(),              // UUID or external ID
  cycle: z.number().int(),
  name: z.string(),
  party: z.string().optional(),
  districtLabel: z.string(),         // e.g., "PA-12", "US Senate (PA)"
  headline: z.object({
    summary: z.string().optional(),
    incumbency: z.enum(["incumbent","challenger","open"]).optional(),
  }),
  finance: z.object({
    totals: z.object({
      receipts: z.number().nullable(),
      disbursements: z.number().nullable(),
      cashOnHand: z.number().nullable(),
      lastUpdated: z.string().nullable(),
    }).optional(),
    topDonors: z.array(z.object({
      name: z.string(),
      amount: z.number(),
    })).optional(),
  }),
  recentVotes: z.array(z.object({
    roll: z.string().optional(),
    date: z.string().optional(),
    title: z.string().optional(),
    position: z.enum(["Yea","Nay","Present","Not Voting"]).optional(),
    result: z.string().optional()
  })).max(10),
  committees: z.array(z.object({
    name: z.string(),
    role: z.string().optional()
  })).optional(),
  updatedAt: z.string(),
});

export type CandidateCardV1 = z.infer<typeof CandidateCardV1>;
