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

  // Get enabled testnet from API (fallback handled by API)
  const { data: testnetsData } = useTestnets();
  const testnet = testnetsData?.enabled?.[0] || testnetsData?.default || "mendoza";

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

  // Get testnet config for service URLs
  const testnetConfig = testnetsData?.testnets?.find((t: { id: string }) => t.id === testnet);

  const getServiceUrl = (serviceId: string): string | undefined => {
    if (!testnetConfig) return undefined;

    switch (serviceId) {
      case "portal":
        return testnetConfig.portalUrl;
      case "rpc":
      case "ws":
        return `https://${testnet}.hoodi.arkiv.network`;
      case "faucet":
        return testnetConfig.faucetUrl;
      case "bridge":
        return testnetConfig.bridgeUrl;
      case "explorer":
        return testnetConfig.explorerUrl;
      default:
        return undefined;
    }
  };

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-[130px] bg-zinc-800 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
                  serviceUrl={getServiceUrl(service.id)}
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
          <div className="flex items-center justify-center gap-3">
            <span>ArkMon - Arkiv Network Monitoring Dashboard</span>
            <a
              href="https://github.com/cmd0s/arkmon"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-zinc-400 transition-colors"
              title="View on GitHub"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>
          <div className="mt-1 text-zinc-600 text-xs">
            Powered by{" "}
            <a
              href="https://www.f12lab.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-zinc-400 transition-colors"
            >
              F12 Lab
            </a>
          </div>
        </div>
      </footer>

      {/* Floating Donate Button */}
      <a
        href="https://donate.f12lab.net"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 hover:shadow-pink-500/25 transition-all duration-200 group"
        title="Support this project"
      >
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="white"
          className="group-hover:scale-110 transition-transform"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </a>
    </div>
  );
}
