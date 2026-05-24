-- POER Veritabani Shemasi
-- Railway PostgreSQL'de calistir

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE,
  password_hash TEXT NOT NULL,
  balance NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nfc_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  card_uid VARCHAR(50) UNIQUE NOT NULL,
  card_type VARCHAR(20) DEFAULT 'virtual',
  label VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(20) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'success',
  reference_no VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Test kullanicisi (sifre: test1234)
INSERT INTO users (name, phone, email, password_hash, balance)
VALUES (
  'Test Kullanici',
  '05001234567',
  'test@poer.app',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  1000.00
) ON CONFLICT DO NOTHING;
