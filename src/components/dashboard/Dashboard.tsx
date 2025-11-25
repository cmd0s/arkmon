"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ServiceCard } from "./ServiceCard";
import { LatencyChart } from "./LatencyChart";
import { UptimeChart } from "./UptimeChart";
import { RpcTestsChart } from "./RpcTestsChart";
import { RecentIncidents } from "./RecentIncidents";
import { useServices, useMetrics, useRpcTests, useTestnets } from "@/lib/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function Dashboard() {
  const [timeRange, setTimeRange] = useState("6");

  // Get enabled testnet from API
  const { data: testnetsData } = useTestnets();
  const testnet = testnetsData?.enabled?.[0] || "rosario";

  const { data: servicesData, isLoading: servicesLoading } = useServices(testnet);
  const { data: metricsData, isLoading: metricsLoading } = useMetrics(
    testnet,
    parseInt(timeRange)
  );
  const { data: rpcData, isLoading: rpcLoading } = useRpcTests(
    testnet,
    parseInt(timeRange)
  );

  const services = servicesData?.services || [];
  const metrics = metricsData?.metrics || {};
  const rpcAverages = rpcData?.averages || [];
  const rpcIncidents = rpcData?.incidents || [];

  // Combine service outages with RPC test failures
  const serviceIncidents = services
    .filter((s: { status: string }) => s.status === "down")
    .map((s: { id: string; errorMessage: string | null }) => ({
      timestamp: new Date().toISOString(),
      service: s.id,
      status: "down",
      errorMessage: s.errorMessage,
    }));

  const incidents = [...serviceIncidents, ...rpcIncidents]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header
        testnet={testnet}
        lastUpdate={servicesData?.lastUpdate || null}
      />

      <main className="container mx-auto px-4 py-6">
        {/* Status Overview */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-300">Service Status</h2>
            <Tabs value={timeRange} onValueChange={setTimeRange}>
              <TabsList className="bg-zinc-900 border border-zinc-800">
                <TabsTrigger
                  value="1"
                  className="data-[state=active]:bg-zinc-800"
                >
                  1h
                </TabsTrigger>
                <TabsTrigger
                  value="6"
                  className="data-[state=active]:bg-zinc-800"
                >
                  6h
                </TabsTrigger>
                <TabsTrigger
                  value="24"
                  className="data-[state=active]:bg-zinc-800"
                >
                  24h
                </TabsTrigger>
                <TabsTrigger
                  value="168"
                  className="data-[state=active]:bg-zinc-800"
                >
                  7d
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {servicesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-[130px] bg-zinc-800 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {services.map((service: {
                id: string;
                name: string;
                description: string;
                status: "up" | "down" | "degraded" | "unknown";
                latencyMs: number | null;
                uptime24h: number | null;
                avgLatency24h: number | null;
              }) => (
                <ServiceCard
                  key={service.id}
                  id={service.id}
                  name={service.name}
                  description={service.description}
                  status={service.status}
                  latencyMs={service.latencyMs}
                  uptime24h={service.uptime24h}
                  avgLatency24h={service.avgLatency24h}
                />
              ))}
            </div>
          )}
        </section>

        {/* Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {metricsLoading ? (
            <>
              <Skeleton className="h-[380px] bg-zinc-800" />
              <Skeleton className="h-[380px] bg-zinc-800" />
            </>
          ) : (
            <>
              <LatencyChart data={metrics} />
              <UptimeChart data={metrics} hours={parseInt(timeRange)} />
            </>
          )}
        </section>

        {/* RPC Performance */}
        <section className="mb-8">
          {rpcLoading ? (
            <Skeleton className="h-[400px] bg-zinc-800" />
          ) : (
            <RpcTestsChart tests={rpcData?.tests || {}} averages={rpcAverages} />
          )}
        </section>

        {/* Recent Incidents */}
        <section>
          <RecentIncidents incidents={incidents} />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-zinc-500 text-sm">
          ArkMon - Arkiv Network Monitoring Dashboard
        </div>
      </footer>
    </div>
  );
}
