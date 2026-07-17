-- Migration 014: Event confirmation, innovation payment, booking client info

-- Events: confirmation columns
ALTER TABLE events ADD COLUMN IF NOT EXISTS confirmation_status VARCHAR(20) DEFAULT 'unconfirmed';
ALTER TABLE events ADD COLUMN IF NOT EXISTS confirmation_payment_number VARCHAR(50);
ALTER TABLE events ADD COLUMN IF NOT EXISTS confirmation_payment_name VARCHAR(100);
ALTER TABLE events ADD COLUMN IF NOT EXISTS confirmation_screenshot_url VARCHAR(500);

-- Innovation submissions: payment columns
ALTER TABLE innovation_submissions ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'unpaid';
ALTER TABLE innovation_submissions ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE innovation_submissions ADD COLUMN IF NOT EXISTS payment_number VARCHAR(50);
ALTER TABLE innovation_submissions ADD COLUMN IF NOT EXISTS payment_name VARCHAR(100);
ALTER TABLE innovation_submissions ADD COLUMN IF NOT EXISTS payment_screenshot_url VARCHAR(500);
ALTER TABLE innovation_submissions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE innovation_submissions ADD COLUMN IF NOT EXISTS payment_confirmed_by UUID REFERENCES users(id);
ALTER TABLE innovation_submissions ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ;

-- Bookings: client name/phone
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_name VARCHAR(200);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_phone VARCHAR(50);
