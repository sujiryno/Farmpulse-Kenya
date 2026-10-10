CREATE TABLE daily_passes (
  id SERIAL PRIMARY KEY,
  farmer_id INT REFERENCES farmers(id),
  mpesa_tx_id TEXT UNIQUE,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);