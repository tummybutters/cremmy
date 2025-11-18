import { Card, PageHeader } from "@/components";
import { fetchActivityFeed } from "@/data/crm";

export default async function ActivitiesFeedPage() {
  const feed = await fetchActivityFeed();

  return (
    <section className="space-y-6">
      <PageHeader
        title="Activities"
        description="Chronological feed of CRM interactions."
        actions={[{ label: "Log Activity" }, { label: "Filter", variant: "ghost" }]}
      />
      <p className="text-xs uppercase text-slate-400">
        TODO: wire to backend
      </p>
      <Card>
        {feed.length ? (
          <ol className="space-y-4 text-sm text-slate-200">
            {feed.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <p className="font-semibold text-white">{item.summary}</p>
                <p className="text-[0.72rem] uppercase tracking-[0.18em] text-slate-400">
                  {item.type} · {item.owner} · {item.occurredAt}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="py-6 text-center text-sm uppercase tracking-[0.2em] text-white/40">
            No activity logged
          </p>
        )}
      </Card>
    </section>
  );
}
