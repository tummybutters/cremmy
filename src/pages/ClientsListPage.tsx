import { Card, PageHeader, StatusTag } from "@/components";
import { fetchClients } from "@/data/crm";

export default async function ClientsListPage() {
  const clients = await fetchClients();

  return (
    <section className="space-y-6">
      <PageHeader
        title="Clients"
        description="Single-user roster of client accounts."
        actions={[{ label: "Add Client" }, { label: "Import", variant: "ghost" }]}
      />
      <div className="flex flex-wrap gap-2 text-[0.6rem] uppercase tracking-[0.2em] text-slate-400">
        {["All", "Prospects", "Active", "At risk"].map((filter) => (
          <button key={filter} className="chip-premium bg-white/5 text-white/70 hover:text-white">
            {filter}
          </button>
        ))}
      </div>
      <Card>
        <div className="hidden grid-cols-[minmax(0,2fr),repeat(4,minmax(0,1fr))] gap-4 border-b border-white/10 pb-2 text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-slate-400 md:grid">
          <span>Client</span>
          <span>Owner</span>
          <span>Lifecycle</span>
          <span>Last Activity</span>
          <span className="text-right">Value</span>
        </div>
        {clients.length ? (
          <div className="divide-y divide-white/5">
            {clients.map((client) => (
              <div
                key={client.id}
                className="group flex flex-col gap-4 py-4 text-sm text-slate-200 transition hover:text-white md:grid md:grid-cols-[minmax(0,2fr),repeat(4,minmax(0,1fr))] md:items-center md:gap-4"
              >
                <div>
                  <p className="mb-1 text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-slate-500 md:hidden">
                    Client
                  </p>
                  <p className="truncate text-base font-semibold text-white">{client.name}</p>
                </div>
                <div>
                  <p className="mb-1 text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-slate-500 md:hidden">
                    Owner
                  </p>
                  <p className="truncate text-slate-400 group-hover:text-white/80">
                    {client.owner}
                  </p>
                </div>
                <div className="flex items-center">
                  <p className="mb-1 text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-slate-500 md:hidden">
                    Lifecycle
                  </p>
                  <StatusTag status={client.status} />
                </div>
                <div>
                  <p className="mb-1 text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-slate-500 md:hidden">
                    Last Activity
                  </p>
                  <p className="truncate text-slate-400 group-hover:text-white/80">
                    {client.lastActivity}
                  </p>
                </div>
                <div className="md:text-right">
                  <p className="mb-1 text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-slate-500 md:hidden">
                    Value
                  </p>
                  <p className="text-base font-semibold text-white">{client.value ?? "—"}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm uppercase tracking-[0.2em] text-white/40">
            No clients found
          </p>
        )}
      </Card>
    </section>
  );
}
