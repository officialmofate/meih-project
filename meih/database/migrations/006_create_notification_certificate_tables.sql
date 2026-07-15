CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('email','sms','whatsapp','push','in_app')),
  title VARCHAR(255),
  body TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(20) NOT NULL
    CHECK (type IN ('participant','winner','judge','mentor','organizer','partner','sponsor','volunteer')),
  reference_id UUID,
  qr_code_url TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
