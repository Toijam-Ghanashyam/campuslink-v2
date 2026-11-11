-- ====================================================================
-- CampusLink v2: Drive Scheduling Calendar & Approval Migration Script
-- Run this script in your Supabase SQL Editor
-- ====================================================================

-- 1. Add approval_status column with temporary default 'APPROVED' so existing drives remain approved
ALTER TABLE public.placement_drives 
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'APPROVED';

-- Ensure all existing rows are marked APPROVED so legitimate starter drives remain visible
UPDATE public.placement_drives 
  SET approval_status = 'APPROVED' 
  WHERE approval_status IS NULL;

-- Set NOT NULL and set permanent DEFAULT to 'PENDING' for future recruiter inserts
ALTER TABLE public.placement_drives 
  ALTER COLUMN approval_status SET NOT NULL;

ALTER TABLE public.placement_drives 
  ALTER COLUMN approval_status SET DEFAULT 'PENDING';

-- Add check constraint for approval_status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'placement_drives_approval_status_check'
  ) THEN
    ALTER TABLE public.placement_drives 
      ADD CONSTRAINT placement_drives_approval_status_check 
      CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED'));
  END IF;
END $$;

-- 2. Add rejection_reason column (stores feedback if rejected by TPO Admin)
ALTER TABLE public.placement_drives 
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 3. Add created_by column for recruiter ownership tracking
ALTER TABLE public.placement_drives 
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4. Update Row-Level Security (RLS) policies for placement_drives
ALTER TABLE public.placement_drives ENABLE ROW LEVEL SECURITY;

-- Drop legacy permissive policy
DROP POLICY IF EXISTS "Authenticated users can read placement drives" ON public.placement_drives;
DROP POLICY IF EXISTS "Placement drives select policy" ON public.placement_drives;

-- Create role-aware and approval-aware select policy
-- TPO Admins see all drives
-- Recruiters see their own drives, legacy unassigned drives, and approved drives
-- Students only see APPROVED drives
CREATE POLICY "Placement drives select policy"
  ON public.placement_drives FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'TPO_ADMIN'
    OR (
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'RECRUITER' 
      AND (created_by = auth.uid() OR created_by IS NULL OR approval_status = 'APPROVED')
    )
    OR approval_status = 'APPROVED'
  );

