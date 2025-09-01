import { NextRequest, NextResponse } from "next/server";
import { lookupAddress } from "../../../apps/ingest/connectors/civicinfo"; // adjust import if paths differ

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const addr = url.searchParams.get("addr")?.trim();
  if (!addr) return NextResponse.json({ error: "Missing addr" }, { status: 400 });

  const data = await lookupAddress(addr);
  return NextResponse.json(data);
}
