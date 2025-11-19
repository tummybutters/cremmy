"use server";

import { query } from "@/data/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createActivitySchema = z.object({
    clientId: z.string().uuid(),
    type: z.enum([
        "note_added",
        "call",
        "email",
        "meeting",
    ]).default("note_added"),
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
});

export type CreateActivityState = {
    error?: {
        clientId?: string[];
        type?: string[];
        title?: string[];
        description?: string[];
        _form?: string[];
    };
    success?: boolean;
};

export async function createActivity(
    prevState: CreateActivityState,
    formData: FormData
): Promise<CreateActivityState> {
    const rawData = {
        clientId: formData.get("clientId"),
        type: formData.get("type"),
        title: formData.get("title"),
        description: formData.get("description"),
    };

    const validatedData = createActivitySchema.safeParse(rawData);

    if (!validatedData.success) {
        return {
            error: validatedData.error.flatten().fieldErrors,
        };
    }

    const { clientId, type, title, description } = validatedData.data;

    // Map UI types to DB types if needed
    // DB types: 'client_created', 'client_updated', 'engagement_created', 'engagement_updated', 'engagement_stage_changed', 'task_created', 'task_completed', 'document_uploaded', 'note_added'
    // We'll use 'note_added' for generic notes/activities for now, or we might need to expand DB types.
    // The migration says: CHECK (type IN ('client_created', ..., 'note_added'))
    // So 'call', 'email', 'meeting' are NOT in the check constraint?
    // Let's check supabase_migration.sql again.

    // Line 68: CHECK (type IN ('client_created', 'client_updated', 'engagement_created', 'engagement_updated', 'engagement_stage_changed', 'task_created', 'task_completed', 'document_uploaded', 'note_added'))

    // So I can only use 'note_added' for now unless I update the constraint.
    // I'll just use 'note_added' and put the actual type in metadata or title prefix.

    const dbType = "note_added";
    const finalTitle = type === "note_added" ? title : `[${type.toUpperCase()}] ${title}`;

    try {
        await query(
            `
      INSERT INTO activities (type, title, description, client_id)
      VALUES ($1, $2, $3, $4)
      `,
            [dbType, finalTitle, description || null, clientId]
        );

        revalidatePath(`/clients/${clientId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to create activity:", error);
        return {
            error: { _form: ["Failed to log activity. Please try again."] },
        };
    }
}
