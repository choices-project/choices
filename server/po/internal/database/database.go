package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

// Database represents the PO service database
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
	-- PO Service Database Schema

	-- Polls table for storing poll information
	CREATE TABLE IF NOT EXISTS polls (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		poll_id TEXT UNIQUE NOT NULL,
		title TEXT NOT NULL,
		description TEXT,
		options TEXT NOT NULL, -- JSON array of options
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		start_time DATETIME NOT NULL,
		end_time DATETIME NOT NULL,
		status TEXT DEFAULT 'draft', -- 'draft', 'active', 'closed'
		sponsors TEXT, -- JSON array of sponsors
		ia_public_key TEXT NOT NULL
	);

	-- Votes table for storing vote information
	CREATE TABLE IF NOT EXISTS votes (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		poll_id TEXT NOT NULL,
		token TEXT NOT NULL,
		tag TEXT NOT NULL,
		choice INTEGER NOT NULL,
		voted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		merkle_leaf TEXT NOT NULL,
		merkle_proof TEXT -- JSON array of proof elements
	);

	-- Merkle trees table for storing Merkle tree state
	CREATE TABLE IF NOT EXISTS merkle_trees (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		poll_id TEXT UNIQUE NOT NULL,
		root TEXT NOT NULL,
		leaf_count INTEGER DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	-- Create indexes for better performance
	CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status);
	CREATE INDEX IF NOT EXISTS idx_polls_start_time ON polls(start_time);
	CREATE INDEX IF NOT EXISTS idx_polls_end_time ON polls(end_time);
	CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON votes(poll_id);
	CREATE INDEX IF NOT EXISTS idx_votes_tag ON votes(tag);
	CREATE INDEX IF NOT EXISTS idx_votes_token ON votes(token);
	CREATE INDEX IF NOT EXISTS idx_merkle_trees_poll_id ON merkle_trees(poll_id);
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
