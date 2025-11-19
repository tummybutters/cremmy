export const PIPELINE_STAGES = [
  'cold_lead',
  'contacted',
  'interested',
  'warm',
  'discovery_scheduled',
  'discovery_done',
  'proposal_drafting',
  'proposal_sent',
  'negotiation',
  'closed_won',
  'closed_lost',
  'onboarding',
  'delivering',
  'maintenance',
] as const;

export type PipelineStage = typeof PIPELINE_STAGES[number];

export const LIFECYCLE_STAGES = ['prospect', 'active', 'churned', 'disqualified'] as const;
export type LifecycleStage = typeof LIFECYCLE_STAGES[number];

export type ActivityType =
  | 'client_change'
  | 'engagement_change'
  | 'stage_change'
  | 'lifecycle_change'
  | 'task_update'
  | 'document_event'
  | 'webhook_event'
  | 'note';

export interface Client {
  id: string;
  name: string;
  contact: {
    email?: string;
    phone?: string;
  };
  company?: string;
  lifecycle_stage: LifecycleStage;
  owner?: string;
  tags: string[];
  notes?: string;
  // New fields for redesign
  description?: string;
  payment_type?: 'monthly' | 'one_time';
  recurring_amount?: number;
  total_value?: number;
  last_payment_date?: string;
  archived_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Engagement {
  id: string;
  client_id: string;
  title: string;
  pipeline_stage: PipelineStage;
  status: 'open' | 'closed';
  value?: number;
  probability?: number;
  expected_close_date?: string;
  notes?: string;
  closed_reason?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  client_id?: string;
  engagement_id?: string;
  title: string;
  description?: string;
  due_at?: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  priority: 'low' | 'med' | 'high';
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  actor: string;
  client_id?: string;
  engagement_id?: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface DocumentRecord {
  id: string;
  client_id: string;
  engagement_id: string;
  template_id?: string;
  title: string;
  external_url?: string;
  status: 'draft' | 'sent' | 'signed' | 'void';
  external_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateRecord {
  id: string;
  name: string;
  version: string;
  description?: string;
  placeholders: string[];
  created_at: string;
  updated_at: string;
}

export interface ExternalAccount {
  id: string;
  provider: string;
  external_id: string;
  account_identifier?: string;
  label?: string;
  metadata?: Record<string, unknown>;
  client_id?: string;
  created_at: string;
  updated_at: string;
}

export interface StageHistory {
  id: string;
  engagement_id: string;
  from: PipelineStage;
  to: PipelineStage;
  created_at: string;
  actor: string;
  note?: string;
}
