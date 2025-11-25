import { NextResponse } from "next/server";
import { TESTNETS, SERVICES, getEnabledTestnets, getDefaultTestnetId } from "@/config/testnets";

export async function GET() {
  const enabledTestnets = getEnabledTestnets();

  return NextResponse.json({
    testnets: Object.values(TESTNETS),
    enabled: enabledTestnets.map((t) => t.id),
    default: getDefaultTestnetId(),
    services: SERVICES,
  });
}
