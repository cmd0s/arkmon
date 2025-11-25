import { NextRequest, NextResponse } from "next/server";
import { getLatestServiceStatus, getUptimePercentage, getAverageLatency } from "@/lib/db/queries";
import { SERVICES, getDefaultTestnetId } from "@/config/testnets";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const testnet = searchParams.get("testnet") || getDefaultTestnetId();

  try {
    const latestMetrics = getLatestServiceStatus(testnet);

    // Group by service and get latest for each
    const serviceStatus = SERVICES.map((service) => {
      const latest = latestMetrics.find((m) => m.service === service.id);
      const uptime24h = getUptimePercentage(testnet, service.id, 24);
      const avgLatency = getAverageLatency(testnet, service.id, 24);

      return {
        id: service.id,
        name: service.name,
        description: service.description,
        status: latest?.status || "unknown",
        latencyMs: latest?.latencyMs || null,
        errorMessage: latest?.errorMessage || null,
        lastCheck: latest?.timestamp || null,
        uptime24h: uptime24h ? parseFloat(uptime24h) : null,
        avgLatency24h: avgLatency,
      };
    });

    // Get actual last check timestamp from database
    const lastCheckTimestamp = latestMetrics.length > 0
      ? Math.max(...latestMetrics.map(m => new Date(m.timestamp).getTime()))
      : null;

    return NextResponse.json({
      testnet,
      services: serviceStatus,
      lastUpdate: lastCheckTimestamp ? new Date(lastCheckTimestamp).toISOString() : null,
    });
  } catch (error) {
    console.error("Error fetching service status:", error);
    return NextResponse.json(
      { error: "Failed to fetch service status" },
      { status: 500 }
    );
  }
}
