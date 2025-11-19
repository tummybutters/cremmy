import { integrationService } from "../domain/integrationService";
import { fetchClientDetail, ClientEmail } from "@/data/crm";

export async function fetchClientEmails(clientId: string): Promise<ClientEmail[]> {
  const client = await fetchClientDetail(clientId);
  if (!client || !client.client.email) return [];
  
  // Hardcoded system account for now
  const systemEmail = 'thomasbutcher@qortana.com';
  
  try {
    const emails = await integrationService.fetchEmails(
      systemEmail,
      `from:${client.client.email} OR to:${client.client.email}`
    );
    return emails.map(e => ({
        id: e.id!,
        snippet: e.snippet ?? undefined,
        subject: e.subject ?? undefined,
        from: e.from ?? undefined,
        date: e.date ?? undefined
    }));
  } catch (e) {
    console.error('Failed to fetch emails', e);
    return [];
  }
}

