package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

// Database represents the IA service database
type Database struct {
	db *sql.DB
}

// NewDatabase creates a new database connection
func NewDatabase(dbPath string) (*Database, error) {
	// Ensure the directory exists
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create database directory: %w", err)
	}

	// Open database connection
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Test the connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// Enable foreign keys
	if _, err := db.Exec("PRAGMA foreign_keys = ON;"); err != nil {
		return nil, fmt.Errorf("failed to enable foreign keys: %w", err)
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
	// Define schema inline since file reading is problematic
	schema := `
	-- IA Service Database Schema

	-- Users table for storing user information
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		stable_id TEXT UNIQUE NOT NULL,
		email TEXT,
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
		is_revoked BOOLEAN DEFAULT 0
	);

	-- Verification sessions for WebAuthn
	CREATE TABLE IF NOT EXISTS verification_sessions (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_stable_id TEXT NOT NULL,
		session_id TEXT UNIQUE NOT NULL,
		challenge TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		expires_at DATETIME NOT NULL,
		is_used BOOLEAN DEFAULT 0
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
		is_active BOOLEAN DEFAULT 1
	);

	-- Create indexes for better performance
	CREATE INDEX IF NOT EXISTS idx_tokens_user_poll ON tokens(user_stable_id, poll_id);
	CREATE INDEX IF NOT EXISTS idx_tokens_hash ON tokens(token_hash);
	CREATE INDEX IF NOT EXISTS idx_tokens_expires ON tokens(expires_at);
	CREATE INDEX IF NOT EXISTS idx_verification_sessions_user ON verification_sessions(user_stable_id);
	CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_user ON webauthn_credentials(user_stable_id);
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
