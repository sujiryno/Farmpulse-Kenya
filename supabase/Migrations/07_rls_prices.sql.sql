-- Allow anyone to insert into feed_prices (but with verified=false)
CREATE POLICY "Anyone can submit feed prices" ON feed_prices
  FOR INSERT WITH CHECK (true);

-- Allow farmers to see only verified prices (for display)
CREATE POLICY "Farmers see verified feed prices" ON feed_prices
  FOR SELECT USING (verified = true);