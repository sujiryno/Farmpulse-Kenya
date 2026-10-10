CREATE TABLE predictor_sessions (
  id SERIAL PRIMARY KEY,
  farmer_id INT REFERENCES farmers(id),
  date DATE NOT NULL,
  photo_url TEXT,
  symptoms TEXT[],
  result_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


