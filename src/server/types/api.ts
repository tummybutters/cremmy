import { z } from 'zod';
import { LIFECYCLE_STAGES, PIPELINE_STAGES } from './domain';

export const paginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const createClientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  lifecycle_stage: z.enum(LIFECYCLE_STAGES).optional(),
  owner: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  description: z.string().optional(),
  payment_type: z.enum(['monthly', 'one_time']).optional(),
  recurring_amount: z.number().optional(),
  total_value: z.number().optional(),
  last_payment_date: z.string().datetime().optional(),
});

export const updateClientSchema = createClientSchema.partial();

export const lifecycleTransitionSchema = z.object({
  target_stage: z.enum(LIFECYCLE_STAGES),
  reason: z.string().optional(),
  allowLifecycleOverride: z.boolean().optional(),
});

export const createEngagementSchema = z.object({
  client_id: z.string().uuid(),
  title: z.string().min(1),
  value: z.number().nonnegative().optional(),
  pipeline_stage: z.enum(PIPELINE_STAGES).optional(),
  expected_close_date: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const updateEngagementSchema = createEngagementSchema.partial().omit({ client_id: true });

export const setStageSchema = z.object({
  target_stage: z.enum(PIPELINE_STAGES),
  note: z.string().optional(),
  force: z.boolean().optional(),
});

export const closeEngagementSchema = z.object({
  outcome: z.enum(['closed_won', 'closed_lost']),
  reason: z.string().optional(),
  note: z.string().optional(),
});

export const createTaskSchema = z.object({
  client_id: z.string().uuid().optional(),
  engagement_id: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  due_at: z.string().datetime().optional(),
  status: z.enum(['todo', 'in_progress', 'done', 'blocked']).optional(),
  priority: z.enum(['low', 'med', 'high']).optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const completeTaskSchema = z.object({
  note: z.string().optional(),
});

export const manualActivitySchema = z.object({
  type: z.string().min(1),
  actor: z.string().default('user'),
  client_id: z.string().uuid().optional(),
  engagement_id: z.string().uuid().optional(),
  payload: z.record(z.string(), z.any()).default({}),
});

export const createDocumentSchema = z.object({
  client_id: z.string().uuid(),
  engagement_id: z.string().uuid(),
  template_id: z.string().uuid().optional(),
  title: z.string().min(1),
  external_url: z.string().url().optional(),
  status: z.enum(['draft', 'sent', 'signed', 'void']).default('draft'),
});

export const updateDocumentSchema = createDocumentSchema.partial().omit({
  client_id: true,
  engagement_id: true,
});

export const documentStatusSchema = z.object({
  status: z.enum(['draft', 'sent', 'signed', 'void']),
  note: z.string().optional(),
});

export const createExternalAccountSchema = z.object({
  provider: z.string().min(1),
  external_id: z.string().min(1),
  label: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  client_id: z.string().uuid().optional(),
});

export const updateExternalAccountSchema = createExternalAccountSchema.partial();

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type LifecycleTransitionInput = z.infer<typeof lifecycleTransitionSchema>;
export type CreateEngagementInput = z.infer<typeof createEngagementSchema>;
export type UpdateEngagementInput = z.infer<typeof updateEngagementSchema>;
export type SetStageInput = z.infer<typeof setStageSchema>;
export type CloseEngagementInput = z.infer<typeof closeEngagementSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ManualActivityInput = z.infer<typeof manualActivitySchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type DocumentStatusInput = z.infer<typeof documentStatusSchema>;
export type CreateExternalAccountInput = z.infer<typeof createExternalAccountSchema>;
export type UpdateExternalAccountInput = z.infer<typeof updateExternalAccountSchema>;
