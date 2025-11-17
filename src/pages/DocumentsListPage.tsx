import { Card, PageHeader } from "@/components";
import { DocumentSummary } from "@/types/ui";

const documents: DocumentSummary[] = [
  {
    id: "doc-1",
    name: "Harborwell Contract",
    owner: "Jess",
    status: "draft",
    updatedAt: "Today",
  },
  {
    id: "doc-2",
    name: "Summit Proposal",
    owner: "Tom",
    status: "review",
    updatedAt: "Yesterday",
  },
  {
    id: "doc-3",
    name: "Northwind SOW",
    owner: "Jess",
    status: "final",
    updatedAt: "Nov 05",
  },
];

export default function DocumentsListPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        title="Documents"
        description="Single-user document tracker."
        actions={[{ label: "Upload" }, { label: "New Doc", variant: "ghost" }]}
      />
      <p className="text-xs uppercase text-slate-400">
        TODO: wire to backend
      </p>
      <Card>
        <div className="grid grid-cols-4 gap-4 border-b border-slate-100 pb-3 text-xs font-semibold uppercase text-slate-400">
          <span>Name</span>
          <span>Owner</span>
          <span>Status</span>
          <span>Updated</span>
        </div>
        <div className="divide-y divide-slate-100">
          {documents.map((doc) => (
            <div key={doc.id} className="grid grid-cols-4 gap-4 py-3 text-sm">
              <span className="font-medium text-slate-900">{doc.name}</span>
              <span className="text-slate-600">{doc.owner}</span>
              <span className="text-slate-500 capitalize">{doc.status}</span>
              <span className="text-slate-500">{doc.updatedAt}</span>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}


