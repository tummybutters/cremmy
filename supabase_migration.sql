-- Cremmy CRM - Supabase Migration
-- Single-user CRM with pipeline management, clients, tasks, and activities

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  lifecycle TEXT NOT NULL DEFAULT 'prospect' CHECK (lifecycle IN ('prospect', 'active', 'at-risk', 'inactive')),
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pipeline stages
CREATE TABLE pipeline_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT NOT NULL,
  color TEXT NOT NULL CHECK (color IN ('slate', 'blue', 'amber', 'emerald', 'rose', 'purple')),
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(sort_order)
);

-- Engagements (opportunities in the pipeline)
CREATE TABLE engagements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES pipeline_stages(id) ON DELETE RESTRICT,
  value DECIMAL(12, 2),
  probability INTEGER CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMPTZ,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activities (audit log / feed)
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('client_created', 'client_updated', 'engagement_created', 'engagement_updated', 'engagement_stage_changed', 'task_created', 'task_completed', 'document_uploaded', 'note_added')),
  title TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  storage_path TEXT NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Templates (email templates, document templates, etc.)
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'document', 'proposal', 'contract')),
  subject TEXT,
  content TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- External accounts (for integrations like Polymarket, etc.)
CREATE TABLE external_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL CHECK (provider IN ('polymarket', 'twitter', 'linkedin', 'github', 'custom')),
  account_name TEXT NOT NULL,
  account_identifier TEXT NOT NULL, -- wallet address, username, etc.
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, account_identifier)
);

-- External account data (cached data from integrations)
CREATE TABLE external_account_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_account_id UUID NOT NULL REFERENCES external_accounts(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL,
  data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_clients_lifecycle ON clients(lifecycle);
CREATE INDEX idx_clients_created_at ON clients(created_at DESC);
CREATE INDEX idx_clients_name ON clients(name);

CREATE INDEX idx_engagements_client_id ON engagements(client_id);
CREATE INDEX idx_engagements_stage_id ON engagements(stage_id);
CREATE INDEX idx_engagements_created_at ON engagements(created_at DESC);

CREATE INDEX idx_tasks_client_id ON tasks(client_id);
CREATE INDEX idx_tasks_engagement_id ON tasks(engagement_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);

CREATE INDEX idx_activities_client_id ON activities(client_id);
CREATE INDEX idx_activities_engagement_id ON activities(engagement_id);
CREATE INDEX idx_activities_task_id ON activities(task_id);
CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);

CREATE INDEX idx_documents_client_id ON documents(client_id);
CREATE INDEX idx_documents_engagement_id ON documents(engagement_id);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);

CREATE INDEX idx_templates_type ON templates(type);
CREATE INDEX idx_templates_is_active ON templates(is_active);

CREATE INDEX idx_external_accounts_provider ON external_accounts(provider);
CREATE INDEX idx_external_accounts_is_active ON external_accounts(is_active);

CREATE INDEX idx_external_account_data_account_id ON external_account_data(external_account_id);
CREATE INDEX idx_external_account_data_type ON external_account_data(data_type);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_engagements_updated_at BEFORE UPDATE ON engagements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_accounts_updated_at BEFORE UPDATE ON external_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL SEED DATA
-- ============================================================================

-- Insert default pipeline stages
INSERT INTO pipeline_stages (label, color, sort_order) VALUES
  ('Lead', 'slate', 1),
  ('Qualified', 'blue', 2),
  ('Proposal', 'amber', 3),
  ('Negotiation', 'purple', 4),
  ('Closed Won', 'emerald', 5),
  ('Closed Lost', 'rose', 6);

