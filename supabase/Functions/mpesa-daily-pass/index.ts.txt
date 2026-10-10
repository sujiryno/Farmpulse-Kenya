-- Daily passes table
CREATE TABLE IF NOT EXISTS daily_passes (
  id SERIAL PRIMARY KEY,
  farmer_id INTEGER REFERENCES farmers(id),
  mpesa_tx_id TEXT UNIQUE,
  amount_kes INTEGER,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' -- pending, confirmed, failed
);

-- Add index for fast lookups
CREATE INDEX idx_daily_passes_farmer_expires ON daily_passes(farmer_id, expires_at);
