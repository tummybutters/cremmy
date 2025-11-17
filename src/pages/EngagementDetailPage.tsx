import { Card, PageHeader, StatusTag } from "@/components";
import { EngagementSummary, TaskSummary } from "@/types/ui";

interface EngagementDetailPageProps {
  engagementId?: string;
}

const engagement: EngagementSummary = {
  id: "eng-1",
  title: "Onboarding Implementation",
  clientName: "Harborwell Inc",
  status: "active",
  updatedAt: "Updated today",
};

const tasks: TaskSummary[] = [
  {
    id: "task-1",
    title: "Share kickoff agenda",
    owner: "Jess",
    dueDate: "Nov 15",
    status: "open",
    relatedTo: "Meeting",
  },
  {
    id: "task-2",
    title: "Compile requirements",
    owner: "Jess",
    dueDate: "Nov 18",
    status: "in-progress",
  },
];

export default function EngagementDetailPage({
  engagementId,
}: EngagementDetailPageProps) {
  return (
    <section className="space-y-6">
      <PageHeader
        title={engagement.title}
        description={`Engagement shell for ${engagementId ?? engagement.id}`}
        actions={[{ label: "Edit Plan" }, { label: "Log Update", variant: "ghost" }]}
      />
      <p className="text-xs uppercase text-slate-400">
        TODO: wire to backend
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Summary" className="md:col-span-2">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs uppercase text-slate-400">Client</dt>
              <dd className="font-semibold text-slate-900">
                {engagement.clientName}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Status</dt>
              <dd className="mt-1">
                <StatusTag status="active" />
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Updated</dt>
              <dd className="text-slate-600">{engagement.updatedAt}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Owner</dt>
              <dd className="text-slate-600">Jess (placeholder)</dd>
            </div>
          </dl>
        </Card>
        <Card title="Key Dates">
          <ul className="space-y-2 text-sm text-slate-600">
            <li>Kickoff: Nov 20</li>
            <li>Training: Dec 02</li>
            <li>Sign-off: Dec 15</li>
          </ul>
        </Card>
      </div>
      <Card title="Tasks" description="Tracking deliverables for this engagement.">
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="rounded-lg border border-slate-100 p-4 text-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-900">{task.title}</p>
                <span className="text-xs text-slate-500">{task.status}</span>
              </div>
              <p className="text-xs text-slate-500">
                Due {task.dueDate} · Owner {task.owner}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}