-- Insert sample email templates
INSERT INTO templates (name, type, subject, content, variables) VALUES
  ('Welcome Email', 'email', 'Welcome to {{company_name}}!', 
   'Hi {{client_name}},\n\nThank you for your interest in {{company_name}}. We''re excited to work with you!\n\nBest regards,\n{{sender_name}}',
   ARRAY['client_name', 'company_name', 'sender_name']),
  
  ('Follow Up', 'email', 'Following up on our conversation',
   'Hi {{client_name}},\n\nI wanted to follow up on our recent conversation about {{topic}}.\n\nLet me know if you have any questions!\n\nBest,\n{{sender_name}}',
   ARRAY['client_name', 'topic', 'sender_name']),
  
  ('Proposal Template', 'proposal', 'Proposal for {{client_name}}',
   '# Proposal\n\n## Overview\n{{overview}}\n\n## Scope of Work\n{{scope}}\n\n## Timeline\n{{timeline}}\n\n## Investment\n{{investment}}',
   ARRAY['client_name', 'overview', 'scope', 'timeline', 'investment']);

-- Insert sample clients (optional - comment out if not needed)
INSERT INTO clients (name, email, company, lifecycle, notes) VALUES
  ('John Doe', 'john@example.com', 'Acme Corp', 'prospect', 'Interested in enterprise plan'),
  ('Jane Smith', 'jane@techstart.io', 'TechStart', 'active', 'Current client, monthly retainer'),
  ('Bob Johnson', 'bob@startup.com', 'Startup Inc', 'prospect', 'Met at conference');

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Note: For single-user app, RLS might be overkill, but here's the setup
-- You can enable this if you add authentication later

-- Enable RLS on all tables (commented out for single-user setup)
-- ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE external_accounts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE external_account_data ENABLE ROW LEVEL SECURITY;

-- For single-user setup, you might want to create a simple policy:
-- CREATE POLICY "Allow all operations for authenticated users" ON clients
--   FOR ALL USING (true) WITH CHECK (true);
-- (Repeat for each table)

-- ============================================================================
-- VIEWS (Optional helpers)
-- ============================================================================

-- View for engagement pipeline with client info
CREATE VIEW engagement_pipeline_view AS
SELECT 
  e.id,
  e.title,
  e.value,
  e.probability,
  e.expected_close_date,
  e.created_at,
  e.updated_at,
  c.id as client_id,
  c.name as client_name,
  c.company as client_company,
  ps.id as stage_id,
  ps.label as stage_label,
  ps.color as stage_color,
  ps.sort_order as stage_order
FROM engagements e
JOIN clients c ON e.client_id = c.id
JOIN pipeline_stages ps ON e.stage_id = ps.id
ORDER BY ps.sort_order, e.created_at DESC;

-- View for tasks with related info
CREATE VIEW tasks_with_context AS
SELECT 
  t.id,
  t.title,
  t.description,
  t.status,
  t.priority,
  t.due_date,
  t.completed_at,
  t.created_at,
  c.id as client_id,
  c.name as client_name,
  e.id as engagement_id,
  e.title as engagement_title
FROM tasks t
LEFT JOIN clients c ON t.client_id = c.id
LEFT JOIN engagements e ON t.engagement_id = e.id
ORDER BY 
  CASE t.priority
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  t.due_date ASC NULLS LAST;

-- View for activity feed with context
CREATE VIEW activity_feed AS
SELECT 
  a.id,
  a.type,
  a.title,
  a.description,
  a.created_at,
  a.metadata,
  c.name as client_name,
  e.title as engagement_title,
  t.title as task_title
FROM activities a
LEFT JOIN clients c ON a.client_id = c.id
LEFT JOIN engagements e ON a.engagement_id = e.id
LEFT JOIN tasks t ON a.task_id = t.id
ORDER BY a.created_at DESC;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE clients IS 'Core client/contact records';
COMMENT ON TABLE pipeline_stages IS 'Configurable stages for the sales pipeline';
COMMENT ON TABLE engagements IS 'Sales opportunities/deals in the pipeline';
COMMENT ON TABLE tasks IS 'Tasks related to clients and engagements';
COMMENT ON TABLE activities IS 'Activity feed/audit log for all actions';
COMMENT ON TABLE documents IS 'File attachments and documents';
COMMENT ON TABLE templates IS 'Reusable templates for emails, proposals, etc.';
COMMENT ON TABLE external_accounts IS 'Connected external accounts for integrations';
COMMENT ON TABLE external_account_data IS 'Cached data from external integrations';

