import { Card, PageHeader, StageBadge, StatusTag } from "@/components";
import { ClientDetailHeader } from "./ClientDetailHeader";
import { fetchClientDetail } from "@/data/crm";
// import { fetchClientEmails } from "@/server/actions/email";

interface ClientDetailPageProps {
  clientId?: string;
}

export default async function ClientDetailPage({ clientId }: ClientDetailPageProps) {
  const detail = clientId ? await fetchClientDetail(clientId) : null;
  const emails: any[] = []; // TODO: Re-enable when googleapis bundling is fixed
  // const emails = clientId ? await fetchClientEmails(clientId) : [];

  return (
    <section className="space-y-6">
      {detail ? (
        <ClientDetailHeader client={detail.client} />
      ) : (
        <PageHeader
          title="Client"
          description="Select a client to view details."
        />
      )}
      <p className="text-xs uppercase text-slate-400">
        {detail ? "Live data from the workspace database." : "Select a record from the client list."}
      </p>
      {detail ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card title="Overview" className="md:col-span-2">
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-slate-400">Owner</p>
                  <p className="font-semibold text-white">{detail.client.owner}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Stage</p>
                  {detail.stage ? (
                    <StageBadge stage={detail.stage} />
                  ) : (
                    <p className="text-xs text-slate-500">Unassigned</p>
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Status</p>
                  <StatusTag status={detail.client.lifecycle} />
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Open Value</p>
                  <p className="font-semibold text-white">{detail.valueLabel ?? "—"}</p>
                </div>
              </div>
            </Card>
            <Card title="Profile">
              <ul className="space-y-3 text-sm text-slate-300">
                <li>Email: {detail.client.email ?? "—"}</li>
                <li>Phone: {detail.client.phone ?? "—"}</li>
                <li>Company: {detail.client.company ?? "—"}</li>
              </ul>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card title="Engagements">
              {detail.engagements.length ? (
                <ul className="space-y-3 text-sm text-slate-200">
                  {detail.engagements.map((item) => (
                    <li key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="font-semibold text-white">{item.title}</p>
                      <p className="text-xs text-slate-400">
                        Status: {item.status} · {item.updatedAt}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                  No engagements yet
                </p>
              )}
            </Card>
            <Card title="Recent Activity">
              {detail.activities.length ? (
                <ul className="space-y-3 text-sm text-slate-200">
                  {detail.activities.map((activity) => (
                    <li key={activity.id}>
                      <p className="font-medium text-white">{activity.summary}</p>
                      <p className="text-xs text-slate-400">
                        {activity.type} · {activity.owner} · {activity.occurredAt}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                  No activity yet
                </p>
              )}
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card title="Emails (Gmail)">
              {emails.length ? (
                <div className="space-y-4">
                  {emails.map((email) => (
                    <div key={email.id} className="border-b border-white/5 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{email.from}</span>
                        <span>{email.date}</span>
                      </div>
                      <p className="mt-1 font-medium text-white text-sm">{email.subject}</p>
                      <p className="mt-1 text-xs text-slate-400 line-clamp-2">{email.snippet}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                  No recent emails found
                </p>
              )}
            </Card>
            <Card title="Documents (Drive)">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                No documents found
              </p>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <p className="text-sm uppercase tracking-[0.2em] text-white/40">
            Choose a client from the list to load their record.
          </p>
        </Card>
      )}
    </section>
  );
}
