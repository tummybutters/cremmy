"use client";

import { NewClientDialog, PageHeader } from "@/components";
import type { PipelineStage } from "@/types/ui";
import { useState } from "react";

interface ClientsHeaderProps {
    stages: PipelineStage[];
}

export function ClientsHeader({ stages }: ClientsHeaderProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <>
            <PageHeader
                title="Clients"
                description="Single-user roster of client accounts."
            />
            <div className="flex flex-wrap gap-3 justify-end">
                <button
                    type="button"
                    onClick={() => setIsDialogOpen(true)}
                    className="button-premium text-xs tracking-[0.18em]"
                >
                    Add Client
                </button>
                <button
                    type="button"
                    onClick={() => console.log("Import clicked")}
                    className="button-ghost text-xs tracking-[0.18em] text-slate-200 border border-white/15 px-4 py-2 rounded-full"
                >
                    Import
                </button>
            </div>
            <NewClientDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                stages={stages}
            />
        </>
    );
}
