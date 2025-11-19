-- Add new fields to clients table for redesign
ALTER TABLE clients ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS payment_type TEXT CHECK (payment_type IN ('monthly', 'one_time'));
ALTER TABLE clients ADD COLUMN IF NOT EXISTS recurring_amount DECIMAL(12, 2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS total_value DECIMAL(12, 2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ;
