import { Card, PageHeader } from "@/components";
import { ActivityItem } from "@/types/ui";

const feed: ActivityItem[] = [
  {
    id: "act-1",
    summary: "Jess logged a call with Harborwell",
    owner: "Jess",
    occurredAt: "Today 10:10",
    type: "call",
  },
  {
    id: "act-2",
    summary: "Template sent to Northwind",
    owner: "Jess",
    occurredAt: "Yesterday 17:25",
    type: "email",
  },
  {
    id: "act-3",
    summary: "Summit added to pipeline",
    owner: "Jess",
    occurredAt: "Yesterday 14:05",
    type: "note",
  },
];

export default function ActivitiesFeedPage() {
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
        <ol className="space-y-4 text-sm">
          {feed.map((item) => (
            <li key={item.id} className="rounded-lg border border-slate-100 p-4">
              <p className="font-medium text-slate-900">{item.summary}</p>
              <p className="text-xs text-slate-500">
                {item.type} · {item.owner} · {item.occurredAt}
              </p>
            </li>
          ))}
        </ol>
      </Card>
    </section>
  );
}


