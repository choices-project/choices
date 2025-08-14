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
    merkle_proof TEXT, -- JSON array of proof elements
    FOREIGN KEY (poll_id) REFERENCES polls(poll_id)
);

-- Merkle trees table for storing Merkle tree state
CREATE TABLE IF NOT EXISTS merkle_trees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    poll_id TEXT UNIQUE NOT NULL,
    root TEXT NOT NULL,
    leaf_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (poll_id) REFERENCES polls(poll_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status);
CREATE INDEX IF NOT EXISTS idx_polls_start_time ON polls(start_time);
CREATE INDEX IF NOT EXISTS idx_polls_end_time ON polls(end_time);
CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_tag ON votes(tag);
CREATE INDEX IF NOT EXISTS idx_votes_token ON votes(token);
CREATE INDEX IF NOT EXISTS idx_merkle_trees_poll_id ON merkle_trees(poll_id);
