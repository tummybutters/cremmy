import { Card, PageHeader, StageBadge, StatusTag } from "@/components";
import { ClientSummary, EngagementSummary, ActivityItem } from "@/types/ui";

interface ClientDetailPageProps {
  clientId?: string;
}

const client: ClientSummary = {
  id: "client-42",
  name: "Harborwell Inc",
  owner: "Jess",
  status: "active",
  stageId: "stage-3",
  lastActivity: "Contract review",
  value: "$68K",
};

const stage = { id: "stage-3", label: "Contract", color: "emerald", count: 1 };

const engagements: EngagementSummary[] = [
  {
    id: "eng-1",
    title: "Onboarding Implementation",
    clientName: client.name,
    status: "active",
    updatedAt: "Updated yesterday",
  },
];

const activities: ActivityItem[] = [
  {
    id: "act-1",
    summary: "Shared final contract draft",
    owner: "Jess",
    occurredAt: "Today 09:20",
    type: "email",
  },
  {
    id: "act-2",
    summary: "Coaching call recap",
    owner: "Jess",
    occurredAt: "Yesterday 16:00",
    type: "meeting",
  },
];

export default function ClientDetailPage({ clientId }: ClientDetailPageProps) {
  return (
    <section className="space-y-6">
      <PageHeader
        title={client.name}
        description={`Client detail shell for ${clientId ?? client.id}`}
        actions={[{ label: "Edit Client" }, { label: "Log Activity", variant: "ghost" }]}
      />
      <p className="text-xs uppercase text-slate-400">
        TODO: wire to backend
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Overview" className="md:col-span-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs uppercase text-slate-400">Owner</p>
              <p className="font-medium text-slate-900">{client.owner}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-400">Stage</p>
              <StageBadge stage={stage} />
            </div>
            <div>
              <p className="text-xs uppercase text-slate-400">Status</p>
              <StatusTag status={client.status} />
            </div>
            <div>
              <p className="text-xs uppercase text-slate-400">Value</p>
              <p className="font-semibold text-slate-900">{client.value}</p>
            </div>
          </div>
        </Card>
        <Card title="Profile">
          <ul className="space-y-3 text-sm text-slate-600">
            <li>Email: placeholder@example.com</li>
            <li>Phone: (000) 000-0000</li>
            <li>Industry: Placeholder</li>
          </ul>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Engagements">
          <ul className="space-y-3 text-sm">
            {engagements.map((item) => (
              <li key={item.id} className="rounded-lg border border-slate-100 p-3">
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500">
                  Status: {item.status} · {item.updatedAt}
                </p>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Recent Activity">
          <ul className="space-y-3 text-sm">
            {activities.map((activity) => (
              <li key={activity.id}>
                <p className="font-medium text-slate-900">{activity.summary}</p>
                <p className="text-xs text-slate-500">
                  {activity.type} · {activity.owner} · {activity.occurredAt}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </section>
  );
}


