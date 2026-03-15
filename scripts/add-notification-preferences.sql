-- Add notification_preferences column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email_notifications": true, "order_alerts": true, "low_stock_alerts": true, "weekly_reports": false}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN profiles.notification_preferences IS 'JSON object storing user notification preferences';
