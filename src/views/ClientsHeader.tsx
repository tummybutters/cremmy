"use client";

import { NewClientDialog, PageHeader } from "@/components";
import { useState } from "react";

export function ClientsHeader() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <>
            <PageHeader
                title="Clients"
                description="Single-user roster of client accounts."
                actions={[
                    {
                        label: "Add Client",
                        onClick: () => setIsDialogOpen(true),
                    },
                    {
                        label: "Import",
                        variant: "ghost",
                        onClick: () => console.log("Import clicked"),
                    },
                ]}
            />
            <NewClientDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
            />
        </>
    );
}
