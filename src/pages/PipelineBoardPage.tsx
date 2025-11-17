import { Card, PageHeader, StageBadge, StatusTag } from "@/components";
import { ClientSummary, PipelineStage } from "@/types/ui";

const mockStages: PipelineStage[] = [
  { id: "stage-1", label: "New Lead", count: 3, color: "blue" },
  { id: "stage-2", label: "Qualified", count: 2, color: "amber" },
  { id: "stage-3", label: "Contract", count: 1, color: "emerald" },
];

const mockClients: ClientSummary[] = [
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
    status: "at-risk",
    stageId: "stage-2",
    lastActivity: "Awaiting feedback",
    value: "$18K",
  },
  {
    id: "client-4",
    name: "Harborwell Inc",
    owner: "Jess",
    status: "active",
    stageId: "stage-3",
    lastActivity: "Contract review",
    value: "$68K",
  },
];

export default function PipelineBoardPage() {
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
      <p className="text-xs uppercase text-slate-400">
        TODO: wire to backend
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {mockStages.map((stage) => (
          <Card
            key={stage.id}
            title={
              <span className="flex items-center justify-between text-sm font-semibold text-slate-900">
                {stage.label}
                <span className="text-xs text-slate-400">{stage.count} open</span>
              </span>
            }
            description="Placeholder summary"
            className="flex flex-col"
          >
            <div className="space-y-3">
              {mockClients
                .filter((client) => client.stageId === stage.id)
                .map((client) => (
                  <div
                    key={client.id}
                    className="rounded-lg border border-slate-100 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {client.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          Owner: {client.owner}
                        </p>
                      </div>
                      <StatusTag status={client.status} />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                      <span>{client.lastActivity}</span>
                      <span className="font-semibold text-slate-700">
                        {client.value}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
            <div className="mt-4 text-xs text-slate-400">
              <StageBadge stage={stage} /> Stage configured placeholder
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

