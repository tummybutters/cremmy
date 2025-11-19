import { ClientSummary } from "@/types/ui";
import { cn } from "@/utils/cn";

interface ClientCardProps {
    client: ClientSummary;
}

export function ClientCard({ client }: ClientCardProps) {
    const isMonthly = client.payment_type === 'monthly';
    const isOneTime = client.payment_type === 'one_time';

    return (
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-white/5 bg-slate-900/50 p-5 transition-all hover:border-white/10 hover:bg-slate-900 hover:shadow-2xl hover:shadow-blue-900/20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

            <div className="relative z-10 space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="font-semibold text-white text-lg leading-tight">{client.name}</h3>
                        {client.company && (
                            <p className="text-sm text-slate-400 mt-0.5">{client.company}</p>
                        )}
                    </div>
                    {client.payment_type && (
                        <span
                            className={cn(
                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                                isMonthly
                                    ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                                    : "bg-blue-500/10 text-blue-400 ring-blue-500/20"
                            )}
                        >
                            {isMonthly ? "Monthly Retainer" : "One-time Project"}
                        </span>
                    )}
                </div>

                <div className="space-y-1.5">
                    <p className="text-[0.65rem] uppercase tracking-wider font-semibold text-slate-500">
                        Services Rendered
                    </p>
                    <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">
                        {client.description || "No services listed."}
                    </p>
                </div>
            </div>

            <div className="relative z-10 mt-6 flex items-end justify-between border-t border-white/5 pt-4">
                <div>
                    <p className="text-[0.65rem] uppercase tracking-wider font-semibold text-slate-500 mb-0.5">
                        Value
                    </p>
                    <p className="text-xl font-bold text-white">
                        {isMonthly && client.recurring_amount
                            ? `$${client.recurring_amount}/mo`
                            : client.total_value
                                ? `$${client.total_value.toLocaleString()}`
                                : "—"}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[0.65rem] uppercase tracking-wider font-semibold text-slate-500 mb-0.5">
                        Last Contact
                    </p>
                    <p className="text-xs text-slate-400">
                        {client.last_payment_date ? new Date(client.last_payment_date).toLocaleDateString() : "—"}
                        {/* Note: Using last_payment_date as proxy for now, or we can compute from activities */}
                    </p>
                </div>
            </div>
        </div>
    );
}
