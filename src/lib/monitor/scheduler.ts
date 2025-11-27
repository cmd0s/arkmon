import { getEnabledTestnets, getTestnet } from "@/config/testnets";
import { runHealthChecks, logHealthCheckResults } from "./services";
import { runRpcTests, logRpcTestResults } from "./rpc-tests";
import { insertMetric, insertRpcTest } from "@/lib/db/queries";

const MONITOR_INTERVAL = parseInt(process.env.MONITOR_INTERVAL_MS || "60000", 10);

let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

async function runMonitoringCycle() {
  if (isRunning) {
    console.log("[Monitor] Previous cycle still running, skipping...");
    return;
  }

  isRunning = true;
  const privateKey = process.env.MONITOR_PRIVATE_KEY;

  try {
    const testnets = getEnabledTestnets();

    for (const testnet of testnets) {
      const config = getTestnet(testnet.id);
      if (!config) continue;

      // Run health checks
      const healthResults = await runHealthChecks(config);
      logHealthCheckResults(testnet.id, healthResults);

      // Save health check results to database
      const timestamp = new Date();
      for (const result of healthResults) {
        await insertMetric({
          timestamp,
          testnet: testnet.id,
          service: result.service,
          status: result.status,
          latencyMs: result.latencyMs,
          errorMessage: result.errorMessage,
        });
      }

      // Run RPC tests if private key is available
      if (privateKey) {
        const rpcResults = await runRpcTests(config, privateKey);
        logRpcTestResults(testnet.id, rpcResults);

        // Save RPC test results to database
        for (const result of rpcResults) {
          await insertRpcTest({
            timestamp,
            testnet: testnet.id,
            operation: result.operation,
            payloadSize: result.payloadSize,
            durationMs: result.durationMs,
            success: result.success,
            txHash: result.txHash,
            entityKey: result.entityKey,
            errorMessage: result.errorMessage,
          });
        }

        // If RPC tests fail, update RPC service status
        const failedTests = rpcResults.filter((r) => !r.success);
        if (failedTests.length > 0) {
          const rpcStatus = failedTests.length === rpcResults.length ? "down" : "degraded";
          const errorMessages = failedTests
            .map((r) => r.errorMessage)
            .filter(Boolean)
            .join("; ");

          await insertMetric({
            timestamp,
            testnet: testnet.id,
            service: "rpc",
            status: rpcStatus,
            latencyMs: null,
            errorMessage: errorMessages || "RPC operation tests failed",
          });
        }
      } else {
        console.log("[Monitor] MONITOR_PRIVATE_KEY not set, skipping RPC tests");
      }
    }
  } catch (error) {
    console.error("[Monitor] Error during monitoring cycle:", error);
  } finally {
    isRunning = false;
  }
}

export function startMonitoring() {
  if (intervalId) {
    console.log("[Monitor] Already running");
    return;
  }

  console.log(`[Monitor] Starting monitoring service (interval: ${MONITOR_INTERVAL}ms)`);
  console.log(`[Monitor] Enabled testnets: ${getEnabledTestnets().map((t) => t.id).join(", ")}`);

  // Run immediately on start
  runMonitoringCycle();

  // Then run at interval
  intervalId = setInterval(runMonitoringCycle, MONITOR_INTERVAL);
}

export function stopMonitoring() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[Monitor] Stopped monitoring service");
  }
}

export function getMonitoringStatus() {
  return {
    isRunning: intervalId !== null,
    interval: MONITOR_INTERVAL,
    enabledTestnets: getEnabledTestnets().map((t) => t.id),
  };
}
