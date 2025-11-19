"use server";

import { query } from "@/data/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const createClientSchema = z.object({
    name: z.string().min(1, "Name is required"),
    company: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().optional(),
    lifecycle: z.enum(["prospect", "active", "at-risk", "inactive"]).default("prospect"),
    notes: z.string().optional(),
});

export type CreateClientState = {
    error?: {
        name?: string[];
        company?: string[];
        email?: string[];
        phone?: string[];
        lifecycle?: string[];
        notes?: string[];
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
    };

    const validatedData = createClientSchema.safeParse(rawData);

    if (!validatedData.success) {
        return {
            error: validatedData.error.flatten().fieldErrors,
        };
    }

    const { name, company, email, phone, lifecycle, notes } = validatedData.data;

    try {
        const { rows } = await query(
            `
      INSERT INTO clients (name, company, email, phone, lifecycle, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
      `,
            [name, company || null, email || null, phone || null, lifecycle, notes || null]
        );

        const newClientId = rows[0].id;

        // Log activity
        await query(
            `
      INSERT INTO activities (type, title, description, client_id)
      VALUES ($1, $2, $3, $4)
      `,
            ["client_created", "Client Created", `Created client ${name}`, newClientId]
        );

        revalidatePath("/clients");
        return { success: true, clientId: newClientId };
    } catch (error) {
        console.error("Failed to create client:", error);
        return {
            error: { _form: ["Failed to create client. Please try again."] },
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
    };

    const validatedData = updateClientSchema.safeParse(rawData);

    if (!validatedData.success) {
        return {
            error: validatedData.error.flatten().fieldErrors,
        };
    }

    const { name, company, email, phone, lifecycle, notes } = validatedData.data;

    try {
        // Build dynamic update query
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (name) { updates.push(`name = $${paramIndex++}`); values.push(name); }
        if (company !== undefined) { updates.push(`company = $${paramIndex++}`); values.push(company || null); }
        if (email !== undefined) { updates.push(`email = $${paramIndex++}`); values.push(email || null); }
        if (phone !== undefined) { updates.push(`phone = $${paramIndex++}`); values.push(phone || null); }
        if (lifecycle) { updates.push(`lifecycle = $${paramIndex++}`); values.push(lifecycle); }
        if (notes !== undefined) { updates.push(`notes = $${paramIndex++}`); values.push(notes || null); }

        if (updates.length === 0) return { success: true, clientId };

        values.push(clientId);
        await query(
            `UPDATE clients SET ${updates.join(", ")} WHERE id = $${paramIndex}`,
            values
        );

        // Log activity
        await query(
            `
      INSERT INTO activities (type, title, description, client_id)
      VALUES ($1, $2, $3, $4)
      `,
            ["client_updated", "Client Updated", `Updated client details`, clientId]
        );

        revalidatePath("/clients");
        revalidatePath(`/clients/${clientId}`);
        return { success: true, clientId };
    } catch (error) {
        console.error("Failed to update client:", error);
        return {
            error: { _form: ["Failed to update client. Please try again."] },
        };
    }
};
