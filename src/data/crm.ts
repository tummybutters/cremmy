import { query, tableExists, tableHasColumn } from "@/data/db";
import {
  ActivityItem,
  ClientLifecycle,
  ClientSummary,
  DocumentSummary,
  ExternalAccountSummary,
  PipelineStage,
  StageColor,
  TaskSummary,
  TemplateSummary,
} from "@/types/ui";
import { formatCurrency, formatDate, formatRelativeTime, titleCase } from "@/utils/format";

type StageColumnMode = "stage_id" | "pipeline_stage";

interface StageShape {
  column: StageColumnMode;
  stages: PipelineStage[];
  lookup: Record<string, PipelineStage>;
  usesStageTable: boolean;
}

interface ClientColumnConfig {
  lifecycleColumn: string;
  ownerColumn?: string;
  archivedColumn?: string;
  emailColumn?: string;
  phoneColumn?: string;
}

interface ClientDetailRow {
  id: string;
  name: string;
  owner: string | null;
  lifecycle: string;
  company: string | null;
  notes?: string | null;
  email?: string | null;
  phone?: string | null;
  updated_at: string;
}

const DEFAULT_STAGE_META: Array<Omit<PipelineStage, "count"> & { sort_order: number }> = [
  { id: "lead", label: "Lead", color: "slate", sort_order: 1 },
  { id: "qualified", label: "Qualified", color: "blue", sort_order: 2 },
  { id: "proposal", label: "Proposal", color: "amber", sort_order: 3 },
  { id: "negotiation", label: "Negotiation", color: "purple", sort_order: 4 },
  { id: "closed_won", label: "Closed Won", color: "emerald", sort_order: 5 },
  { id: "closed_lost", label: "Closed Lost", color: "rose", sort_order: 6 },
];

const STAGE_CATEGORY_MAP: Record<string, string> = {
  cold_lead: "lead",
  contacted: "lead",
  interested: "lead",
  warm: "qualified",
  discovery_scheduled: "qualified",
  discovery_done: "qualified",
  proposal_drafting: "proposal",
  proposal_sent: "proposal",
  negotiation: "negotiation",
  closed_won: "closed_won",
  onboarding: "closed_won",
  delivering: "closed_won",
  maintenance: "closed_won",
  closed_lost: "closed_lost",
};

const FALLBACK_OWNER = "Workspace";

let clientColumns: ClientColumnConfig | null = null;
let stageShapeCache: StageShape | null = null;
let taskDueColumn: "due_at" | "due_date" | null = null;
let activityActorColumn: string | null = null;

async function getClientColumns() {
  if (clientColumns) return clientColumns;
  const lifecycleColumn = (await tableHasColumn("clients", "lifecycle_stage")) ? "lifecycle_stage" : "lifecycle";
  const ownerColumn = (await tableHasColumn("clients", "owner")) ? "owner" : undefined;
  const archivedColumn = (await tableHasColumn("clients", "archived_at")) ? "archived_at" : undefined;
  const emailColumn = (await tableHasColumn("clients", "email")) ? "email" : undefined;
  const phoneColumn = (await tableHasColumn("clients", "phone")) ? "phone" : undefined;
  clientColumns = { lifecycleColumn, ownerColumn, archivedColumn, emailColumn, phoneColumn };
  return clientColumns;
}

async function getStageShape(): Promise<StageShape> {
  if (stageShapeCache) {
    return {
      ...stageShapeCache,
      stages: stageShapeCache.stages.map((stage) => ({ ...stage, count: 0 })),
    };
  }

  const hasStageTable = await tableExists("pipeline_stages");
  const hasStageId = await tableHasColumn("engagements", "stage_id");
  if (hasStageTable && hasStageId) {
    const { rows } = await query<{ id: string; label: string; color: StageColor; sort_order: number }>(
      `
        SELECT id, label, color, sort_order
        FROM pipeline_stages
        ORDER BY sort_order ASC, created_at ASC
      `,
    );

    const stages = rows.map((row, index) => ({
      id: row.id,
      label: row.label,
      color: row.color ?? DEFAULT_STAGE_META[index % DEFAULT_STAGE_META.length].color,
      count: 0,
    }));

    const lookup = Object.fromEntries(stages.map((stage) => [stage.id, stage]));
    stageShapeCache = { column: "stage_id", stages, lookup, usesStageTable: true };
    return {
      column: "stage_id",
      usesStageTable: true,
      lookup,
      stages: stages.map((stage) => ({ ...stage })),
    };
  }

  const fallbackStages = DEFAULT_STAGE_META.map((stage) => ({
    id: stage.id,
    label: stage.label,
    color: stage.color,
    count: 0,
  }));
  const lookup = Object.fromEntries(fallbackStages.map((stage) => [stage.id, stage]));
  stageShapeCache = { column: "pipeline_stage", stages: fallbackStages, lookup, usesStageTable: false };
  return {
    column: "pipeline_stage",
    usesStageTable: false,
    lookup,
    stages: fallbackStages.map((stage) => ({ ...stage })),
  };
}

