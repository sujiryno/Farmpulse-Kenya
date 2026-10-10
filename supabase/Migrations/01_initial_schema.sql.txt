-- Profit calculator scenarios (farmers can save scenarios)
CREATE TABLE IF NOT EXISTS profit_scenarios (
  id SERIAL PRIMARY KEY,
  farmer_id INTEGER REFERENCES farmers(id),
  name TEXT NOT NULL,  -- e.g., "Batch #12 - Unga feed"
  poultry_type TEXT NOT NULL CHECK (poultry_type IN ('broiler', 'layer', 'kienyeji')),
  
  -- Inputs
  bird_count INTEGER NOT NULL,
  chick_cost_kes DECIMAL(10,2) NOT NULL,
  mortality_percent DECIMAL(5,2) DEFAULT 0,
  selling_weight_kg DECIMAL(5,2),  -- for broilers
  price_per_kg_kes DECIMAL(10,2),   -- selling price
  lay_rate_percent DECIMAL(5,2),    -- for layers (eggs per day %)
  egg_price_kes DECIMAL(5,2),       -- per egg
  cycle_days INTEGER,               -- e.g., 56 for broilers
  
  -- Linked data (from F5/F9)
  feed_brand TEXT,
  feed_type TEXT,
  feed_price_kes DECIMAL(10,2),
  medicine_ids INTEGER[],
  total_medicine_cost_kes DECIMAL(10,2),
  
  -- Results
  total_cost_kes DECIMAL(10,2),
  expected_revenue_kes DECIMAL(10,2),
  profit_kes DECIMAL(10,2),
  break_even_bird_count DECIMAL(10,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profit_scenarios ENABLE ROW LEVEL SECURITY;

-- Farmers can read/write their own scenarios
CREATE POLICY "Farmers can manage own scenarios" ON profit_scenarios
  FOR ALL USING (farmer_id = auth.uid());