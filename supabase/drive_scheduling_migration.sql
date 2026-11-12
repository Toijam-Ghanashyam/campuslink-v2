-- ==============================================================================
-- CAMPUSLINK ENTERPRISE MIGRATION: DRIVE SCHEDULING & CONFLICT MANAGEMENT
-- ==============================================================================

-- 1. Alter placement_drives table with drive scheduling and conflict tracking columns
ALTER TABLE placement_drives
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME,
ADD COLUMN IF NOT EXISTS venue TEXT,
ADD COLUMN IF NOT EXISTS has_conflict BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS conflict_details JSONB,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;

-- 2. Performance indexes for drive collision queries and venue lookups
CREATE INDEX IF NOT EXISTS idx_placement_drives_date_time 
ON placement_drives (drive_date, start_time, end_time) 
WHERE status != 'CANCELLED';

CREATE INDEX IF NOT EXISTS idx_placement_drives_venue 
ON placement_drives (venue) 
WHERE venue IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_placement_drives_conflict 
ON placement_drives (has_conflict) 
WHERE has_conflict = TRUE;

-- 3. Comments for documentation
COMMENT ON COLUMN placement_drives.start_time IS 'Drive session start time (e.g. 10:00:00)';
COMMENT ON COLUMN placement_drives.end_time IS 'Drive session end time (e.g. 13:00:00)';
COMMENT ON COLUMN placement_drives.venue IS 'On-campus physical hall or virtual room allocated for placement rounds';
COMMENT ON COLUMN placement_drives.has_conflict IS 'Flag set when drive timing overlaps with an existing drive venue or eligible candidate pool';
COMMENT ON COLUMN placement_drives.conflict_details IS 'JSON payload containing conflict types (VENUE_CLASH, STUDENT_OVERLAP_CLASH), overlapping counts, and AI resolutions';