async function getTaskDueColumn() {
  if (taskDueColumn) return taskDueColumn;
  taskDueColumn = (await tableHasColumn("tasks", "due_at")) ? "due_at" : (await tableHasColumn("tasks", "due_date")) ? "due_date" : null;
  return taskDueColumn;
}

async function getActivityActorColumn() {
  if (activityActorColumn !== null) return activityActorColumn;
  activityActorColumn = (await tableHasColumn("activities", "actor")) ? "actor" : null;
  return activityActorColumn;
}

function normalizeLifecycle(value?: string | null): ClientLifecycle {
  if (!value) return "prospect";
  const normalized = value.toLowerCase();
  if (normalized === "active") return "active";
  if (normalized === "at-risk" || normalized === "at_risk" || normalized === "at risk") return "at-risk";
  if (normalized === "inactive") return "inactive";
  if (normalized === "prospect") return "prospect";
  if (normalized === "churned" || normalized === "disqualified") return "inactive";
  return "prospect";
}

function formatOwner(owner?: string | null, fallback: string | null = null) {
  return owner?.trim() || fallback?.trim() || FALLBACK_OWNER;
}

function mapTaskStatus(status?: string | null): TaskSummary["status"] {
  if (!status) return "open";
  const normalized = status.toLowerCase();
  if (normalized === "in-progress" || normalized === "in_progress") return "in-progress";
  if (normalized === "completed" || normalized === "done") return "completed";
  return "open";
}

function mapActivityType(value?: string | null): ActivityItem["type"] {
  if (!value) return "note";
  const normalized = value.toLowerCase();
  if (normalized.includes("call")) return "call";
  if (normalized.includes("email") || normalized.includes("mail")) return "email";
  if (normalized.includes("meeting") || normalized.includes("event")) return "meeting";
  return "note";
}

function mapDocumentStatus(value?: string | null): DocumentSummary["status"] {
  if (!value) return "draft";
  const normalized = value.toLowerCase();
  if (normalized.includes("review")) return "review";
  if (normalized.includes("final") || normalized.includes("signed")) return "final";
  return "draft";
}

export interface PipelineBoardData {
  stages: PipelineStage[];
  dealsByStage: Record<string, ClientSummary[]>;
}

