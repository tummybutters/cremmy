"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClientSummary } from "@/types/ui";
import { cn } from "@/utils/cn";
import { Dialog } from "@/components/Dialog";
import { Input } from "@/components/Input";
import { updateClient, deleteClient, type CreateClientState } from "@/server/actions/clients";

interface ClientCardProps {
  client: ClientSummary;
}

const initialState: CreateClientState = { error: {}, success: false };

export function ClientCard({ client }: ClientCardProps) {
  const isMonthly = client.payment_type === "monthly";
  const isOneTime = client.payment_type === "one_time";
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  const updateAction = updateClient.bind(null, client.id);
  const [state, formAction, isPending] = useActionState(updateAction, initialState);
  const deleteAction = deleteClient.bind(null, client.id);
  const [deleteState, deleteFormAction, isDeleting] = useActionState(deleteAction, initialState);

  useEffect(() => {
    if (state.success || deleteState.success) {
      setIsDialogOpen(false);
      router.refresh();
    }
  }, [state.success, deleteState.success, router]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsDialogOpen(true)}
        className="group relative flex w-full flex-col justify-between overflow-hidden rounded-xl border border-white/5 bg-slate-900/50 p-5 text-left transition-all hover:border-white/10 hover:bg-slate-900 hover:shadow-2xl hover:shadow-blue-900/20"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-white text-lg leading-tight">{client.name}</h3>
              {client.company && <p className="text-sm text-slate-400 mt-0.5">{client.company}</p>}
            </div>
            {client.payment_type && (
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                  isMonthly
                    ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                    : "bg-blue-500/10 text-blue-400 ring-blue-500/20",
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
                  : client.value ?? "—"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[0.65rem] uppercase tracking-wider font-semibold text-slate-500 mb-0.5">
              Last Contact
            </p>
            <p className="text-xs text-slate-400">
              {client.last_payment_date
                ? new Date(client.last_payment_date).toLocaleDateString()
                : "—"}
              {/* Note: Using last_payment_date as proxy for now, or we can compute from activities */}
            </p>
          </div>
        </div>
      </button>

      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Update services & value"
        actions={
          <>
            <button
              type="button"
              onClick={() => setIsDialogOpen(false)}
              className="button-ghost px-4 py-2 uppercase tracking-[0.15em] text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              form={`delete-client-${client.id}`}
              className="button-ghost px-4 py-2 uppercase tracking-[0.15em] text-xs text-rose-300 hover:text-rose-100"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
            <button
              type="submit"
              form={`quick-update-${client.id}`}
              className="button-premium px-5 py-2 text-xs"
              disabled={isPending}
            >
              {isPending ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <form id={`delete-client-${client.id}`} action={deleteFormAction}></form>
        <form id={`quick-update-${client.id}`} action={formAction} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Services Rendered
            </label>
            <textarea
              name="notes"
              defaultValue={client.description ?? ""}
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 shadow-[0_15px_35px_rgba(0,0,0,0.45)] backdrop-blur-md focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
              placeholder="e.g., GTM strategy, leadership advisory"
            />
            {state.error?.notes && (
              <p className="text-xs text-rose-400">{state.error.notes[0]}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Value (USD)
            </label>
            <Input
              name="custom_value"
              type="number"
              step="0.01"
              min="0"
              defaultValue={client.total_value ?? ""}
              placeholder="25000"
            />
            {state.error?.custom_value && (
              <p className="text-xs text-rose-400">{state.error.custom_value[0]}</p>
            )}
          </div>

            {state.error?._form && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                {state.error._form[0]}
              </div>
            )}
          {deleteState.error?._form && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
              {deleteState.error._form[0]}
            </div>
          )}
        </form>
      </Dialog>
    </>
  );
}
