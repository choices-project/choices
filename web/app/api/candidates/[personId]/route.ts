import { NextRequest, NextResponse } from "next/server";
import { CandidateCardV1 } from "@choices/civics-schemas";
import { createCache } from "@choices/civics-client";
import { getRecentVotesForMember } from "@choices/ingest";

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
  const cached = await cache.get(key);
  if (cached && typeof cached === 'string') return NextResponse.json(JSON.parse(cached));

  const base = shapeStub(params.personId);
  // attach stub votes
  const votes = await getRecentVotesForMember(params.personId);
  const payload: CandidateCardV1 = { ...base, recentVotes: votes };

  await cache.set(key, JSON.stringify(payload), 600);
  return NextResponse.json(payload);
}
