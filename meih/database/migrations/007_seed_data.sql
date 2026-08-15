-- Seed event categories with suggested fees (USD)
INSERT INTO event_categories (name, suggested_fee_usd) VALUES
  ('Birthday Events', 15),
  ('Graduation', 20),
  ('Funeral Planning', 20),
  ('Religious Events', 25),
  ('Community Events', 25),
  ('Workshops', 30),
  ('Trainings', 35),
  ('Seminars', 35),
  ('Virtual Events', 40),
  ('Academic Events', 40),
  ('Wedding Planning', 50),
  ('Fundraising Events', 50),
  ('NGO Events', 60),
  ('Medical Events', 60),
  ('Health Conferences', 70),
  ('Scientific Conferences', 75),
  ('Conference Planning', 80),
  ('Corporate Events', 100),
  ('Government Events', 120),
  ('Product Launch', 120),
  ('Exhibitions', 120),
  ('Trade Fair', 150),
  ('Entertainment Events', 150),
  ('Sports Events', 150),
  ('Festival Planning', 180),
  ('Hybrid Events', 180),
  ('Hackathons', 200),
  ('Innovation Summit', 250),
  ('Awards Ceremony', 250)
ON CONFLICT (name) DO NOTHING;

-- Seed innovation competitions (removed — competitions are created by innovation managers at runtime)