export async function fetchPipelineBoardData(): Promise<PipelineBoardData> {
  const stageShape = await getStageShape();
  const clientCols = await getClientColumns();
  const ownerExpr = clientCols.ownerColumn ? `c.${clientCols.ownerColumn}` : `'${FALLBACK_OWNER}'::text`;
  const lifecycleExpr = `c.${clientCols.lifecycleColumn}`;
  const archivedFilter = clientCols.archivedColumn ? `c.${clientCols.archivedColumn} IS NULL` : "TRUE";
  const stageSelect =
    stageShape.column === "stage_id" ? "e.stage_id AS stage_ref," : "e.pipeline_stage AS stage_ref,";
  const stageJoin = stageShape.usesStageTable
    ? `
        LEFT JOIN pipeline_stages ps ON ps.id = e.stage_id
      `
    : "";
  const stageLabelSelect = stageShape.usesStageTable ? "ps.label AS stage_label, ps.color AS stage_color," : "";

  const { rows } = await query<{
    id: string;
    title: string;
    value: number | null;
    stage_ref: string | null;
    stage_label?: string | null;
    stage_color?: StageColor | null;
    client_id: string;
    client_name: string;
    owner: string | null;
    lifecycle: string | null;
    last_activity: string | null;
  }>(
    `
      SELECT
        e.id,
        e.title,
        e.value,
        ${stageSelect}
        ${stageLabelSelect}
        c.id AS client_id,
        c.name AS client_name,
        ${ownerExpr} AS owner,
        ${lifecycleExpr} AS lifecycle,
        COALESCE(la.last_activity_at, e.updated_at) AS last_activity
      FROM engagements e
      JOIN clients c ON c.id = e.client_id
      ${stageJoin}
      LEFT JOIN LATERAL (
        SELECT created_at AS last_activity_at
        FROM activities a
        WHERE a.client_id = c.id
        ORDER BY created_at DESC
        LIMIT 1
      ) la ON TRUE
      WHERE ${archivedFilter}
        AND (e.status IS NULL OR e.status = 'open')
      ORDER BY e.updated_at DESC
    `,
  );

  const stages = stageShape.stages.map((stage) => ({ ...stage, count: 0 }));
  const dealsByStage: Record<string, ClientSummary[]> = Object.fromEntries(
    stages.map((stage) => [stage.id, []]),
  );

  for (const row of rows) {
    let stageId = row.stage_ref ?? "";
    let stageMeta = stageShape.lookup[stageId];
    if (!stageMeta && !stageShape.usesStageTable) {
      const fallbackId = STAGE_CATEGORY_MAP[stageId] ?? "qualified";
      stageId = fallbackId;
      stageMeta = stageShape.lookup[stageId];
    }
    if (!stageMeta) {
      stageMeta = stages[0];
      stageId = stageMeta.id;
    }

    if (stageShape.usesStageTable) {
      const entry = stages.find((stage) => stage.id === stageMeta.id);
      if (entry && row.stage_label) {
        entry.label = row.stage_label;
      }
      if (entry && row.stage_color) {
        entry.color = row.stage_color;
      }
    }

    const summary: ClientSummary = {
      id: row.client_id,
      name: row.client_name,
      owner: formatOwner(row.owner),
      status: normalizeLifecycle(row.lifecycle),
      stageId,
      lastActivity: formatRelativeTime(row.last_activity),
      value: row.value ? formatCurrency(row.value) : undefined,
    };
    dealsByStage[stageId] = dealsByStage[stageId] ?? [];
    dealsByStage[stageId].push(summary);
  }

  for (const stage of stages) {
    stage.count = dealsByStage[stage.id]?.length ?? 0;
  }

  return { stages, dealsByStage };
}

export async function fetchClients(limit = 25): Promise<ClientSummary[]> {
  const cols = await getClientColumns();
  const stageShape = await getStageShape();
  const stageRefColumn = stageShape.column === "stage_id" ? "stage_id" : "pipeline_stage";
  const ownerExpr = cols.ownerColumn ? `c.${cols.ownerColumn}` : `'${FALLBACK_OWNER}'::text`;
  const lifecycleExpr = `c.${cols.lifecycleColumn}`;
  const archivedFilter = cols.archivedColumn ? "c.archived_at IS NULL" : "TRUE";

  const queryText = `
    WITH engagement_stage AS (
      SELECT DISTINCT ON (client_id)
        client_id,
        ${stageRefColumn} AS stage_ref,
        updated_at
      FROM engagements
      ORDER BY client_id, updated_at DESC
    )
    SELECT
      c.id,
      c.name,
      ${ownerExpr} AS owner,
      ${lifecycleExpr} AS lifecycle,
      c.updated_at,
      la.last_activity_at,
      totals.total_value,
      es.stage_ref AS stage_id
    FROM clients c
    LEFT JOIN LATERAL (
      SELECT MAX(created_at) AS last_activity_at
      FROM activities a
      WHERE a.client_id = c.id
    ) la ON TRUE
    LEFT JOIN LATERAL (
      SELECT SUM(value) AS total_value
      FROM engagements e
      WHERE e.client_id = c.id
        AND (e.status IS NULL OR e.status = 'open')
    ) totals ON TRUE
    LEFT JOIN engagement_stage es ON es.client_id = c.id
    WHERE ${archivedFilter}
    ORDER BY c.updated_at DESC
    LIMIT $1
  `;

  const { rows } = await query<{
    id: string;
    name: string;
    owner: string | null;
    lifecycle: string | null;
    updated_at: string;
    last_activity_at: string | null;
    total_value: number | null;
    stage_id: string | null;
  }>(queryText, [limit]);

  return rows.map((row) => {
    const stageId = row.stage_id
      ? stageShape.lookup[row.stage_id]
        ? row.stage_id
        : STAGE_CATEGORY_MAP[row.stage_id] ?? stageShape.stages[0]?.id
      : stageShape.stages[0]?.id;
    return {
      id: row.id,
      name: row.name,
      owner: formatOwner(row.owner),
      status: normalizeLifecycle(row.lifecycle),
      stageId: stageId ?? stageShape.stages[0]?.id ?? "lead",
      lastActivity: formatRelativeTime(row.last_activity_at),
      value: row.total_value ? formatCurrency(row.total_value) : undefined,
    };
  });
}

