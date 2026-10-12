-- ==========================================
-- 04_rls_policies.sql
-- ==========================================

-- Enable RLS
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE disease_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE diseases ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vets ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbreak_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profit_scenarios ENABLE ROW LEVEL SECURITY;

-- Public can read
CREATE POLICY "Public can read diseases" ON diseases FOR SELECT USING (true);
CREATE POLICY "Public can read verified feed prices" ON feed_prices FOR SELECT USING (verified = true);
CREATE POLICY "Public can read verified medicine prices" ON medicine_prices FOR SELECT USING (verified = true);
CREATE POLICY "Public can read verified vets" ON vets FOR SELECT USING (verified = true);
CREATE POLICY "Public can read outbreak alerts" ON outbreak_alerts FOR SELECT USING (true);

-- Farmers can manage their own data
CREATE POLICY "Farmers can manage own profile" ON farmers FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Farmers can manage own history" ON disease_history FOR ALL USING (farmer_id IN (SELECT id FROM farmers WHERE user_id = auth.uid()));
CREATE POLICY "Farmers can manage own sessions" ON predictor_sessions FOR ALL USING (farmer_id IN (SELECT id FROM farmers WHERE user_id = auth.uid()));
CREATE POLICY "Farmers can manage own passes" ON daily_passes FOR ALL USING (farmer_id IN (SELECT id FROM farmers WHERE user_id = auth.uid()));
CREATE POLICY "Farmers can manage own scenarios" ON profit_scenarios FOR ALL USING (farmer_id IN (SELECT id FROM farmers WHERE user_id = auth.uid()));

-- Anyone can submit prices, but MUST be unverified
CREATE POLICY "Anyone can submit feed prices" ON feed_prices FOR INSERT WITH CHECK (verified = false);
CREATE POLICY "Anyone can submit medicine prices" ON medicine_prices FOR INSERT WITH CHECK (verified = false);

-- Only admins can verify prices and manage vets/alerts
CREATE POLICY "Admins can manage feed prices" ON feed_prices FOR UPDATE USING (EXISTS (SELECT 1 FROM farmers WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can manage medicine prices" ON medicine_prices FOR UPDATE USING (EXISTS (SELECT 1 FROM farmers WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can manage vets" ON vets FOR ALL USING (EXISTS (SELECT 1 FROM farmers WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can manage alerts" ON outbreak_alerts FOR ALL USING (EXISTS (SELECT 1 FROM farmers WHERE user_id = auth.uid() AND role = 'admin'));