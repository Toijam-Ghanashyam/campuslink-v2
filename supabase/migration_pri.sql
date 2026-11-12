-- ====================================================================
-- CampusLink v2: Explainable Readiness Index (PRI) Matrix Delta Migration
-- ====================================================================

-- 1. Extend placement_drives with PRI threshold and benchmark role skill vector
ALTER TABLE public.placement_drives 
  ADD COLUMN IF NOT EXISTS pri_threshold NUMERIC(5,2) NOT NULL DEFAULT 70.00;

ALTER TABLE public.placement_drives 
  ADD COLUMN IF NOT EXISTS role_skill_vector JSONB NOT NULL DEFAULT '{
    "dsa": 8,
    "system_design": 7,
    "backend_apis": 8,
    "databases": 7,
    "cloud_devops": 6,
    "frontend_ui": 6,
    "testing_cicd": 6,
    "cs_fundamentals": 8
  }'::jsonb;

-- 2. Extend drive_applications with mathematical PRI component scores, vector deltas, and cosine similarity
ALTER TABLE public.drive_applications 
  ADD COLUMN IF NOT EXISTS e_academic NUMERIC(5,2);

ALTER TABLE public.drive_applications 
  ADD COLUMN IF NOT EXISTS e_practical NUMERIC(5,2);

ALTER TABLE public.drive_applications 
  ADD COLUMN IF NOT EXISTS e_eval NUMERIC(5,2);

ALTER TABLE public.drive_applications 
  ADD COLUMN IF NOT EXISTS pri_score NUMERIC(5,2);

ALTER TABLE public.drive_applications 
  ADD COLUMN IF NOT EXISTS cosine_similarity NUMERIC(5,4);

ALTER TABLE public.drive_applications 
  ADD COLUMN IF NOT EXISTS student_skill_vector JSONB;

ALTER TABLE public.drive_applications 
  ADD COLUMN IF NOT EXISTS skill_gap_delta JSONB;

-- 3. Extend candidate_roadmaps with immutable PRI snapshot
ALTER TABLE public.candidate_roadmaps 
  ADD COLUMN IF NOT EXISTS pri_snapshot JSONB;

