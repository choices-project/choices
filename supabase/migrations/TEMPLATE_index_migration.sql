-- migrate:up
-- Index: [INDEX_NAME]
-- Table: [TABLE_NAME]
-- Columns: [COLUMN1, COLUMN2, ...]
-- Reason: [Why this index is needed - e.g., "Speeds up queries filtering by created_at and is_public"]
-- Generated: [DATE]

-- Always use CONCURRENTLY for production to avoid locking the table
CREATE INDEX CONCURRENTLY IF NOT EXISTS [INDEX_NAME]
ON public.[TABLE_NAME]
USING btree ([COLUMN1], [COLUMN2]);

-- Optional: Add comment for documentation
COMMENT ON INDEX [INDEX_NAME] IS '[Description of what this index optimizes]';

-- migrate:down
DROP INDEX IF EXISTS [INDEX_NAME];

-- ============================================================================
-- INDEX CREATION BEST PRACTICES
-- ============================================================================
--
-- 1. Naming Convention:
--    idx_[table_name]_[column1]_[column2]
--    Example: idx_polls_created_at_public
--
-- 2. Column Order Matters:
--    Put most selective column first
--    Put columns used in WHERE before ORDER BY
--
-- 3. Always Use CONCURRENTLY:
--    - Doesn't lock table during creation
--    - Safe for production
--    - Takes longer but non-blocking
--
-- 4. Partial Indexes:
--    CREATE INDEX CONCURRENTLY idx_name
--    ON table_name (column)
--    WHERE condition;  -- Only index rows matching condition
--
-- 5. Unique Indexes:
--    CREATE UNIQUE INDEX CONCURRENTLY idx_name
--    ON table_name (column);
--
-- 6. Composite Indexes:
--    CREATE INDEX CONCURRENTLY idx_name
--    ON table_name (col1, col2, col3);
--    -- Order: most selective first, WHERE columns before ORDER BY
--
-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
--
-- Check if index exists:
-- SELECT * FROM pg_indexes WHERE indexname = '[INDEX_NAME]';
--
-- Check index size:
-- SELECT pg_size_pretty(pg_relation_size('[INDEX_NAME]'));
--
-- Check index usage:
-- SELECT * FROM pg_stat_user_indexes WHERE indexname = '[INDEX_NAME]';
--
-- Analyze query plan:
-- EXPLAIN ANALYZE SELECT ... FROM [TABLE_NAME] WHERE ...;