export interface ClientDetailData {
  client: ClientDetailRow & { lifecycle: ClientLifecycle; owner: string };
  stage?: PipelineStage;
  valueLabel?: string;
  engagements: Array<{ id: string; title: string; status: string; updatedAt: string }>;
  activities: ActivityItem[];
}

export async function fetchClientDetail(clientId: string): Promise<ClientDetailData | null> {
  const cols = await getClientColumns();
  const ownerExpr = cols.ownerColumn ? `c.${cols.ownerColumn}` : `'${FALLBACK_OWNER}'::text`;
  const lifecycleExpr = `c.${cols.lifecycleColumn}`;
  const emailExpr = cols.emailColumn ? `c.${cols.emailColumn}` : "NULL";
  const phoneExpr = cols.phoneColumn ? `c.${cols.phoneColumn}` : "NULL";

  const { rows } = await query<ClientDetailRow>(
    `
      SELECT
        c.id,
        c.name,
        ${ownerExpr} AS owner,
        ${lifecycleExpr} AS lifecycle,
        c.company,
        c.notes,
        ${emailExpr} AS email,
        ${phoneExpr} AS phone,
        c.updated_at
      FROM clients c
      WHERE c.id = $1
      LIMIT 1
    `,
    [clientId],
  );
  const client = rows[0];
  if (!client) return null;

  const stageShape = await getStageShape();

  const { rows: engagementRows } = await query<{
    id: string;
    title: string;
    pipeline_stage: string | null;
    stage_id?: string | null;
    status: string | null;
    updated_at: string;
    value: number | null;
  }>(
    `
      SELECT
        e.id,
        e.title,
        ${stageShape.column === "stage_id" ? "e.stage_id" : "e.pipeline_stage"} AS stage_ref,
        e.status,
        e.updated_at,
        e.value
      FROM engagements e
      WHERE e.client_id = $1
      ORDER BY e.updated_at DESC
      LIMIT 25
    `,
    [clientId],
  );

  const activeStage = engagementRows[0]?.stage_ref
    ? stageShape.lookup[engagementRows[0].stage_ref] ??
      stageShape.lookup[STAGE_CATEGORY_MAP[engagementRows[0].stage_ref] ?? ""]
    : undefined;

  const totalValue = engagementRows
    .filter((row) => !row.status || row.status === "open")
    .reduce((sum, row) => sum + (row.value ?? 0), 0);

  const actorColumn = await getActivityActorColumn();
  const { rows: activityRows } = await query<{
    id: string;
    type: string | null;
    title?: string | null;
    description?: string | null;
    created_at: string;
    actor?: string | null;
  }>(
    `
      SELECT
        a.id,
        a.type,
        a.title,
        a.description,
        a.created_at,
        ${actorColumn ? `a.${actorColumn}` : "NULL"} AS actor
      FROM activities a
      WHERE a.client_id = $1
      ORDER BY a.created_at DESC
      LIMIT 10
    `,
    [clientId],
  );

  const activities: ActivityItem[] = activityRows.map((activity) => ({
    id: activity.id,
    summary: activity.title ?? activity.description ?? titleCase(activity.type ?? "Update"),
    owner: formatOwner(activity.actor, client.owner),
    occurredAt: formatRelativeTime(activity.created_at),
    type: mapActivityType(activity.type),
  }));

  return {
    client: {
      ...client,
      owner: formatOwner(client.owner),
      lifecycle: normalizeLifecycle(client.lifecycle),
    },
    stage: activeStage,
    valueLabel: totalValue ? formatCurrency(totalValue) : undefined,
    engagements: engagementRows.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status ?? "open",
      updatedAt: formatRelativeTime(row.updated_at),
    })),
    activities,
  };
}

