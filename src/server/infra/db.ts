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

function toDbClient(client: Partial<Client>): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const key in client) {
    if (key === 'contact') {
      const contact = (client as any).contact;
      if (contact) {
        if (contact.email !== undefined) result.email = contact.email;
        if (contact.phone !== undefined) result.phone = contact.phone;
      }
    } else {
      result[key] = (client as any)[key];
    }
  }
  
  return result;
}

function fromDbClient(row: any): Client {
  const { email, phone, ...rest } = row;
  return {
    ...rest,
    contact: { email, phone },
  };
}

function toDbStageHistory(history: Partial<StageHistory>): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const key in history) {
    if (key === 'from') {
      result.from_stage = (history as any).from;
    } else if (key === 'to') {
      result.to_stage = (history as any).to;
    } else {
      result[key] = (history as any)[key];
    }
  }
  
  return result;
}

function fromDbStageHistory(row: any): StageHistory {
  const { from_stage, to_stage, ...rest } = row;
  return {
    ...rest,
    from: from_stage,
    to: to_stage,
  };
}

export class TransactionContext {
  constructor(private readonly client: any) {}

  async list<K extends TableName>(table: K): Promise<TableShape[K][]> {
    const sqlTable = TABLE_MAPPING[table];
    const result = await this.client.query(`SELECT * FROM ${sqlTable}`);
    
    if (table === 'clients') {
      return result.rows.map(fromDbClient) as TableShape[K][];
    } else if (table === 'stageHistory') {
      return result.rows.map(fromDbStageHistory) as TableShape[K][];
    }
    return result.rows;
  }

  async find<K extends TableName>(table: K, id: string): Promise<TableShape[K] | undefined> {
    const sqlTable = TABLE_MAPPING[table];
    const result = await this.client.query(`SELECT * FROM ${sqlTable} WHERE id = $1`, [id]);
    
    if (result.rows.length === 0) return undefined;
    
    if (table === 'clients') {
      return fromDbClient(result.rows[0]) as TableShape[K];
    } else if (table === 'stageHistory') {
      return fromDbStageHistory(result.rows[0]) as TableShape[K];
    }
    return result.rows[0];
  }

  async insert<K extends TableName>(table: K, record: Partial<TableShape[K]>): Promise<TableShape[K]> {
    const sqlTable = TABLE_MAPPING[table];
    
    let dbRecord = record as any;
    if (table === 'clients') {
      dbRecord = toDbClient(record as Client);
    } else if (table === 'stageHistory') {
      dbRecord = toDbStageHistory(record as StageHistory);
    }
    
    const keys = Object.keys(dbRecord).filter(k => dbRecord[k] !== undefined);
    const values = keys.map(k => dbRecord[k]);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO ${sqlTable} (${keys.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await this.client.query(query, values);
    
    if (table === 'clients') {
      return fromDbClient(result.rows[0]) as TableShape[K];
    } else if (table === 'stageHistory') {
      return fromDbStageHistory(result.rows[0]) as TableShape[K];
    }
    return result.rows[0];
  }

  async upsert<K extends TableName>(table: K, record: TableShape[K]): Promise<TableShape[K]> {
    const sqlTable = TABLE_MAPPING[table];
    
    let dbRecord = record as any;
    if (table === 'clients') {
      dbRecord = toDbClient(record as Client);
    } else if (table === 'stageHistory') {
      dbRecord = toDbStageHistory(record as StageHistory);
    }
    
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
      if (table === 'clients') {
        return fromDbClient(result.rows[0]) as TableShape[K];
      } else if (table === 'stageHistory') {
        return fromDbStageHistory(result.rows[0]) as TableShape[K];
      }
      return result.rows[0];
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
    
    if (table === 'clients') {
      return fromDbClient(result.rows[0]) as TableShape[K];
    } else if (table === 'stageHistory') {
      return fromDbStageHistory(result.rows[0]) as TableShape[K];
    }
    return result.rows[0];
  }

  async update<K extends TableName>(table: K, id: string, patch: Partial<TableShape[K]>): Promise<TableShape[K]> {
    const sqlTable = TABLE_MAPPING[table];
    
    let dbPatch = patch as any;
    if (table === 'clients') {
      dbPatch = toDbClient(patch as unknown as Partial<Client>);
    } else if (table === 'stageHistory') {
      dbPatch = toDbStageHistory(patch as unknown as Partial<StageHistory>);
    }
    
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
    
    if (table === 'clients') {
      return fromDbClient(result.rows[0]) as TableShape[K];
    } else if (table === 'stageHistory') {
      return fromDbStageHistory(result.rows[0]) as TableShape[K];
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
