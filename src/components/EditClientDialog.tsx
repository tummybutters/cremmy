"use client";

import { useActionState, useEffect, useState } from "react";
import { updateClient, type CreateClientState } from "@/server/actions/clients";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { FormField } from "./FormField";
import { Input } from "./Input";
import { Select } from "./Select";

interface EditClientDialogProps {
    isOpen: boolean;
    onClose: () => void;
    client: {
        id: string;
        name: string;
        company?: string | null;
        email?: string | null;
        phone?: string | null;
        lifecycle: string;
        notes?: string | null;
    };
}

const initialState: CreateClientState = {
    error: {},
    success: false,
};

export function EditClientDialog({ isOpen, onClose, client }: EditClientDialogProps) {
    const updateAction = updateClient.bind(null, client.id);
    const [state, formAction, isPending] = useActionState(updateAction, initialState);

    useEffect(() => {
        if (state.success) {
            onClose();
        }
    }, [state.success, onClose]);

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Client"
            actions={
                <>
                    <Button variant="ghost" onClick={onClose} type="button">
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        form="edit-client-form"
                        disabled={isPending}
                    >
                        {isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </>
            }
        >
            <form
                id="edit-client-form"
                action={formAction}
                className="space-y-4"
            >
                <FormField label="Name" description="Company or contact name">
                    <Input
                        name="name"
                        defaultValue={client.name}
                        required
                    />
                    {state.error?.name && (
                        <p className="text-xs text-rose-400 mt-1">{state.error.name[0]}</p>
                    )}
                </FormField>

                <FormField label="Company" description="Optional company name">
                    <Input name="company" defaultValue={client.company || ""} />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                    <FormField label="Email">
                        <Input name="email" type="email" defaultValue={client.email || ""} />
                        {state.error?.email && (
                            <p className="text-xs text-rose-400 mt-1">{state.error.email[0]}</p>
                        )}
                    </FormField>

                    <FormField label="Phone">
                        <Input name="phone" type="tel" defaultValue={client.phone || ""} />
                    </FormField>
                </div>

                <FormField label="Lifecycle Stage">
                    <Select name="lifecycle" defaultValue={client.lifecycle}>
                        <option value="prospect">Prospect</option>
                        <option value="active">Active</option>
                        <option value="at-risk">At Risk</option>
                        <option value="inactive">Inactive</option>
                    </Select>
                </FormField>

                <FormField label="Notes">
                    <Input name="notes" defaultValue={client.notes || ""} />
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
