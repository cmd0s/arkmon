import { NextRequest, NextResponse } from "next/server";
import { getMetricsHistory } from "@/lib/db/queries";
import { getDefaultTestnetId } from "@/config/testnets";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const testnet = searchParams.get("testnet") || getDefaultTestnetId();
  const service = searchParams.get("service");
  const hours = parseInt(searchParams.get("hours") || "24", 10);

  try {
    const metrics = getMetricsHistory(testnet, service, hours);

    // Group metrics by service for easier charting
    const grouped: Record<string, typeof metrics> = {};
    for (const metric of metrics) {
      if (!grouped[metric.service]) {
        grouped[metric.service] = [];
      }
      grouped[metric.service].push(metric);
    }

    return NextResponse.json({
      testnet,
      hours,
      service: service || "all",
      metrics: grouped,
      count: metrics.length,
    });
  } catch (error) {
    console.error("Error fetching metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}
