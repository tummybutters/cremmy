import { Pool } from 'pg';
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

export class TransactionContext {
  constructor(private readonly client: any) {}

  async list<K extends TableName>(table: K): Promise<TableShape[K][]> {
    const sqlTable = TABLE_MAPPING[table];
    const result = await this.client.query(`SELECT * FROM ${sqlTable}`);
    return result.rows;
  }

  async find<K extends TableName>(table: K, id: string): Promise<TableShape[K] | undefined> {
    const sqlTable = TABLE_MAPPING[table];
    const result = await this.client.query(`SELECT * FROM ${sqlTable} WHERE id = $1`, [id]);
    return result.rows[0];
  }

  async insert<K extends TableName>(table: K, record: Partial<TableShape[K]>): Promise<TableShape[K]> {
    const sqlTable = TABLE_MAPPING[table];
    const { id, ...rest } = record as any;
    const keys = Object.keys(rest);
    const values = Object.values(rest);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO ${sqlTable} (${keys.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await this.client.query(query, values);
    return result.rows[0];
  }

  async upsert<K extends TableName>(table: K, record: TableShape[K]): Promise<TableShape[K]> {
    const sqlTable = TABLE_MAPPING[table];
    const { id, ...rest } = record as any;
    const keys = Object.keys(rest);
    const values = Object.values(rest);
    
    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
    const placeholders = values.map((_, i) => `$${i + 2}`).join(', ');
    
    const query = `
      INSERT INTO ${sqlTable} (id, ${keys.join(', ')})
      VALUES ($1, ${placeholders})
      ON CONFLICT (id) DO UPDATE SET ${setClause}
      RETURNING *
    `;
    
    const result = await this.client.query(query, [id, ...values, ...values]);
    return result.rows[0];
  }

  async update<K extends TableName>(table: K, id: string, patch: Partial<TableShape[K]>): Promise<TableShape[K]> {
    const sqlTable = TABLE_MAPPING[table];
    const keys = Object.keys(patch);
    const values = Object.values(patch);
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
    return result.rows[0];
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
