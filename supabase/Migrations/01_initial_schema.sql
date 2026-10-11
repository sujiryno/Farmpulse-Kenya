-- ==========================================
-- 01_initial_schema.sql
-- This is the foundation. Every other table depends on these.
-- ==========================================

-- 1. Create farmers table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS farmers (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id), -- IMPORTANT: Links to Supabase Auth
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  county TEXT,
  poultry_types TEXT[],
  market_channel TEXT,
  flock_size INTEGER,
  role TEXT DEFAULT 'farmer' CHECK (role IN ('farmer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create diseases table (The knowledge base)
CREATE TABLE IF NOT EXISTS diseases (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  poultry_types TEXT[] NOT NULL,
  symptoms TEXT[] NOT NULL,
  cause TEXT NOT NULL,
  treatment TEXT NOT NULL,
  prevention TEXT NOT NULL,
  mortality_rate TEXT,
  recommended_medicines TEXT[]
);

-- 3. Create disease_history table (Links farmers to past diseases)
CREATE TABLE IF NOT EXISTS disease_history (
  id SERIAL PRIMARY KEY,
  farmer_id INTEGER REFERENCES farmers(id),
  disease_id INTEGER REFERENCES diseases(id),
  date_recorded TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- SECURITY (RLS) POLICIES FOR FOUNDATION TABLES
-- ==========================================

ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE disease_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE diseases ENABLE ROW LEVEL SECURITY;

-- Public can read diseases (needed for the library and AI)
DROP POLICY IF EXISTS "Public can read diseases" ON diseases;
CREATE POLICY "Public can read diseases" ON diseases FOR SELECT USING (true);

-- Farmers can only see/edit their own profile
DROP POLICY IF EXISTS "Farmers can manage own profile" ON farmers;
CREATE POLICY "Farmers can manage own profile" ON farmers FOR ALL USING (user_id = auth.uid());

-- Farmers can only see/edit their own disease history
DROP POLICY IF EXISTS "Farmers can manage own disease history" ON disease_history;
CREATE POLICY "Farmers can manage own disease history" ON disease_history FOR ALL USING (farmer_id IN (SELECT id FROM farmers WHERE user_id = auth.uid()));