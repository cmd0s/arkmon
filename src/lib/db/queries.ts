import { db } from "./client";
import { metrics, rpcTests, type NewMetric, type NewRpcTest } from "./schema";
import { desc, eq, and, gte, sql } from "drizzle-orm";

// Insert metrics
export async function insertMetric(metric: NewMetric) {
  return db.insert(metrics).values(metric).run();
}

export async function insertMetrics(data: NewMetric[]) {
  return db.insert(metrics).values(data).run();
}

// Insert RPC test result
export async function insertRpcTest(test: NewRpcTest) {
  return db.insert(rpcTests).values(test).run();
}

// Get latest status for all services of a testnet
export function getLatestServiceStatus(testnet: string) {
  return db
    .select()
    .from(metrics)
    .where(eq(metrics.testnet, testnet))
    .orderBy(desc(metrics.timestamp))
    .limit(10)
    .all();
}

// Get metrics history for a time range
export function getMetricsHistory(
  testnet: string,
  service: string | null,
  hours: number = 24
) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  if (service) {
    return db
      .select()
      .from(metrics)
      .where(
        and(
          eq(metrics.testnet, testnet),
          eq(metrics.service, service),
          gte(metrics.timestamp, since)
        )
      )
      .orderBy(desc(metrics.timestamp))
      .all();
  }

  return db
    .select()
    .from(metrics)
    .where(and(eq(metrics.testnet, testnet), gte(metrics.timestamp, since)))
    .orderBy(desc(metrics.timestamp))
    .all();
}

// Get RPC test history
export function getRpcTestHistory(testnet: string, hours: number = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  return db
    .select()
    .from(rpcTests)
    .where(and(eq(rpcTests.testnet, testnet), gte(rpcTests.timestamp, since)))
    .orderBy(desc(rpcTests.timestamp))
    .all();
}

// Get uptime percentage for a service
export function getUptimePercentage(
  testnet: string,
  service: string,
  hours: number = 24
) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const result = db
    .select({
      total: sql<number>`count(*)`,
      up: sql<number>`sum(case when status = 'up' then 1 else 0 end)`,
    })
    .from(metrics)
    .where(
      and(
        eq(metrics.testnet, testnet),
        eq(metrics.service, service),
        gte(metrics.timestamp, since)
      )
    )
    .get();

  if (!result || result.total === 0) return null;
  return ((result.up / result.total) * 100).toFixed(2);
}

// Get average latency for a service
export function getAverageLatency(
  testnet: string,
  service: string,
  hours: number = 24
) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const result = db
    .select({
      avgLatency: sql<number>`avg(latency_ms)`,
    })
    .from(metrics)
    .where(
      and(
        eq(metrics.testnet, testnet),
        eq(metrics.service, service),
        eq(metrics.status, "up"),
        gte(metrics.timestamp, since)
      )
    )
    .get();

  return result?.avgLatency ? Math.round(result.avgLatency) : null;
}

// Get RPC test averages
export function getRpcTestAverages(testnet: string, hours: number = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  return db
    .select({
      operation: rpcTests.operation,
      avgDuration: sql<number>`avg(duration_ms)`,
      successRate: sql<number>`(sum(case when success = 1 then 1 else 0 end) * 100.0 / count(*))`,
      count: sql<number>`count(*)`,
    })
    .from(rpcTests)
    .where(and(eq(rpcTests.testnet, testnet), gte(rpcTests.timestamp, since)))
    .groupBy(rpcTests.operation)
    .all();
}

// Get recent incidents (status changes to down)
export function getRecentIncidents(testnet: string, limit: number = 20) {
  return db
    .select()
    .from(metrics)
    .where(and(eq(metrics.testnet, testnet), eq(metrics.status, "down")))
    .orderBy(desc(metrics.timestamp))
    .limit(limit)
    .all();
}
