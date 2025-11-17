export type StageColor =
  | "slate"
  | "blue"
  | "amber"
  | "emerald"
  | "rose"
  | "purple";

export interface PipelineStage {
  id: string;
  label: string;
  count: number;
  color: StageColor;
  description?: string;
}

export type ClientLifecycle = "prospect" | "active" | "at-risk" | "inactive";

export interface ClientSummary {
  id: string;
  name: string;
  owner: string;
  status: ClientLifecycle;
  stageId: string;
  lastActivity: string;
  value?: string;
}

export interface EngagementSummary {
  id: string;
  title: string;
  clientName: string;
  status: "planning" | "active" | "on-hold" | "closed";
  updatedAt: string;
}

export interface TaskSummary {
  id: string;
  title: string;
  owner: string;
  dueDate: string;
  status: "open" | "in-progress" | "completed";
  relatedTo?: string;
}

export interface ActivityItem {
  id: string;
  summary: string;
  owner: string;
  occurredAt: string;
  type: "note" | "email" | "call" | "meeting";
}

export interface TemplateSummary {
  id: string;
  name: string;
  category: string;
  updatedAt: string;
}

export interface DocumentSummary {
  id: string;
  name: string;
  owner: string;
  status: "draft" | "review" | "final";
  updatedAt: string;
}

export interface ExternalAccountSummary {
  id: string;
  provider: string;
  accountName: string;
  status: "connected" | "error" | "disconnected";
  lastSync: string;
}


