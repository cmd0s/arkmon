import "dotenv/config";
import { startMonitoring } from "./src/lib/monitor/scheduler";

console.log("╔════════════════════════════════════════════════╗");
console.log("║           ArkMon Monitoring Worker             ║");
console.log("╚════════════════════════════════════════════════╝");

// Start the monitoring service
startMonitoring();

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n[Worker] Received SIGINT, shutting down...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n[Worker] Received SIGTERM, shutting down...");
  process.exit(0);
});
