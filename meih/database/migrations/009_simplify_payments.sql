-- Simplified payments: mobile money / bank transfer with screenshot proof
-- Adds payment_number, payment_name, screenshot_url to payments table
-- and payment_details to planner/vendor for receiving payments

ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_number VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_name VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS screenshot_url TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS confirmed_by UUID REFERENCES users(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS notes TEXT;

-- Payment contact details for planners and vendors
ALTER TABLE planners ADD COLUMN IF NOT EXISTS payment_number VARCHAR(100);
ALTER TABLE planners ADD COLUMN IF NOT EXISTS payment_name VARCHAR(255);
ALTER TABLE planners ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'mobile_money';

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS payment_number VARCHAR(100);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS payment_name VARCHAR(255);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'mobile_money';
