package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/lib/pq"
)

// Database represents the PO service database
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
		AND table_name LIKE 'po_%'
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
	-- PO Service Database Schema

	-- Polls table for storing poll information
	CREATE TABLE IF NOT EXISTS po_polls (
		id SERIAL PRIMARY KEY,
		poll_id TEXT UNIQUE NOT NULL,
		title TEXT NOT NULL,
		description TEXT,
		options JSONB NOT NULL, -- JSON array of options
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		start_time TIMESTAMP WITH TIME ZONE NOT NULL,
		end_time TIMESTAMP WITH TIME ZONE NOT NULL,
		status TEXT DEFAULT 'draft', -- 'draft', 'active', 'closed'
		sponsors JSONB, -- JSON array of sponsors
		ia_public_key TEXT NOT NULL,
		total_votes INTEGER DEFAULT 0,
		participation_rate DECIMAL(5,2) DEFAULT 0.00
	);

	-- Votes table for storing vote information
	CREATE TABLE IF NOT EXISTS po_votes (
		id SERIAL PRIMARY KEY,
		poll_id TEXT NOT NULL,
		token TEXT NOT NULL,
		tag TEXT NOT NULL,
		choice INTEGER NOT NULL,
		voted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		merkle_leaf TEXT NOT NULL,
		merkle_proof JSONB, -- JSON array of proof elements
		FOREIGN KEY (poll_id) REFERENCES po_polls(poll_id) ON DELETE CASCADE
	);

	-- Merkle trees table for storing Merkle tree state
	CREATE TABLE IF NOT EXISTS po_merkle_trees (
		id SERIAL PRIMARY KEY,
		poll_id TEXT UNIQUE NOT NULL,
		root TEXT NOT NULL,
		leaf_count INTEGER DEFAULT 0,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (poll_id) REFERENCES po_polls(poll_id) ON DELETE CASCADE
	);

	-- Analytics and Dashboard Tables

	-- Real-time analytics data
	CREATE TABLE IF NOT EXISTS analytics_events (
		id SERIAL PRIMARY KEY,
		event_type TEXT NOT NULL, -- 'vote', 'poll_created', 'user_registered'
		poll_id TEXT,
		user_stable_id TEXT,
		metadata JSONB,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);

	-- Demographic data (anonymized)
	CREATE TABLE IF NOT EXISTS analytics_demographics (
		id SERIAL PRIMARY KEY,
		poll_id TEXT NOT NULL,
		demographic_key TEXT NOT NULL, -- 'age_group', 'location', 'device_type'
		demographic_value TEXT NOT NULL,
		vote_count INTEGER DEFAULT 0,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (poll_id) REFERENCES po_polls(poll_id) ON DELETE CASCADE
	);

	-- Create indexes for better performance
	CREATE INDEX IF NOT EXISTS idx_po_polls_status ON po_polls(status);
	CREATE INDEX IF NOT EXISTS idx_po_polls_start_time ON po_polls(start_time);
	CREATE INDEX IF NOT EXISTS idx_po_polls_end_time ON po_polls(end_time);
	CREATE INDEX IF NOT EXISTS idx_po_polls_created_at ON po_polls(created_at);
	CREATE INDEX IF NOT EXISTS idx_po_votes_poll_id ON po_votes(poll_id);
	CREATE INDEX IF NOT EXISTS idx_po_votes_tag ON po_votes(tag);
	CREATE INDEX IF NOT EXISTS idx_po_votes_token ON po_votes(token);
	CREATE INDEX IF NOT EXISTS idx_po_votes_voted_at ON po_votes(voted_at);
	CREATE INDEX IF NOT EXISTS idx_po_merkle_trees_poll_id ON po_merkle_trees(poll_id);

	-- Analytics indexes
	CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
	CREATE INDEX IF NOT EXISTS idx_analytics_events_poll_id ON analytics_events(poll_id);
	CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
	CREATE INDEX IF NOT EXISTS idx_analytics_demographics_poll_key ON analytics_demographics(poll_id, demographic_key);
	`

	// Execute the schema
	if _, err := db.Exec(schema); err != nil {
		return fmt.Errorf("failed to execute schema: %w", err)
	}

	log.Println("PO database schema initialized successfully")
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
