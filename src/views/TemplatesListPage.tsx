import { Card, PageHeader, Button } from "@/components";
import { fetchTemplates } from "@/data/crm";

export default async function TemplatesListPage() {
  const templates = await fetchTemplates();

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
        {templates.length ? (
          <div className="divide-y divide-white/5">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex flex-col gap-3 py-4 text-sm text-slate-200 sm:flex-row sm:items-center"
              >
                <div className="flex-1">
                  <p className="font-semibold text-white">{template.name}</p>
                  <p className="text-xs text-slate-400">
                    {template.category} · Updated {template.updatedAt}
                  </p>
                </div>
                <Button variant="ghost" size="sm" block className="w-full sm:w-auto">
                  Open
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm uppercase tracking-[0.2em] text-white/40">
            No templates yet
          </p>
        )}
      </Card>
    </section>
  );
}
