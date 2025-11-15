-- Supabase Database Schema for QR Check-In System
-- Run this in your Supabase SQL editor

-- Ensure required extensions
create extension if not exists pgcrypto;

-- Create tables
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_code VARCHAR(50) UNIQUE NOT NULL,
  event_name VARCHAR(255) NOT NULL,
  event_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  badge_uid VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  category VARCHAR(50) NOT NULL,
  institution VARCHAR(255),
  phone VARCHAR(20),
  meal_entitled BOOLEAN DEFAULT false,
  kit_entitled BOOLEAN DEFAULT false,
  badge_print_template VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS check_ins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attendee_id UUID REFERENCES attendees(id) ON DELETE CASCADE,
  check_in_type VARCHAR(20) NOT NULL CHECK (check_in_type IN ('meal', 'kit', 'general')),
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  checked_in_by VARCHAR(100),
  location VARCHAR(100),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS check_out_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attendee_id UUID REFERENCES attendees(id) ON DELETE CASCADE,
  check_in_type VARCHAR(20) NOT NULL CHECK (check_in_type IN ('meal', 'kit', 'general')),
  checked_out_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  checked_out_by VARCHAR(100),
  notes TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendees_badge_uid ON attendees(badge_uid);
CREATE INDEX IF NOT EXISTS idx_attendees_event_id ON attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_attendee_id ON check_ins(attendee_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_type ON check_ins(check_in_type);
CREATE INDEX IF NOT EXISTS idx_check_ins_created_at ON check_ins(checked_in_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendees_updated_at BEFORE UPDATE ON attendees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_out_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Events: public can read (for UI dropdowns), authenticated can modify
CREATE POLICY "events_select_public" ON events
  FOR SELECT USING (true);
CREATE POLICY "events_all_authenticated" ON events
  FOR ALL USING (auth.role() = 'authenticated');

-- Attendees: only authenticated can read/write
CREATE POLICY "attendees_all_authenticated" ON attendees
  FOR ALL USING (auth.role() = 'authenticated');

-- Check-ins: only authenticated can read/write
CREATE POLICY "check_ins_all_authenticated" ON check_ins
  FOR ALL USING (auth.role() = 'authenticated');

-- Check-out logs: only authenticated can read/write
CREATE POLICY "check_out_logs_all_authenticated" ON check_out_logs
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert sample event
INSERT INTO events (event_code, event_name, event_date) 
VALUES ('MEDCONF25', 'Medical Conference 2025', '2025-01-15')
ON CONFLICT (event_code) DO NOTHING;

-- Insert sample attendees (you can import your CSV data here)
INSERT INTO attendees (event_id, badge_uid, full_name, email, category, institution, phone, meal_entitled, kit_entitled, badge_print_template)
SELECT 
  (SELECT id FROM events WHERE event_code = 'MEDCONF25'),
  'MED0001',
  'Dr Aarav Sharma',
  'aarav.sharma@example.com',
  'delegate',
  'AIIMS New Delhi',
  '9876543201',
  true,
  true,
  'TPL_A6_V1'
ON CONFLICT (badge_uid) DO NOTHING;

-- Create views for easy querying
CREATE OR REPLACE VIEW attendee_checkin_status AS
SELECT 
  a.id,
  a.badge_uid,
  a.full_name,
  a.email,
  a.category,
  a.institution,
  a.meal_entitled,
  a.kit_entitled,
  e.event_code,
  e.event_name,
  -- Meal check-in status
  CASE WHEN meal_ci.id IS NOT NULL THEN true ELSE false END as meal_checked_in,
  meal_ci.checked_in_at as meal_checkin_time,
  -- Kit check-in status
  CASE WHEN kit_ci.id IS NOT NULL THEN true ELSE false END as kit_checked_in,
  kit_ci.checked_in_at as kit_checkin_time
FROM attendees a
JOIN events e ON a.event_id = e.id
LEFT JOIN check_ins meal_ci ON a.id = meal_ci.attendee_id AND meal_ci.check_in_type = 'meal'
LEFT JOIN check_ins kit_ci ON a.id = kit_ci.attendee_id AND kit_ci.check_in_type = 'kit';

-- Create function for check-in
CREATE OR REPLACE FUNCTION perform_checkin(
  p_badge_uid VARCHAR(50),
  p_check_in_type VARCHAR(20),
  p_checked_in_by VARCHAR(100) DEFAULT 'system',
  p_location VARCHAR(100) DEFAULT 'main',
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_attendee_id UUID;
  v_result JSON;
BEGIN
  -- Get attendee ID
  SELECT id INTO v_attendee_id 
  FROM attendees 
  WHERE badge_uid = p_badge_uid;
  
  IF v_attendee_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Attendee not found'
    );
  END IF;
  
  -- Check if already checked in
  IF EXISTS (
    SELECT 1 FROM check_ins 
    WHERE attendee_id = v_attendee_id 
    AND check_in_type = p_check_in_type
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Already checked in for ' || p_check_in_type
    );
  END IF;
  
  -- Perform check-in
  INSERT INTO check_ins (attendee_id, check_in_type, checked_in_by, location, notes)
  VALUES (v_attendee_id, p_check_in_type, p_checked_in_by, p_location, p_notes);
  
  RETURN json_build_object(
    'success', true,
    'message', 'Check-in successful',
    'attendee_id', v_attendee_id
  );
END;
$$ LANGUAGE plpgsql;

-- Create function for check-out
CREATE OR REPLACE FUNCTION perform_checkout(
  p_badge_uid VARCHAR(50),
  p_check_in_type VARCHAR(20),
  p_checked_out_by VARCHAR(100) DEFAULT 'system',
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_attendee_id UUID;
  v_check_in_id UUID;
BEGIN
  -- Get attendee ID
  SELECT id INTO v_attendee_id 
  FROM attendees 
  WHERE badge_uid = p_badge_uid;
  
  IF v_attendee_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Attendee not found'
    );
  END IF;
  
  -- Get check-in record
  SELECT id INTO v_check_in_id
  FROM check_ins 
  WHERE attendee_id = v_attendee_id 
  AND check_in_type = p_check_in_type;
  
  IF v_check_in_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Not checked in for ' || p_check_in_type
    );
  END IF;
  
  -- Log check-out
  INSERT INTO check_out_logs (attendee_id, check_in_type, checked_out_by, notes)
  VALUES (v_attendee_id, p_check_in_type, p_checked_out_by, p_notes);
  
  -- Remove check-in record
  DELETE FROM check_ins WHERE id = v_check_in_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Check-out successful'
  );
END;
$$ LANGUAGE plpgsql;
