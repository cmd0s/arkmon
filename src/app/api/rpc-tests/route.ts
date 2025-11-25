import { NextRequest, NextResponse } from "next/server";
import { getRpcTestHistory, getRpcTestAverages } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const testnet = searchParams.get("testnet") || "rosario";
  const hours = parseInt(searchParams.get("hours") || "24", 10);

  try {
    const tests = getRpcTestHistory(testnet, hours);
    const averages = getRpcTestAverages(testnet, hours);

    // Group tests by operation for charting
    const grouped: Record<string, typeof tests> = {};
    for (const test of tests) {
      if (!grouped[test.operation]) {
        grouped[test.operation] = [];
      }
      grouped[test.operation].push(test);
    }

    return NextResponse.json({
      testnet,
      hours,
      tests: grouped,
      averages: averages.map((avg) => ({
        operation: avg.operation,
        avgDurationMs: Math.round(avg.avgDuration || 0),
        successRate: parseFloat((avg.successRate || 0).toFixed(2)),
        count: avg.count,
      })),
      count: tests.length,
    });
  } catch (error) {
    console.error("Error fetching RPC tests:", error);
    return NextResponse.json(
      { error: "Failed to fetch RPC tests" },
      { status: 500 }
    );
  }
}
