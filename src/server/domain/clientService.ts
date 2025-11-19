import { db, generateId, TransactionContext } from '../infra/db';
import { Client, Engagement, LifecycleStage } from '../types/domain';
import { activityService } from './activityService';
import { notFound } from './errors';
import { daysBetween, generateTimestamp } from './utils';

interface ListFilters {
  lifecycle_stage?: LifecycleStage;
  search?: string;
  tags?: string[];
  cursor?: string;
  limit?: number;
}

const DEFAULT_LIMIT = 25;

type ClientUpsertInput = Partial<Client> & {
  email?: string;
  phone?: string;
  description?: string;
  payment_type?: 'monthly' | 'one_time';
  recurring_amount?: number;
  total_value?: number;
  last_payment_date?: string;
};

export const clientService = {
  async list(filters: ListFilters) {
    return db.withTransaction(async (tx) => {
      const allClients = await tx.list('clients');

      const cursorIdx = filters.cursor
        ? allClients
          .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
          .findIndex((c) => c.id === filters.cursor)
        : -1;

      const start = cursorIdx >= 0 ? cursorIdx + 1 : 0;
      const items = allClients
        .filter((client) => !client.archived_at)
        .filter((client) => (filters.lifecycle_stage ? client.lifecycle_stage === filters.lifecycle_stage : true))
        .filter((client) =>
          filters.search
            ? client.name.toLowerCase().includes(filters.search.toLowerCase()) ||
            (client.company ?? '').toLowerCase().includes(filters.search.toLowerCase())
            : true
        )
        .filter((client) =>
          filters.tags?.length
            ? filters.tags.every((tag) => client.tags.includes(tag))
            : true
        )
        .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
        .slice(start, start + (filters.limit ?? DEFAULT_LIMIT));

      const nextCursor = items.length === (filters.limit ?? DEFAULT_LIMIT) ? items[items.length - 1].id : undefined;

      return { data: items, nextCursor };
    });
  },

  async create(input: ClientUpsertInput, actor: string) {
    return db.withTransaction(async (tx) => {
      const now = generateTimestamp();
      const record: Client = {
        id: generateId(),
        name: input.name ?? 'Untitled Client',
        contact: {
          email: input.contact?.email ?? input.email,
          phone: input.contact?.phone ?? input.phone,
        },
        company: input.company,
        lifecycle_stage: (input.lifecycle_stage as LifecycleStage) ?? 'prospect',
        owner: input.owner,
        tags: input.tags ?? [],
        notes: input.notes,
        description: input.description,
        payment_type: input.payment_type,
        recurring_amount: input.recurring_amount,
        total_value: input.total_value,
        last_payment_date: input.last_payment_date,
        created_at: now,
        updated_at: now,
      };

      const client = await tx.insert('clients', record);
      await activityService.log(tx, {
        type: 'client_change',
        actor,
        client_id: client.id,
        payload: { action: 'created' },
      });
      return client;
    });
  },

  async getById(id: string) {
    return db.withTransaction(async (tx) => {
      const client = await tx.find('clients', id);
      if (!client || client.archived_at) throw notFound('Client not found');
      return client;
    });
  },

  async update(id: string, patch: ClientUpsertInput, actor: string) {
    return db.withTransaction(async (tx) => {
      const client = await tx.find('clients', id);
      if (!client || client.archived_at) throw notFound('Client not found');
      const updated = await tx.update('clients', id, {
        ...patch,
        contact: {
          email: patch.contact?.email ?? patch.email ?? client.contact.email,
          phone: patch.contact?.phone ?? patch.phone ?? client.contact.phone,
        },
        tags: patch.tags ?? client.tags,
        updated_at: generateTimestamp(),
      });
      await activityService.log(tx, {
        type: 'client_change',
        actor,
        client_id: id,
        payload: { action: 'updated' },
      });
      return updated;
    });
  },

  async delete(id: string, actor: string) {
    return db.withTransaction(async (tx) => {
      const client = await tx.find('clients', id);
      if (!client || client.archived_at) throw notFound('Client not found');
      const updated = await tx.update('clients', id, { archived_at: generateTimestamp() });
      await activityService.log(tx, {
        type: 'client_change',
        actor,
        client_id: id,
        payload: { action: 'archived' },
      });
      return updated;
    });
  },

  async setLifecycle(id: string, target: LifecycleStage, actor: string, reason?: string) {
    return db.withTransaction(async (tx) => {
      const client = await tx.find('clients', id);
      if (!client || client.archived_at) throw notFound('Client not found');
      if (client.lifecycle_stage === target) return client;
      const updated = await tx.update('clients', id, { lifecycle_stage: target, updated_at: generateTimestamp() });
      await activityService.log(tx, {
        type: 'lifecycle_change',
        actor,
        client_id: id,
        payload: { from: client.lifecycle_stage, to: target, reason },
      });
      return updated;
    });
  },

  async syncLifecycleForClient(tx: TransactionContext, clientId: string, actor = 'system') {
    const client = await tx.find('clients', clientId);
    if (!client || client.archived_at) return client;
    const engagements = await tx.list('engagements');
    const filteredEngagements = engagements.filter((engagement) => engagement.client_id === clientId);
    const nextStage = determineLifecycle(client, filteredEngagements);
    if (nextStage && nextStage !== client.lifecycle_stage) {
      await tx.update('clients', clientId, { lifecycle_stage: nextStage, updated_at: generateTimestamp() });
      await activityService.log(tx, {
        type: 'lifecycle_change',
        actor,
        client_id: clientId,
        payload: { from: client.lifecycle_stage, to: nextStage, reason: 'auto-sync' },
      });
    }
    return await tx.find('clients', clientId);
  },
};

const determineLifecycle = (client: Client, engagements: Engagement[]): LifecycleStage => {
  if (!engagements.length) return client.lifecycle_stage ?? 'prospect';
  const hasWon = engagements.some((e) => e.pipeline_stage === 'closed_won' || e.pipeline_stage === 'onboarding' || e.pipeline_stage === 'delivering' || e.pipeline_stage === 'maintenance');
  if (hasWon) return 'active';
  const openEngagements = engagements.some((e) => e.status === 'open');
  if (openEngagements) return 'prospect';

  const allClosed = engagements.every((e) => e.status === 'closed');
  if (allClosed) {
    const allNotAFit = engagements.every((e) => (e.closed_reason ?? '') === 'not_a_fit');
    if (allNotAFit) return 'disqualified';

    const closedWithDates = engagements.filter((e) => e.closed_at);
    if (closedWithDates.length) {
      const latestClosed = closedWithDates.sort((a, b) => (a.closed_at! < b.closed_at! ? 1 : -1))[0];
      if (latestClosed.closed_at && daysBetween(latestClosed.closed_at, generateTimestamp()) >= 90) {
        return 'churned';
      }
    }
  }
  return client.lifecycle_stage;
};
