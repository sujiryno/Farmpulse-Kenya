-- Grants required for anon, authenticated, and service_role
-- to access all public tables. Run this on every fresh database.
-- Safe to run multiple times (idempotent).

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

GRANT SELECT ON TABLE diseases TO anon, authenticated;
GRANT SELECT ON TABLE app_config TO anon, authenticated;
GRANT SELECT ON TABLE feed_prices TO anon, authenticated;
GRANT SELECT ON TABLE medicine_prices TO anon, authenticated;
GRANT SELECT ON TABLE vets TO anon, authenticated;
GRANT SELECT ON TABLE outbreak_alerts TO anon, authenticated;

GRANT ALL ON TABLE farmers TO authenticated;
GRANT ALL ON TABLE disease_history TO authenticated;
GRANT ALL ON TABLE predictor_sessions TO authenticated;
GRANT ALL ON TABLE daily_passes TO authenticated;
GRANT ALL ON TABLE profit_scenarios TO authenticated;

-- Default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO service_role;