export interface EngagementDetailData {
  engagement: {
    id: string;
    title: string;
    status: string;
    updatedAt: string;
    clientId: string;
    clientName: string;
  };
  stage?: PipelineStage;
  tasks: TaskSummary[];
}

export async function fetchEngagementDetail(engagementId: string): Promise<EngagementDetailData | null> {
  const cols = await getClientColumns();
  const ownerExpr = cols.ownerColumn ? `c.${cols.ownerColumn}` : `'${FALLBACK_OWNER}'::text`;
  const { rows } = await query<{
    id: string;
    title: string;
    status: string | null;
    pipeline_stage?: string | null;
    stage_id?: string | null;
    updated_at: string;
    client_id: string;
    client_name: string;
    owner: string | null;
  }>(
    `
      SELECT
        e.id,
        e.title,
        e.status,
        e.pipeline_stage,
        e.stage_id,
        e.updated_at,
        c.id AS client_id,
        c.name AS client_name,
        ${ownerExpr} AS owner
      FROM engagements e
      JOIN clients c ON c.id = e.client_id
      WHERE e.id = $1
      LIMIT 1
    `,
    [engagementId],
  );
  const engagement = rows[0];
  if (!engagement) return null;

  const stageShape = await getStageShape();
  const stageRef = stageShape.column === "stage_id" ? engagement.stage_id : engagement.pipeline_stage;
  const stage =
    stageRef && stageShape.lookup[stageRef]
      ? stageShape.lookup[stageRef]
      : stageShape.lookup[STAGE_CATEGORY_MAP[stageRef ?? ""] ?? ""];

  const dueColumn = await getTaskDueColumn();
  const { rows: taskRows } = await query<{
    id: string;
    title: string;
    status: string | null;
    due: string | null;
    client_name: string | null;
    created_at: string;
  }>(
    `
      SELECT
        t.id,
        t.title,
        t.status,
        ${dueColumn ? `t.${dueColumn}` : "NULL"} AS due,
        c.name AS client_name,
        t.created_at
      FROM tasks t
      LEFT JOIN clients c ON c.id = t.client_id
      WHERE t.engagement_id = $1
      ORDER BY t.created_at DESC
      LIMIT 25
    `,
    [engagementId],
  );

  const tasks: TaskSummary[] = taskRows.map((task) => ({
    id: task.id,
    title: task.title,
    owner: formatOwner(task.client_name),
    dueDate: task.due ? formatDate(task.due) : "No due date",
    status: mapTaskStatus(task.status),
  }));

  return {
    engagement: {
      id: engagement.id,
      title: engagement.title,
      status: engagement.status ?? "open",
      updatedAt: formatRelativeTime(engagement.updated_at),
      clientId: engagement.client_id,
      clientName: engagement.client_name,
    },
    stage,
    tasks,
  };
}

export async function fetchTasks(limit = 25): Promise<TaskSummary[]> {
  const dueColumn = await getTaskDueColumn();
  const cols = await getClientColumns();
  const ownerField = cols.ownerColumn ? `c.${cols.ownerColumn}` : "c.name";
  const { rows } = await query<{
    id: string;
    title: string;
    status: string | null;
    due: string | null;
    owner: string | null;
    related: string | null;
    created_at: string;
  }>(
    `
      SELECT
        t.id,
        t.title,
        t.status,
        ${dueColumn ? `t.${dueColumn}` : "NULL"} AS due,
        ${ownerField} AS owner,
        e.title AS related,
        t.created_at
      FROM tasks t
      LEFT JOIN clients c ON c.id = t.client_id
      LEFT JOIN engagements e ON e.id = t.engagement_id
      ORDER BY t.created_at DESC
      LIMIT $1
    `,
    [limit],
  );

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    owner: formatOwner(row.owner),
    dueDate: row.due ? formatDate(row.due) : "No due date",
    status: mapTaskStatus(row.status),
    relatedTo: row.related ?? undefined,
  }));
}

