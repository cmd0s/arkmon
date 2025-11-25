import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "arkmon.db");

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

// Initialize tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    testnet TEXT NOT NULL,
    service TEXT NOT NULL,
    status TEXT NOT NULL,
    latency_ms INTEGER,
    error_message TEXT
  );

  CREATE TABLE IF NOT EXISTS rpc_tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    testnet TEXT NOT NULL,
    operation TEXT NOT NULL,
    payload_size INTEGER,
    duration_ms INTEGER NOT NULL,
    success INTEGER NOT NULL,
    tx_hash TEXT,
    entity_key TEXT,
    error_message TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp);
  CREATE INDEX IF NOT EXISTS idx_metrics_testnet ON metrics(testnet);
  CREATE INDEX IF NOT EXISTS idx_metrics_service ON metrics(service);
  CREATE INDEX IF NOT EXISTS idx_rpc_tests_timestamp ON rpc_tests(timestamp);
  CREATE INDEX IF NOT EXISTS idx_rpc_tests_testnet ON rpc_tests(testnet);
`);

export { sqlite };
