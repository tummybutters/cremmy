"use client";

import { useActionState, useEffect, useState } from "react";
import { createActivity, type CreateActivityState } from "@/server/actions/activities";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { FormField } from "./FormField";
import { Input } from "./Input";
import { Select } from "./Select";

interface LogActivityDialogProps {
    isOpen: boolean;
    onClose: () => void;
    clientId: string;
}

const initialState: CreateActivityState = {
    error: {},
    success: false,
};

export function LogActivityDialog({ isOpen, onClose, clientId }: LogActivityDialogProps) {
    const [state, formAction, isPending] = useActionState(createActivity, initialState);
    const [key, setKey] = useState(0);

    useEffect(() => {
        if (state.success) {
            onClose();
            setKey((k) => k + 1);
        }
    }, [state.success, onClose]);

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title="Log Activity"
            actions={
                <>
                    <Button variant="ghost" onClick={onClose} type="button">
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        form="log-activity-form"
                        disabled={isPending}
                    >
                        {isPending ? "Logging..." : "Log Activity"}
                    </Button>
                </>
            }
        >
            <form
                id="log-activity-form"
                action={formAction}
                className="space-y-4"
                key={key}
            >
                <input type="hidden" name="clientId" value={clientId} />

                <FormField label="Type">
                    <Select name="type" defaultValue="note_added">
                        <option value="note_added">Note</option>
                        <option value="call">Call</option>
                        <option value="email">Email</option>
                        <option value="meeting">Meeting</option>
                    </Select>
                </FormField>

                <FormField label="Title" description="Brief summary">
                    <Input
                        name="title"
                        placeholder="e.g. Weekly check-in"
                        required
                        autoFocus
                    />
                    {state.error?.title && (
                        <p className="text-xs text-rose-400 mt-1">{state.error.title[0]}</p>
                    )}
                </FormField>

                <FormField label="Description">
                    <textarea
                        name="description"
                        className="h-24 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-white/40 shadow-[0_15px_35px_rgba(0,0,0,0.45)] backdrop-blur-md focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                        placeholder="Details..."
                    />
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
