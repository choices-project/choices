package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/lib/pq"
)

// Database represents the IA service database
type Database struct {
	db *sql.DB
}

// NewDatabase creates a new database connection
func NewDatabase(dbURL string) (*Database, error) {
	// Use environment variable if dbURL is empty
	if dbURL == "" {
		dbURL = os.Getenv("DATABASE_URL")
		if dbURL == "" {
			return nil, fmt.Errorf("DATABASE_URL environment variable is required")
		}
	}

	// Open database connection
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Configure connection pool
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	// Test the connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// Initialize the database schema
	if err := initializeSchema(db); err != nil {
		return nil, fmt.Errorf("failed to initialize schema: %w", err)
	}

	return &Database{db: db}, nil
}

// Close closes the database connection
func (d *Database) Close() error {
	return d.db.Close()
}

// GetDB returns the underlying database connection
func (d *Database) GetDB() *sql.DB {
	return d.db
}

// initializeSchema initializes the database schema
func initializeSchema(db *sql.DB) error {
	// Check if tables already exist
	var tableCount int
	err := db.QueryRow(`
		SELECT COUNT(*) 
		FROM information_schema.tables 
		WHERE table_schema = 'public' 
		AND table_name LIKE 'ia_%'
	`).Scan(&tableCount)
	
	if err != nil {
		return fmt.Errorf("failed to check existing tables: %w", err)
	}

	// If tables exist, assume schema is already initialized
	if tableCount > 0 {
		log.Println("Database schema already initialized")
		return nil
	}

	log.Println("Initializing database schema...")

	// Define schema inline since file reading is problematic
	schema := `
	-- IA Service Database Schema

	-- Users table for storing user information
	CREATE TABLE IF NOT EXISTS ia_users (
		id SERIAL PRIMARY KEY,
		stable_id TEXT UNIQUE NOT NULL,
		email TEXT,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		verification_tier TEXT DEFAULT 'T0',
		is_active BOOLEAN DEFAULT TRUE
	);

	-- Tokens table for storing issued tokens
	CREATE TABLE IF NOT EXISTS ia_tokens (
		id SERIAL PRIMARY KEY,
		user_stable_id TEXT NOT NULL,
		poll_id TEXT NOT NULL,
		token_hash TEXT NOT NULL,
		tag TEXT NOT NULL,
		tier TEXT NOT NULL,
		scope TEXT NOT NULL,
		issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
		is_revoked BOOLEAN DEFAULT FALSE
	);

	-- Verification sessions for WebAuthn
	CREATE TABLE IF NOT EXISTS ia_verification_sessions (
		id SERIAL PRIMARY KEY,
		user_stable_id TEXT NOT NULL,
		session_id TEXT UNIQUE NOT NULL,
		challenge TEXT NOT NULL,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
		is_used BOOLEAN DEFAULT FALSE
	);

	-- WebAuthn credentials
	CREATE TABLE IF NOT EXISTS ia_webauthn_credentials (
		id SERIAL PRIMARY KEY,
		user_stable_id TEXT NOT NULL,
		credential_id TEXT UNIQUE NOT NULL,
		public_key TEXT NOT NULL,
		sign_count INTEGER DEFAULT 0,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		last_used_at TIMESTAMP WITH TIME ZONE,
		is_active BOOLEAN DEFAULT TRUE
	);

	-- Create indexes for better performance
	CREATE INDEX IF NOT EXISTS idx_ia_tokens_user_poll ON ia_tokens(user_stable_id, poll_id);
	CREATE INDEX IF NOT EXISTS idx_ia_tokens_hash ON ia_tokens(token_hash);
	CREATE INDEX IF NOT EXISTS idx_ia_tokens_expires ON ia_tokens(expires_at);
	CREATE INDEX IF NOT EXISTS idx_ia_verification_sessions_user ON ia_verification_sessions(user_stable_id);
	CREATE INDEX IF NOT EXISTS idx_ia_webauthn_credentials_user ON ia_webauthn_credentials(user_stable_id);
	CREATE INDEX IF NOT EXISTS idx_ia_users_stable_id ON ia_users(stable_id);
	CREATE INDEX IF NOT EXISTS idx_ia_users_email ON ia_users(email);
	`

	// Execute the schema
	if _, err := db.Exec(schema); err != nil {
		return fmt.Errorf("failed to execute schema: %w", err)
	}

	log.Println("Database schema initialized successfully")
	return nil
}

// BeginTransaction begins a new transaction
func (d *Database) BeginTransaction() (*sql.Tx, error) {
	return d.db.Begin()
}

// Exec executes a query without returning rows
func (d *Database) Exec(query string, args ...interface{}) (sql.Result, error) {
	return d.db.Exec(query, args...)
}

// Query executes a query that returns rows
func (d *Database) Query(query string, args ...interface{}) (*sql.Rows, error) {
	return d.db.Query(query, args...)
}

// QueryRow executes a query that returns a single row
func (d *Database) QueryRow(query string, args ...interface{}) *sql.Row {
	return d.db.QueryRow(query, args...)
}
