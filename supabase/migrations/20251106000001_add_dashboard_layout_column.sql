/**
 * Add Dashboard Layout Column to User Preferences
 * 
 * Adds support for storing customizable widget dashboard layouts.
 * Each user can have their own personalized analytics dashboard configuration.
 * 
 * Created: November 6, 2025
 * Migration ID: 20251106000001
 */

-- Add dashboard_layout column to user_preferences
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS dashboard_layout JSONB DEFAULT NULL;

-- Add dashboard mode preference column
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS analytics_dashboard_mode TEXT DEFAULT 'classic' 
CHECK (analytics_dashboard_mode IN ('classic', 'widget'));

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_dashboard_layout 
ON user_preferences USING gin (dashboard_layout);

-- Add comments
COMMENT ON COLUMN user_preferences.dashboard_layout IS 
'Stores user customizable widget dashboard layout configuration (widgets, positions, sizes, breakpoints)';

COMMENT ON COLUMN user_preferences.analytics_dashboard_mode IS 
'User preference for analytics dashboard mode: classic (tabbed) or widget (customizable)';

-- Example dashboard_layout structure:
-- {
--   "id": "user-123-default",
--   "name": "My Dashboard",
--   "description": "Custom analytics dashboard",
--   "widgets": [
--     {
--       "id": "trends-1699123456789-abc123",
--       "type": "trends",
--       "title": "Activity Trends",
--       "position": { "x": 0, "y": 0 },
--       "size": { "w": 6, "h": 4 },
--       "settings": {
--         "refreshInterval": 300,
--         "filters": { "dateRange": "30d" }
--       },
--       "enabled": true,
--       "createdAt": "2025-11-06T00:00:00Z",
--       "updatedAt": "2025-11-06T00:00:00Z"
--     }
--   ],
--   "breakpoints": {
--     "lg": [...],
--     "md": [...],
--     "sm": [...]
--   },
--   "isDefault": false,
--   "isPreset": false,
--   "createdAt": "2025-11-06T00:00:00Z",
--   "updatedAt": "2025-11-06T00:00:00Z"
-- }

