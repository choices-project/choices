-- export_public_schema.sql
WITH cols AS (
  SELECT
    table_schema,
    table_name,
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default,
    character_maximum_length,
    ordinal_position
  FROM information_schema.columns
  WHERE table_schema = 'public'
),
pk AS (
  SELECT
    tc.table_schema,
    tc.table_name,
    array_agg(kcu.column_name ORDER BY kcu.ordinal_position) AS primary_keys
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
  WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
  GROUP BY tc.table_schema, tc.table_name
),
fks AS (
  SELECT
    tc.table_schema,
    tc.table_name,
    json_agg(json_build_object(
      'constraint', tc.constraint_name,
      'columns', array_agg(kcu.column_name ORDER BY kcu.ordinal_position),
      'foreign_table', ccu.table_schema || '.' || ccu.table_name,
      'foreign_columns', array_agg(ccu.column_name ORDER BY kcu.ordinal_position)
    )) AS foreign_keys
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
  GROUP BY tc.table_schema, tc.table_name
),
tbls AS (
  SELECT table_schema, table_name
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
)
SELECT jsonb_pretty(jsonb_agg(t)) FROM (
  SELECT
    t.table_name AS name,
    t.table_schema AS schema,
    COALESCE(s.row_estimate, 0) AS rows,
    COALESCE(p.primary_keys, ARRAY[]::text[]) AS primary_keys,
    COALESCE(f.foreign_keys, '[]'::json) AS foreign_key_constraints,
    jsonb_agg(jsonb_build_object(
      'name', c.column_name,
      'data_type', c.data_type,
      'udt_name', c.udt_name,
      'is_nullable', c.is_nullable,
      'column_default', c.column_default,
      'character_maximum_length', c.character_maximum_length
    ) ORDER BY c.ordinal_position) FILTER (WHERE c.column_name IS NOT NULL) AS columns
  FROM tbls t
  LEFT JOIN cols c ON c.table_schema = t.table_schema AND c.table_name = t.table_name
  LEFT JOIN pk p ON p.table_schema = t.table_schema AND p.table_name = t.table_name
  LEFT JOIN fks f ON f.table_schema = t.table_schema AND f.table_name = t.table_name
  LEFT JOIN (
    SELECT relname, n_live_tup::bigint AS row_estimate
    FROM pg_stat_user_tables
  ) s ON s.relname = t.table_name
  GROUP BY t.table_schema, t.table_name, p.primary_keys, f.foreign_keys, s.row_estimate
  ORDER BY t.table_name
) t;
