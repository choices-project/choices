import { NextRequest, NextResponse } from "next/server";
import { CandidateCardV1 } from "../../../../packages/civics-schemas/src/candidateCard";
import { createCache } from "../../../../packages/civics-client/src/cache";
import { getRecentVotesForMember } from "../../../../apps/ingest/connectors/propublica";

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
  if (cached) return NextResponse.json(JSON.parse(cached));

  const base = shapeStub(params.personId);
  // attach stub votes
  const votes = await getRecentVotesForMember(params.personId);
  const payload = { ...base, recentVotes: votes };

  const parsed = CandidateCardV1.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Invalid card", issues: parsed.error.issues }, { status: 500 });

  await cache.set(key, JSON.stringify(payload), 600);
  return NextResponse.json(payload);
}
