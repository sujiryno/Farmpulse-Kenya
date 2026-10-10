Run this in your Supabase SQL editor

-- Table to store key-value configuration (e.g., Claude disease library JSON)
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,           -- JSON string
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS but allow service role and edge functions to read/write
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (public config), but only service role can write
CREATE POLICY "Public can read app_config" ON app_config
  FOR SELECT USING (true);