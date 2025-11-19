import { PageHeader } from "@/components";
import { ClientCard } from "./ClientCard";
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
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {clients.length ? (
          clients.map((client) => <ClientCard key={client.id} client={client} />)
        ) : (
          <div className="col-span-full py-12 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-white/40">
              No clients found
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
