-- ====================================================================
-- CampusLink v2: Live AI Video Interview & Supabase Storage Migration
-- Run this in your Supabase Dashboard -> SQL Editor
-- ====================================================================

-- 1. Update the 'stage' check constraint on public.drive_applications
-- This allows the recruiter to advance a candidate to 'VIDEO_ASSESSMENT'
ALTER TABLE public.drive_applications 
  DROP CONSTRAINT IF EXISTS drive_applications_stage_check;

ALTER TABLE public.drive_applications 
  ADD CONSTRAINT drive_applications_stage_check 
  CHECK (stage IN (
    'APPLIED', 
    'VIDEO_ASSESSMENT', 
    'OA_CLEARED', 
    'GD_CLEARED', 
    'INTERVIEW_R1', 
    'INTERVIEW_R2', 
    'HR_ROUND', 
    'OFFERED', 
    'REJECTED'
  ));

-- 2. Add video assessment metadata columns to drive_applications
ALTER TABLE public.drive_applications
  ADD COLUMN IF NOT EXISTS video_assessment_called BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS video_assessment_called_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS video_interview_completed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS full_session_video_url TEXT,
  ADD COLUMN IF NOT EXISTS question_clips JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS proctoring_events JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS video_integrity_score INTEGER DEFAULT 100;

-- 3. Create a dedicated public.ai_interview_sessions table for recruiter review
CREATE TABLE IF NOT EXISTS public.ai_interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.drive_applications(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  drive_id UUID REFERENCES public.placement_drives(id) ON DELETE CASCADE,
  full_session_video_url TEXT,
  total_duration_sec INTEGER NOT NULL DEFAULT 0,
  integrity_score INTEGER NOT NULL DEFAULT 100,
  question_clips JSONB NOT NULL DEFAULT '[]'::jsonb,
  proctoring_events JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for instant lookup by application and student
CREATE INDEX IF NOT EXISTS idx_ai_interview_app ON public.ai_interview_sessions (application_id);
CREATE INDEX IF NOT EXISTS idx_ai_interview_student ON public.ai_interview_sessions (student_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.ai_interview_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read on ai_interview_sessions" ON public.ai_interview_sessions;
CREATE POLICY "Allow authenticated read on ai_interview_sessions"
  ON public.ai_interview_sessions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert on ai_interview_sessions" ON public.ai_interview_sessions;
CREATE POLICY "Allow authenticated insert on ai_interview_sessions"
  ON public.ai_interview_sessions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Enable Supabase Storage Bucket: 'interview-videos'
-- (Creates public bucket for master sessions & question clips)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'interview-videos', 
  'interview-videos', 
  true, 
  52428800, -- 50MB per video limit
  ARRAY['video/webm', 'video/mp4']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['video/webm', 'video/mp4']::text[];

-- Storage Policies for 'interview-videos' bucket
DROP POLICY IF EXISTS "Public View on interview-videos" ON storage.objects;
CREATE POLICY "Public View on interview-videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'interview-videos');

DROP POLICY IF EXISTS "Authenticated Upload on interview-videos" ON storage.objects;
CREATE POLICY "Authenticated Upload on interview-videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'interview-videos');