export async function fetchDocuments(limit = 20): Promise<DocumentSummary[]> {
  const hasStatus = await tableHasColumn("documents", "status");
  const cols = await getClientColumns();
  const ownerField = cols.ownerColumn ? `c.${cols.ownerColumn}` : "c.name";
  const { rows } = await query<{
    id: string;
    title: string;
    owner: string | null;
    status: string | null;
    updated_at: string;
  }>(
    `
      SELECT
        d.id,
        d.title,
        ${hasStatus ? "d.status" : "NULL"} AS status,
        ${ownerField} AS owner,
        d.updated_at
      FROM documents d
      LEFT JOIN clients c ON c.id = d.client_id
      ORDER BY d.updated_at DESC
      LIMIT $1
    `,
    [limit],
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.title,
    owner: formatOwner(row.owner),
    status: mapDocumentStatus(row.status),
    updatedAt: formatRelativeTime(row.updated_at),
  }));
}

export async function fetchTemplates(limit = 20): Promise<TemplateSummary[]> {
  const hasType = await tableHasColumn("templates", "type");
  const { rows } = await query<{
    id: string;
    name: string;
    category: string | null;
    updated_at: string;
  }>(
    `
      SELECT
        t.id,
        t.name,
        ${hasType ? "t.type" : "NULL"} AS category,
        t.updated_at
      FROM templates t
      ORDER BY t.updated_at DESC
      LIMIT $1
    `,
    [limit],
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category ? titleCase(row.category) : "General",
    updatedAt: formatRelativeTime(row.updated_at),
  }));
}

export async function fetchExternalAccounts(limit = 20): Promise<ExternalAccountSummary[]> {
  const hasAccountName = await tableHasColumn("external_accounts", "account_name");
  const hasAccountIdentifier = await tableHasColumn("external_accounts", "account_identifier");
  const hasStatus = await tableHasColumn("external_accounts", "status");

  const { rows } = await query<{
    id: string;
    provider: string;
    account_name: string | null;
    account_identifier: string | null;
    status: string | null;
    last_synced_at: string | null;
  }>(
    `
      SELECT
        ea.id,
        ea.provider,
        ${hasAccountName ? "ea.account_name" : "ea.label"} AS account_name,
        ${hasAccountIdentifier ? "ea.account_identifier" : "ea.external_id"} AS account_identifier,
        ${hasStatus ? "ea.status" : "CASE WHEN ea.is_active = true THEN 'connected' ELSE 'disconnected' END"} AS status,
        ea.last_synced_at
      FROM external_accounts ea
      ORDER BY ea.updated_at DESC
      LIMIT $1
    `,
    [limit],
  );

  return rows.map((row) => {
    const normalized = row.status?.toLowerCase();
    const status: ExternalAccountSummary["status"] =
      normalized === "error"
        ? "error"
        : normalized === "disconnected"
          ? "disconnected"
          : "connected";
    return {
      id: row.id,
      provider: titleCase(row.provider),
      accountName: row.account_name ?? row.account_identifier ?? row.provider,
      status,
      lastSync: row.last_synced_at ? formatRelativeTime(row.last_synced_at) : "Never",
    };
  });
}

export async function fetchActivityFeed(limit = 15): Promise<ActivityItem[]> {
  const actorColumn = await getActivityActorColumn();
  const hasTitle = await tableHasColumn("activities", "title");
  const { rows } = await query<{
    id: string;
    type: string | null;
    title: string | null;
    description: string | null;
    created_at: string;
    actor: string | null;
    client_name: string | null;
  }>(
    `
      SELECT
        a.id,
        a.type,
        ${hasTitle ? "a.title" : "NULL"} AS title,
        a.description,
        a.created_at,
        ${actorColumn ? `a.${actorColumn}` : "NULL"} AS actor,
        c.name AS client_name
      FROM activities a
      LEFT JOIN clients c ON c.id = a.client_id
      ORDER BY a.created_at DESC
      LIMIT $1
    `,
    [limit],
  );

  return rows.map((row) => ({
    id: row.id,
    summary: row.title ?? row.description ?? titleCase(row.type ?? "Update"),
    owner: formatOwner(row.actor, row.client_name ?? FALLBACK_OWNER),
    occurredAt: formatRelativeTime(row.created_at),
    type: mapActivityType(row.type),
  }));
}
