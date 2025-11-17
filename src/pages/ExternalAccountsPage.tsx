import { Card, PageHeader, Button } from "@/components";
import { ExternalAccountSummary } from "@/types/ui";

const accounts: ExternalAccountSummary[] = [
  {
    id: "acc-1",
    provider: "Gmail",
    accountName: "Jess Personal",
    status: "connected",
    lastSync: "5m ago",
  },
  {
    id: "acc-2",
    provider: "Google Drive",
    accountName: "Shared Docs",
    status: "error",
    lastSync: "2h ago",
  },
  {
    id: "acc-3",
    provider: "Calendar",
    accountName: "Main Calendar",
    status: "disconnected",
    lastSync: "1d ago",
  },
];

export default function ExternalAccountsPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        title="External Accounts"
        description="Connections that feed CRM data."
        actions={[{ label: "Connect Account" }]}
      />
      <p className="text-xs uppercase text-slate-400">
        TODO: wire to backend
      </p>
      <Card>
        <div className="divide-y divide-slate-100">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex flex-wrap items-center gap-3 py-4 text-sm"
            >
              <div className="flex-1">
                <p className="font-semibold text-slate-900">
                  {account.provider}
                </p>
                <p className="text-xs text-slate-500">
                  {account.accountName} · Last sync {account.lastSync}
                </p>
              </div>
              <span className="text-xs uppercase text-slate-500">
                {account.status}
              </span>
              <Button variant="ghost" size="sm">
                Manage
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}


