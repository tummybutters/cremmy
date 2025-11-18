# Integration Strategy & Specification

## 1. Overview

This document outlines the integration strategy for connecting Cremmy with Google Workspace (Gmail, Drive, Docs, Sheets, Calendar) and Twilio. The primary goal is to automate the solo consultant workflow for `thomasbutcher@qortana.com`.

## 2. Architecture

### 2.1. Authentication & Tokens
- **Provider**: Google OAuth 2.0
- **Storage**: `external_accounts` table
  - `provider`: "google"
  - `account_identifier`: Email address (e.g., `thomasbutcher@qortana.com`)
  - `access_token`: Encrypted (future) or protected access token
  - `refresh_token`: Long-lived refresh token
  - `expires_at`: Token expiration timestamp
  - `metadata`: JSON blob for scopes and service-specific config

### 2.2. Service Layer
A unified `IntegrationService` will handle:
- Token refresh logic
- Client instantiation (initializing `googleapis` clients)
- Unified error handling

## 3. Connectors & Use Cases

### 3.1. Gmail Integration
**Goal**: Seamless communication tracking.

*   **Sync (Ingest)**:
    *   *Trigger*: Scheduled job (every 5-10 mins) or on-load refresh.
    *   *Logic*: Query Gmail for messages `from:client_email` or `to:client_email`.
    *   *Action*: If match found, create `Activity` record (Type: "email"). Deduplicate by Message-ID.
*   **Send**:
    *   *Trigger*: User action from "Send Email" modal on Client Page.
    *   *Logic*: Use Gmail API `users.messages.send`.
    *   *Action*: Log outgoing email as `Activity`.
*   **Drafts (Automation)**:
    *   *Trigger*: Pipeline stage change (e.g., Moved to "Proposal").
    *   *Logic*: Create draft email with subject "Proposal for [Project]" and body from template.
    *   *Action*: Save draft ID in `Activity` or `Task` metadata.

### 3.2. Google Drive Integration
**Goal**: Organized client asset storage.

*   **Folder Structure**:
    *   Root: `Cremmy CRM`
    *   Sub-folder: `Clients`
    *   Client Folder: `[Client Name]` (e.g., "Acme Corp")
*   **Automation**:
    *   *Trigger*: New Client created or "Create Folder" button clicked.
    *   *Logic*: Check if folder exists; if not, create it. Save `folder_id` to `clients.metadata`.

### 3.3. Google Docs Integration
**Goal**: Automated document generation (Contracts, Proposals).

*   **Templating**:
    *   Use existing Google Docs as master templates.
    *   Variables syntax: `{{client_name}}`, `{{date}}`, `{{project_value}}`.
*   **Generation**:
    *   *Trigger*: "Generate Proposal" action.
    *   *Logic*:
        1.  Copy "Proposal Template" Doc.
        2.  Rename to "Proposal - [Client Name]".
        3.  Move to Client's Drive Folder.
        4.  Batch replace `{{vars}}` with client data.
    *   *Action*: Log `Document` record in CRM linked to the new Doc ID.

### 3.4. Google Sheets Integration
**Goal**: Bulk data management and reporting.

*   **Pipeline Export**:
    *   *Trigger*: "Export to Sheets" button on Pipeline Board.
    *   *Logic*: Create/Update a Sheet "Pipeline Dump". Rows = Deals. Columns = Stage, Value, Owner, Last Activity.
*   **Lead Ingest (Two-way)**:
    *   *Trigger*: Scheduled check of "Leads" sheet.
    *   *Logic*: Read rows. If email doesn't exist in CRM, create new Lead. Mark row as "Imported".

### 3.5. Future Integrations

#### Google Calendar
*   **Sync**: Pull events where `attendees` match client emails. Log as Meeting `Activity`.
*   **Scheduling**: Create event from Task due date.

#### Twilio
*   **SMS**: Send automated reminders for meetings or invoices.
*   **Calls**: Log call duration and status via webhooks.

## 4. Implementation Plan (Immediate)

Focus on **thomasbutcher@qortana.com** account.

1.  **Setup**: Install `googleapis`, configure OAuth credentials.
2.  **Base**: `IntegrationService` class for auth.
3.  **Features**:
    *   Gmail: Read-only sync (fetch last 10 emails).
    *   Drive: "Ensure Client Folder" function.
    *   Docs: "Create from Template" stub.
    *   Sheets: "Export Pipeline" stub.

