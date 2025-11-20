"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, type CreateClientState } from "@/server/actions/clients";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { FormField } from "./FormField";
import { Input } from "./Input";
import { Select } from "./Select";
import type { PipelineStage } from "@/types/ui";

interface NewClientDialogProps {
    isOpen: boolean;
    onClose: () => void;
    stages: PipelineStage[];
}

const initialState: CreateClientState = {
    error: {},
    success: false,
};

const FALLBACK_STAGES: PipelineStage[] = [
    { id: "lead", label: "Lead", color: "slate", count: 0 },
    { id: "qualified", label: "Qualified", color: "blue", count: 0 },
    { id: "proposal", label: "Proposal", color: "amber", count: 0 },
    { id: "negotiation", label: "Negotiation", color: "purple", count: 0 },
    { id: "closed_won", label: "Closed Won", color: "emerald", count: 0 },
    { id: "closed_lost", label: "Closed Lost", color: "rose", count: 0 },
];

export function NewClientDialog({ isOpen, onClose, stages }: NewClientDialogProps) {
    const [state, formAction, isPending] = useActionState(createClient, initialState);
    const [key, setKey] = useState(0); // Force reset form on open/close
    const router = useRouter();
    const stageOptions = useMemo(() => (stages?.length ? stages : FALLBACK_STAGES), [stages]);
    const defaultStageId = stageOptions[0]?.id ?? "lead";

    useEffect(() => {
        if (state.success) {
            onClose();
            router.refresh();
            setKey((k) => k + 1); // Reset form
        }
    }, [state.success, onClose, router]);

    useEffect(() => {
        if (!isOpen) {
            // Optional: reset state when closed if needed, but key reset handles form inputs
        }
    }, [isOpen]);

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title="Add New Client"
            actions={
                <>
                    <Button variant="ghost" onClick={onClose} type="button">
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        form="create-client-form"
                        disabled={isPending}
                    >
                        {isPending ? "Creating..." : "Create Client"}
                    </Button>
                </>
            }
        >
            <form
                id="create-client-form"
                action={formAction}
                className="space-y-4"
                key={key}
            >
                <FormField label="Name" description="Company or contact name">
                    <Input
                        name="name"
                        placeholder="e.g. Acme Corp"
                        required
                        autoFocus
                    />
                    {state.error?.name && (
                        <p className="text-xs text-rose-400 mt-1">{state.error.name[0]}</p>
                    )}
                </FormField>

                <FormField label="Company" description="Optional company name">
                    <Input name="company" placeholder="e.g. Acme Corp" />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                    <FormField label="Email">
                        <Input name="email" type="email" placeholder="contact@example.com" />
                        {state.error?.email && (
                            <p className="text-xs text-rose-400 mt-1">{state.error.email[0]}</p>
                        )}
                    </FormField>

                    <FormField label="Phone">
                        <Input name="phone" type="tel" placeholder="+1 (555) 000-0000" />
                    </FormField>
                </div>

                <FormField label="Pipeline Stage" description="Pick where this client enters the deal flow">
                    <Select name="pipeline_stage" defaultValue={defaultStageId}>
                        {stageOptions.map((stage) => (
                            <option key={stage.id} value={stage.id}>
                                {stage.label}
                            </option>
                        ))}
                    </Select>
                    {state.error?.pipeline_stage && (
                        <p className="text-xs text-rose-400 mt-1">{state.error.pipeline_stage[0]}</p>
                    )}
                </FormField>

                <FormField label="Lifecycle Stage">
                    <Select name="lifecycle" defaultValue="prospect">
                        <option value="prospect">Prospect</option>
                        <option value="active">Active</option>
                        <option value="at-risk">At Risk</option>
                        <option value="inactive">Inactive</option>
                    </Select>
                </FormField>

                <FormField label="Notes">
                    <Input name="notes" placeholder="Initial notes..." />
                </FormField>

                {state.error?._form && (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm">
                        {state.error._form[0]}
                    </div>
                )}
            </form>
        </Dialog>
    );
}
