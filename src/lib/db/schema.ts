import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Service availability metrics
export const metrics = sqliteTable("metrics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
  testnet: text("testnet").notNull(),
  service: text("service").notNull(),
  status: text("status", { enum: ["up", "down", "degraded"] }).notNull(),
  latencyMs: integer("latency_ms"),
  errorMessage: text("error_message"),
});

// RPC operation tests
export const rpcTests = sqliteTable("rpc_tests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
  testnet: text("testnet").notNull(),
  operation: text("operation", {
    enum: ["write_small", "write_large", "read"],
  }).notNull(),
  payloadSize: integer("payload_size"),
  durationMs: integer("duration_ms").notNull(),
  success: integer("success", { mode: "boolean" }).notNull(),
  txHash: text("tx_hash"),
  entityKey: text("entity_key"),
  errorMessage: text("error_message"),
});

// Type exports
export type Metric = typeof metrics.$inferSelect;
export type NewMetric = typeof metrics.$inferInsert;
export type RpcTest = typeof rpcTests.$inferSelect;
export type NewRpcTest = typeof rpcTests.$inferInsert;
