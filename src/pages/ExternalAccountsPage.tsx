import { Card, PageHeader, Button } from "@/components";
import { fetchExternalAccounts } from "@/data/crm";

export default async function ExternalAccountsPage() {
  const accounts = await fetchExternalAccounts();

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
        {accounts.length ? (
          <div className="divide-y divide-white/5">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex flex-col gap-4 py-4 text-sm text-slate-200 sm:flex-row sm:items-center sm:gap-6"
              >
                <div className="flex-1">
                  <p className="font-semibold text-white">{account.provider}</p>
                  <p className="text-xs text-slate-400">
                    {account.accountName} · Last sync {account.lastSync}
                  </p>
                </div>
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/70 sm:text-right">
                  {account.status}
                </span>
                <Button variant="ghost" size="sm" block className="w-full sm:w-auto">
                  Manage
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm uppercase tracking-[0.2em] text-white/40">
            No connections yet
          </p>
        )}
      </Card>
    </section>
  );
}
