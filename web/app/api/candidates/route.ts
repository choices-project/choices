import { NextRequest, NextResponse } from "next/server";

// STUB mapping: a single PA district returns two candidates
const MOCK = {
  "us-senate-pa": [
    { personId: "person-sen-inc", name: "Pat Example", party: "Independent", districtLabel: "US Senate (PA)" },
    { personId: "person-sen-chal", name: "Alex Challenger", party: "Independent", districtLabel: "US Senate (PA)" }
  ],
  "us-house-pa-12": [
    { personId: "person-pa12-inc", name: "Dana Incumbent", party: "Independent", districtLabel: "PA-12" },
    { personId: "person-pa12-chal", name: "Riley Challenger", party: "Independent", districtLabel: "PA-12" }
  ]
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const districtId = url.searchParams.get("district_id");
  if (!districtId) return NextResponse.json({ error: "Missing district_id" }, { status: 400 });

  const list = MOCK[districtId as keyof typeof MOCK] ?? [];
  return NextResponse.json({ candidates: list });
}
