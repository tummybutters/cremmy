import { db, generateId, TransactionContext } from '../infra/db';
import { Activity, ActivityType } from '../types/domain';
import { generateTimestamp } from './utils';

export interface ActivityLogInput {
  type: ActivityType;
  actor: string;
  client_id?: string;
  engagement_id?: string;
  payload?: Record<string, unknown>;
}

export const activityService = {
  async log(tx: TransactionContext, input: ActivityLogInput): Promise<Activity> {
    const record: Activity = {
      id: generateId(),
      type: input.type,
      actor: input.actor,
      client_id: input.client_id,
      engagement_id: input.engagement_id,
      payload: input.payload ?? {},
      created_at: generateTimestamp(),
    };
    return tx.insert('activities', record);
  },

  async list(filter: {
    client_id?: string;
    engagement_id?: string;
    type?: ActivityType;
    since?: string;
  }): Promise<Activity[]> {
    return db.withTransaction(async (tx) => {
      const sinceTs = filter.since ? Date.parse(filter.since) : undefined;
      return tx
        .list('activities')
        .filter((activity) => {
          if (filter.client_id && activity.client_id !== filter.client_id) return false;
          if (filter.engagement_id && activity.engagement_id !== filter.engagement_id) return false;
          if (filter.type && activity.type !== filter.type) return false;
          if (sinceTs && Date.parse(activity.created_at) < sinceTs) return false;
          return true;
        })
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    });
  },

  async createManual(input: ActivityLogInput): Promise<Activity> {
    return db.withTransaction(async (tx) => this.log(tx, input));
  },
};
