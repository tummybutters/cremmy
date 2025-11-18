import { Pool, type QueryResult } from "pg";

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

export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  const pool = getPool();
  return pool.query<T>(text, params);
}

const columnCache = new Map<string, boolean>();

export async function tableHasColumn(table: string, column: string) {
  const key = `${table}.${column}`;
  if (columnCache.has(key)) {
    return columnCache.get(key)!;
  }
  const { rows } = await query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = $1
          AND column_name = $2
      ) AS exists
    `,
    [table, column],
  );
  const exists = Boolean(rows[0]?.exists);
  columnCache.set(key, exists);
  return exists;
}

const tableCache = new Map<string, boolean>();

export async function tableExists(table: string) {
  if (tableCache.has(table)) {
    return tableCache.get(table)!;
  }
  const { rows } = await query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = $1
      ) AS exists
    `,
    [table],
  );
  const exists = Boolean(rows[0]?.exists);
  tableCache.set(table, exists);
  return exists;
}
