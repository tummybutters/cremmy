import { Card, PageHeader, StageBadge, StatusTag } from "@/components";
import { fetchPipelineBoardData } from "@/data/crm";

export default async function PipelineBoardPage() {
  const { stages, dealsByStage } = await fetchPipelineBoardData();

  return (
    <section className="space-y-6">
      <PageHeader
        title="Pipeline Board"
        description="Track single-user deals and move clients through defined stages."
        actions={[
          { label: "Add Client", variant: "primary" },
          { label: "New Note", variant: "ghost" },
        ]}
      />
      <div className="flex flex-wrap gap-2 text-[0.6rem] uppercase tracking-[0.2em] text-slate-400">
          {["Today", "This week", "High Value", "At risk"].map((filter) => (
            <button key={filter} className="chip-premium bg-white/5 text-white/70 hover:text-white">
              {filter}
            </button>
          ))}
        </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {stages.map((stage) => {
          const stageDeals = dealsByStage[stage.id] ?? [];
          return (
            <Card
              key={stage.id}
              title={
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white/80">
                  {stage.label}
                </span>
              }
              description="Live snapshot"
              className="flex flex-col"
            >
              <div className="space-y-3">
                {stageDeals.length ? (
                  stageDeals.map((client) => (
                    <div
                      key={client.id}
                      className="group rounded-xl border border-white/10 bg-white/5 p-3 text-slate-200 transition hover:border-white/30 hover:bg-white/10"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {client.name}
                          </p>
                          <p className="mt-1 text-[0.65rem] text-slate-400">Owner {client.owner}</p>
                        </div>
                        <StatusTag status={client.status} />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[0.65rem] text-slate-400">
                        <span className="truncate">{client.lastActivity}</span>
                        <span className="font-semibold text-white/80">{client.value ?? "—"}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[0.7rem] uppercase tracking-[0.2em] text-white/40">
                    No deals in this stage
                  </p>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between text-[0.65rem] text-slate-400">
                <StageBadge stage={stage} />
                <span>Pending automation</span>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
