import { type TestnetConfig, SERVICES, type ServiceId } from "@/config/testnets";
import WebSocket from "ws";

export interface HealthCheckResult {
  service: ServiceId;
  status: "up" | "down" | "degraded";
  latencyMs: number | null;
  errorMessage: string | null;
}

// Check HTTP RPC endpoint
async function checkRpc(config: TestnetConfig): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const response = await fetch(config.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_chainId",
        params: [],
        id: 1,
      }),
      signal: AbortSignal.timeout(10000),
    });

    const latencyMs = Date.now() - start;

    if (!response.ok) {
      return {
        service: "rpc",
        status: "down",
        latencyMs,
        errorMessage: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    if (data.error) {
      return {
        service: "rpc",
        status: "degraded",
        latencyMs,
        errorMessage: data.error.message,
      };
    }

    return {
      service: "rpc",
      status: latencyMs > 5000 ? "degraded" : "up",
      latencyMs,
      errorMessage: null,
    };
  } catch (error) {
    return {
      service: "rpc",
      status: "down",
      latencyMs: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Check WebSocket RPC endpoint
async function checkWs(config: TestnetConfig): Promise<HealthCheckResult> {
  const start = Date.now();

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({
        service: "ws",
        status: "down",
        latencyMs: 10000,
        errorMessage: "Connection timeout",
      });
    }, 10000);

    try {
      const ws = new WebSocket(config.wsUrl);

      ws.on("open", () => {
        const latencyMs = Date.now() - start;
        clearTimeout(timeout);
        ws.close();
        resolve({
          service: "ws",
          status: latencyMs > 5000 ? "degraded" : "up",
          latencyMs,
          errorMessage: null,
        });
      });

      ws.on("error", (error) => {
        clearTimeout(timeout);
        ws.close();
        resolve({
          service: "ws",
          status: "down",
          latencyMs: Date.now() - start,
          errorMessage: error.message,
        });
      });
    } catch (error) {
      clearTimeout(timeout);
      resolve({
        service: "ws",
        status: "down",
        latencyMs: Date.now() - start,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
}

// Check HTTP endpoint (Faucet, Bridge, Explorer)
async function checkHttpEndpoint(
  url: string,
  service: ServiceId
): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const response = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(10000),
    });

    const latencyMs = Date.now() - start;

    // Accept 200-399 as success (some services redirect)
    if (response.status >= 200 && response.status < 400) {
      return {
        service,
        status: latencyMs > 5000 ? "degraded" : "up",
        latencyMs,
        errorMessage: null,
      };
    }

    return {
      service,
      status: "down",
      latencyMs,
      errorMessage: `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      service,
      status: "down",
      latencyMs: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Run all health checks for a testnet
export async function runHealthChecks(
  config: TestnetConfig
): Promise<HealthCheckResult[]> {
  const checks = await Promise.all([
    checkHttpEndpoint(config.portalUrl, "portal"),
    checkRpc(config),
    checkWs(config),
    checkHttpEndpoint(config.faucetUrl, "faucet"),
    checkHttpEndpoint(config.bridgeUrl, "bridge"),
    checkHttpEndpoint(config.explorerUrl, "explorer"),
  ]);

  return checks;
}

// Log health check results
export function logHealthCheckResults(
  testnet: string,
  results: HealthCheckResult[]
) {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] Health Check: ${testnet}`);
  console.log("─".repeat(50));

  for (const result of results) {
    const statusIcon =
      result.status === "up" ? "✓" : result.status === "degraded" ? "!" : "✗";
    const statusColor =
      result.status === "up" ? "\x1b[32m" : result.status === "degraded" ? "\x1b[33m" : "\x1b[31m";
    const serviceName = SERVICES.find((s) => s.id === result.service)?.name || result.service;

    console.log(
      `${statusColor}${statusIcon}\x1b[0m ${serviceName.padEnd(20)} ${result.latencyMs ? `${result.latencyMs}ms` : "N/A"}${
        result.errorMessage ? ` (${result.errorMessage})` : ""
      }`
    );
  }
}
