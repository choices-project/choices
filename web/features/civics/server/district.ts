import { lookupAddress } from "../../../lib/civics/ingest";

export async function getDistrict(addr: string) {
  if (!addr?.trim()) {
    throw new Error("Missing addr");
  }
  
  const data = await lookupAddress(addr.trim());
  return data;
}



