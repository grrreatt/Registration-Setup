-- Database Optimizations for Enterprise-Grade QR Check-in System
-- Run these optimizations in your Supabase SQL editor

-- 1. Enhanced Indexes for Performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendees_email_event ON attendees(event_id, email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendees_category_event ON attendees(event_id, category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendees_created_at_desc ON attendees(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_check_ins_attendee_type ON check_ins(attendee_id, check_in_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_check_ins_checked_in_at_desc ON check_ins(checked_in_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_event_date_asc ON events(event_date ASC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_event_code ON events(event_code);

-- 2. Partial Indexes for Common Queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendees_meal_entitled ON attendees(id) WHERE meal_entitled = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendees_kit_entitled ON attendees(id) WHERE kit_entitled = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_check_ins_today ON check_ins(checked_in_at) WHERE checked_in_at >= CURRENT_DATE;

-- 3. Full-Text Search Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendees_full_text ON attendees USING gin(to_tsvector('english', full_name || ' ' || COALESCE(email, '') || ' ' || COALESCE(institution, '')));

-- 4. Enhanced Views for Analytics
CREATE OR REPLACE VIEW daily_registration_stats AS
SELECT 
    DATE(created_at) as registration_date,
    event_id,
    COUNT(*) as registrations,
    COUNT(CASE WHEN meal_entitled THEN 1 END) as meal_entitled_count,
    COUNT(CASE WHEN kit_entitled THEN 1 END) as kit_entitled_count,
    COUNT(CASE WHEN category = 'delegate' THEN 1 END) as delegate_count,
    COUNT(CASE WHEN category = 'faculty' THEN 1 END) as faculty_count,
    COUNT(CASE WHEN category = 'speaker' THEN 1 END) as speaker_count
FROM attendees
GROUP BY DATE(created_at), event_id
ORDER BY registration_date DESC;

CREATE OR REPLACE VIEW daily_checkin_stats AS
SELECT 
    DATE(checked_in_at) as checkin_date,
    check_in_type,
    COUNT(*) as checkin_count,
    COUNT(DISTINCT attendee_id) as unique_attendees
FROM check_ins
GROUP BY DATE(checked_in_at), check_in_type
ORDER BY checkin_date DESC;

CREATE OR REPLACE VIEW event_analytics AS
SELECT 
    e.id as event_id,
    e.event_name,
    e.event_date,
    COUNT(a.id) as total_attendees,
    COUNT(CASE WHEN a.meal_entitled THEN 1 END) as meal_entitled,
    COUNT(CASE WHEN a.kit_entitled THEN 1 END) as kit_entitled,
    COUNT(ci.id) as total_checkins,
    COUNT(CASE WHEN ci.check_in_type = 'meal' THEN 1 END) as meal_checkins,
    COUNT(CASE WHEN ci.check_in_type = 'kit' THEN 1 END) as kit_checkins,
    COUNT(CASE WHEN ci.check_in_type = 'general' THEN 1 END) as general_checkins
FROM events e
LEFT JOIN attendees a ON e.id = a.event_id
LEFT JOIN check_ins ci ON a.id = ci.attendee_id
GROUP BY e.id, e.event_name, e.event_date
ORDER BY e.event_date DESC;

-- 5. Performance-Optimized Functions
CREATE OR REPLACE FUNCTION get_attendee_with_checkins(p_badge_uid VARCHAR(50))
RETURNS TABLE (
    id UUID,
    badge_uid VARCHAR(50),
    full_name VARCHAR(255),
    email VARCHAR(255),
    category VARCHAR(50),
    institution VARCHAR(255),
    phone VARCHAR(20),
    meal_entitled BOOLEAN,
    kit_entitled BOOLEAN,
    event_name VARCHAR(255),
    event_date DATE,
    check_ins JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.badge_uid,
        a.full_name,
        a.email,
        a.category,
        a.institution,
        a.phone,
        a.meal_entitled,
        a.kit_entitled,
        e.event_name,
        e.event_date,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'check_in_type', ci.check_in_type,
                    'checked_in_at', ci.checked_in_at,
                    'location', ci.location
                )
            ) FILTER (WHERE ci.id IS NOT NULL),
            '[]'::jsonb
        ) as check_ins
    FROM attendees a
    JOIN events e ON a.event_id = e.id
    LEFT JOIN check_ins ci ON a.id = ci.attendee_id
    WHERE a.badge_uid = p_badge_uid
    GROUP BY a.id, a.badge_uid, a.full_name, a.email, a.category, a.institution, a.phone, a.meal_entitled, a.kit_entitled, e.event_name, e.event_date;
END;
$$ LANGUAGE plpgsql;

-- 6. Data Archiving Function
CREATE OR REPLACE FUNCTION archive_old_data(p_days_old INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER := 0;
BEGIN
    -- Archive old check-ins (keep for 1 year by default)
    WITH archived AS (
        DELETE FROM check_ins 
        WHERE checked_in_at < NOW() - INTERVAL '1 day' * p_days_old
        RETURNING id
    )
    SELECT COUNT(*) INTO archived_count FROM archived;
    
    -- Archive old check-out logs
    DELETE FROM check_out_logs 
    WHERE checked_out_at < NOW() - INTERVAL '1 day' * p_days_old;
    
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- 7. Data Integrity Functions
CREATE OR REPLACE FUNCTION validate_attendee_data()
RETURNS TABLE (
    attendee_id UUID,
    badge_uid VARCHAR(50),
    full_name VARCHAR(255),
    issues TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.badge_uid,
        a.full_name,
        ARRAY_AGG(
            CASE 
                WHEN a.full_name IS NULL OR LENGTH(TRIM(a.full_name)) < 2 THEN 'Invalid full name'
                WHEN a.email IS NOT NULL AND a.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN 'Invalid email format'
                WHEN a.phone IS NOT NULL AND a.phone !~ '^[\+]?[1-9][\d]{0,15}$' THEN 'Invalid phone format'
                WHEN a.badge_uid IS NULL OR LENGTH(TRIM(a.badge_uid)) < 6 THEN 'Invalid badge UID'
                ELSE NULL
            END
        ) FILTER (WHERE 
            a.full_name IS NULL OR LENGTH(TRIM(a.full_name)) < 2 OR
            (a.email IS NOT NULL AND a.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') OR
            (a.phone IS NOT NULL AND a.phone !~ '^[\+]?[1-9][\d]{0,15}$') OR
            a.badge_uid IS NULL OR LENGTH(TRIM(a.badge_uid)) < 6
        ) as issues
    FROM attendees a
    GROUP BY a.id, a.badge_uid, a.full_name
    HAVING COUNT(*) > 0;
END;
$$ LANGUAGE plpgsql;

-- 8. Audit Trail Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    changed_by VARCHAR(100),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at ON audit_logs(changed_at DESC);

-- 9. Audit Triggers
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values, changed_by)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD), current_user);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW), current_user);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (table_name, record_id, action, new_values, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW), current_user);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers
DROP TRIGGER IF EXISTS audit_attendees_trigger ON attendees;
CREATE TRIGGER audit_attendees_trigger
    AFTER INSERT OR UPDATE OR DELETE ON attendees
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_events_trigger ON events;
CREATE TRIGGER audit_events_trigger
    AFTER INSERT OR UPDATE OR DELETE ON events
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- 10. Performance Monitoring Views
CREATE OR REPLACE VIEW performance_metrics AS
SELECT 
    'attendees' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as records_last_24h,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as records_last_7d
FROM attendees
UNION ALL
SELECT 
    'check_ins' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE checked_in_at >= NOW() - INTERVAL '24 hours') as records_last_24h,
    COUNT(*) FILTER (WHERE checked_in_at >= NOW() - INTERVAL '7 days') as records_last_7d
