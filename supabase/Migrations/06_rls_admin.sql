-- Example for vets: admins can see unverified rows
CREATE POLICY "Admins can see unverified vets" ON vets
  FOR SELECT USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM farmers WHERE id = auth.uid() AND role = 'admin'
  ));

-- For feed_prices moderation
CREATE POLICY "Admins can see all pending submissions" ON feed_prices
  FOR SELECT USING (verified = false AND EXISTS (SELECT 1 FROM farmers WHERE id = auth.uid() AND role = 'admin'));