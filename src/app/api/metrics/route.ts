import { NextRequest, NextResponse } from "next/server";
import { getMetricsHistory, getRpcTestHistory } from "@/lib/db/queries";
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

    // For RPC service, also include failed RPC tests as "down" status
    if (!service || service === "rpc") {
      const rpcTestHistory = getRpcTestHistory(testnet, hours);
      const failedRpcTests = rpcTestHistory.filter((t) => !t.success);

      if (!grouped["rpc"]) {
        grouped["rpc"] = [];
      }

      for (const test of failedRpcTests) {
        grouped["rpc"].push({
          id: -test.id, // Negative ID to distinguish from real metrics
          timestamp: test.timestamp,
          testnet: test.testnet,
          service: "rpc",
          status: "down",
          latencyMs: null,
          errorMessage: test.errorMessage,
        });
      }

      // Sort by timestamp descending after adding RPC test failures
      grouped["rpc"].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
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
