import Database from "better-sqlite3";
import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "arkmon.db");

// Lazy initialization - only create DB when needed
let _sqlite: Database.Database | null = null;
let _db: BetterSQLite3Database<typeof schema> | null = null;

function initializeDatabase() {
  if (_sqlite && _db) {
    return { sqlite: _sqlite, db: _db };
  }

  // Ensure the directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  _sqlite = new Database(dbPath);
  _sqlite.pragma("journal_mode = WAL");

  _db = drizzle(_sqlite, { schema });

  // Initialize tables if they don't exist
  _sqlite.exec(`
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

  return { sqlite: _sqlite, db: _db };
}

// Export getters that lazily initialize the database
export function getDb() {
  return initializeDatabase().db;
}

export function getSqlite() {
  return initializeDatabase().sqlite;
}

// For backwards compatibility - these will initialize on first access
export const db = new Proxy({} as BetterSQLite3Database<typeof schema>, {
  get(_, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const sqlite = new Proxy({} as Database.Database, {
  get(_, prop) {
    return (getSqlite() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
