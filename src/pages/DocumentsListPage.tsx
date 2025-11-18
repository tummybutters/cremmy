import { Card, PageHeader } from "@/components";
import { fetchDocuments } from "@/data/crm";

export default async function DocumentsListPage() {
  const documents = await fetchDocuments();

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
        <div className="hidden grid-cols-[minmax(0,2fr),repeat(3,minmax(0,1fr))] gap-4 border-b border-white/10 pb-3 text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-slate-400 md:grid">
          <span>Name</span>
          <span>Owner</span>
          <span>Status</span>
          <span>Updated</span>
        </div>
        {documents.length ? (
          <div className="divide-y divide-white/5">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col gap-4 py-4 text-sm text-slate-200 md:grid md:grid-cols-[minmax(0,2fr),repeat(3,minmax(0,1fr))] md:items-center md:gap-4"
              >
                <div>
                  <p className="mb-1 text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-slate-500 md:hidden">
                    Name
                  </p>
                  <p className="font-semibold text-white">{doc.name}</p>
                </div>
                <div>
                  <p className="mb-1 text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-slate-500 md:hidden">
                    Owner
                  </p>
                  <p className="text-slate-400">{doc.owner}</p>
                </div>
                <div>
                  <p className="mb-1 text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-slate-500 md:hidden">
                    Status
                  </p>
                  <p className="capitalize text-slate-300">{doc.status}</p>
                </div>
                <div className="md:text-right">
                  <p className="mb-1 text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-slate-500 md:hidden">
                    Updated
                  </p>
                  <p className="text-slate-400">{doc.updatedAt}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm uppercase tracking-[0.2em] text-white/40">
            No documents yet
          </p>
        )}
      </Card>
    </section>
  );
}
