-- Add map coordinates and extra event detail columns
ALTER TABLE events ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7);
ALTER TABLE events ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7);
ALTER TABLE events ADD COLUMN IF NOT EXISTS guest_count INT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS services TEXT[];
ALTER TABLE events ADD COLUMN IF NOT EXISTS requirements TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS quote_deadline TIMESTAMPTZ;
