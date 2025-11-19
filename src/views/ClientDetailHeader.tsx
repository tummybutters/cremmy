"use client";

import { EditClientDialog, LogActivityDialog, PageHeader } from "@/components";
import { useState } from "react";

interface ClientDetailHeaderProps {
    client: {
        id: string;
        name: string;
        owner: string;
        lifecycle: string;
        company: string | null;
        notes?: string | null;
        email?: string | null;
        phone?: string | null;
    };
}

export function ClientDetailHeader({ client }: ClientDetailHeaderProps) {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isLogActivityOpen, setIsLogActivityOpen] = useState(false);

    return (
        <>
            <PageHeader
                title={client.name}
                description={`Owner ${client.owner}`}
                actions={[
                    {
                        label: "Edit Client",
                        onClick: () => setIsEditDialogOpen(true),
                    },
                    {
                        label: "Log Activity",
                        variant: "ghost",
                        onClick: () => setIsLogActivityOpen(true),
                    },
                ]}
            />
            <EditClientDialog
                isOpen={isEditDialogOpen}
                onClose={() => setIsEditDialogOpen(false)}
                client={client}
            />
            <LogActivityDialog
                isOpen={isLogActivityOpen}
                onClose={() => setIsLogActivityOpen(false)}
                clientId={client.id}
            />
        </>
    );
}
