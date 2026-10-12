-- ==========================================
-- 03_create_core_tables.sql
-- ==========================================

-- 1. predictor_sessions
CREATE TABLE IF NOT EXISTS predictor_sessions (
  id SERIAL PRIMARY KEY,
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  photo_url TEXT,
  symptoms TEXT[],
  result_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. daily_passes (Fixed with amount_kes, status, and index)
CREATE TABLE IF NOT EXISTS daily_passes (
  id SERIAL PRIMARY KEY,
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  mpesa_tx_id TEXT UNIQUE,
  amount_kes INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_daily_passes_farmer_expires ON daily_passes(farmer_id, expires_at);

-- 3. vets
CREATE TABLE IF NOT EXISTS vets (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  county TEXT,
  specialisation TEXT,
  kvb_number TEXT UNIQUE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. feed_prices
CREATE TABLE IF NOT EXISTS feed_prices (
  id SERIAL PRIMARY KEY,
  brand TEXT NOT NULL,
  poultry_type TEXT NOT NULL,
  feed_type TEXT NOT NULL,
  price_kes DECIMAL(10,2) NOT NULL,
  county TEXT NOT NULL,
  submitted_by UUID REFERENCES farmers(id),
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES farmers(id),
  verified_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. medicine_prices
CREATE TABLE IF NOT EXISTS medicine_prices (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  active_ingredient TEXT,
  pack_size TEXT,
  price_kes DECIMAL(10,2) NOT NULL,
  supplier TEXT,
  county TEXT NOT NULL,
  submitted_by UUID REFERENCES farmers(id),
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES farmers(id),
  verified_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. outbreak_alerts (Fixed missing column)
CREATE TABLE IF NOT EXISTS outbreak_alerts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  counties TEXT[],
  poultry_types TEXT[],
  created_by UUID REFERENCES farmers(id),
  sms_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- 7. profit_scenarios
CREATE TABLE IF NOT EXISTS profit_scenarios (
  id SERIAL PRIMARY KEY,
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  poultry_type TEXT NOT NULL CHECK (poultry_type IN ('broiler', 'layer', 'kienyeji')),
  bird_count INTEGER NOT NULL,
  chick_cost_kes DECIMAL(10,2) NOT NULL,
  mortality_percent DECIMAL(5,2) DEFAULT 0,
  selling_weight_kg DECIMAL(5,2),
  price_per_kg_kes DECIMAL(10,2),
  lay_rate_percent DECIMAL(5,2),
  egg_price_kes DECIMAL(5,2),
  cycle_days INTEGER,
  feed_brand TEXT,
  feed_type TEXT,
  feed_price_kes DECIMAL(10,2),
  medicine_ids INTEGER[],
  total_medicine_cost_kes DECIMAL(10,2),
  total_cost_kes DECIMAL(10,2),
  expected_revenue_kes DECIMAL(10,2),
  profit_kes DECIMAL(10,2),
  break_even_bird_count DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);