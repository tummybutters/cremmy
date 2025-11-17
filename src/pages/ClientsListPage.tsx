import { Card, PageHeader, StatusTag } from "@/components";
import { ClientSummary } from "@/types/ui";

const clients: ClientSummary[] = [
  {
    id: "client-1",
    name: "Northwind Analytics",
    owner: "Jess",
    status: "prospect",
    stageId: "stage-1",
    lastActivity: "Intro call scheduled",
    value: "$24K",
  },
  {
    id: "client-2",
    name: "Summit Holdings",
    owner: "Tom",
    status: "active",
    stageId: "stage-2",
    lastActivity: "Proposal sent",
    value: "$42K",
  },
  {
    id: "client-3",
    name: "Beacon Labs",
    owner: "Mona",
    status: "inactive",
    stageId: "stage-3",
    lastActivity: "Closed Sep 02",
    value: "$18K",
  },
];

export default function ClientsListPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        title="Clients"
        description="Single-user roster of client accounts."
        actions={[{ label: "Add Client" }, { label: "Import", variant: "ghost" }]}
      />
      <p className="text-xs uppercase text-slate-400">
        TODO: wire to backend
      </p>
      <Card>
        <div className="grid grid-cols-5 gap-4 border-b border-slate-100 pb-3 text-xs font-semibold uppercase text-slate-400">
          <span>Name</span>
          <span>Owner</span>
          <span>Status</span>
          <span>Last Activity</span>
          <span className="text-right">Value</span>
        </div>
        <div className="divide-y divide-slate-100">
          {clients.map((client) => (
            <div key={client.id} className="grid grid-cols-5 gap-4 py-4 text-sm">
              <span className="font-medium text-slate-900">{client.name}</span>
              <span className="text-slate-600">{client.owner}</span>
              <StatusTag status={client.status} />
              <span className="text-slate-500">{client.lastActivity}</span>
              <span className="text-right font-semibold text-slate-900">
                {client.value}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}


