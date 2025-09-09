import { NextRequest, NextResponse } from "next/server";
import { CandidateCardV1Schema } from "../../../../lib/civics/schemas";
import { createCache } from "../../../../lib/civics/client";
import { getRecentVotesForMember } from "../../../../lib/civics/ingest";

const cache = createCache();

function shapeStub(personId: string) {
  const now = new Date().toISOString();
  const name = personId.includes("inc") ? "Dana Incumbent" : "Riley Challenger";
  const districtLabel = personId.includes("sen") ? "US Senate (PA)" : "PA-12";
  return {
    personId, cycle: 2024,
    name, party: "Independent", districtLabel,
    headline: { summary: "Running on transparency and local priorities", incumbency: personId.includes("inc") ? "incumbent" : "challenger" },
    finance: { totals: { receipts: null, disbursements: null, cashOnHand: null, lastUpdated: null }, topDonors: [] },
    recentVotes: [], committees: [], updatedAt: now
  };
}

export async function GET(_: NextRequest, { params }: { params: { personId: string } }) {
  const key = `cc:v1:${params.personId}`;
  const cached = cache.get(key);
  if (cached) {
    // Validate cached data before returning
    const validation = CandidateCardV1Schema.safeParse(cached);
    if (validation.success) {
      return NextResponse.json(validation.data);
    }
    // If cached data is invalid, fall through to regenerate
  }

  const base = shapeStub(params.personId);
  // attach stub votes
  const votes = await getRecentVotesForMember(params.personId);
  const payload = { ...base, recentVotes: votes };

  // Validate the payload before caching and returning
  const validation = CandidateCardV1Schema.safeParse(payload);
  if (!validation.success) {
    return NextResponse.json({ 
      error: "Invalid candidate data", 
      issues: validation.error.issues 
    }, { status: 500 });
  }

  cache.set(key, validation.data, 600000); // 10 minutes in milliseconds
  return NextResponse.json(validation.data);
}
