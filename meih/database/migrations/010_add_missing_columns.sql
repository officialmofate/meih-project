-- Add missing columns that were referenced by services but not in original schema

-- Add phone to users (needed by planner/vendor profile queries)
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- Add bio and starting_price to vendors (needed by vendor profile update)
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS starting_price NUMERIC(10,2);

-- Add updated_at to payments (needed by screenshot upload and status updates)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
