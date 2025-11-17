import { Card, PageHeader, Button } from "@/components";
import { TemplateSummary } from "@/types/ui";

const templates: TemplateSummary[] = [
  { id: "tmp-1", name: "Introduction Email", category: "Email", updatedAt: "Nov 10" },
  { id: "tmp-2", name: "Implementation Plan", category: "Document", updatedAt: "Nov 08" },
  { id: "tmp-3", name: "Renewal Reminder", category: "Email", updatedAt: "Nov 05" },
];

export default function TemplatesListPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        title="Templates"
        description="Reusable touchpoints for single-user workflows."
        actions={[{ label: "New Template" }]}
      />
      <p className="text-xs uppercase text-slate-400">
        TODO: wire to backend
      </p>
      <Card>
        <div className="divide-y divide-slate-100">
          {templates.map((template) => (
            <div
              key={template.id}
              className="flex flex-wrap items-center gap-3 py-4 text-sm"
            >
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{template.name}</p>
                <p className="text-xs text-slate-500">
                  {template.category} · Updated {template.updatedAt}
                </p>
              </div>
              <Button variant="ghost" size="sm">
                Open
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}


