import { Pool, type QueryResult, type QueryResultRow } from "pg";

declare global {
  var __crm_pg_pool__: Pool | undefined;
}

function initPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL env variable is not set. Please configure it so the app can connect to Postgres.",
    );
  }
  const ssl =
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false;
  return new Pool({ connectionString, ssl });
}

function getPool() {
  if (!globalThis.__crm_pg_pool__) {
    globalThis.__crm_pg_pool__ = initPool();
  }
  return globalThis.__crm_pg_pool__;
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  const pool = getPool();
  return pool.query<T>(text, params);
}

// Simple in-memory caches keyed by table/column to avoid repeated metadata lookups.
const columnCheckCache = new Map<string, Promise<boolean>>();
const tableCheckCache = new Map<string, Promise<boolean>>();

export async function tableHasColumn(table: string, column: string) {
  const key = `${table}:${column}`;
  const cached = columnCheckCache.get(key);
  if (cached) return cached;

  const checkPromise = query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = $1
          AND column_name = $2
      ) AS exists
    `,
    [table, column],
  ).then((result) => Boolean(result.rows[0]?.exists));

  columnCheckCache.set(key, checkPromise);
  return checkPromise;
}

export async function tableExists(table: string) {
  const cached = tableCheckCache.get(table);
  if (cached) return cached;

  const checkPromise = query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = $1
      ) AS exists
    `,
    [table],
  ).then((result) => Boolean(result.rows[0]?.exists));

  tableCheckCache.set(table, checkPromise);
  return checkPromise;
}
