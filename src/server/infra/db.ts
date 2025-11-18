import { Pool } from 'pg';
import type { PoolClient, QueryResultRow } from 'pg';
import {
  Activity,
  Client,
  DocumentRecord,
  Engagement,
  ExternalAccount,
  StageHistory,
  Task,
  TemplateRecord,
} from '../types/domain';

export type TableShape = {
  clients: Client;
  engagements: Engagement;
  tasks: Task;
  activities: Activity;
  documents: DocumentRecord;
  templates: TemplateRecord;
  externalAccounts: ExternalAccount;
  stageHistory: StageHistory;
};

type TableName = keyof TableShape;

type DbRecord = Record<string, unknown>;

type ClientRowInput = Partial<Client> & {
  email?: string;
  phone?: string;
};

type DbClientRow = Omit<Client, 'contact'> & {
  email?: string;
  phone?: string;
};

type DbStageHistoryRow = Omit<StageHistory, 'from' | 'to'> & {
  from_stage: StageHistory['from'];
  to_stage: StageHistory['to'];
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const TABLE_MAPPING: Record<TableName, string> = {
  clients: 'clients',
  engagements: 'engagements',
  tasks: 'tasks',
  activities: 'activities',
  documents: 'documents',
  templates: 'templates',
  externalAccounts: 'external_accounts',
  stageHistory: 'stage_history',
};

function toDbClient(client: ClientRowInput): DbRecord {
  const { contact, email, phone, ...rest } = client;
  const result: DbRecord = { ...rest };
  const resolvedEmail = contact?.email ?? email;
  if (resolvedEmail !== undefined) {
    result.email = resolvedEmail;
  }
  const resolvedPhone = contact?.phone ?? phone;
  if (resolvedPhone !== undefined) {
    result.phone = resolvedPhone;
  }
  return result;
}

function fromDbClient(row: DbClientRow): Client {
  const { email, phone, ...rest } = row;
  return {
    ...rest,
    contact: { email, phone },
  };
}

function toDbStageHistory(history: Partial<StageHistory>): DbRecord {
  const { from, to, ...rest } = history;
  const result: DbRecord = { ...rest };
  if (from !== undefined) {
    result.from_stage = from;
  }
  if (to !== undefined) {
    result.to_stage = to;
  }
  return result;
}

function fromDbStageHistory(row: DbStageHistoryRow): StageHistory {
  const { from_stage, to_stage, ...rest } = row;
  return {
    ...rest,
    from: from_stage,
    to: to_stage,
  };
}

function mapRowFromDb<K extends TableName>(table: K, row: QueryResultRow): TableShape[K] {
  if (table === 'clients') {
    return fromDbClient(row as DbClientRow) as TableShape[K];
  }
  if (table === 'stageHistory') {
    return fromDbStageHistory(row as DbStageHistoryRow) as TableShape[K];
  }
  return row as TableShape[K];
}

function prepareRecordForDb<K extends TableName>(table: K, record: Partial<TableShape[K]>): DbRecord {
  if (table === 'clients') {
    return toDbClient(record as ClientRowInput);
  }
  if (table === 'stageHistory') {
    return toDbStageHistory(record as Partial<StageHistory>);
  }
  return record as DbRecord;
}

export class TransactionContext {
  constructor(private readonly client: PoolClient) {}

  async list<K extends TableName>(table: K): Promise<TableShape[K][]> {
    const sqlTable = TABLE_MAPPING[table];
    const result = await this.client.query(`SELECT * FROM ${sqlTable}`);
    return result.rows.map((row) => mapRowFromDb(table, row));
  }

  async find<K extends TableName>(table: K, id: string): Promise<TableShape[K] | undefined> {
    const sqlTable = TABLE_MAPPING[table];
    const result = await this.client.query(`SELECT * FROM ${sqlTable} WHERE id = $1`, [id]);
    
    if (result.rows.length === 0) return undefined;
    
    return mapRowFromDb(table, result.rows[0]);
  }

  async insert<K extends TableName>(table: K, record: Partial<TableShape[K]>): Promise<TableShape[K]> {
    const sqlTable = TABLE_MAPPING[table];
    
    const dbRecord = prepareRecordForDb(table, record);
    const keys = Object.keys(dbRecord).filter(k => dbRecord[k] !== undefined);
    const values = keys.map(k => dbRecord[k]);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO ${sqlTable} (${keys.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await this.client.query(query, values);
    
    return mapRowFromDb(table, result.rows[0]);
  }

  async upsert<K extends TableName>(table: K, record: TableShape[K]): Promise<TableShape[K]> {
    const sqlTable = TABLE_MAPPING[table];
    
    const dbRecord = prepareRecordForDb(table, record);
    
    const { id, ...rest } = dbRecord;
    const keys = Object.keys(rest).filter(k => rest[k] !== undefined);
    const values = keys.map(k => rest[k]);
    
    let query: string;
    if (keys.length === 0) {
      query = `
        INSERT INTO ${sqlTable} (id)
        VALUES ($1)
        ON CONFLICT (id) DO NOTHING
        RETURNING *
      `;
      const result = await this.client.query(query, [id]);
      if (result.rows.length === 0) {
        return this.find(table, id) as Promise<TableShape[K]>;
      }
      return mapRowFromDb(table, result.rows[0]);
    }
    
    const placeholders = values.map((_, i) => `$${i + 2}`).join(', ');
    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
    
    query = `
      INSERT INTO ${sqlTable} (id, ${keys.join(', ')})
      VALUES ($1, ${placeholders})
      ON CONFLICT (id) DO UPDATE SET ${setClause}
      RETURNING *
    `;
    
    const result = await this.client.query(query, [id, ...values]);
    
    return mapRowFromDb(table, result.rows[0]);
  }

  async update<K extends TableName>(table: K, id: string, patch: Partial<TableShape[K]>): Promise<TableShape[K]> {
    const sqlTable = TABLE_MAPPING[table];
    
    const dbPatch = prepareRecordForDb(table, patch);
    
    const keys = Object.keys(dbPatch).filter(k => dbPatch[k] !== undefined);
    
    if (keys.length === 0) {
      const existing = await this.find(table, id);
      if (!existing) throw new Error(`Record not found for table ${table}`);
      return existing;
    }
    
    const values = keys.map(k => dbPatch[k]);
    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
    
    const query = `
      UPDATE ${sqlTable}
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await this.client.query(query, [id, ...values]);
    if (result.rows.length === 0) {
      throw new Error(`Record not found for table ${table}`);
    }
    
    return mapRowFromDb(table, result.rows[0]);
  }

  async delete<K extends TableName>(table: K, id: string): Promise<void> {
    const sqlTable = TABLE_MAPPING[table];
    await this.client.query(`DELETE FROM ${sqlTable} WHERE id = $1`, [id]);
  }
}

export const db = {
  async withTransaction<T>(fn: (tx: TransactionContext) => Promise<T> | T): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const tx = new TransactionContext(client);
      const result = await fn(tx);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
};

export const generateId = () => crypto.randomUUID();
