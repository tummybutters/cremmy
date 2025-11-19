-- Migration to add missing columns to match the expected schema

-- Add lifecycle column to clients if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'lifecycle'
  ) THEN
    ALTER TABLE clients ADD COLUMN lifecycle TEXT NOT NULL DEFAULT 'prospect' 
      CHECK (lifecycle IN ('prospect', 'active', 'at-risk', 'inactive'));
  END IF;
END $$;

-- Add stage_id column to engagements if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'engagements' AND column_name = 'stage_id'
  ) THEN
    -- First, ensure pipeline_stages table exists and has data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pipeline_stages') THEN
      -- Add the column as nullable first
      ALTER TABLE engagements ADD COLUMN stage_id UUID REFERENCES pipeline_stages(id) ON DELETE RESTRICT;
      
      -- Migrate data from pipeline_stage to stage_id if pipeline_stage exists
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'engagements' AND column_name = 'pipeline_stage'
      ) THEN
        -- Map old pipeline_stage values to new stage_id
        UPDATE engagements e
        SET stage_id = ps.id
        FROM pipeline_stages ps
        WHERE LOWER(e.pipeline_stage) = LOWER(ps.label)
          AND e.stage_id IS NULL;
        
        -- For any remaining null values, set to first stage
        UPDATE engagements
        SET stage_id = (SELECT id FROM pipeline_stages ORDER BY sort_order LIMIT 1)
        WHERE stage_id IS NULL;
      ELSE
        -- If no pipeline_stage column, set all to first stage
        UPDATE engagements
        SET stage_id = (SELECT id FROM pipeline_stages ORDER BY sort_order LIMIT 1)
        WHERE stage_id IS NULL;
      END IF;
      
      -- Now make it NOT NULL
      ALTER TABLE engagements ALTER COLUMN stage_id SET NOT NULL;
    END IF;
  END IF;
END $$;

-- Add task_id column to activities if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'activities' AND column_name = 'task_id'
  ) THEN
    ALTER TABLE activities ADD COLUMN task_id UUID REFERENCES tasks(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add title column to activities if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'activities' AND column_name = 'title'
  ) THEN
    ALTER TABLE activities ADD COLUMN title TEXT NOT NULL DEFAULT 'Activity';
  END IF;
END $$;

-- Add type column to templates if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'templates' AND column_name = 'type'
  ) THEN
    ALTER TABLE templates ADD COLUMN type TEXT NOT NULL DEFAULT 'email' 
      CHECK (type IN ('email', 'document', 'proposal', 'contract'));
  END IF;
END $$;

-- Add is_active column to templates if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'templates' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE templates ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add is_active column to external_accounts if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'external_accounts' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE external_accounts ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Create indexes that don't exist yet
CREATE INDEX IF NOT EXISTS idx_clients_lifecycle ON clients(lifecycle);
CREATE INDEX IF NOT EXISTS idx_engagements_stage_id ON engagements(stage_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_at ON tasks(due_at);
CREATE INDEX IF NOT EXISTS idx_activities_task_id ON activities(task_id);
CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(type);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON templates(is_active);
CREATE INDEX IF NOT EXISTS idx_external_accounts_is_active ON external_accounts(is_active);
