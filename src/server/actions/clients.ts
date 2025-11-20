"use server";

import { query, tableExists, tableHasColumn } from "@/data/db";
import { getStageShape } from "@/data/crm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createClientSchema = z.object({
    name: z.string().min(1, "Name is required"),
    company: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().optional(),
    lifecycle: z.enum(["prospect", "active", "at-risk", "inactive"]).default("prospect"),
    notes: z.string().optional(),
    custom_value: z.union([z.string(), z.number()]).optional(),
    pipeline_stage: z.string().optional(),
});

export type CreateClientState = {
    error?: {
        name?: string[];
        company?: string[];
        email?: string[];
        phone?: string[];
        lifecycle?: string[];
        notes?: string[];
        custom_value?: string[];
        pipeline_stage?: string[];
        _form?: string[];
    };
    success?: boolean;
    clientId?: string;
};

export async function createClient(
    prevState: CreateClientState,
    formData: FormData
): Promise<CreateClientState> {
    const rawData = {
        name: formData.get("name"),
        company: formData.get("company"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        lifecycle: formData.get("lifecycle") || "prospect",
        notes: formData.get("notes"),
        custom_value: formData.get("custom_value"),
        pipeline_stage: formData.get("pipeline_stage"),
    };

    const validatedData = createClientSchema.safeParse(rawData);

    if (!validatedData.success) {
        return {
            error: validatedData.error.flatten().fieldErrors,
        };
    }

    const { name, company, email, phone, lifecycle, notes, custom_value, pipeline_stage } = validatedData.data;

    try {
        const hasClientsTable = await tableExists("clients");
        if (!hasClientsTable) {
            return { error: { _form: ["Clients table is missing in the database"] } };
        }

        // Detect column presence so we don't explode if schemas differ locally.
        const [
            hasLifecycle,
            hasLifecycleStage,
            hasCompany,
            hasEmail,
            hasPhone,
            hasNotesColumn,
            hasCustomValueColumn,
            hasEngagementsTable,
            hasStageIdColumn,
            hasStageTextColumn,
            hasEngagementStatus,
            hasActivitiesTable,
        ] = await Promise.all([
            tableHasColumn("clients", "lifecycle"),
            tableHasColumn("clients", "lifecycle_stage"),
            tableHasColumn("clients", "company"),
            tableHasColumn("clients", "email"),
            tableHasColumn("clients", "phone"),
            tableHasColumn("clients", "notes"),
            tableHasColumn("clients", "custom_value"),
            tableExists("engagements"),
            tableHasColumn("engagements", "stage_id"),
            tableHasColumn("engagements", "pipeline_stage"),
            tableHasColumn("engagements", "status"),
            tableExists("activities"),
        ]);

        const lifecycleColumn = hasLifecycle ? "lifecycle" : hasLifecycleStage ? "lifecycle_stage" : null;

        const columns: string[] = ["name"];
        const placeholders: string[] = ["$1"];
        const values: any[] = [String(name).trim()];

        if (hasCompany) {
            columns.push("company");
            placeholders.push(`$${placeholders.length + 1}`);
            values.push(company ? String(company).trim() : null);
        }

        if (hasEmail) {
            columns.push("email");
            placeholders.push(`$${placeholders.length + 1}`);
            values.push(email ? String(email).trim() : null);
        }

        if (hasPhone) {
            columns.push("phone");
            placeholders.push(`$${placeholders.length + 1}`);
            values.push(phone ? String(phone).trim() : null);
        }

        if (lifecycleColumn) {
            columns.push(lifecycleColumn);
            placeholders.push(`$${placeholders.length + 1}`);
            values.push(String(lifecycle));
        }

        if (hasNotesColumn) {
            columns.push("notes");
            placeholders.push(`$${placeholders.length + 1}`);
            values.push(notes ? String(notes).trim() : null);
        }

        if (hasCustomValueColumn) {
            const parsedValue =
                custom_value === undefined || custom_value === null || custom_value === ""
                    ? null
                    : Number(custom_value);
            if (parsedValue !== null && Number.isNaN(parsedValue)) {
                return { error: { custom_value: ["Value must be a number"] } };
            }
            columns.push("custom_value");
            placeholders.push(`$${placeholders.length + 1}`);
            values.push(parsedValue);
        }

        const { rows } = await query(
            `
      INSERT INTO clients (${columns.join(", ")})
      VALUES (${placeholders.join(", ")})
      RETURNING id
      `,
            values,
        );

        const newClientId = rows[0].id;
        let createdEngagementId: string | undefined;

        if (hasEngagementsTable && (hasStageIdColumn || hasStageTextColumn)) {
            try {
                const stageShape = await getStageShape();
                const stageColumn =
                    stageShape.column === "stage_id" && hasStageIdColumn
                        ? "stage_id"
                        : stageShape.column === "pipeline_stage" && hasStageTextColumn
                            ? "pipeline_stage"
                            : null;
                const selectedStage =
                    pipeline_stage && stageShape.lookup[pipeline_stage]
                        ? pipeline_stage
                        : stageShape.stages[0]?.id;

                if (stageColumn && selectedStage) {
                    const engagementColumns = ["title", "client_id", stageColumn];
                    const engagementValues: any[] = [
                        `${String(name).trim()} Deal`,
                        newClientId,
                        selectedStage,
                    ];
                    const engagementPlaceholders = engagementColumns.map((_, idx) => `$${idx + 1}`);

                    if (hasEngagementStatus) {
                        engagementColumns.push("status");
                        engagementValues.push("open");
                        engagementPlaceholders.push(`$${engagementPlaceholders.length + 1}`);
                    }

                    const engagementResult = await query(
                        `
          INSERT INTO engagements (${engagementColumns.join(", ")})
          VALUES (${engagementPlaceholders.join(", ")})
          RETURNING id
          `,
                        engagementValues,
                    );

                    createdEngagementId = engagementResult.rows[0]?.id;
                }
            } catch (err) {
                console.warn("Engagement creation skipped due to stage mismatch", err);
            }
        }

        // Log activity if the table exists; don't block client creation on this.
        try {
            if (hasActivitiesTable) {
                await query(
                    `
          INSERT INTO activities (type, title, description, client_id)
          VALUES ($1, $2, $3, $4)
          `,
                    ["client_created", "Client Created", `Created client ${name}`, newClientId],
                );
                if (createdEngagementId) {
                    await query(
                        `
          INSERT INTO activities (type, title, description, client_id, engagement_id)
          VALUES ($1, $2, $3, $4, $5)
          `,
                        ["engagement_created", "Engagement Created", `Created initial engagement for ${name}`, newClientId, createdEngagementId],
                    );
                }
            }
        } catch (error) {
            console.warn("Activity log failed; continuing without blocking client creation", error);
        }

        revalidatePath("/clients");
        revalidatePath("/");
        revalidatePath("/pipeline");
        return { success: true, clientId: newClientId };
    } catch (error) {
        console.error("Failed to create client:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
            error: { _form: [`Failed to create client. ${message}`] },
        };
    }
}

const updateClientSchema = createClientSchema.partial();

export async function updateClient(
    clientId: string,
    prevState: CreateClientState,
    formData: FormData
): Promise<CreateClientState> {
    const rawData = {
        name: formData.get("name"),
        company: formData.get("company"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        lifecycle: formData.get("lifecycle"),
        notes: formData.get("notes"),
        custom_value: formData.get("custom_value"),
    };

    const validatedData = updateClientSchema.safeParse(rawData);

    if (!validatedData.success) {
        return {
            error: validatedData.error.flatten().fieldErrors,
        };
    }

    const { name, company, email, phone, lifecycle, notes, custom_value } = validatedData.data;

    try {
        const [hasLifecycle, hasLifecycleStage, hasNotesColumn, hasCustomValueColumn, hasActivities] = await Promise.all([
            tableHasColumn("clients", "lifecycle"),
            tableHasColumn("clients", "lifecycle_stage"),
            tableHasColumn("clients", "notes"),
            tableHasColumn("clients", "custom_value"),
            tableExists("activities"),
        ]);
        const lifecycleColumn = hasLifecycle ? "lifecycle" : hasLifecycleStage ? "lifecycle_stage" : null;
        if (!lifecycleColumn) {
            return {
                error: { _form: ["Clients table is missing lifecycle/lifecycle_stage column"] },
            };
        }

        const parsedCustomValue =
            custom_value === undefined || custom_value === null || custom_value === ""
                ? null
                : Number(custom_value);

        if (parsedCustomValue !== null && Number.isNaN(parsedCustomValue)) {
            return {
                error: { custom_value: ["Value must be a number"], _form: [] },
            };
        }

        // Build dynamic update query
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (name) { updates.push(`name = $${paramIndex++}`); values.push(String(name).trim()); }
        if (company !== undefined) { updates.push(`company = $${paramIndex++}`); values.push(company ? String(company).trim() : null); }
        if (email !== undefined) { updates.push(`email = $${paramIndex++}`); values.push(email ? String(email).trim() : null); }
        if (phone !== undefined) { updates.push(`phone = $${paramIndex++}`); values.push(phone ? String(phone).trim() : null); }
        if (lifecycle && lifecycleColumn) { updates.push(`${lifecycleColumn} = $${paramIndex++}`); values.push(lifecycle); }
        if (hasNotesColumn && notes !== undefined) { updates.push(`notes = $${paramIndex++}`); values.push(notes ? String(notes).trim() : null); }
        if (hasCustomValueColumn && custom_value !== undefined) {
            updates.push(`custom_value = $${paramIndex++}`);
            values.push(parsedCustomValue);
        }

        if (updates.length === 0) return { success: true, clientId };

        values.push(clientId);
        await query(
            `UPDATE clients SET ${updates.join(", ")} WHERE id = $${paramIndex}`,
            values
        );

        if (hasActivities) {
            try {
                await query(
                    `
          INSERT INTO activities (type, title, description, client_id)
          VALUES ($1, $2, $3, $4)
          `,
                    ["client_updated", "Client Updated", `Updated client details`, clientId]
                );
            } catch (err) {
                console.warn("Activity log failed; update succeeded", err);
            }
        }

        revalidatePath("/clients");
        revalidatePath(`/clients/${clientId}`);
        revalidatePath("/");
        revalidatePath("/pipeline");
        return { success: true, clientId };
    } catch (error) {
        console.error("Failed to update client:", error);
        return {
            error: { _form: ["Failed to update client. Please try again."] },
        };
    }
};

export async function deleteClient(clientId: string): Promise<CreateClientState> {
    if (!clientId) {
        return { error: { _form: ["Client ID is required"] } };
    }

    try {
        const result = await query(
            `DELETE FROM clients WHERE id = $1 RETURNING id`,
            [clientId]
        );

        if (result.rowCount === 0) {
            return { error: { _form: ["Client not found"] } };
        }

        revalidatePath("/clients");
        revalidatePath("/");
        revalidatePath("/pipeline");
        revalidatePath(`/clients/${clientId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to delete client:", error);
        return { error: { _form: ["Failed to delete client. Please try again."] } };
    }
}
