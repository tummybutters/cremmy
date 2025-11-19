import { Pool, type QueryResult, type QueryResultRow } from "pg";
import { unstable_cache } from "next/cache";

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

export const tableHasColumn = unstable_cache(
  async (table: string, column: string) => {
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
    return Boolean(rows[0]?.exists);
  },
  ["table-has-column"],
  { revalidate: 86400 }
);

export const tableExists = unstable_cache(
  async (table: string) => {
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
    return Boolean(rows[0]?.exists);
  },
  ["table-exists"],
  { revalidate: 86400 }
);
