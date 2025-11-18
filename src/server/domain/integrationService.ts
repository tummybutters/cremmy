import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { db, generateId } from '../infra/db';
import { env } from '../config/env';
import { ExternalAccount } from '../types/domain';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/userinfo.email',
];

export class IntegrationService {
  private getOAuthClient(): OAuth2Client {
    return new google.auth.OAuth2(
      env.google.clientId,
      env.google.clientSecret,
      env.google.redirectUri
    );
  }

  getAuthUrl(): string {
    const client = this.getOAuthClient();
    return client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent', // Force refresh token generation
    });
  }

  async handleCallback(code: string): Promise<ExternalAccount> {
    const client = this.getOAuthClient();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Get user email
    const oauth2 = google.oauth2({ version: 'v2', auth: client });
    const { data: userInfo } = await oauth2.userinfo.get();
    
    if (!userInfo.email || !userInfo.id) {
      throw new Error('Failed to get user info from Google');
    }

    // Store in DB
    return await db.withTransaction(async (tx) => {
      // Check if exists
      const existing = await tx.list('externalAccounts');
      const match = existing.find(
        (acc) => acc.provider === 'google' && acc.external_id === userInfo.email
      );

      const metadata = {
        tokens,
        scope: tokens.scope,
        expiry_date: tokens.expiry_date,
      };

      if (match) {
        return await tx.update('externalAccounts', match.id, {
          metadata: metadata as Record<string, unknown>,
          label: userInfo.email!, // Use email as label
          updated_at: new Date().toISOString(),
        });
      }

      return await tx.insert('externalAccounts', {
        id: generateId(),
        provider: 'google',
        external_id: userInfo.email!,
        account_identifier: userInfo.email!, // Map email to identifier
        label: userInfo.email!,
        metadata: metadata as Record<string, unknown>,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });
  }

  async getAuthenticatedClient(email: string): Promise<OAuth2Client> {
    const account = await db.withTransaction(async (tx) => {
      const accounts = await tx.list('externalAccounts');
      return accounts.find(
        (acc) => acc.provider === 'google' && (acc.external_id === email || acc.account_identifier === email)
      );
    });

    if (!account || !account.metadata || !account.metadata.tokens) {
      throw new Error(`No connected Google account found for ${email}`);
    }

    const client = this.getOAuthClient();
    const tokens = account.metadata.tokens as any;
    
    client.setCredentials(tokens);

    // Handle token refresh if needed (handled automatically by google-auth-library if refresh_token is present)
    // But we should update DB if tokens change
    client.on('tokens', async (newTokens) => {
      if (newTokens.refresh_token) {
         // Update tokens in DB
         await db.withTransaction(async (tx) => {
             const current = await tx.find('externalAccounts', account.id);
             if (current) {
                 const meta = (current.metadata || {}) as any;
                 meta.tokens = {
                     ...meta.tokens,
                     ...newTokens,
                 };
                 await tx.update('externalAccounts', account.id, {
                     metadata: meta,
                     updated_at: new Date().toISOString(),
                 });
             }
         });
      }
    });

    return client;
  }

  async getGmail(email: string) {
    const auth = await this.getAuthenticatedClient(email);
    return google.gmail({ version: 'v1', auth });
  }

  async getDrive(email: string) {
    const auth = await this.getAuthenticatedClient(email);
    return google.drive({ version: 'v3', auth });
  }

  async getSheets(email: string) {
    const auth = await this.getAuthenticatedClient(email);
    return google.sheets({ version: 'v4', auth });
  }
  
  async getDocs(email: string) {
      const auth = await this.getAuthenticatedClient(email);
      return google.docs({ version: 'v1', auth });
  }

  async ensureFolder(email: string, folderName: string, parentId?: string): Promise<string> {
    const drive = await this.getDrive(email);
    const query = [
      `mimeType = 'application/vnd.google-apps.folder'`,
      `name = '${folderName}'`,
      `trashed = false`,
      parentId ? `'${parentId}' in parents` : undefined
    ].filter(Boolean).join(' and ');

    const { data } = await drive.files.list({
      q: query,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (data.files && data.files.length > 0) {
      return data.files[0].id!;
    }

    const { data: folder } = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : undefined,
      },
      fields: 'id',
    });

    return folder.id!;
  }

  async copyFile(email: string, fileId: string, name: string, parents?: string[]): Promise<string> {
    const drive = await this.getDrive(email);
    const { data } = await drive.files.copy({
      fileId,
      requestBody: {
        name,
        parents,
      },
      fields: 'id',
    });
    return data.id!;
  }

  async replaceTextInDoc(email: string, documentId: string, replacements: Record<string, string>) {
    const docs = await this.getDocs(email);
    const requests = Object.entries(replacements).map(([key, value]) => ({
      replaceAllText: {
        containsText: {
          text: `{{${key}}}`,
          matchCase: true,
        },
        replaceText: value,
      },
    }));

    if (requests.length > 0) {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: {
          requests,
        },
      });
    }
  }

  async fetchEmails(email: string, query: string, maxResults = 10) {
    const gmail = await this.getGmail(email);
    const { data } = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults,
    });

    if (!data.messages) return [];

    const messages = await Promise.all(
      data.messages.map(async (msg) => {
        const { data: fullMsg } = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
        });
        
        const headers = fullMsg.payload?.headers;
        const subject = headers?.find((h) => h.name === 'Subject')?.value;
        const from = headers?.find((h) => h.name === 'From')?.value;
        const date = headers?.find((h) => h.name === 'Date')?.value;
        
        return {
          id: msg.id,
          snippet: fullMsg.snippet,
          subject,
          from,
          date,
        };
      })
    );

    return messages;
  }

  async sendEmail(email: string, to: string, subject: string, body: string) {
    const gmail = await this.getGmail(email);
    
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `From: <${email}>`,
      `To: <${to}>`,
      `Subject: ${utf8Subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      body,
    ];
    
    const message = messageParts.join('\n');
    const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });
  }

  async exportToSheets(email: string, title: string, header: string[], rows: string[][]) {
    const sheets = await this.getSheets(email);
    
    const { data: spreadsheet } = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title,
        },
      },
    });

    const spreadsheetId = spreadsheet.spreadsheetId!;
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [header, ...rows],
      },
    });

    return spreadsheet.spreadsheetUrl;
  }
}

export const integrationService = new IntegrationService();

