-- ============================================================================
-- INDIA FINTECH FRAUD & RBI COMPLIANCE SCHEMA (PostgreSQL)
-- Standards: RBI Master Direction on Digital Payment Security Controls & NPCI UPI
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE payment_channel_enum AS ENUM (
    'UPI',
    'DOMESTIC_CC',
    'INTERNATIONAL_CC',
    'NET_BANKING',
    'RUPAY_DEBIT'
);

CREATE TYPE fraud_decision_enum AS ENUM (
    'APPROVE',
    'CHALLENGE_WITH_OTP',
    'BLOCK'
);

CREATE TYPE alert_status_enum AS ENUM (
    'TRIGGERED',
    'USER_CONFIRMED_GENUINE',
    'CONFIRMED_FRAUD',
    'AUTO_MITIGATED'
);

-- 1. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    vpa_or_card_hash VARCHAR(64) NOT NULL,
    masked_instrument VARCHAR(32) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    amount_in_inr NUMERIC(14, 2) NOT NULL CHECK (amount_in_inr >= 0),
    merchant_name VARCHAR(128) NOT NULL,
    merchant_id VARCHAR(64),
    mcc_category VARCHAR(4) NOT NULL,
    device_fingerprint VARCHAR(128) NOT NULL,
    sim_serial_hash VARCHAR(64),
    ip_address INET NOT NULL,
    geo_latitude DOUBLE PRECISION,
    geo_longitude DOUBLE PRECISION,
    geo_city VARCHAR(64),
    geo_country_code VARCHAR(3) DEFAULT 'IND',
    channel payment_channel_enum NOT NULL,
    is_international_enabled BOOLEAN DEFAULT FALSE,
    is_tokenized_transaction BOOLEAN DEFAULT TRUE,
    risk_score SMALLINT CHECK (risk_score BETWEEN 0 AND 100),
    decision fraud_decision_enum NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tx_user_time ON transactions(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tx_instrument_time ON transactions(vpa_or_card_hash, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tx_device ON transactions(device_fingerprint);

-- 2. RBI MANDATED TWO-FACTOR AUTHENTICATION (AFA/2FA) AUDIT LOG
CREATE TABLE IF NOT EXISTS transaction_2fa_logs (
    afa_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(64) REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    otp_reference VARCHAR(64),
    otp_channel VARCHAR(16) DEFAULT 'SMS_AND_EMAIL',
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    validated_at TIMESTAMPTZ,
    validation_status VARCHAR(24) NOT NULL DEFAULT 'PENDING',
    attempts_count SMALLINT DEFAULT 0,
    rbi_exemption_category VARCHAR(32)
);

CREATE INDEX IF NOT EXISTS idx_2fa_tx ON transaction_2fa_logs(transaction_id);

-- 3. FRAUD ALERTS & INCIDENT ESCALATION TABLE
CREATE TABLE IF NOT EXISTS fraud_alerts (
    alert_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(64) REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL,
    risk_score SMALLINT NOT NULL,
    trigger_rules JSONB NOT NULL,
    dispatch_channel VARCHAR(32) DEFAULT 'WHATSAPP_AND_SMS',
    dispatch_payload JSONB,
    status alert_status_enum DEFAULT 'TRIGGERED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_user ON fraud_alerts(user_id, created_at DESC);
