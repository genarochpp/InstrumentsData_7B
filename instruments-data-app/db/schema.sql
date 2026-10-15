CREATE TABLE IF NOT EXISTS instruments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_name VARCHAR(160) NOT NULL,
  instrument_name VARCHAR(160) NOT NULL,
  part_number VARCHAR(100) NOT NULL,
  serial_number VARCHAR(100) NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);