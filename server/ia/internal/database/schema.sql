-- IA Service Database Schema

-- Users table for storing user information
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stable_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    verification_tier TEXT DEFAULT 'T0',
    is_active BOOLEAN DEFAULT 1
);

-- Tokens table for storing issued tokens
CREATE TABLE IF NOT EXISTS tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_stable_id TEXT NOT NULL,
    poll_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    tag TEXT NOT NULL,
    tier TEXT NOT NULL,
    scope TEXT NOT NULL,
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    is_revoked BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_stable_id) REFERENCES users(stable_id)
);

-- Verification sessions for WebAuthn
CREATE TABLE IF NOT EXISTS verification_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_stable_id TEXT NOT NULL,
    session_id TEXT UNIQUE NOT NULL,
    challenge TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    is_used BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_stable_id) REFERENCES users(stable_id)
);

-- WebAuthn credentials
CREATE TABLE IF NOT EXISTS webauthn_credentials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_stable_id TEXT NOT NULL,
    credential_id TEXT UNIQUE NOT NULL,
    public_key TEXT NOT NULL,
    sign_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used_at DATETIME,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (user_stable_id) REFERENCES users(stable_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tokens_user_poll ON tokens(user_stable_id, poll_id);
CREATE INDEX IF NOT EXISTS idx_tokens_hash ON tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_tokens_expires ON tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_sessions_user ON verification_sessions(user_stable_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_user ON webauthn_credentials(user_stable_id);
