import { randomUUID } from 'crypto';
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

type StoreMap = {
  [K in TableName]: Map<string, TableShape[K]>;
};

const stores: StoreMap = {
  clients: new Map(),
  engagements: new Map(),
  tasks: new Map(),
  activities: new Map(),
  documents: new Map(),
  templates: new Map(),
  externalAccounts: new Map(),
  stageHistory: new Map(),
};

export class TransactionContext {
  constructor(private readonly map: StoreMap) {}

  list<K extends TableName>(table: K): TableShape[K][] {
    return Array.from(this.map[table].values());
  }

  find<K extends TableName>(table: K, id: string): TableShape[K] | undefined {
    return this.map[table].get(id);
  }

  insert<K extends TableName>(table: K, record: TableShape[K]): TableShape[K] {
    const id = (record as any).id ?? randomUUID();
    const value = { ...record, id } as TableShape[K];
    this.map[table].set(id, value);
    return value;
  }

  upsert<K extends TableName>(table: K, record: TableShape[K]): TableShape[K] {
    this.map[table].set(record.id as string, record);
    return record;
  }

  update<K extends TableName>(table: K, id: string, patch: Partial<TableShape[K]>): TableShape[K] {
    const existing = this.map[table].get(id);
    if (!existing) throw new Error(`Record not found for table ${table}`);
    const next = { ...existing, ...patch };
    this.map[table].set(id, next as TableShape[K]);
    return next as TableShape[K];
  }

  delete<K extends TableName>(table: K, id: string): void {
    this.map[table].delete(id);
  }
}

export const db = {
  async withTransaction<T>(fn: (tx: TransactionContext) => Promise<T> | T): Promise<T> {
    // For in-memory usage we do not clone per transaction; adequate for prototype.
    return await fn(new TransactionContext(stores));
  },
};

export const generateId = () => randomUUID();
