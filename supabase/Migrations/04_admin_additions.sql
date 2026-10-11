-- Add role column to farmers table (default 'farmer')
ALTER TABLE farmers ADD COLUMN role TEXT DEFAULT 'farmer' CHECK (role IN ('farmer', 'admin'));

-- Set your account as admin (replace with your phone number)
UPDATE farmers SET role = 'admin' WHERE phone = '254712345678';

-- Add verified column for vets (already in schema, but ensure)
ALTER TABLE vets ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
ALTER TABLE vets ADD COLUMN IF NOT EXISTS submitted_by INTEGER REFERENCES farmers(id);

-- Add moderation columns for price tables
ALTER TABLE feed_prices ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
ALTER TABLE feed_prices ADD COLUMN IF NOT EXISTS submitted_by INTEGER REFERENCES farmers(id);
ALTER TABLE feed_prices ADD COLUMN IF NOT EXISTS verified_by INTEGER REFERENCES farmers(id);
ALTER TABLE feed_prices ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

ALTER TABLE medicine_prices ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
ALTER TABLE medicine_prices ADD COLUMN IF NOT EXISTS submitted_by INTEGER REFERENCES farmers(id);
ALTER TABLE medicine_prices ADD COLUMN IF NOT EXISTS verified_by INTEGER REFERENCES farmers(id);
ALTER TABLE medicine_prices ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Add outbreak_alerts table
CREATE TABLE IF NOT EXISTS outbreak_alerts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  counties TEXT[], -- array of counties to target, NULL for all
  poultry_types TEXT[],
  created_by INTEGER REFERENCES farmers(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);