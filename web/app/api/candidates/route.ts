import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { getCandidates } from "@/features/civics/server/candidates";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const districtId = url.searchParams.get("district_id");
    
    const data = await getCandidates(districtId || "");
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" }, 
      { status: 400 }
    );
  }
}






