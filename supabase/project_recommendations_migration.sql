-- ====================================================================
-- CampusLink v2: AI Project Recommendation & Missing-Project Readiness Migration
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Alter public.student_profiles to store verified / parsed student projects
ALTER TABLE public.student_profiles 
  ADD COLUMN IF NOT EXISTS projects JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2. Create public.drive_project_recommendations Cache Table
-- Caches generated tailored project blueprints per drive + student missing-skill set
CREATE TABLE IF NOT EXISTS public.drive_project_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id UUID NOT NULL REFERENCES public.placement_drives(id) ON DELETE CASCADE,
  skill_gap_hash TEXT NOT NULL,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for instant cache lookups by drive and missing skill set hash
CREATE UNIQUE INDEX IF NOT EXISTS idx_drive_project_recs_drive_gap 
  ON public.drive_project_recommendations (drive_id, skill_gap_hash);

CREATE INDEX IF NOT EXISTS idx_drive_project_recs_drive 
  ON public.drive_project_recommendations (drive_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.drive_project_recommendations ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users (students, recruiters, admins) to read cached project recommendations
DROP POLICY IF EXISTS "Authenticated users can view project recommendations" ON public.drive_project_recommendations;
CREATE POLICY "Authenticated users can view project recommendations"
  ON public.drive_project_recommendations FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert cached recommendations
DROP POLICY IF EXISTS "Authenticated users can insert project recommendations" ON public.drive_project_recommendations;
CREATE POLICY "Authenticated users can insert project recommendations"
  ON public.drive_project_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow update/upsert on cached recommendations
DROP POLICY IF EXISTS "Authenticated users can update project recommendations" ON public.drive_project_recommendations;
CREATE POLICY "Authenticated users can update project recommendations"
  ON public.drive_project_recommendations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