FROM check_ins
UNION ALL
SELECT 
    'events' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as records_last_24h,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as records_last_7d
FROM events;

-- 11. Cleanup and Maintenance Functions
CREATE OR REPLACE FUNCTION cleanup_orphaned_data()
RETURNS TABLE (
    cleanup_type TEXT,
    records_cleaned INTEGER
) AS $$
DECLARE
    checkin_count INTEGER := 0;
    audit_count INTEGER := 0;
BEGIN
    -- Clean up orphaned check-ins
    WITH cleaned AS (
        DELETE FROM check_ins 
        WHERE attendee_id NOT IN (SELECT id FROM attendees)
        RETURNING id
    )
    SELECT COUNT(*) INTO checkin_count FROM cleaned;
    
    -- Clean up old audit logs (keep for 2 years)
    WITH cleaned AS (
        DELETE FROM audit_logs 
        WHERE changed_at < NOW() - INTERVAL '2 years'
        RETURNING id
    )
    SELECT COUNT(*) INTO audit_count FROM cleaned;
    
    RETURN QUERY SELECT 'orphaned_checkins'::TEXT, checkin_count;
    RETURN QUERY SELECT 'old_audit_logs'::TEXT, audit_count;
END;
$$ LANGUAGE plpgsql;

-- 12. Security Enhancements
-- Add row-level security policies for better data isolation
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin only access to audit logs" ON audit_logs
    FOR ALL USING (auth.role() = 'service_role');

-- 13. Backup and Recovery Functions
CREATE OR REPLACE FUNCTION create_data_backup()
RETURNS TEXT AS $$
DECLARE
    backup_name TEXT;
BEGIN
    backup_name := 'backup_' || TO_CHAR(NOW(), 'YYYY_MM_DD_HH24_MI_SS');
    
    -- This would typically be handled by your backup system
    -- For now, we'll just return the backup name
    RETURN backup_name;
END;
$$ LANGUAGE plpgsql;

-- 14. Statistics and Health Check
CREATE OR REPLACE VIEW system_health AS
SELECT 
    (SELECT COUNT(*) FROM attendees) as total_attendees,
    (SELECT COUNT(*) FROM check_ins) as total_checkins,
    (SELECT COUNT(*) FROM events) as total_events,
    (SELECT COUNT(*) FROM audit_logs) as total_audit_logs,
    (SELECT COUNT(*) FROM attendees WHERE created_at >= NOW() - INTERVAL '24 hours') as new_attendees_24h,
    (SELECT COUNT(*) FROM check_ins WHERE checked_in_at >= NOW() - INTERVAL '24 hours') as new_checkins_24h,
    NOW() as last_updated;

-- 15. Performance Tuning Settings
-- These should be set at the database level, but documented here for reference
-- shared_preload_libraries = 'pg_stat_statements'
-- track_activity_query_size = 2048
-- pg_stat_statements.track = all
-- log_statement = 'mod'
-- log_min_duration_statement = 1000


