import { Card, PageHeader, StatusTag, StageBadge } from "@/components";
import { fetchEngagementDetail } from "@/data/crm";

interface EngagementDetailPageProps {
  engagementId?: string;
}

export default async function EngagementDetailPage({
  engagementId,
}: EngagementDetailPageProps) {
  const detail = engagementId ? await fetchEngagementDetail(engagementId) : null;

  return (
    <section className="space-y-6">
      <PageHeader
        title={detail?.engagement.title ?? "Engagement"}
        description={detail ? `Client ${detail.engagement.clientName}` : "Select an engagement to view details."}
        actions={[{ label: "Edit Plan" }, { label: "Log Update", variant: "ghost" }]}
      />
      <p className="text-xs uppercase text-slate-400">
        {detail ? "Live engagement data" : "Waiting for selection"}
      </p>
      {detail ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card title="Summary" className="md:col-span-2">
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs uppercase text-slate-400">Client</dt>
                  <dd className="font-semibold text-white">
                    {detail.engagement.clientName}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-slate-400">Status</dt>
                  <dd className="mt-1">
                    <StatusTag status={detail.engagement.status === "open" ? "active" : "inactive"} />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-slate-400">Updated</dt>
                  <dd className="text-slate-400">{detail.engagement.updatedAt}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-slate-400">Stage</dt>
                  {detail.stage ? (
                    <dd className="mt-1">
                      <StageBadge stage={detail.stage} />
                    </dd>
                  ) : (
                    <dd className="text-slate-400">Unassigned</dd>
                  )}
                </div>
              </dl>
            </Card>
            <Card title="Key Facts">
              <ul className="space-y-2 text-sm text-slate-300">
                <li>ID: {detail.engagement.id}</li>
                <li>Client ID: {detail.engagement.clientId}</li>
                <li>Status: {detail.engagement.status}</li>
              </ul>
            </Card>
          </div>
          <Card title="Tasks" description="Tracking deliverables for this engagement.">
            {detail.tasks.length ? (
              <div className="space-y-3">
                {detail.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-white">{task.title}</p>
                      <span className="text-[0.65rem] uppercase tracking-[0.2em] text-white/70">
                        {task.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Due {task.dueDate} · Owner {task.owner}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                No tasks yet
              </p>
            )}
          </Card>
        </>
      ) : (
        <Card>
          <p className="text-sm uppercase tracking-[0.2em] text-white/40">
            Choose an engagement from the pipeline to load this view.
          </p>
        </Card>
      )}
    </section>
  );
}
