-- ====================================================================
-- CampusLink v2: Proctored Student Readiness Assessment Engine Migration
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Alter public.student_profiles to support Readiness & Integrity Scores
ALTER TABLE public.student_profiles 
  ADD COLUMN IF NOT EXISTS readiness_score INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.student_profiles 
  ADD COLUMN IF NOT EXISTS readiness_integrity_score INTEGER NOT NULL DEFAULT 100;

ALTER TABLE public.student_profiles 
  ADD COLUMN IF NOT EXISTS readiness_status TEXT NOT NULL DEFAULT 'NOT_TESTED';

ALTER TABLE public.student_profiles 
  ADD COLUMN IF NOT EXISTS last_readiness_test_at TIMESTAMPTZ;

-- 2. Create public.readiness_assessments Table
CREATE TABLE IF NOT EXISTS public.readiness_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skills_tested TEXT[] NOT NULL DEFAULT '{}'::text[],
  questions_payload JSONB NOT NULL DEFAULT '[]'::jsonb,
  student_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  keystroke_telemetry JSONB NOT NULL DEFAULT '{}'::jsonb,
  mcq_score NUMERIC NOT NULL DEFAULT 0,
  paragraph_score NUMERIC NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  integrity_score INTEGER NOT NULL DEFAULT 100,
  proctoring_logs JSONB NOT NULL DEFAULT '[]'::jsonb,
  snapshot_urls TEXT[] NOT NULL DEFAULT '{}'::text[],
  ai_evaluation_summary TEXT,
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Index for quick lookups by student_id and date
CREATE INDEX IF NOT EXISTS idx_readiness_assessments_student ON public.readiness_assessments (student_id, started_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.readiness_assessments ENABLE ROW LEVEL SECURITY;

-- Students can read their own assessment sessions
DROP POLICY IF EXISTS "Students can view own assessments" ON public.readiness_assessments;
CREATE POLICY "Students can view own assessments"
  ON public.readiness_assessments FOR SELECT
  TO authenticated
  USING (
    auth.uid() = student_id OR
    UPPER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '')) IN ('TPO_ADMIN', 'RECRUITER')
  );

-- Students can create their own assessment sessions
DROP POLICY IF EXISTS "Students can insert own assessments" ON public.readiness_assessments;
CREATE POLICY "Students can insert own assessments"
  ON public.readiness_assessments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

-- Students can update their own assessment sessions
DROP POLICY IF EXISTS "Students can update own assessments" ON public.readiness_assessments;
CREATE POLICY "Students can update own assessments"
  ON public.readiness_assessments FOR UPDATE
  TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- 4. Setup Storage Bucket for Proctoring Web-Cam Snapshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('proctoring-snapshots', 'proctoring-snapshots', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket RLS Policy: Authenticated users can upload proctoring snapshots
DROP POLICY IF EXISTS "Authenticated users can upload snapshots" ON storage.objects;
CREATE POLICY "Authenticated users can upload snapshots"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'proctoring-snapshots');

-- Bucket RLS Policy: Public/Authenticated users can read proctoring snapshots
DROP POLICY IF EXISTS "Anyone can view proctoring snapshots" ON storage.objects;
CREATE POLICY "Anyone can view proctoring snapshots"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'proctoring-snapshots');

-- 5. Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

