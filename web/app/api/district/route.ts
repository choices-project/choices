import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { getDistrict } from "@/features/civics/server/district";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const addr = url.searchParams.get("addr");
    
    const data = await getDistrict(addr || "");
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" }, 
      { status: 400 }
    );
  }
}





